"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Contract = {
  id: string;
  player_id: string;
  status: string | null;
  confidence: string | null;
  start_date: string | null;
  end_date: string | null;
  annual_salary: number | null;
  weekly_salary: number | null;
  currency: string | null;
  player: {
    full_name: string;
    photo_url: string | null;
    nationality: string | null;
    position: string | null;
  } | null;
  club: {
    name: string;
    league: string | null;
    country: string | null;
    logo_url: string | null;
  } | null;
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [league, setLeague] = useState("All");

  useEffect(() => {
    async function loadContracts() {
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          id,
          player_id,
          status,
          confidence,
          start_date,
          end_date,
          annual_salary,
          weekly_salary,
          currency,
          player:players (
            full_name,
            photo_url,
            nationality,
            position
          ),
          club:clubs (
            name,
            league,
            country,
            logo_url
          )
        `)
        .order("end_date", { ascending: true });

      if (error) {
        console.error("Error loading contracts:", error);
        setLoading(false);
        return;
      }

      setContracts(data || []);
      setLoading(false);
    }

    loadContracts();
  }, []);

  const statuses = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          contracts
            .map((contract) => contract.status)
            .filter(Boolean)
        )
      ),
    ],
    [contracts]
  );

  const leagues = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          contracts
            .map((contract) => contract.club?.league)
            .filter(Boolean)
        )
      ),
    ],
    [contracts]
  );

  const filteredContracts = contracts.filter((contract) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      (contract.player?.full_name || "")
        .toLowerCase()
        .includes(searchText) ||
      (contract.club?.name || "")
        .toLowerCase()
        .includes(searchText) ||
      (contract.club?.league || "")
        .toLowerCase()
        .includes(searchText);

    const matchesStatus =
      status === "All" || contract.status === status;

    const matchesLeague =
      league === "All" || contract.club?.league === league;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesLeague
    );
  });

  const formatSalary = (
    salary: number | null,
    currency: string | null
  ) => {
    if (salary === null || salary === undefined) {
      return "Not available";
    }

    return `${currency || "USD"} ${Number(
      salary
    ).toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })}`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Unknown";

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  const getStatusLabel = (value: string | null) => {
    if (!value) return "Unknown";

    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const getConfidenceLabel = (value: string | null) => {
    if (!value) return null;

    return value.charAt(0).toUpperCase() + value.slice(1);
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

      {/* CONTRACT DATABASE */}

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 20px 60px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* PAGE HEADER */}

        <div style={{ marginBottom: "30px" }}>
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
            Contract Database
          </div>

          <h1
            style={{
              fontSize: "42px",
              margin: "0 0 10px",
              letterSpacing: "-1px",
            }}
          >
            Player Contracts
          </h1>

          <p
            style={{
              color: "#666",
              margin: 0,
              fontSize: "17px",
            }}
          >
            Contract terms, expiration dates, salaries and market confidence.
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
              placeholder="Search players, clubs, leagues..."
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
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                padding: "14px 16px",
                border: "1px solid #d5d5d5",
                borderRadius: "9px",
                fontSize: "15px",
                background: "#fff",
              }}
            >
              {statuses.map((item) => (
                <option key={item} value={item || ""}>
                  {item === "All"
                    ? "All Statuses"
                    : getStatusLabel(item)}
                </option>
              ))}
            </select>

            <select
              value={league}
              onChange={(e) => setLeague(e.target.value)}
              style={{
                padding: "14px 16px",
                border: "1px solid #d5d5d5",
                borderRadius: "9px",
                fontSize: "15px",
                background: "#fff",
              }}
            >
              {leagues.map((item) => (
                <option key={item} value={item || ""}>
                  {item === "All"
                    ? "All Leagues"
                    : item || "Unknown"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* RESULTS COUNT */}

        {!loading && (
          <div
            style={{
              marginBottom: "18px",
              fontSize: "14px",
              color: "#777",
            }}
          >
            Showing{" "}
            <strong style={{ color: "#222" }}>
              {filteredContracts.length}
            </strong>{" "}
            contract
            {filteredContracts.length !== 1 ? "s" : ""}
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#777",
            }}
          >
            Loading contracts...
          </div>
        ) : filteredContracts.length === 0 ? (
          <div
            style={{
              padding: "50px",
              border: "1px solid #e5e5e5",
              borderRadius: "14px",
              textAlign: "center",
            }}
          >
            <h2>No contracts found</h2>

            <p style={{ color: "#666" }}>
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          /* CONTRACT TABLE */

          <div
            style={{
              border: "1px solid #e3e3e3",
              borderRadius: "14px",
              overflow: "hidden",
              background: "#fff",
            }}
          >
            {/* TABLE HEADER */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "2fr 1.5fr 1fr 1.2fr 1.2fr 1fr",
                gap: "15px",
                padding: "15px 20px",
                background: "#f7f7f7",
                borderBottom: "1px solid #e5e5e5",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.8px",
                color: "#777",
                textTransform: "uppercase",
              }}
            >
              <span>Player</span>
              <span>Club</span>
              <span>Status</span>
              <span>Contract End</span>
              <span>Salary</span>
              <span>Confidence</span>
            </div>

            {/* TABLE ROWS */}

            {filteredContracts.map((contract) => {
              const confidence = getConfidenceLabel(
                contract.confidence
              );

              return (
                <Link
                  key={contract.id}
                  href={`/players/${contract.player_id}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "2fr 1.5fr 1fr 1.2fr 1.2fr 1fr",
                      gap: "15px",
                      padding: "18px 20px",
                      borderBottom: "1px solid #eeeeee",
                      alignItems: "center",
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
                      {contract.player?.photo_url ? (
                        <img
                          src={contract.player.photo_url}
                          alt={contract.player.full_name}
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            background: "#f1f1f1",
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
                            fontWeight: "700",
                            marginBottom: "3px",
                          }}
                        >
                          {contract.player?.full_name ||
                            "Unknown player"}
                        </div>

                        <div
                          style={{
                            color: "#888",
                            fontSize: "12px",
                          }}
                        >
                          {contract.player?.position ||
                            "Position unknown"}
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
                      {contract.club?.logo_url ? (
                        <img
                          src={contract.club.logo_url}
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
                            background: "#f1f1f1",
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
                            fontSize: "13px",
                            fontWeight: "700",
                          }}
                        >
                          {contract.club?.name ||
                            "No club"}
                        </div>

                        <div
                          style={{
                            color: "#888",
                            fontSize: "11px",
                            marginTop: "2px",
                          }}
                        >
                          {contract.club?.league || "—"}
                        </div>
                      </div>
                    </div>

                    {/* STATUS */}

                    <div>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "5px 9px",
                          borderRadius: "20px",
                          background:
                            contract.status?.toLowerCase() ===
                            "active"
                              ? "#e9f7ef"
                              : "#f3f3f3",
                          color:
                            contract.status?.toLowerCase() ===
                            "active"
                              ? "#237a45"
                              : "#666",
                          fontSize: "11px",
                          fontWeight: "700",
                        }}
                      >
                        {getStatusLabel(contract.status)}
                      </span>
                    </div>

                    {/* CONTRACT END */}

                    <div
                      style={{
                        fontSize: "13px",
                        color: "#444",
                      }}
                    >
                      {formatDate(contract.end_date)}
                    </div>

                    {/* SALARY */}

                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                      }}
                    >
                      {formatSalary(
                        contract.annual_salary,
                        contract.currency
                      )}
                    </div>

                    {/* CONFIDENCE */}

                    <div
                      style={{
                        fontSize: "12px",
                        color: "#777",
                      }}
                    >
                      {confidence || "Not rated"}
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
