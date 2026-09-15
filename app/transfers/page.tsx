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
  id: string;
  name: string;
  league: string | null;
  country: string | null;
  logo_url: string | null;
};

type Transfer = {
  id: string;
  player_id: string;
  transfer_date: string | null;
  transfer_type: string | null;
  fee: number | null;
  currency: string | null;
  confidence: string | null;
  player: PlayerData | null;
  from_club: ClubData | null;
  to_club: ClubData | null;
};

function formatDate(date: string | null) {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function formatFee(
  fee: number | null,
  currency: string | null,
  transferType: string | null
) {
  if (transferType?.toLowerCase() === "free") {
    return "Free";
  }

  if (fee === null || fee === undefined) {
    return "Undisclosed";
  }

  return `${currency || "USD"} ${fee.toLocaleString()}`;
}

function formatLabel(value: string | null) {
  if (!value) return "—";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [leagueFilter, setLeagueFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTransfers() {
      const { data, error } = await supabase
        .from("transfers")
        .select(`
          id,
          player_id,
          transfer_date,
          transfer_type,
          fee,
          currency,
          confidence,
          player:players (
            full_name,
            photo_url,
            nationality,
            position
          ),
          from_club:clubs!transfers_from_club_id_fkey (
            id,
            name,
            league,
            country,
            logo_url
          ),
          to_club:clubs!transfers_to_club_id_fkey (
            id,
            name,
            league,
            country,
            logo_url
          )
        `)
        .order("transfer_date", { ascending: false });

      if (error) {
        console.error(error);
        setTransfers([]);
        setLoading(false);
        return;
      }

      const normalized = (data || []).map((transfer: any) => ({
        ...transfer,
        player: Array.isArray(transfer.player)
          ? transfer.player[0] || null
          : transfer.player,
        from_club: Array.isArray(transfer.from_club)
          ? transfer.from_club[0] || null
          : transfer.from_club,
        to_club: Array.isArray(transfer.to_club)
          ? transfer.to_club[0] || null
          : transfer.to_club,
      }));

      setTransfers(normalized);
      setLoading(false);
    }

    loadTransfers();
  }, []);

  const transferTypes = useMemo(() => {
    const values = transfers
      .map((transfer) => transfer.transfer_type)
      .filter(Boolean) as string[];

    return ["All", ...Array.from(new Set(values))];
  }, [transfers]);

  const leagues = useMemo(() => {
    const values = transfers
      .flatMap((transfer) => [
        transfer.from_club?.league,
        transfer.to_club?.league,
      ])
      .filter(Boolean) as string[];

    return ["All", ...Array.from(new Set(values)).sort()];
  }, [transfers]);

  const filteredTransfers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return transfers.filter((transfer) => {
      const playerName = transfer.player?.full_name?.toLowerCase() || "";
      const fromClub = transfer.from_club?.name?.toLowerCase() || "";
      const toClub = transfer.to_club?.name?.toLowerCase() || "";
      const fromLeague = transfer.from_club?.league?.toLowerCase() || "";
      const toLeague = transfer.to_club?.league?.toLowerCase() || "";

      const matchesSearch =
        !term ||
        playerName.includes(term) ||
        fromClub.includes(term) ||
        toClub.includes(term) ||
        fromLeague.includes(term) ||
        toLeague.includes(term);

      const matchesType =
        typeFilter === "All" || transfer.transfer_type === typeFilter;

      const matchesLeague =
        leagueFilter === "All" ||
        transfer.from_club?.league === leagueFilter ||
        transfer.to_club?.league === leagueFilter;

      return matchesSearch && matchesType && matchesLeague;
    });
  }, [transfers, search, typeFilter, leagueFilter]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f4ef",
        color: "#111",
      }}
    >
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
            textDecoration: "none",
            color: "#111",
            fontSize: 24,
            fontWeight: 800,
            marginRight: 40,
          }}
        >
          WFM<span style={{ color: "#777" }}>•</span>
        </Link>

        <div
          style={{
            display: "flex",
            gap: 28,
            alignItems: "center",
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
              fontWeight: 400,
            }}
          >
            Contracts
          </Link>

          <Link
            href="/transfers"
            style={{
              color: "#111",
              textDecoration: "none",
              fontWeight: 700,
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
            cursor: "pointer",
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
              fontSize: 48,
              lineHeight: 1.05,
              margin: 0,
              fontWeight: 800,
            }}
          >
            Transfers
          </h1>

          <p
            style={{
              maxWidth: 700,
              color: "#ccc",
              fontSize: 17,
              lineHeight: 1.6,
              marginTop: 18,
              marginBottom: 0,
            }}
          >
            Track player movements, transfer types, reported fees, and the
            clubs involved.
          </p>
        </div>
      </section>

      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "35px 24px 70px",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e2e2",
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(220px, 1fr) 180px 180px",
              gap: 14,
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search player or club..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "11px 13px",
                border: "1px solid #ddd",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
              }}
            />

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 13px",
                border: "1px solid #ddd",
                borderRadius: 8,
                fontSize: 14,
                background: "#fff",
              }}
            >
              {transferTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "All" ? "All transfer types" : formatLabel(type)}
                </option>
              ))}
            </select>

            <select
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 13px",
                border: "1px solid #ddd",
                borderRadius: 8,
                fontSize: 14,
                background: "#fff",
              }}
            >
              {leagues.map((league) => (
                <option key={league} value={league}>
                  {league === "All" ? "All leagues" : league}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: "#666",
            }}
          >
            {loading
              ? "Loading transfers..."
              : `${filteredTransfers.length} transfer${
                  filteredTransfers.length === 1 ? "" : "s"
                }`}
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e2e2",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#777",
              }}
            >
              Loading transfers...
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#777",
              }}
            >
              No transfers found.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 850,
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid #e5e5e5",
                      background: "#fafafa",
                    }}
                  >
                    <th style={headerStyle}>Player</th>
                    <th style={headerStyle}>From</th>
                    <th
                      style={{
                        ...headerStyle,
                        width: 45,
                        textAlign: "center",
                      }}
                    >
                      →
                    </th>
                    <th style={headerStyle}>To</th>
                    <th style={headerStyle}>Fee</th>
                    <th style={headerStyle}>Date</th>
                    <th style={headerStyle}>Confidence</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransfers.map((transfer) => (
                    <tr
                      key={transfer.id}
                      style={{
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <td style={cellStyle}>
                        <Link
                          href={`/players/${transfer.player_id}`}
                          style={{
                            color: "#111",
                            textDecoration: "none",
                            fontWeight: 700,
                          }}
                        >
                          {transfer.player?.full_name || "Unknown Player"}
                        </Link>

                        {transfer.player?.position && (
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 12,
                              color: "#888",
                            }}
                          >
                            {transfer.player.position}
                          </div>
                        )}
                      </td>

                      <td style={cellStyle}>
                        {transfer.from_club ? (
                          <Link
                            href={`/clubs/${transfer.from_club.id}`}
                            style={{
                              color: "#111",
                              textDecoration: "none",
                              fontWeight: 600,
                            }}
                          >
                            {transfer.from_club.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td
                        style={{
                          ...cellStyle,
                          textAlign: "center",
                          color: "#999",
                          fontSize: 18,
                        }}
                      >
                        →
                      </td>

                      <td style={cellStyle}>
                        {transfer.to_club ? (
                          <Link
                            href={`/clubs/${transfer.to_club.id}`}
                            style={{
                              color: "#111",
                              textDecoration: "none",
                              fontWeight: 600,
                            }}
                          >
                            {transfer.to_club.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td style={cellStyle}>
                        <div style={{ fontWeight: 600 }}>
                          {formatFee(
                            transfer.fee,
                            transfer.currency,
                            transfer.transfer_type
                          )}
                        </div>

                        {transfer.transfer_type && (
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 12,
                              color: "#888",
                            }}
                          >
                            {formatLabel(transfer.transfer_type)}
                          </div>
                        )}
                      </td>

                      <td style={cellStyle}>
                        {formatDate(transfer.transfer_date)}
                      </td>

                      <td style={cellStyle}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "5px 9px",
                            borderRadius: 999,
                            background: "#f2f2f2",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {formatLabel(transfer.confidence)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <footer
        style={{
          borderTop: "1px solid #ddd",
          padding: "24px",
          textAlign: "center",
          fontSize: 12,
          color: "#777",
        }}
      >
        Women&apos;s Football Market · Data is continuously updated
      </footer>
    </main>
  );
}

const headerStyle = {
  textAlign: "left" as const,
  padding: "14px 16px",
  fontSize: 12,
  fontWeight: 700,
  color: "#666",
  textTransform: "uppercase" as const,
  letterSpacing: 0.5,
};

const cellStyle = {
  padding: "16px",
  fontSize: 14,
  verticalAlign: "middle" as const,
};
