import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@^1";

type SportmonksFixture = {
  id?: number | string;
  league_id?: number | string | null;
  season_id?: number | string | null;
  lineups?: Array<{
    player_id?: number | string | null;
    player_name?: string | null;
    minutes_played?: number | null;
    details?: Array<{
      type?: { name?: string | null; code?: string | null };
      data?: { value?: unknown };
    }>;
  }>;
};

function numeric(details: SportmonksFixture["lineups"][number]["details"], ...names: string[]) {
  const wanted = new Set(names.map((name) => name.toLowerCase()));
  const item = (details || []).find((detail) => wanted.has((detail.type?.name || detail.type?.code || "").toLowerCase()));
  const raw = item?.data?.value;
  return typeof raw === "number" ? raw : Number(raw) || 0;
}

async function sportmonks(path: string, token: string) {
  const url = new URL(`https://api.sportmonks.com/v3/football/${path}`);
  const response = await fetch(url, { headers: { Authorization: token } });
  const text = await response.text();
  if (!response.ok) throw new Error(`Sportmonks ${response.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text);
}

export default withSupabase({ auth: "secret" }, async (req, ctx) => {
  if (req.method !== "POST") return Response.json({ error: "POST required" }, { status: 405 });

  const token = Deno.env.get("SPORTMONKS_TOKEN");
  if (!token) return Response.json({
    error: "SPORTMONKS_TOKEN is not configured",
    setup: "Add SPORTMONKS_TOKEN in Supabase Edge Function Secrets, then retry."
  }, { status: 503 });

  let body: { fixture_ids?: Array<string | number>; provider?: string };
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const fixtureIds = Array.isArray(body.fixture_ids) ? body.fixture_ids.map(String).filter(Boolean) : [];
  if (!fixtureIds.length) return Response.json({ error: "fixture_ids must contain at least one fixture id" }, { status: 400 });

  const provider = body.provider?.trim() || "sportmonks";
  const { data: run, error: runError } = await ctx.supabaseAdmin
    .from("data_update_runs")
    .insert({
      provider,
      run_type: "manual",
      status: "running",
      records_received: fixtureIds.length,
      metadata: { fixture_ids: fixtureIds, mode: "match_stats" }
    })
    .select("id").single();

  if (runError || !run) return Response.json({ error: runError?.message || "Could not create update run" }, { status: 500 });

  let received = 0, inserted = 0, updated = 0, rejected = 0;
  const errors: string[] = [];

  for (const fixtureId of fixtureIds) {
    try {
      const payload = await sportmonks(`fixtures/${encodeURIComponent(fixtureId)}?include=lineups.details;participants`, token);
      const fixture = payload?.data as SportmonksFixture | undefined;
      if (!fixture?.id || !fixture.season_id || !fixture.league_id) {
        rejected++;
        errors.push(`${fixtureId}: missing fixture/season/league data`);
        continue;
      }

      for (const lineup of fixture.lineups || []) {
        if (lineup.player_id == null) continue;
        received++;

        const externalPlayerId = String(lineup.player_id);
        const { data: mapping } = await ctx.supabaseAdmin
          .from("provider_player_mappings")
          .select("player_id")
          .eq("provider", provider)
          .eq("external_player_id", externalPlayerId)
          .maybeSingle();

        let playerId = mapping?.player_id || null;

        if (!playerId && lineup.player_name) {
          const normalized = lineup.player_name.trim().replace(/\s+/g, " ").toLowerCase();
          const { data: candidates } = await ctx.supabaseAdmin
            .from("players")
            .select("id,full_name")
            .ilike("full_name", normalized)
            .limit(2);

          if (candidates?.length === 1) {
            playerId = candidates[0].id;
            await ctx.supabaseAdmin.from("provider_player_mappings").upsert({
              provider,
              external_player_id: externalPlayerId,
              player_id: playerId,
              external_name: lineup.player_name,
              confidence: "verified",
              notes: "Exact player-name match during Sportmonks fixture validation."
            }, { onConflict: "provider,external_player_id" });
          }
        }

        if (!playerId) {
          rejected++;
          errors.push(`${fixtureId}:${externalPlayerId}: no WFM player mapping`);
          continue;
        }

        const details = lineup.details || [];
        const row = {
          provider,
          external_match_id: String(fixture.id),
          external_player_id: externalPlayerId,
          player_id: playerId,
          season: String(fixture.season_id),
          competition: String(fixture.league_id),
          appearances: (lineup.minutes_played || 0) > 0 ? 1 : 0,
          minutes: lineup.minutes_played || 0,
          goals: numeric(details, "Goals"),
          assists: numeric(details, "Assists"),
          shots: numeric(details, "Shots Total", "Shots"),
          shots_on_target: numeric(details, "Shots On Target"),
          key_passes: numeric(details, "Key Passes"),
          tackles: numeric(details, "Tackles"),
          interceptions: numeric(details, "Interceptions"),
          clearances: numeric(details, "Clearances"),
          blocks: numeric(details, "Blocks"),
          recoveries: numeric(details, "Recoveries"),
          dispossessions: numeric(details, "Dispossessed"),
          dribbles_attempted: numeric(details, "Dribbles Attempted", "Dribbles"),
          dribbles_completed: numeric(details, "Dribbles Successful", "Successful Dribbles"),
          fouls_committed: numeric(details, "Fouls"),
          offsides: numeric(details, "Offsides"),
          passes_attempted: numeric(details, "Passes"),
          duels_won: numeric(details, "Duels Won"),
          aerials_won: numeric(details, "Aerials Won"),
          own_goals: numeric(details, "Own Goals"),
          match_id: String(fixture.id),
          source_event_id: `sportmonks:${fixture.id}:${externalPlayerId}`,
          confidence: "verified",
          notes: "Imported from Sportmonks fixture lineups.details."
        };

        const { data: existing } = await ctx.supabaseAdmin
          .from("player_match_stats")
          .select("id")
          .eq("provider", provider)
          .eq("external_match_id", String(fixture.id))
          .eq("external_player_id", externalPlayerId)
          .maybeSingle();

        const { error } = await ctx.supabaseAdmin
          .from("player_match_stats")
          .upsert({ ...row, updated_at: new Date().toISOString() },
            { onConflict: "provider,external_match_id,external_player_id" });

        if (error) {
          rejected++;
          errors.push(`${fixtureId}:${externalPlayerId}: ${error.message}`);
        } else if (existing) updated++;
        else inserted++;
      }
    } catch (error) {
      rejected++;
      errors.push(`${fixtureId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const status = rejected === 0 ? "completed" : (inserted + updated > 0 ? "partial" : "failed");
  await ctx.supabaseAdmin.from("data_update_runs").update({
    status,
    finished_at: new Date().toISOString(),
    records_received: received,
    records_inserted: inserted,
    records_updated: updated,
    records_rejected: rejected,
    error_message: errors.length ? errors.slice(0, 100).join(" | ") : null
  }).eq("id", run.id);

  return Response.json({
    ok: status !== "failed",
    run_id: run.id,
    provider,
    status,
    fixtures_requested: fixtureIds.length,
    records_received: received,
    records_inserted: inserted,
    records_updated: updated,
    records_rejected: rejected,
    errors
  }, { status: status === "failed" ? 422 : 200 });
});
