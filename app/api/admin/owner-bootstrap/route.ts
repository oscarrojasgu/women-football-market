import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OWNER_EMAIL = "oscarrojasgu@hotmail.com";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const accessToken = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Supabase recommends the newer secret key for server-side privileged work;
  // keep the legacy service-role variable supported for existing deployments.
  const serviceRoleKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Owner provisioning is not configured on the server." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(accessToken);
  const user = authData.user;

  if (authError || !user) {
    return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
  }

  if (
    user.email?.trim().toLowerCase() !== OWNER_EMAIL ||
    !user.email_confirmed_at
  ) {
    return NextResponse.json({ error: "This account is not eligible for owner access." }, { status: 403 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: currentRecord, error: currentError } = await adminClient
    .from("wfm_admins")
    .select("user_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (currentError) {
    return NextResponse.json({ error: "Could not verify the WFM admin record." }, { status: 500 });
  }

  if (currentRecord) {
    if (currentRecord.role === "owner") {
      return NextResponse.json({ ok: true, alreadyOwner: true }, {
        headers: { "Cache-Control": "no-store" },
      });
    }
    return NextResponse.json({ error: "This account already has a different WFM role." }, { status: 409 });
  }

  const { data: owners, error: ownersError } = await adminClient
    .from("wfm_admins")
    .select("user_id")
    .eq("role", "owner")
    .limit(2);

  if (ownersError) {
    return NextResponse.json({ error: "Could not verify WFM owner provisioning." }, { status: 500 });
  }

  if (owners && owners.some((owner) => owner.user_id !== user.id)) {
    return NextResponse.json({ error: "A WFM owner account is already configured." }, { status: 409 });
  }

  const { error: insertError } = await adminClient
    .from("wfm_admins")
    .insert({ user_id: user.id, email: user.email, role: "owner" });

  if (insertError) {
    return NextResponse.json({ error: "Owner provisioning failed. Please contact the site administrator." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, {
    headers: { "Cache-Control": "no-store" },
  });
}
