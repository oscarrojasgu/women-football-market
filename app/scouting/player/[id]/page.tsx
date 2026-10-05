export const dynamic = "force-dynamic";

import Link from "next/link";
import { getWfmT } from "../../../lib/get-wfm-t"
import { supabase } from "../../../lib/supabase";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ returnTo?: string }> };

const ageOf = (dob: string | null) => {
  if (!dob) return null;
  const birth = new Date(`${dob}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
};

const money = (value: number | null) =>
  value == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const pct = (value: number | null) =>
  value == null ? "—" : `${Math.round(value * 100)}th`;

const cardStyle = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: 20,
};

export default async function ScoutingReportPage({ params, searchParams }: PageProps) {
  const t = await getWfmT();
  const { returnTo } = await searchParams;
  const workspaceHref = returnTo && returnTo.startsWith("/scouting/profiles/") ? returnTo : "/scouting";
  const profileId = workspaceHref.startsWith("/scouting/profiles/") ? workspaceHref.split("/")[3] || null : null;
  const { id } = await params;
  const { data: player, error } = await supabase
    .from("players")
    .select("id,full_name,date_of_birth,nationality,position,secondary_position,preferred_foot,agency,photo_url,photo_source,photo_credit,photo_license")
    .eq("id", id)
    .single();

  if (error || !player) {
    return (
      <main className="players-page" style={{ paddingTop: 48 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
          <h1>{t("Unknown player")}</h1>
          <Link href={workspaceHref}>{t("Back to scouting")}</Link>
        </div>
      </main>
    );
  }

  return <main className="players-page" style={{ paddingTop: 48 }}><div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}><h1>{player.full_name}</h1><p>{t("Player Information")}</p><Link href={workspaceHref}>{t("Back to scouting")}</Link></div></main>;
}