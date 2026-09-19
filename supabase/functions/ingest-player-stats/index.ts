import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@^1";

type StatRecord = Record<string, unknown> & {
  player_id: string;
  club_id?: string | null;
  season: string;
  competition: string;
};

const required = ["player_id", "season", "competition"];

export default withSupabase({ auth: "secret" }, async (req, ctx) => {
  if (req.method !== "POST") return Response.json({ error: "POST required" }, { status: 405 });

  let body: { provider?: string; run_type?: string; records?: StatRecord[]; metadata?: Record<string, unknown> };
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const provider = body.provider?.trim();
  const records = Array.isArray(body.records) ? body.records : [];
  if (!provider) return Response.json({ error: "provider is required" }, { status: 400 });
  if (!records.length) return Response.json({ error: "records must contain at least one stat record" }, { status: 400 });

  const runType = body.run_type && ["manual", "scheduled", "webhook", "backfill"].includes(body.run_type)
    ? body.run_type : "manual";

  const { data: run, error: runError } = await ctx.supabaseAdmin
    .from("data_update_runs")
    .insert({ provider, run_type: runType, status: "running", records_received: records.length, metadata: body.metadata || {} })
    .select("id").single();

  if (runError || !run) return Response.json({ error: runError?.message || "Could not create update run" }, { status: 500 });

  let inserted = 0, updated = 0, rejected = 0;
  const errors: Array<{ index: number; error: string }> = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const missing = required.filter((key) => !record[key]);
    if (missing.length) {
      rejected++;
      errors.push({ index: i, error: `Missing required fields: ${missing.join(", ")}` });
      continue;
    }

    const { data: existing } = await ctx.supabaseAdmin
      .from("player_stats").select("id")
      .eq("player_id", record.player_id)
      .eq("season", record.season)
      .eq("competition", record.competition)
      .eq("club_id", record.club_id ?? null)
      .maybeSingle();

    const { error } = await ctx.supabaseAdmin
      .from("player_stats")
      .upsert({ ...record, updated_at: new Date().toISOString() },
        { onConflict: "player_id,club_id,season,competition" });

    if (error) {
      rejected++;
      errors.push({ index: i, error: error.message });
    } else if (existing) updated++;
    else inserted++;
  }

  const status = rejected === 0 ? "completed" : (inserted + updated > 0 ? "partial" : "failed");
  await ctx.supabaseAdmin.from("data_update_runs").update({
    status,
    finished_at: new Date().toISOString(),
    records_inserted: inserted,
    records_updated: updated,
    records_rejected: rejected,
    error_message: errors.length ? errors.map((e) => `#${e.index}: ${e.error}`).join(" | ") : null
  }).eq("id", run.id);

  return Response.json({
    ok: status !== "failed", run_id: run.id, provider, status,
    records_received: records.length, records_inserted: inserted,
    records_updated: updated, records_rejected: rejected, errors
  }, { status: status === "failed" ? 422 : 200 });
});
