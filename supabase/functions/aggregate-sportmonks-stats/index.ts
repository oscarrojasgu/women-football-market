import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@^1";

type MatchRow = {
  player_id: string;
  club_id: string | null;
  season: string;
  competition: string;
  appearances: number | null;
  minutes: number | null;
  goals: number | null;
  assists: number | null;
  shots: number | null;
  shots_on_target: number | null;
  key_passes: number | null;
  chances_created: number | null;
  crosses: number | null;
  tackles: number | null;
  tackles_won: number | null;
  interceptions: number | null;
  clearances: number | null;
  blocks: number | null;
  recoveries: number | null;
  dispossessions: number | null;
  dribbles_attempted: number | null;
  dribbles_completed: number | null;
  fouls_committed: number | null;
  fouls_drawn: number | null;
  offsides: number | null;
  passes_attempted: number | null;
  passes_completed: number | null;
  progressive_passes: number | null;
  progressive_carries: number | null;
  duels_won: number | null;
  duels_lost: number | null;
  aerials_won: number | null;
  aerials_lost: number | null;
  xg: number | null;
  xa: number | null;
  sca: number | null;
  gca: number | null;
  saves: number | null;
  shots_on_target_faced: number | null;
  goals_against: number | null;
  clean_sheets: number | null;
  penalty_kicks_saved: number | null;
  penalty_kicks_faced: number | null;
  own_goals: number | null;
};

const n=(v:number|null)=>v||0;

export default withSupabase({ auth: "secret" }, async (req, ctx) => {
  if (req.method !== "POST") return Response.json({ error: "POST required" }, { status: 405 });

  let body: { provider?: string; season?: string; competition?: string };
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const provider = body.provider?.trim() || "sportmonks";
  const { data: run, error: runError } = await ctx.supabaseAdmin
    .from("data_update_runs")
    .insert({ provider, run_type: "backfill", status: "running", metadata: { mode: "aggregate_match_stats", season: body.season || null, competition: body.competition || null } })
    .select("id").single();

  if (runError || !run) return Response.json({ error: runError?.message || "Could not create update run" }, { status: 500 });

  let query = ctx.supabaseAdmin.from("player_match_stats").select("*").eq("provider", provider);
  if (body.season) query = query.eq("season", body.season);
  if (body.competition) query = query.eq("competition", body.competition);

  const { data: rows, error } = await query;
  if (error) {
    await ctx.supabaseAdmin.from("data_update_runs").update({ status: "failed", finished_at: new Date().toISOString(), error_message: error.message }).eq("id", run.id);
    return Response.json({ error: error.message, run_id: run.id }, { status: 500 });
  }

  const groups = new Map<string, MatchRow[]>();
  for (const row of (rows || []) as MatchRow[]) {
    const key = [row.player_id, row.club_id || "", row.season, row.competition].join("|");
    const group = groups.get(key) || [];
    group.push(row);
    groups.set(key, group);
  }

  let inserted = 0, updated = 0, rejected = 0;
  const errors: string[] = [];

  for (const group of groups.values()) {
    const first = group[0];
    const aggregate = group.reduce((a, r) => ({
      appearances: a.appearances + n(r.appearances),
      minutes: a.minutes + n(r.minutes),
      goals: a.goals + n(r.goals),
      assists: a.assists + n(r.assists),
      shots: a.shots + n(r.shots),
      shots_on_target: a.shots_on_target + n(r.shots_on_target),
      key_passes: a.key_passes + n(r.key_passes),
      chances_created: a.chances_created + n(r.chances_created),
      crosses: a.crosses + n(r.crosses),
      tackles: a.tackles + n(r.tackles),
      tackles_won: a.tackles_won + n(r.tackles_won),
      interceptions: a.interceptions + n(r.interceptions),
      clearances: a.clearances + n(r.clearances),
      blocks: a.blocks + n(r.blocks),
      recoveries: a.recoveries + n(r.recoveries),
      dispossessions: a.dispossessions + n(r.dispossessions),
      dribbles_attempted: a.dribbles_attempted + n(r.dribbles_attempted),
      dribbles_completed: a.dribbles_completed + n(r.dribbles_completed),
      fouls_committed: a.fouls_committed + n(r.fouls_committed),
      fouls_drawn: a.fouls_drawn + n(r.fouls_drawn),
      offsides: a.offsides + n(r.offsides),
      passes_attempted: a.passes_attempted + n(r.passes_attempted),
      passes_completed: a.passes_completed + n(r.passes_completed),
      progressive_passes: a.progressive_passes + n(r.progressive_passes),
      progressive_carries: a.progressive_carries + n(r.progressive_carries),
      duels_won: a.duels_won + n(r.duels_won),
      duels_lost: a.duels_lost + n(r.duels_lost),
      aerials_won: a.aerials_won + n(r.aerials_won),
      aerials_lost: a.aerials_lost + n(r.aerials_lost),
      xg: a.xg + n(r.xg),
      xa: a.xa + n(r.xa),
      sca: a.sca + n(r.sca),
      gca: a.gca + n(r.gca),
      saves: a.saves + n(r.saves),
      shots_on_target_faced: a.shots_on_target_faced + n(r.shots_on_target_faced),
      goals_against: a.goals_against + n(r.goals_against),
      clean_sheets: a.clean_sheets + n(r.clean_sheets),
      penalty_kicks_saved: a.penalty_kicks_saved + n(r.penalty_kicks_saved),
      penalty_kicks_faced: a.penalty_kicks_faced + n(r.penalty_kicks_faced),
      own_goals: a.own_goals + n(r.own_goals),
    }), {
      appearances:0,minutes:0,goals:0,assists:0,shots:0,shots_on_target:0,key_passes:0,chances_created:0,crosses:0,tackles:0,tackles_won:0,interceptions:0,clearances:0,blocks:0,recoveries:0,dispossessions:0,dribbles_attempted:0,dribbles_completed:0,fouls_committed:0,fouls_drawn:0,offsides:0,passes_attempted:0,passes_completed:0,progressive_passes:0,progressive_carries:0,duels_won:0,duels_lost:0,aerials_won:0,aerials_lost:0,xg:0,xa:0,sca:0,gca:0,saves:0,shots_on_target_faced:0,goals_against:0,clean_sheets:0,penalty_kicks_saved:0,penalty_kicks_faced:0,own_goals:0
    });

    const sourceEventId = `sportmonks:aggregate:${first.season}:${first.competition}:${first.player_id}:${first.club_id || "none"}`;
    const row = {
      player_id:first.player_id, club_id:first.club_id, season:first.season, competition:first.competition,
      ...aggregate, source_event_id:sourceEventId, confidence:"verified",
      notes:`Aggregated from ${group.length} Sportmonks match-stat records.`, updated_at:new Date().toISOString()
    };

    const { data: existing } = await ctx.supabaseAdmin.from("player_stats").select("id").eq("source_event_id", sourceEventId).maybeSingle();
    const { error: upsertError } = await ctx.supabaseAdmin.from("player_stats").upsert(row, { onConflict:"source_event_id" });
    if (upsertError) { rejected++; errors.push(`${first.player_id}:${first.season}:${upsertError.message}`); }
    else if (existing) updated++;
    else inserted++;
  }

  const status = rejected === 0 ? "completed" : (inserted + updated > 0 ? "partial" : "failed");
  await ctx.supabaseAdmin.from("data_update_runs").update({
    status, finished_at:new Date().toISOString(), records_received:groups.size,
    records_inserted:inserted, records_updated:updated, records_rejected:rejected,
    error_message:errors.length ? errors.slice(0,100).join(" | ") : null
  }).eq("id",run.id);

  return Response.json({ ok:status!=="failed",run_id:run.id,provider,status,groups:groups.size,records_inserted:inserted,records_updated:updated,records_rejected:rejected,errors });
});
