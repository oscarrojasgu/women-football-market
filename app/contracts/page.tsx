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
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
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
            fontSize: 24,
            fontWeight: 800,
            color: "#111",
            textDecoration: "none",
            marginRight: 40,
          }}
        >
          WFM<span style={{ color: "#777" }}>•</span>
        </Link>

        <div
          style={{
            display: "flex",
            gap: 28,
          }}
        >
          <Link
            href="/players"
            style={{
              color: "#111",
              textDecoration: "none",
              fontWeight: 400,
            }}
          >
            Players
          </Link>

          <Link
            href="/contracts"
            style={{
              color: "#111",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Contracts
          </Link>

          <Link
            href="/transfers"
            style={{
              color: "#111",
              textDecoration: "none",
              fontWeight: 400,
            }}
          >
            Transfers
          </Link>

          <Link
            href="/salaries"
            style={{
              color: "#111",
              textDecoration: "none",
              fontWeight: 400,
            }}
          >
            Salaries
          </Link>

          <Link
            href="/clubs"
            style={{
              color: "#111",
              textDecoration: "none",
              fontWeight: 400,
            }}
          >
            Clubs
          </Link>
        </div>

        <button
          style={{
            marginLeft: "auto",
            border: "1px solid #ddd",
            background: "#fff",
            borderRadius: 8,
            padding: "9px 16px",
            fontSize: 14,
          }}
        >
          Sign in
        </button>
      </nav>

      <section
        style={{
          background: "#111",
          color: "#fff",
          padding: "55px 6vw 50px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: 2,
              fontWeight: 700,
              marginBottom: 14,
              color: "#aaa",
            }}
          >
            WOMEN&apos;S FOOTBALL MARKET
          </div>

          <h1
            style={{
              fontSize: 46,
              lineHeight: 1.05,
              margin: 0,
              fontWeight: 800,
            }}
          >
            Player Contracts
          </h1>

          <p
            style={{
              marginTop: 18,
              maxWidth: 700,
              color: "#ccc",
              fontSize: 17,
              lineHeight: 1.6,
            }}
          >
            Contract terms, salaries, dates and confidence levels
            across women&apos;s football.
          </p>
        </div>
      </section>

      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 20px 60px",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr",
              gap: 14,
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search player, club or league..."
              style={{
                padding: "12px 14px",
                border: "1px solid #ccc",
                borderRadius: 8,
                fontSize: 14,
              }}
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                padding: "12px 14px",
                border: "1px solid #ccc",
                borderRadius: 8,
                fontSize: 14,
                background: "#fff",
              }}
            >
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {value === "All"
                    ? "All Statuses"
                    : getStatusLabel(value)}
                </option>
              ))}
            </select>

            <select
              value={league}
              onChange={(e) => setLeague(e.target.value)}
              style={{
                padding: "12px 14px",
                border: "1px solid #ccc",
                borderRadius: 8,
                fontSize: 14,
                background: "#fff",
              }}
            >
              {leagues.map((value) => (
                <option key={value} value={value}>
                  {value === "All" ? "All Leagues" : value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            marginBottom: 14,
            color: "#555",
            fontSize: 14,
          }}
        >
          {loading
            ? "Loading contracts..."
            : `${filteredContracts.length} contract${
                filteredContracts.length === 1 ? "" : "s"
              }`}
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1.5fr 1fr 1.2fr 1.3fr 1fr",
              padding: "14px 18px",
              background: "#f7f7f7",
              borderBottom: "1px solid #ddd",
              fontSize: 12,
              fontWeight: 700,
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            <div>Player</div>
            <div>Club</div>
            <div>Status</div>
            <div>Contract End</div>
            <div>Salary</div>
            <div>Confidence</div>
          </div>

          {loading ? (
            <div
              style={{
                padding: 30,
                textAlign: "center",
                color: "#777",
              }}
            >
              Loading...
            </div>
          ) : filteredContracts.length === 0 ? (
            <div
              style={{
                padding: 30,
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
                    "2fr 1.5fr 1fr 1.2fr 1.3fr 1fr",
                  padding: "18px",
                  borderBottom: "1px solid #eee",
                  textDecoration: "none",
                  color: "#111",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {contract.player?.photo_url ? (
                    <img
                      src={contract.player.photo_url}
                      alt=""
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        background: "#eee",
                      }}
                    />
                  )}

                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                      }}
                    >
                      {contract.player?.full_name ||
                        "Unknown Player"}
                    </div>

                    <div
                      style={{
                        color: "#777",
                        fontSize: 13,
                        marginTop: 3,
                      }}
                    >
                      {contract.player?.position || "—"}
                    </div>
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {contract.club?.name || "Unknown Club"}
                  </div>

                  <div
                    style={{
                      color: "#777",
                      fontSize: 12,
                      marginTop: 3,
                    }}
                  >
                    {contract.club?.league || "—"}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {getStatusLabel(contract.status)}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: "#444",
                  }}
                >
                  {formatDate(contract.end_date)}
                </div>

                <div
                  style={{
                    fontSize: 14,
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
                    fontSize: 13,
                    color: "#555",
                  }}
                >
                  {getConfidenceLabel(contract.confidence)}
                </div>
              </Link>
            ))
          )}
        </div>
      </main>

      <footer
        style={{
          borderTop: "1px solid #ddd",
          padding: "30px 20px",
          textAlign: "center",
          color: "#777",
          fontSize: 13,
        }}
      >
        Women&apos;s Football Market · Data is continuously updated
      </footer>
    </>
  );
}
