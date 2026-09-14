"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type PlayerData = {
  full_name: string;
  photo_url: string | null;
  nationality: string | null;
  position: string | null;
};

type ClubData = {
  name: string;
  league: string | null;
  country: string | null;
  logo_url: string | null;
};

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
  player: PlayerData | null;
  club: ClubData | null;
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [league, setLeague] = useState("All");

  useEffect(() => {
    async function loadContracts() {
      setLoading(true);

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
        setContracts([]);
        setLoading(false);
        return;
      }

      const normalizedContracts: Contract[] = (data || []).map(
        (contract: any) => ({
          id: contract.id,
          player_id: contract.player_id,
          status: contract.status,
          confidence: contract.confidence,
          start_date: contract.start_date,
          end_date: contract.end_date,
          annual_salary: contract.annual_salary,
          weekly_salary: contract.weekly_salary,
          currency: contract.currency,

          player: Array.isArray(contract.player)
            ? contract.player[0] || null
            : contract.player || null,

          club: Array.isArray(contract.club)
            ? contract.club[0] || null
            : contract.club || null,
        })
      );

      setContracts(normalizedContracts);
      setLoading(false);
    }

    loadContracts();
  }, []);

  const statuses = useMemo(() => {
    const values = contracts
      .map((contract) => contract.status)
      .filter(Boolean) as string[];

    return ["All", ...Array.from(new Set(values))];
  }, [contracts]);

  const leagues = useMemo(() => {
    const values = contracts
      .map((contract) => contract.club?.league)
      .filter(Boolean) as string[];

    return ["All", ...Array.from(new Set(values))];
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    const query = search.toLowerCase().trim();

    return contracts.filter((contract) => {
      const playerName =
        contract.player?.full_name?.toLowerCase() || "";

      const clubName =
        contract.club?.name?.toLowerCase() || "";

      const clubLeague =
        contract.club?.league?.toLowerCase() || "";

      const matchesSearch =
        !query ||
        playerName.includes(query) ||
        clubName.includes(query) ||
        clubLeague.includes(query);

      const matchesStatus =
        status === "All" || contract.status === status;

      const matchesLeague =
        league === "All" ||
        contract.club?.league === league;

      return matchesSearch && matchesStatus && matchesLeague;
    });
  }, [contracts, search, status, league]);

  function formatSalary(
    salary: number | null,
    currency: string | null
  ) {
    if (salary === null || salary === undefined) {
      return "Not available";
    }

    return `${currency || "USD"} ${Number(salary).toLocaleString(
      "en-US",
      {
        maximumFractionDigits: 0,
      }
    )}`;
  }

  function formatDate(date: string | null) {
    if (!date) return "—";

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  }

  function getStatusLabel(value: string | null) {
    if (!value) return "Unknown";

    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function getConfidenceLabel(value: string | null) {
    if (!value) return "";

    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  return (
    <>
      {/* HEADER */}

      <nav
        style={{
          display: "flex",
          alignItems: "center",
          padding: "18px 32px",
          borderBottom: "1px solid #e5e5e5",
          background: "#fff",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: "24px",
            fontWeight: 800,
            textDecoration: "none",
            color: "#111",
            marginRight: "40px",
          }}
        >
          WFM<span style={{ color: "#777" }}>•</span>
        </Link>

        <div
          style={{
            display: "flex",
            gap: "28px",
            alignItems: "center",
          }}
        >
          <Link
            href="/players"
            style={{
              color: "#111",
              textDecoration: "none",
            }}
          >
            Players
          </Link>

          <Link
            href="/contracts"
            style={{
              color: "#111",
              textDecoration: "none",
            }}
          >
            Contracts
          </Link>

          <Link
            href="/transfers"
            style={{
              color: "#111",
              textDecoration: "none",
            }}
          >
            Transfers
          </Link>

          <Link
            href="/salaries"
            style={{
              color: "#111",
              textDecoration: "none",
            }}
          >
            Salaries
          </Link>

          <Link
            href="/clubs"
            style={{
              color: "#111",
              textDecoration: "none",
            }}
          >
            Clubs
          </Link>
        </div>

        <button
          className="login"
          style={{
            marginLeft: "auto",
            border: "1px solid #ddd",
            background: "#fff",
            borderRadius: "8px",
            padding: "9px 16px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Sign in
        </button>
      </nav>

      {/* MAIN */}

      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 20px 60px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* PAGE HEADER */}

        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "8px",
            }}
          >
            Contract Database
          </div>

          <h1
            style={{
              fontSize: "42px",
              lineHeight: 1.1,
              margin: 0,
              marginBottom: "10px",
            }}
          >
            Player Contracts
          </h1>

          <p
            style={{
              fontSize: "17px",
              color: "#666",
              margin: 0,
            }}
          >
            Contract terms, expiration dates, salaries and market confidence.
          </p>
        </div>

        {/* FILTERS */}

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
              gridTemplateColumns: "2fr 1fr 1fr",
              gap: "12px",
            }}
          >
            <input
              type="text"
              placeholder="Search player or club..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "14px 16px",
                border: "1px solid #ddd",
                borderRadius: "9px",
                fontSize: "15px",
                background: "#fff",
              }}
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                padding: "14px 16px",
                border: "1px solid #ddd",
                borderRadius: "9px",
                fontSize: "15px",
                background: "#fff",
              }}
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
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
                border: "1px solid #ddd",
                borderRadius: "9px",
                fontSize: "15px",
                background: "#fff",
              }}
            >
              {leagues.map((item) => (
                <option key={item} value={item}>
                  {item === "All"
                    ? "All Leagues"
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
            ? "Loading contracts..."
            : `${filteredContracts.length} contract${
                filteredContracts.length === 1 ? "" : "s"
              } found`}
        </div>

        {/* RESULTS */}

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
                "1.8fr 1.5fr 1.1fr 1.1fr 1.3fr 1fr",
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
            <div>Status</div>
            <div>Contract End</div>
            <div>Salary</div>
            <div>Confidence</div>
          </div>

          {/* ROWS */}

          {loading ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#777",
              }}
            >
              Loading contracts...
            </div>
          ) : filteredContracts.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#777",
              }}
            >
              No contracts found.
            </div>
          ) : (
            filteredContracts.map((contract) => (
              <Link
                key={contract.id}
                href={`/players/${contract.player_id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1.8fr 1.5fr 1.1fr 1.1fr 1.3fr 1fr",
                  gap: "12px",
                  padding: "18px 20px",
                  borderBottom: "1px solid #eee",
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
                        background: "#eee",
                        flexShrink: 0,
                      }}
                    />
                  )}

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "15px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {contract.player?.full_name ||
                        "Unknown Player"}
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "#777",
                        marginTop: "3px",
                      }}
                    >
                      {contract.player?.position || "—"}
                      {contract.player?.nationality
                        ? ` • ${contract.player.nationality}`
                        : ""}
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
                  ) : null}

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {contract.club?.name || "—"}
                    </div>

                    <div
                      style={{
                        fontSize: "11px",
                        color: "#888",
                        marginTop: "2px",
                      }}
                    >
                      {contract.club?.league || ""}
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
                      fontWeight: 700,
                    }}
                  >
                    {getStatusLabel(contract.status)}
                  </span>
                </div>

                {/* CONTRACT END */}

                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    {formatDate(contract.end_date)}
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      color: "#888",
                      marginTop: "3px",
                    }}
                  >
                    Start: {formatDate(contract.start_date)}
                  </div>
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
                      contract.annual_salary,
                      contract.currency
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      color: "#888",
                      marginTop: "3px",
                    }}
                  >
                    {contract.weekly_salary
                      ? `${contract.currency || "USD"} ${Number(
                          contract.weekly_salary
                        ).toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })} / wk`
                      : "Weekly salary unavailable"}
                  </div>
                </div>

                {/* CONFIDENCE */}

                <div
                  style={{
                    fontSize: "12px",
                    color: "#777",
                  }}
                >
                  {getConfidenceLabel(contract.confidence) ||
                    "Not rated"}
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </>
  );
}
