"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../../lib/supabase";

type PlayerStat = {
  id: string;
  club_id: string | null;
  season: string;
  competition: string;
  appearances: number | null;
  starts: number | null;
  minutes: number | null;
  goals: number | null;
  assists: number | null;
  yellow_cards: number | null;
  red_cards: number | null;
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
  confidence: string | null;
  notes: string | null;
};

type Club = {
  id: string;
  name: string;
  league: string | null;
  country: string | null;
  logo_url: string | null;
};

type NationalTeamStat = {
  id: string;
  country: string;
  level: string | null;
  caps: number | null;
  starts: number | null;
  minutes: number | null;
  goals: number | null;
  assists: number | null;
  yellow_cards: number | null;
  red_cards: number | null;
  debut_date: string | null;
  last_appearance_date: string | null;
  competitions: string | null;
  confidence: string | null;
  notes: string | null;
};

type PlayerStatisticsProps = {
  stats: PlayerStat[];
  clubs: Club[];
};

const formatStat = (value: number | null) => {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("en-US");
};

const formatDecimal = (value: number | null) => {
  if (value === null || value === undefined) return "—";
  return Number.isInteger(value)
    ? value.toLocaleString("en-US")
    : value.toLocaleString("en-US", {
        maximumFractionDigits: 2,
      });
};

const formatDate = (date: string | null) => {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
};

const displayConfidence = (value: string | null) => {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export default function PlayerStatistics({
  stats,
  clubs,
}: PlayerStatisticsProps) {
  const pathname = usePathname();
  const playerId = pathname.split("/").filter(Boolean).pop() || "";

  const [fullStats, setFullStats] = useState<PlayerStat[]>(stats);
  const [nationalTeamStats, setNationalTeamStats] =
    useState<NationalTeamStat[]>([]);
  const [loadingAdvanced, setLoadingAdvanced] = useState(true);

  const [seasonFilter, setSeasonFilter] = useState("All");
  const [competitionFilter, setCompetitionFilter] =
    useState("All");
  const [clubFilter, setClubFilter] = useState("All");
  const [advancedOpenByClub, setAdvancedOpenByClub] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      if (!playerId) {
        setLoadingAdvanced(false);
        return;
      }

      setLoadingAdvanced(true);

      const [clubStatsResult, nationalResult] =
        await Promise.all([
          supabase
            .from("player_stats")
            .select("*")
            .eq("player_id", playerId)
            .order("season", { ascending: false })
            .order("competition", { ascending: true }),
          supabase
            .from("national_team_stats")
            .select("*")
            .eq("player_id", playerId)
            .order("level", { ascending: true })
            .order("country", { ascending: true }),
        ]);

      if (cancelled) return;

      if (!clubStatsResult.error && clubStatsResult.data) {
        setFullStats(clubStatsResult.data as PlayerStat[]);
      }

      if (!nationalResult.error && nationalResult.data) {
        setNationalTeamStats(
          nationalResult.data as NationalTeamStat[]
        );
      }

      setLoadingAdvanced(false);
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [playerId]);

  const clubMap = useMemo(() => {
    return new Map(clubs.map((club) => [club.id, club]));
  }, [clubs]);

  const seasons = useMemo(() => {
    return Array.from(
      new Set(
        fullStats.map((stat) => stat.season).filter(Boolean)
      )
    ).sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true })
    );
  }, [fullStats]);

  const competitions = useMemo(() => {
    return Array.from(
      new Set(
        fullStats
          .map((stat) => stat.competition)
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [fullStats]);

  const statClubs = useMemo(() => {
    const ids = Array.from(
      new Set(
        fullStats
          .map((stat) => stat.club_id)
          .filter(
            (clubId): clubId is string => Boolean(clubId)
          )
      )
    );

    return ids
      .map((clubId) => clubMap.get(clubId))
      .filter((club): club is Club => Boolean(club))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [fullStats, clubMap]);

  const filteredStats = useMemo(() => {
    return fullStats.filter((stat) => {
      const matchesSeason =
        seasonFilter === "All" ||
        stat.season === seasonFilter;

      const matchesCompetition =
        competitionFilter === "All" ||
        stat.competition === competitionFilter;

      const matchesClub =
        clubFilter === "All" ||
        stat.club_id === clubFilter;

      return (
        matchesSeason &&
        matchesCompetition &&
        matchesClub
      );
    });
  }, [
    fullStats,
    seasonFilter,
    competitionFilter,
    clubFilter,
  ]);

  const groupedStats = useMemo(() => {
    const grouped = new Map<
      string,
      {
        club: Club | null;
        stats: PlayerStat[];
      }
    >();

    filteredStats.forEach((stat) => {
      const key = stat.club_id || "unknown";

      if (!grouped.has(key)) {
        grouped.set(key, {
          club: stat.club_id
            ? clubMap.get(stat.club_id) || null
            : null,
          stats: [],
        });
      }

      grouped.get(key)!.stats.push(stat);
    });

    return Array.from(grouped.entries())
      .map(([clubId, group]) => ({
        clubId,
        club: group.club,
        stats: [...group.stats].sort((a, b) => {
          const seasonComparison = b.season.localeCompare(
            a.season,
            undefined,
            { numeric: true }
          );

          if (seasonComparison !== 0) {
            return seasonComparison;
          }

          return a.competition.localeCompare(
            b.competition
          );
        }),
      }))
      .sort((a, b) => {
        const aSeason = a.stats[0]?.season || "";
        const bSeason = b.stats[0]?.season || "";

        const seasonComparison = bSeason.localeCompare(
          aSeason,
          undefined,
          { numeric: true }
        );

        if (seasonComparison !== 0) {
          return seasonComparison;
        }

        return (
          a.club?.name || "Club not specified"
        ).localeCompare(
          b.club?.name || "Club not specified"
        );
      });
  }, [filteredStats, clubMap]);

  const selectStyle = {
    border: "1px solid #ddd",
    borderRadius: 7,
    background: "#fff",
    padding: "8px 32px 8px 10px",
    fontSize: 13,
    color: "#111",
    minWidth: 150,
    cursor: "pointer",
  };

  const labelStyle = {
    display: "block",
    marginBottom: 5,
    fontSize: 10,
    color: "#888",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  };

  const tableCellStyle = {
    padding: "10px 8px",
    borderBottom: "1px solid #f0f0f0",
    fontSize: 12,
    textAlign: "right" as const,
    whiteSpace: "nowrap" as const,
  };

  const sectionTitleStyle = {
    margin: 0,
    fontSize: 15,
    fontWeight: 750,
  };

  const sectionSubTitleStyle = {
    marginTop: 3,
    fontSize: 11,
    color: "#888",
  };

  if (fullStats.length === 0 && nationalTeamStats.length === 0) {
    return (
      <div
        style={{
          marginTop: 16,
          padding: "22px",
          border: "1px solid #ddd",
          borderRadius: 10,
          background: "#fff",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 750,
          }}
        >
          Career Statistics
        </h2>

        <div
          style={{
            marginTop: 20,
            color: "#888",
            fontSize: 14,
          }}
        >
          {loadingAdvanced
            ? "Loading statistics..."
            : "No statistics available."}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          marginTop: 16,
          padding: "22px",
          border: "1px solid #ddd",
          borderRadius: 10,
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 750,
              }}
            >
              Career Statistics
            </h2>

            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                color: "#888",
              }}
            >
              Season-by-season statistics by club and
              competition
            </div>
          </div>

          <div
            style={{
              fontSize: 11,
              color: "#888",
              paddingTop: 4,
            }}
          >
            {filteredStats.length} record
            {filteredStats.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 20,
            padding: 14,
            border: "1px solid #eee",
            borderRadius: 8,
            background: "#fafafa",
          }}
        >
          <div>
            <label style={labelStyle}>Season</label>

            <select
              value={seasonFilter}
              onChange={(event) =>
                setSeasonFilter(event.target.value)
              }
              style={selectStyle}
            >
              <option value="All">All</option>

              {seasons.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Competition</label>

            <select
              value={competitionFilter}
              onChange={(event) =>
                setCompetitionFilter(event.target.value)
              }
              style={selectStyle}
            >
              <option value="All">All</option>

              {competitions.map((competition) => (
                <option
                  key={competition}
                  value={competition}
                >
                  {competition}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Club</label>

            <select
              value={clubFilter}
              onChange={(event) =>
                setClubFilter(event.target.value)
              }
              style={selectStyle}
            >
              <option value="All">All</option>

              {statClubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </div>

          {(seasonFilter !== "All" ||
            competitionFilter !== "All" ||
            clubFilter !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSeasonFilter("All");
                setCompetitionFilter("All");
                setClubFilter("All");
              }}
              style={{
                alignSelf: "flex-end",
                border: "1px solid #ddd",
                borderRadius: 7,
                background: "#fff",
                padding: "8px 12px",
                fontSize: 12,
                cursor: "pointer",
                color: "#555",
              }}
            >
              Reset
            </button>
          )}
        </div>

        {filteredStats.length === 0 ? (
          <div
            style={{
              marginTop: 24,
              padding: "24px 0",
              color: "#888",
              fontSize: 13,
              textAlign: "center",
            }}
          >
            No statistics match the selected filters.
          </div>
        ) : (
          <div style={{ marginTop: 22 }}>
            {groupedStats.map((group) => (
              <div
                key={group.clubId}
                style={{
                  marginTop: 20,
                  paddingTop: 20,
                  borderTop: "1px solid #eee",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {group.club?.logo_url ? (
                    <img
                      src={group.club.logo_url}
                      alt={group.club.name}
                      style={{
                        width: 38,
                        height: 38,
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 7,
                        background: "#f5f4ef",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 15,
                        flexShrink: 0,
                      }}
                    >
                      {(group.club?.name || "?").charAt(0)}
                    </div>
                  )}

                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 750,
                      }}
                    >
                      {group.club?.name ||
                        "Club not specified"}
                    </div>

                    {group.club && (
                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 11,
                          color: "#888",
                        }}
                      >
                        {group.club.league ||
                          "League unknown"}
                        {group.club.country
                          ? ` · ${group.club.country}`
                          : ""}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 14,
                    overflowX: "auto",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      minWidth: 760,
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr>
                        {[
                          "Season",
                          "Competition",
                          "Apps",
                          "Starts",
                          "Minutes",
                          "Goals",
                          "Assists",
                          "YC",
                          "RC",
                        ].map((heading, index) => (
                          <th
                            key={heading}
                            style={{
                              padding: "9px 8px",
                              borderBottom:
                                "1px solid #ddd",
                              fontSize: 10,
                              color: "#888",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              textAlign:
                                index < 2
                                  ? "left"
                                  : "right",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {group.stats.map((stat) => (
                        <tr key={stat.id}>
                          <td
                            style={{
                              padding: "11px 8px",
                              borderBottom:
                                "1px solid #f0f0f0",
                              fontSize: 12,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {stat.season}
                          </td>

                          <td
                            style={{
                              padding: "11px 8px",
                              borderBottom:
                                "1px solid #f0f0f0",
                              fontSize: 12,
                              color: "#444",
                              minWidth: 180,
                            }}
                          >
                            {stat.competition}
                          </td>

                          {[
                            stat.appearances,
                            stat.starts,
                            stat.minutes,
                            stat.goals,
                            stat.assists,
                            stat.yellow_cards,
                            stat.red_cards,
                          ].map((value, index) => (
                            <td
                              key={index}
                              style={{
                                padding: "11px 8px",
                                borderBottom:
                                  "1px solid #f0f0f0",
                                fontSize: 12,
                                textAlign: "right",
                                fontWeight:
                                  index === 3
                                    ? 600
                                    : 400,
                              }}
                            >
                              {formatStat(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {group.stats.some(
                  (stat) =>
                    stat.shots !== null ||
                    stat.shots_on_target !== null ||
                    stat.key_passes !== null ||
                    stat.chances_created !== null ||
                    stat.crosses !== null ||
                    stat.tackles !== null ||
                    stat.tackles_won !== null ||
                    stat.interceptions !== null ||
                    stat.clearances !== null ||
                    stat.blocks !== null ||
                    stat.recoveries !== null ||
                    stat.dispossessions !== null ||
                    stat.dribbles_attempted !== null ||
                    stat.dribbles_completed !== null ||
                    stat.fouls_committed !== null ||
                    stat.fouls_drawn !== null ||
                    stat.offsides !== null ||
                    stat.passes_attempted !== null ||
                    stat.passes_completed !== null ||
                    stat.progressive_passes !== null ||
                    stat.progressive_carries !== null ||
                    stat.duels_won !== null ||
                    stat.duels_lost !== null ||
                    stat.aerials_won !== null ||
                    stat.aerials_lost !== null ||
                    stat.xg !== null ||
                    stat.xa !== null ||
                    stat.sca !== null ||
                    stat.gca !== null ||
                    stat.saves !== null ||
                    stat.shots_on_target_faced !== null ||
                    stat.goals_against !== null ||
                    stat.clean_sheets !== null ||
                    stat.penalty_kicks_saved !== null ||
                    stat.penalty_kicks_faced !== null ||
                    stat.own_goals !== null
                ) && (
                  <div
                    style={{
                      marginTop: 18,
                      overflowX: "auto",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setAdvancedOpenByClub((current) => ({
                          ...current,
                          [group.clubId]: !current[group.clubId],
                        }))
                      }
                      aria-expanded={Boolean(advancedOpenByClub[group.clubId])}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        marginBottom: advancedOpenByClub[group.clubId] ? 10 : 0,
                        padding: "0 0 10px",
                        border: "none",
                        borderBottom: "1px solid #eee",
                        background: "transparent",
                        color: "#888",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <span>Advanced Statistics</span>
                      <span
                        style={{
                          fontSize: 14,
                          color: "#555",
                          lineHeight: 1,
                        }}
                      >
                        {advancedOpenByClub[group.clubId] ? "−" : "+"}
                      </span>
                    </button>

                    {advancedOpenByClub[group.clubId] && (
                    <table
                      style={{
                        width: "100%",
                        minWidth: 1900,
                        borderCollapse: "collapse",
                      }}
                    >
                      <thead>
                        <tr>
                          {[
                            "Season",
                            "Competition",
                            "Shots",
                            "SOT",
                            "Key Passes",
                            "Chances",
                            "Crosses",
                            "Dribbles",
                            "Passes",
                            "Prog. Passes",
                            "Prog. Carries",
                            "Tackles",
                            "Tackles Won",
                            "Interceptions",
                            "Clearances",
                            "Blocks",
                            "Recoveries",
                            "Dispossessions",
                            "Duels Won",
                            "Duels Lost",
                            "Aerials Won",
                            "Aerials Lost",
                            "xG",
                            "xA",
                            "SCA",
                            "GCA",
                            "Fouls",
                            "Drawn",
                            "Offsides",
                            "Own Goals",
                            "Saves",
                            "SoTA Faced",
                            "GA",
                            "Clean Sheets",
                            "PK Faced",
                            "PK Saved",
                          ].map((heading, index) => (
                            <th
                              key={heading}
                              style={{
                                padding: "9px 8px",
                                borderBottom: "1px solid #ddd",
                                fontSize: 10,
                                color: "#888",
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                textAlign:
                                  index < 2 ? "left" : "right",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {group.stats.map((stat) => (
                          <tr key={`${stat.id}-advanced`}>
                            <td
                              style={{
                                padding: "11px 8px",
                                borderBottom: "1px solid #f0f0f0",
                                fontSize: 12,
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {stat.season}
                            </td>

                            <td
                              style={{
                                padding: "11px 8px",
                                borderBottom: "1px solid #f0f0f0",
                                fontSize: 12,
                                color: "#444",
                                minWidth: 180,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {stat.competition}
                            </td>

                            {[
                              formatStat(stat.shots),
                              formatStat(stat.shots_on_target),
                              formatStat(stat.key_passes),
                              formatStat(stat.chances_created),
                              formatStat(stat.crosses),
                              stat.dribbles_attempted === null &&
                              stat.dribbles_completed === null
                                ? "—"
                                : `${formatStat(stat.dribbles_completed)} / ${formatStat(stat.dribbles_attempted)}`,
                              stat.passes_attempted === null &&
                              stat.passes_completed === null
                                ? "—"
                                : `${formatStat(stat.passes_completed)} / ${formatStat(stat.passes_attempted)}`,
                              formatStat(stat.progressive_passes),
                              formatStat(stat.progressive_carries),
                              formatStat(stat.tackles),
                              formatStat(stat.tackles_won),
                              formatStat(stat.interceptions),
                              formatStat(stat.clearances),
                              formatStat(stat.blocks),
                              formatStat(stat.recoveries),
                              formatStat(stat.dispossessions),
                              formatStat(stat.duels_won),
                              formatStat(stat.duels_lost),
                              formatStat(stat.aerials_won),
                              formatStat(stat.aerials_lost),
                              formatDecimal(stat.xg),
                              formatDecimal(stat.xa),
                              formatStat(stat.sca),
                              formatStat(stat.gca),
                              formatStat(stat.fouls_committed),
                              formatStat(stat.fouls_drawn),
                              formatStat(stat.offsides),
                              formatStat(stat.own_goals),
                              formatStat(stat.saves),
                              formatStat(stat.shots_on_target_faced),
                              formatStat(stat.goals_against),
                              formatStat(stat.clean_sheets),
                              formatStat(stat.penalty_kicks_faced),
                              formatStat(stat.penalty_kicks_saved),
                            ].map((value, index) => (
                              <td
                                key={index}
                                style={{
                                  padding: "11px 8px",
                                  borderBottom: "1px solid #f0f0f0",
                                  fontSize: 12,
                                  textAlign: "right",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    )}

                    {advancedOpenByClub[group.clubId] && group.stats.some((stat) => stat.notes) && (
                      <div
                        style={{
                          marginTop: 10,
                          fontSize: 10,
                          color: "#888",
                          lineHeight: 1.45,
                        }}
                      >
                        {group.stats
                          .filter((stat) => stat.notes)
                          .map((stat) => (
                            <div key={`${stat.id}-note`}>
                              <strong>
                                {stat.season} · {stat.competition}:
                              </strong>{" "}
                              {stat.notes}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 16,
          padding: "22px",
          border: "1px solid #ddd",
          borderRadius: 10,
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 750,
              }}
            >
              National Team
            </h2>

            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                color: "#888",
              }}
            >
              Senior and youth international career records
            </div>
          </div>

          <div
            style={{
              fontSize: 11,
              color: "#888",
              paddingTop: 4,
            }}
          >
            {nationalTeamStats.length} team
            {nationalTeamStats.length !== 1 ? "s" : ""}
          </div>
        </div>

        {nationalTeamStats.length === 0 ? (
          <div
            style={{
              marginTop: 20,
              color: "#888",
              fontSize: 13,
            }}
          >
            {loadingAdvanced
              ? "Loading national team history..."
              : "No national team statistics available."}
          </div>
        ) : (
          <div
            style={{
              marginTop: 18,
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: 900,
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  {[
                    "National Team",
                    "Level",
                    "Caps",
                    "Starts",
                    "Minutes",
                    "Goals",
                    "Assists",
                    "YC",
                    "RC",
                    "Debut",
                    "Last Appearance",
                  ].map((heading, index) => (
                    <th
                      key={heading}
                      style={{
                        padding: "9px 8px",
                        borderBottom: "1px solid #ddd",
                        fontSize: 10,
                        color: "#888",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        textAlign:
                          index < 2 ? "left" : "right",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {nationalTeamStats.map((stat) => (
                  <tr key={stat.id}>
                    <td
                      style={{
                        padding: "11px 8px",
                        borderBottom: "1px solid #f0f0f0",
                        fontSize: 12,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {stat.country}
                    </td>

                    <td
                      style={{
                        padding: "11px 8px",
                        borderBottom: "1px solid #f0f0f0",
                        fontSize: 12,
                        textTransform: "capitalize",
                        color: "#555",
                      }}
                    >
                      {stat.level || "senior"}
                    </td>

                    {[
                      stat.caps,
                      stat.starts,
                      stat.minutes,
                      stat.goals,
                      stat.assists,
                      stat.yellow_cards,
                      stat.red_cards,
                    ].map((value, index) => (
                      <td
                        key={index}
                        style={{
                          padding: "11px 8px",
                          borderBottom:
                            "1px solid #f0f0f0",
                          fontSize: 12,
                          textAlign: "right",
                          fontWeight:
                            index === 0 || index === 3
                              ? 700
                              : 400,
                        }}
                      >
                        {formatStat(value)}
                      </td>
                    ))}

                    <td
                      style={{
                        padding: "11px 8px",
                        borderBottom: "1px solid #f0f0f0",
                        fontSize: 11,
                        color: "#666",
                        whiteSpace: "nowrap",
                        textAlign: "right",
                      }}
                    >
                      {formatDate(stat.debut_date)}
                    </td>

                    <td
                      style={{
                        padding: "11px 8px",
                        borderBottom: "1px solid #f0f0f0",
                        fontSize: 11,
                        color: "#666",
                        whiteSpace: "nowrap",
                        textAlign: "right",
                      }}
                    >
                      {formatDate(
                        stat.last_appearance_date
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {nationalTeamStats.some(
              (stat) =>
                stat.competitions ||
                stat.notes ||
                stat.confidence
            ) && (
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: "1px solid #eee",
                }}
              >
                {nationalTeamStats.map((stat) => (
                  <div
                    key={`${stat.id}-details`}
                    style={{
                      marginTop: 10,
                      fontSize: 11,
                      color: "#777",
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>
                      {stat.country}
                      {stat.level
                        ? ` · ${stat.level}`
                        : ""}
                    </strong>

                    {stat.competitions && (
                      <span>
                        {" · Competitions: "}
                        {stat.competitions}
                      </span>
                    )}

                    {stat.confidence && (
                      <span>
                        {" · Confidence: "}
                        {displayConfidence(
                          stat.confidence
                        )}
                      </span>
                    )}

                    {stat.notes && (
                      <div style={{ marginTop: 3 }}>
                        {stat.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
