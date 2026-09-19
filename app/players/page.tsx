"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Player = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  position: string | null;
  preferred_foot: string | null;
  agency: string | null;
  photo_url: string | null;
};

type ContractInfo = {
  player_id: string;
  annual_salary: number | null;
  weekly_salary: number | null;
  currency: string | null;
  status: string | null;
  club: {
    name: string;
    league: string | null;
    logo_url: string | null;
  } | null;
};

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [contracts, setContracts] = useState<ContractInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("All");
  const [nationality, setNationality] = useState("All");

  useEffect(() => {
    async function loadPlayers() {
      setLoading(true);

      const { data: playerData, error: playerError } =
        await supabase
          .from("players")
          .select(`
            id,
            full_name,
            date_of_birth,
            nationality,
            position,
            preferred_foot,
            agency,
            photo_url
          `)
          .order("full_name", { ascending: true });

      if (playerError) {
        console.error("Error loading players:", playerError);
        setPlayers([]);
        setLoading(false);
        return;
      }

      const { data: contractData, error: contractError } =
        await supabase
          .from("contracts")
          .select(`
            player_id,
            annual_salary,
            weekly_salary,
            currency,
            status,
            club:clubs (
              name,
              league,
              logo_url
            )
          `);

      if (contractError) {
        console.error("Error loading contracts:", contractError);
      }

      const normalizedContracts: ContractInfo[] = (
        contractData || []
      ).map((contract: any) => ({
        player_id: contract.player_id,
        annual_salary: contract.annual_salary,
        weekly_salary: contract.weekly_salary,
        currency: contract.currency,
        status: contract.status,
        club: Array.isArray(contract.club)
          ? contract.club[0] || null
          : contract.club || null,
      }));

      setPlayers(playerData || []);
      setContracts(normalizedContracts);
      setLoading(false);
    }

    loadPlayers();
  }, []);

  const positions = useMemo(() => {
    const values = players
      .map((player) => player.position)
      .filter(Boolean) as string[];

    return ["All", ...Array.from(new Set(values))];
  }, [players]);

  const nationalities = useMemo(() => {
    const values = players
      .map((player) => player.nationality)
      .filter(Boolean) as string[];

    return ["All", ...Array.from(new Set(values))];
  }, [players]);

  const getContract = (playerId: string) => {
    const playerContracts = contracts.filter(
      (contract) => contract.player_id === playerId
    );

    const activeContract = playerContracts.find(
      (contract) =>
        contract.status?.toLowerCase() === "active"
    );

    return activeContract || playerContracts[0] || null;
  };

  const filteredPlayers = useMemo(() => {
    const query = search.toLowerCase().trim();

    return players.filter((player) => {
      const playerName =
        player.full_name?.toLowerCase() || "";

      const playerNationality =
        player.nationality?.toLowerCase() || "";

      const playerPosition =
        player.position?.toLowerCase() || "";

      const playerAgency =
        player.agency?.toLowerCase() || "";

      const contract = contracts.find(
        (item) => item.player_id === player.id
      );

      const clubName =
        contract?.club?.name?.toLowerCase() || "";

      const matchesSearch =
        !query ||
        playerName.includes(query) ||
        playerNationality.includes(query) ||
        playerPosition.includes(query) ||
        playerAgency.includes(query) ||
        clubName.includes(query);

      const matchesPosition =
        position === "All" ||
        player.position === position;

      const matchesNationality =
        nationality === "All" ||
        player.nationality === nationality;

      return (
        matchesSearch &&
        matchesPosition &&
        matchesNationality
      );
    });
  }, [
    players,
    contracts,
    search,
    position,
    nationality,
  ]);

  function calculateAge(dateOfBirth: string | null) {
    if (!dateOfBirth) return null;

    const birthDate = new Date(
      `${dateOfBirth}T00:00:00`
    );

    const today = new Date();

    let age =
      today.getFullYear() -
      birthDate.getFullYear();

    const monthDifference =
      today.getMonth() -
      birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 &&
        today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  function formatSalary(
    salary: number | null,
    currency: string | null
  ) {
    if (salary === null || salary === undefined) {
      return "Not available";
    }

    return `${currency || "USD"} ${Number(
      salary
    ).toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })}`;
  }

  return (
    <>
      {/* HEADER */}

      

      {/* BLACK PAGE HERO */}

      <section
        style={{
          background: "#111",
          color: "#fff",
          padding: "55px 6vw 50px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              letterSpacing: "2px",
              fontWeight: 700,
              marginBottom: "14px",
              color: "#aaa",
            }}
          >
            WOMEN&apos;S FOOTBALL MARKET
          </div>

          <h1
            style={{
              fontSize: "48px",
              lineHeight: 1.05,
              margin: 0,
              fontWeight: 800,
            }}
          >
            Players
          </h1>

          <p
            style={{
              maxWidth: "700px",
              color: "#ccc",
              fontSize: "17px",
              lineHeight: 1.6,
              marginTop: "18px",
              marginBottom: 0,
            }}
          >
            Explore women&apos;s football players, clubs,
            positions and market data.
          </p>
        </div>
      </section>

      {/* MAIN */}

      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 20px 60px",
          fontFamily: "Arial, sans-serif",
          background: "#f5f4ef",
        }}
      >
        {/* FILTERS */}

        <div
          style={{
            padding: "20px",
            border: "1px solid #e5e5e5",
            borderRadius: "14px",
            marginBottom: "30px",
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr",
              gap: "12px",
            }}
          >
            <input
              type="text"
              placeholder="Search player or club..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              style={{
                padding: "14px 16px",
                border: "1px solid #ddd",
                borderRadius: "9px",
                fontSize: "15px",
                background: "#fff",
              }}
            />

            <select
              value={position}
              onChange={(e) =>
                setPosition(e.target.value)
              }
              style={{
                padding: "14px 16px",
                border: "1px solid #ddd",
                borderRadius: "9px",
                fontSize: "15px",
                background: "#fff",
              }}
            >
              {positions.map((item) => (
                <option key={item} value={item}>
                  {item === "All"
                    ? "All Positions"
                    : item}
                </option>
              ))}
            </select>

            <select
              value={nationality}
              onChange={(e) =>
                setNationality(e.target.value)
              }
              style={{
                padding: "14px 16px",
                border: "1px solid #ddd",
                borderRadius: "9px",
                fontSize: "15px",
                background: "#fff",
              }}
            >
              {nationalities.map((item) => (
                <option key={item} value={item}>
                  {item === "All"
                    ? "All Nationalities"
                    : item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* RESULTS COUNT */}

        <div
          style={{
            fontSize: "14px",
            color: "#666",
            marginBottom: "12px",
          }}
        >
          {loading
            ? "Loading players..."
            : `${filteredPlayers.length} player${
                filteredPlayers.length === 1
                  ? ""
                  : "s"
              } found`}
        </div>

        {/* PLAYER DATABASE */}

        <div
          style={{
            border: "1px solid #e3e3e3",
            borderRadius: "14px",
            overflow: "hidden",
            background: "#fff",
          }}
        >
          {/* HEADER ROW */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "2fr 1.5fr 1fr 1.2fr 1.3fr",
              gap: "12px",
              padding: "15px 20px",
              background: "#fafafa",
              borderBottom: "1px solid #e3e3e3",
              fontSize: "11px",
              fontWeight: 700,
              color: "#777",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              alignItems: "center",
            }}
          >
            <div>Player</div>
            <div>Club</div>
            <div>Position</div>
            <div>Nationality</div>
            <div>Salary</div>
          </div>

          {/* PLAYER ROWS */}

          {loading ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#777",
              }}
            >
              Loading players...
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#777",
              }}
            >
              No players found.
            </div>
          ) : (
            filteredPlayers.map((player) => {
              const contract = getContract(player.id);
              const age = calculateAge(
                player.date_of_birth
              );

              return (
                <Link
                  key={player.id}
                  href={`/players/${player.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "2fr 1.5fr 1fr 1.2fr 1.3fr",
                    gap: "12px",
                    padding: "18px 20px",
                    borderBottom:
                      "1px solid #eee",
                    alignItems: "center",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  {/* PLAYER */}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      minWidth: 0,
                    }}
                  >
                    {player.photo_url ? (
                      <img
                        src={player.photo_url}
                        alt={player.full_name}
                        style={{
  width: "44px",
  height: "44px",
  borderRadius: "50%",
  objectFit: "cover",
  objectPosition: "center top",
  flexShrink: 0,
  display: "block",
}}
                      />
                    ) : (
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "50%",
                          background: "#eee",
                          flexShrink: 0,
                        }}
                      />
                    )}

                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "15px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {player.full_name}
                      </div>

                      <div
                        style={{
                          fontSize: "12px",
                          color: "#777",
                          marginTop: "3px",
                        }}
                      >
                        {age !== null
                          ? `${age} years old`
                          : "Age unavailable"}
                      </div>
                    </div>
                  </div>

                  {/* CLUB */}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      minWidth: 0,
                    }}
                  >
                    {contract?.club?.logo_url ? (
                      <img
                        src={
                          contract.club.logo_url
                        }
                        alt={contract.club.name}
                        style={{
                          width: "32px",
                          height: "32px",
                          objectFit: "contain",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "7px",
                          background: "#eee",
                          flexShrink: 0,
                        }}
                      />
                    )}

                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {contract?.club?.name ||
                          "No club"}
                      </div>

                      <div
                        style={{
                          fontSize: "11px",
                          color: "#888",
                          marginTop: "2px",
                        }}
                      >
                        {contract?.club?.league ||
                          ""}
                      </div>
                    </div>
                  </div>

                  {/* POSITION */}

                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      {player.position || "—"}
                    </div>

                    {player.preferred_foot && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#888",
                          marginTop: "3px",
                        }}
                      >
                        {player.preferred_foot} foot
                      </div>
                    )}
                  </div>

                  {/* NATIONALITY */}

                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      {player.nationality || "—"}
                    </div>

                    {player.agency && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#888",
                          marginTop: "3px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {player.agency}
                      </div>
                    )}
                  </div>

                  {/* SALARY */}

                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                      }}
                    >
                      {formatSalary(
                        contract?.annual_salary ?? null,
                        contract?.currency ?? null
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: "11px",
                        color: "#888",
                        marginTop: "3px",
                      }}
                    >
                      {contract?.weekly_salary
                        ? `${contract.currency || "USD"} ${Number(
                            contract.weekly_salary
                          ).toLocaleString(
                            "en-US",
                            {
                              maximumFractionDigits: 0,
                            }
                          )} / wk`
                        : "Weekly salary unavailable"}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </main>
    </>
  );
}
