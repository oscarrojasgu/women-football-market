import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@^1";

type Fixture = {
  id?: number | string;
  league_id?: number | string | null;
  season_id?: number | string | null;
  starting_at?: string | null;
  league?: { name?: string | null } | null;
  season?: { name?: string | number | null } | null;
  state?: { name?: string | null; short_name?: string | null } | null;
  participants?: Array<{ id?: number | string; name?: string | null; meta?: { location?: string | null } | null }>;
  scores?: Array<{ participant?: string | null; score?: { goals?: number | null; participant?: string | null } | null }>;
  venue?: { name?: string | null } | null;
};

async function sportmonks(path: string, token: string) {
  const response = await fetch(`https://api.sportmonks.com/v3/football/${path}`, { headers: { Authorization: token } });
  const body = await response.text();
  if (!response.ok) throw new Error(`Sportmonks ${response.status}: ${body.slice(0, 500)}`);
  return JSON.parse(body);
}

function statusFor(f: Fixture) {
  const s = (f.state?.short_name || f.state?.name || "").toLowerCase();
  if (s.includes("live") || s === "inplay" || s === "1h" || s === "2h") return "live";
  if (s.includes("half")) return "halftime";
  if (s.includes("post") || s.includes("finished") || s === "ft" || s.includes("full")) return "finished";
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("postpon")) return "postponed";
  return "scheduled";
}

function scoreFor(f: Fixture, location: "home" | "away") {
  const item = (f.scores || []).find((s) => String(s.participant || s.score?.participant || "").toLowerCase() === location);
  const goals = item?.score?.goals;
  return typeof goals === "number" ? goals : goals == null ? null : Number(goals);
}

export default withSupabase({ auth: "secret" }, async (req, ctx) => {
  if (req.method !== "POST") return Response.json({ error: "POST required" }, { status: 405 });
  const token = Deno.env.get("SPORTMONKS_TOKEN");
  if (!token) return Response.json({ error: "SPORTMONKS_TOKEN is not configured" }, { status: 503 });

  let body: { start_date?: string; end_date?: string; league_ids?: string[] };
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const start = body.start_date || new Date().toISOString().slice(0, 10);
  const end = body.end_date || start;
  const { data: configured, error: configError } = await ctx.supabaseAdmin
    .from("wfm_match_competitions")
    .select("external_league_id,competition_id,competition_name")
    .eq("provider", "sportmonks").eq("active", true).order("priority", { ascending: false });

  if (configError) return Response.json({ error: configError.message }, { status: 500 });

  const allowed = new Set((body.league_ids?.length ? body.league_ids : (configured || []).map((x) => x.external_league_id)).map(String));
  if (!allowed.size) return Response.json({ error: "No active match competitions configured." }, { status: 422 });

  const runResult = await ctx.supabaseAdmin.from("data_update_runs").insert({
    provider: "sportmonks", run_type: "match_fixtures", status: "running",
    metadata: { start_date: start, end_date: end, league_ids: [...allowed] }
  }).select("id").single();
  if (runResult.error || !runResult.data) return Response.json({ error: runResult.error?.message || "Could not create update run" }, { status: 500 });

  let fixtures: Fixture[] = [];
  const errors: string[] = [];
  try {
    const payload = await sportmonks(`fixtures/between/date/${start}/${end}?include=participants;scores;state;league;season;venue`, token);
    fixtures = Array.isArray(payload?.data) ? payload.data : [];
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  let inserted = 0, updated = 0, rejected = 0;
  for (const fixture of fixtures) {
    const leagueId = String(fixture.league_id ?? "");
    if (!allowed.has(leagueId) || fixture.id == null) continue;
    const source = (configured || []).find((x) => String(x.external_league_id) === leagueId);
    const participants = fixture.participants || [];
    const home = participants.find((p) => p.meta?.location === "home") || participants[0];
    const away = participants.find((p) => p.meta?.location === "away") || participants[1];
    if (!home?.name || !away?.name) { rejected++; errors.push(`${fixture.id}: missing participants`); continue; }

    const row = {
      provider: "sportmonks", external_match_id: String(fixture.id),
      competition_id: source?.competition_id || null,
      competition_name: source?.competition_name || fixture.league?.name || leagueId,
      season_id: null, season_label: fixture.season?.name ? String(fixture.season.name) : null,
      home_team_name: home.name, away_team_name: away.name, kickoff_at: fixture.starting_at || null,
      status: statusFor(fixture), home_score: scoreFor(fixture, "home"), away_score: scoreFor(fixture, "away"),
      venue_name: fixture.venue?.name || null, source_updated_at: new Date().toISOString(), confidence: "verified"
    };

    const { data: existing } = await ctx.supabaseAdmin.from("wfm_match_fixtures").select("id")
      .eq("provider", "sportmonks").eq("external_match_id", String(fixture.id)).maybeSingle();
    const { error } = await ctx.supabaseAdmin.from("wfm_match_fixtures").upsert(row, { onConflict: "provider,external_match_id" });
    if (error) { rejected++; errors.push(`${fixture.id}: ${error.message}`); }
    else if (existing) updated++;
    else inserted++;
  }

  const status = errors.length && !inserted && !updated ? "failed" : errors.length || rejected ? "partial" : "completed";
  await ctx.supabaseAdmin.from("data_update_runs").update({
    status, finished_at: new Date().toISOString(), records_received: fixtures.length,
    records_inserted: inserted, records_updated: updated, records_rejected: rejected,
    error_message: errors.length ? errors.slice(0, 100).join(" | ") : null
  }).eq("id", runResult.data.id);

  return Response.json({ ok: status !== "failed", status, run_id: runResult.data.id,
    date_range: { start, end }, provider_fixtures_received: fixtures.length, inserted, updated, rejected, errors });
});