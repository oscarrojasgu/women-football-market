export type SportmonksPlayerMap = Record<string, string>;

type RawDetail = {
  type?: { name?: string | null; code?: string | null } | null;
  data?: { value?: unknown } | null;
};

type RawLineup = {
  player_id?: number | string | null;
  player_name?: string | null;
  minutes_played?: number | null;
  details?: RawDetail[] | null;
};

type RawFixture = {
  id?: number | string | null;
  name?: string | null;
  league_id?: number | string | null;
  season_id?: number | string | null;
  starting_at?: string | null;
  participants?: Array<{ id?: number | string; name?: string | null; meta?: { location?: string | null } | null }> | null;
  lineups?: RawLineup[] | null;
};

function value(details: RawDetail[] | null | undefined, ...names: string[]) {
  const wanted = new Set(names.map((name) => name.toLowerCase()));
  const item = (details || []).find((detail) => wanted.has((detail.type?.name || detail.type?.code || "").toLowerCase()));
  const raw = item?.data?.value;
  return typeof raw === "number" ? raw : Number(raw) || 0;
}

export function normalizeSportmonksFixture(
  fixture: RawFixture,
  playerMap: SportmonksPlayerMap,
) {
  const season = fixture.season_id ? String(fixture.season_id) : "";
  const competition = fixture.league_id ? String(fixture.league_id) : "";
  if (!season || !competition) return [];

  return (fixture.lineups || [])
    .map((lineup) => {
      const externalId = lineup.player_id == null ? "" : String(lineup.player_id);
      const playerId = playerMap[externalId];
      if (!playerId) return null;

      const details = lineup.details || [];
      return {
        player_id: playerId,
        season,
        competition,
        match_id: fixture.id == null ? null : String(fixture.id),
        source_event_id: externalId && fixture.id != null ? `sportmonks:${fixture.id}:${externalId}` : null,
        appearances: lineup.minutes_played && lineup.minutes_played > 0 ? 1 : 0,
        starts: 0,
        minutes: lineup.minutes_played || 0,
        goals: value(details, "Goals"),
        assists: value(details, "Assists"),
        shots: value(details, "Shots Total", "Shots"),
        shots_on_target: value(details, "Shots On Target"),
        key_passes: value(details, "Key Passes"),
        tackles: value(details, "Tackles"),
        interceptions: value(details, "Interceptions"),
        clearances: value(details, "Clearances"),
        blocks: value(details, "Blocks"),
        recoveries: value(details, "Recoveries"),
        dispossessions: value(details, "Dispossessed"),
        dribbles_attempted: value(details, "Dribbles Attempted", "Dribbles"),
        dribbles_completed: value(details, "Dribbles Successful", "Successful Dribbles"),
        fouls_committed: value(details, "Fouls"),
        offsides: value(details, "Offsides"),
        passes_attempted: value(details, "Passes"),
        passes_completed: value(details, "Passes Accuracy"),
        duels_won: value(details, "Duels Won"),
        aerials_won: value(details, "Aerials Won"),
        own_goals: value(details, "Own Goals"),
        notes: "Sportmonks adapter; validate field availability by competition before production ingestion.",
      };
    })
    .filter(Boolean);
}
