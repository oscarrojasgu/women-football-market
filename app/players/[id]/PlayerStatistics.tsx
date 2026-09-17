"use client";

import { useMemo, useState } from "react";

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

type PlayerStatisticsProps = {
  stats: PlayerStat[];
  clubs: Club[];
};

const formatStat = (value: number | null) => {
  if (value === null || value === undefined) {
    return "—";
  }

  return value.toLocaleString("en-US");
};

export default function PlayerStatistics({
  stats,
  clubs,
}: PlayerStatisticsProps) {
  const [seasonFilter, setSeasonFilter] = useState("All");
  const [competitionFilter, setCompetitionFilter] =
    useState("All");
  const [clubFilter, setClubFilter] = useState("All");

  const clubMap = useMemo(() => {
    return new Map(clubs.map((club) => [club.id, club]));
  }, [clubs]);

  const seasons = useMemo(() => {
    return Array.from(
      new Set(stats.map((stat) => stat.season).filter(Boolean))
    ).sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true })
    );
  }, [stats]);

  const competitions = useMemo(() => {
    return Array.from(
      new Set(
        stats
          .map((stat) => stat.competition)
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [stats]);

  const statClubs = useMemo(() => {
    const ids = Array.from(
      new Set(
        stats
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
  }, [stats, clubMap]);

  const filteredStats = useMemo(() => {
    return stats.filter((stat) => {
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
    stats,
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

  if (stats.length === 0) {
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
          No statistics available.
        </div>
      </div>
    );
  }

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

                        <td
                          style={{
                            padding: "11px 8px",
                            borderBottom:
                              "1px solid #f0f0f0",
                            fontSize: 12,
                            textAlign: "right",
                          }}
                        >
                          {formatStat(stat.appearances)}
                        </td>

                        <td
                          style={{
                            padding: "11px 8px",
                            borderBottom:
                              "1px solid #f0f0f0",
                            fontSize: 12,
                            textAlign: "right",
                          }}
                        >
                          {formatStat(stat.starts)}
                        </td>

                        <td
                          style={{
                            padding: "11px 8px",
                            borderBottom:
                              "1px solid #f0f0f0",
                            fontSize: 12,
                            textAlign: "right",
                          }}
                        >
                          {formatStat(stat.minutes)}
                        </td>

                        <td
                          style={{
                            padding: "11px 8px",
                            borderBottom:
                              "1px solid #f0f0f0",
                            fontSize: 12,
                            textAlign: "right",
                            fontWeight: 600,
                          }}
                        >
                          {formatStat(stat.goals)}
                        </td>

                        <td
                          style={{
                            padding: "11px 8px",
                            borderBottom:
                              "1px solid #f0f0f0",
                            fontSize: 12,
                            textAlign: "right",
                          }}
                        >
                          {formatStat(stat.assists)}
                        </td>

                        <td
                          style={{
                            padding: "11px 8px",
                            borderBottom:
                              "1px solid #f0f0f0",
                            fontSize: 12,
                            textAlign: "right",
                          }}
                        >
                          {formatStat(stat.yellow_cards)}
                        </td>

                        <td
                          style={{
                            padding: "11px 8px",
                            borderBottom:
                              "1px solid #f0f0f0",
                            fontSize: 12,
                            textAlign: "right",
                          }}
                        >
                          {formatStat(stat.red_cards)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
