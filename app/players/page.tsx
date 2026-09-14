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

type Contract = {
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

type PlayerWithContract = Player & {
  contract: Contract | null;
};

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerWithContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("All");
  const [nationality, setNationality] = useState("All");

  useEffect(() => {
    async function loadPlayers() {
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("*")
        .order("full_name");

      if (playerError) {
        console.error("Error loading players:", playerError);
        setLoading(false);
        return;
      }

      const { data: contractData, error: contractError } = await supabase
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

      const combinedPlayers = (playerData || []).map((player) => {
        const contracts =
          (contractData || []).filter(
            (contract) => contract.player_id === player.id
          );

        const activeContract =
          contracts.find(
            (contract) =>
              String(contract.status).toLowerCase() === "active"
          ) || contracts[0] || null;

        return {
          ...player,
          contract: activeContract,
        };
      });

      setPlayers(combinedPlayers);
      setLoading(false);
    }

    loadPlayers();
  }, []);

  const positions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          players
            .map((player) => player.position)
            .filter(Boolean)
        )
      ),
    ],
    [players]
  );

  const nationalities = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          players
            .map((player) => player.nationality)
            .filter(Boolean)
        )
      ),
    ],
    [players]
  );

  const filteredPlayers = players.filter((player) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      player.full_name.toLowerCase().includes(searchText) ||
      (player.nationality || "")
        .toLowerCase()
        .includes(searchText) ||
      (player.position || "")
        .toLowerCase()
        .includes(searchText) ||
      (player.agency || "")
        .toLowerCase()
        .includes(searchText) ||
      (player.contract?.club?.name || "")
        .toLowerCase()
        .includes(searchText);

    const matchesPosition =
      position === "All" || player.position === position;

    const matchesNationality =
      nationality === "All" ||
      player.nationality === nationality;

    return (
      matchesSearch &&
      matchesPosition &&
      matchesNationality
    );
  });

  const formatSalary = (
    salary: number | null,
    currency: string | null
  ) => {
    if (salary === null || salary === undefined) {
      return null;
    }

    return `${currency || "USD"} ${Number(
      salary
    ).toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <main>
      {/* HEADER */}

      <nav>
        <Link href="/" className="logo">
          WFM<span>•</span>
        </Link>

        <div className="navlinks">
          <Link href="/players">Players</Link>
          <Link href="/contracts">Contracts</Link>
          <Link href="/transfers">Transfers</Link>
          <Link href="/salaries">Salaries</Link>
          <Link href="/clubs">Clubs</Link>
        </div>

        <button className="login">Sign in</button>
      </nav>

      {/* PLAYER DATABASE */}

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 20px 60px",
          fontFamily: "Arial, sans-serif",
          background: "#ffffff",
        }}
      >
        {/* PAGE HEADER */}

        <div
          style={{
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              color: "#777",
              fontSize: "13px",
              fontWeight: "700",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            Player Database
          </div>

          <h1
            style={{
              fontSize: "42px",
              margin: "0 0 10px",
              letterSpacing: "-1px",
            }}
          >
            Women Football Market
          </h1>

          <p
            style={{
              color: "#666",
              margin: 0,
              fontSize: "17px",
            }}
          >
            Player profiles, contracts, salaries and market intelligence.
          </p>
        </div>

        {/* SEARCH + FILTERS */}

        <div
          style={{
            padding: "20px",
            border: "1px solid #e5e5e5",
            borderRadius: "14px",
            marginBottom: "30px",
            background: "#fafafa",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(250px, 2fr) minmax(150px, 1fr) minmax(150px, 1fr)",
              gap: "12px",
            }}
          >
            <input
              type="text"
              placeholder="Search players, clubs, agencies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "14px 16px",
                border: "1px solid #d5d5d5",
                borderRadius: "9px",
                fontSize: "15px",
                outline: "none",
                background: "#fff",
              }}
            />

            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              style={{
                padding: "14px 16px",
                border: "1px solid #d5d5d5",
                borderRadius: "9px",
                fontSize: "15px",
                background: "#fff",
              }}
            >
              {positions.map((item) => (
                <option key={item} value={item || ""}>
                  {item || "Unknown"}
                </option>
              ))}
            </select>

            <select
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              style={{
                padding: "14px 16px",
                border: "1px solid #d5d5d5",
                borderRadius: "9px",
                fontSize: "15px",
                background: "#fff",
              }}
            >
              {nationalities.map((item) => (
                <option key={item} value={item || ""}>
                  {item || "Unknown"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* RESULTS HEADER */}

        {!loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                color: "#777",
              }}
            >
              Showing{" "}
              <strong style={{ color: "#222" }}>
                {filteredPlayers.length}
              </strong>{" "}
              player
              {filteredPlayers.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}

        {/* LOADING / RESULTS */}

        {loading ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#777",
            }}
          >
            Loading players...
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div
            style={{
              padding: "50px",
              border: "1px solid #e5e5e5",
              borderRadius: "14px",
              textAlign: "center",
            }}
          >
            <h2>No players found</h2>

            <p style={{ color: "#666" }}>
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          /* PLAYER GRID */

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {filteredPlayers.map((player) => {
              const club = player.contract?.club;

              const salary = formatSalary(
                player.contract?.annual_salary ?? null,
                player.contract?.currency ?? null
              );

              return (
                <Link
                  key={player.id}
                  href={`/players/${player.id}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div
                    style={{
                      border: "1px solid #e3e3e3",
                      borderRadius: "16px",
                      overflow: "hidden",
                      background: "#fff",
                      transition: "transform 0.15s ease",
                      height: "100%",
                    }}
                  >
                    {/* PHOTO */}

                    <div
                      style={{
                        height: "260px",
                        background: "#f1f1f1",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {player.photo_url ? (
                        <img
                          src={player.photo_url}
                          alt={player.full_name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#999",
                            fontSize: "14px",
                          }}
                        >
                          No Photo
                        </div>
                      )}

                      {/* CLUB LOGO */}

                      {club?.logo_url && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "12px",
                            right: "12px",
                            width: "58px",
                            height: "58px",
                            borderRadius: "12px",
                            background: "#fff",
                            padding: "8px",
                            boxShadow:
                              "0 2px 10px rgba(0,0,0,0.12)",
                          }}
                        >
                          <img
                            src={club.logo_url}
                            alt={club.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* PLAYER DETAILS */}

                    <div
                      style={{
                        padding: "20px",
                      }}
                    >
                      <h2
                        style={{
                          margin: "0 0 7px",
                          fontSize: "22px",
                          lineHeight: "1.2",
                        }}
                      >
                        {player.full_name}
                      </h2>

                      <div
                        style={{
                          color: "#666",
                          fontSize: "14px",
                          marginBottom: "16px",
                        }}
                      >
                        {player.nationality || "Nationality unknown"}
                        {" · "}
                        {player.position || "Position unknown"}
                      </div>

                      {/* CLUB */}

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          minHeight: "42px",
                          marginBottom: "15px",
                        }}
                      >
                        {club?.logo_url ? (
                          <img
                            src={club.logo_url}
                            alt={club.name}
                            style={{
                              width: "34px",
                              height: "34px",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "8px",
                              background: "#f1f1f1",
                            }}
                          />
                        )}

                        <div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "700",
                            }}
                          >
                            {club?.name || "No current club"}
                          </div>

                          <div
                            style={{
                              color: "#888",
                              fontSize: "12px",
                              marginTop: "2px",
                            }}
                          >
                            {club?.league || "—"}
                          </div>
                        </div>
                      </div>

                      {/* SALARY */}

                      <div
                        style={{
                          paddingTop: "14px",
                          borderTop: "1px solid #eeeeee",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            color: "#888",
                            fontSize: "12px",
                            textTransform: "uppercase",
                            letterSpacing: "0.8px",
                          }}
                        >
                          Annual Salary
                        </span>

                        <strong
                          style={{
                            fontSize: "15px",
                          }}
                        >
                          {salary || "Not available"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
