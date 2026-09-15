"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Player = {
  id: string;
  full_name: string;
  nationality: string | null;
  position: string | null;
  photo_url: string | null;
};

type Club = {
  id: string;
  name: string;
  country: string | null;
  league: string | null;
  logo_url: string | null;
};

type Transfer = {
  id: string;
  player_id: string;
  from_club_id: string | null;
  to_club_id: string | null;
  transfer_date: string | null;
  transfer_type: string | null;
  fee: number | null;
  currency: string | null;
  confidence: string | null;
  player: Player | null;
  from_club: Club | null;
  to_club: Club | null;
};

function formatDate(date: string | null) {
  if (!date) return "Unknown";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTransferType(type: string | null) {
  if (!type) return "Unknown";

  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatConfidence(confidence: string | null) {
  if (!confidence) return "Unknown";

  return confidence
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

  const code = currency || "USD";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(fee);
  } catch {
    return `${code} ${fee.toLocaleString()}`;
  }
}

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [confidenceFilter, setConfidenceFilter] = useState("All");

  useEffect(() => {
    async function loadTransfers() {
      setLoading(true);

      const { data: transferData, error: transferError } = await supabase
        .from("transfers")
        .select(`
          id,
          player_id,
          from_club_id,
          to_club_id,
          transfer_date,
          transfer_type,
          fee,
          currency,
          confidence
        `)
        .order("transfer_date", { ascending: false });

      if (transferError) {
        console.error("Error loading transfers:", transferError);
        setTransfers([]);
        setLoading(false);
        return;
      }

      const rows = transferData || [];

      const playerIds = [
        ...new Set(
          rows
            .map((transfer) => transfer.player_id)
            .filter(Boolean)
        ),
      ];

      const clubIds = [
        ...new Set(
          rows.flatMap((transfer) =>
            [
              transfer.from_club_id,
              transfer.to_club_id,
            ].filter(Boolean)
          )
        ),
      ];

      const [{ data: playerData }, { data: clubData }] =
        await Promise.all([
          playerIds.length > 0
            ? supabase
                .from("players")
                .select(`
                  id,
                  full_name,
                  nationality,
                  position,
                  photo_url
                `)
                .in("id", playerIds)
            : Promise.resolve({ data: [] }),

          clubIds.length > 0
            ? supabase
                .from("clubs")
                .select(`
                  id,
                  name,
                  country,
                  league,
                  logo_url
                `)
                .in("id", clubIds)
            : Promise.resolve({ data: [] }),
        ]);

      const playerMap = new Map(
        (playerData || []).map((player) => [
          player.id,
          player,
        ])
      );

      const clubMap = new Map(
        (clubData || []).map((club) => [
          club.id,
          club,
        ])
      );

      const combinedTransfers: Transfer[] = rows.map(
        (transfer) => ({
          ...transfer,
          player:
            playerMap.get(transfer.player_id) || null,
          from_club: transfer.from_club_id
            ? clubMap.get(transfer.from_club_id) || null
            : null,
          to_club: transfer.to_club_id
            ? clubMap.get(transfer.to_club_id) || null
            : null,
        })
      );

      setTransfers(combinedTransfers);
      setLoading(false);
    }

    loadTransfers();
  }, []);

  const transferTypes = useMemo(() => {
    const types = transfers
      .map((transfer) => transfer.transfer_type)
      .filter(Boolean) as string[];

    return ["All", ...Array.from(new Set(types))];
  }, [transfers]);

  const confidenceOptions = useMemo(() => {
    const values = transfers
      .map((transfer) => transfer.confidence)
      .filter(Boolean) as string[];

    return ["All", ...Array.from(new Set(values))];
  }, [transfers]);

  const filteredTransfers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transfers.filter((transfer) => {
      const playerName =
        transfer.player?.full_name?.toLowerCase() || "";

      const fromClub =
        transfer.from_club?.name?.toLowerCase() || "";

      const toClub =
        transfer.to_club?.name?.toLowerCase() || "";

      const league =
        transfer.to_club?.league?.toLowerCase() ||
        transfer.from_club?.league?.toLowerCase() ||
        "";

      const matchesSearch =
        !query ||
        playerName.includes(query) ||
        fromClub.includes(query) ||
        toClub.includes(query) ||
        league.includes(query);

      const matchesType =
        typeFilter === "All" ||
        transfer.transfer_type === typeFilter;

      const matchesConfidence =
        confidenceFilter === "All" ||
        transfer.confidence === confidenceFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesConfidence
      );
    });
  }, [
    transfers,
    search,
    typeFilter,
    confidenceFilter,
  ]);

  const verifiedCount = transfers.filter(
    (transfer) =>
      transfer.confidence?.toLowerCase() === "verified"
  ).length;

  const freeTransfers = transfers.filter(
    (transfer) =>
      transfer.transfer_type?.toLowerCase() === "free"
  ).length;

  const knownFees = transfers.filter(
    (transfer) =>
      transfer.fee !== null &&
      transfer.transfer_type?.toLowerCase() !== "free"
  );

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
          width: "100%",
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
              textDecoration: "none",
              color: "#111",
              fontSize: 14,
            }}
          >
            Players
          </Link>

          <Link
            href="/contracts"
            style={{
              textDecoration: "none",
              color: "#111",
              fontSize: 14,
            }}
          >
            Contracts
          </Link>

          <Link
            href="/transfers"
            style={{
              textDecoration: "none",
              color: "#111",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Transfers
          </Link>

          <Link
            href="/salaries"
            style={{
              textDecoration: "none",
              color: "#111",
              fontSize: 14,
            }}
          >
            Salaries
          </Link>

          <Link
            href="/clubs"
            style={{
              textDecoration: "none",
              color: "#111",
              fontSize: 14,
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
              margin: 0,
              fontSize: 44,
              lineHeight: 1.05,
              letterSpacing: "-1.5px",
            }}
          >
            Transfers
          </h1>

          <p
            style={{
              marginTop: 16,
              marginBottom: 0,
              maxWidth: 720,
              color: "#cfcfcf",
              fontSize: 16,
              lineHeight: 1.6,
            }}
          >
            Track player movements, transfer types,
            reported fees, and confidence levels across
            women&apos;s football.
          </p>
        </div>
      </section>

      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "32px 24px 60px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
            marginBottom: 24,
          }}
        >
          {[
            ["Transfers", transfers.length.toString()],
            ["Verified", verifiedCount.toString()],
            ["Free Transfers", freeTransfers.toString()],
            ["Known Fees", knownFees.length.toString()],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                background: "#fff",
                border: "1px solid #e5e5e5",
                borderRadius: 12,
                padding: "18px 20px",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "#777",
                  marginBottom: 6,
                }}
              >
                {label}
              </div>

              <div
                style={{
                  fontSize: 26,
                  fontWeight: 750,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(240px, 1fr) 180px 180px",
              gap: 12,
            }}
          >
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search player or club..."
              style={{
                width: "100%",
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: "11px 13px",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: "11px 13px",
                fontSize: 14,
                background: "#fff",
              }}
            >
              {transferTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "All"
                    ? "All transfer types"
                    : formatTransferType(type)}
                </option>
              ))}
            </select>

            <select
              value={confidenceFilter}
              onChange={(event) =>
                setConfidenceFilter(event.target.value)
              }
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: "11px 13px",
                fontSize: 14,
                background: "#fff",
              }}
            >
              {confidenceOptions.map((confidence) => (
                <option
                  key={confidence}
                  value={confidence}
                >
                  {confidence === "All"
                    ? "All confidence"
                    : formatConfidence(confidence)}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              marginTop: 14,
              fontSize: 13,
              color: "#777",
            }}
          >
            Showing {filteredTransfers.length} of{" "}
            {transfers.length} transfers
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div
              style={{
                padding: 30,
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
                  minWidth: 900,
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid #e5e5e5",
                      textAlign: "left",
                    }}
                  >
                    {[
                      "Player",
                      "From",
                      "",
                      "To",
                      "Type",
                      "Fee",
                      "Date",
                      "Confidence",
                    ].map((heading, index) => (
                      <th
                        key={`${heading}-${index}`}
                        style={{
                          padding: "15px 16px",
                          fontSize: 11,
                          letterSpacing: 1,
                          textTransform: "uppercase",
                          color: "#888",
                          fontWeight: 700,
                        }}
                      >
                        {heading}
                      </th>
                    ))}
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
                      <td
                        style={{
                          padding: "16px",
                          fontWeight: 650,
                        }}
                      >
                        {transfer.player ? (
                          <Link
                            href={`/players/${transfer.player.id}`}
                            style={{
                              color: "#111",
                              textDecoration: "none",
                            }}
                          >
                            {transfer.player.full_name}
                          </Link>
                        ) : (
                          "Unknown Player"
                        )}
                      </td>

                      <td style={{ padding: "16px" }}>
                        {transfer.from_club ? (
                          <Link
                            href={`/clubs/${transfer.from_club.id}`}
                            style={{
                              color: "#111",
                              textDecoration: "none",
                            }}
                          >
                            {transfer.from_club.name}
                          </Link>
                        ) : (
                          "Unknown"
                        )}
                      </td>

                      <td
                        style={{
                          padding: "16px",
                          color: "#999",
                          textAlign: "center",
                        }}
                      >
                        →
                      </td>

                      <td style={{ padding: "16px" }}>
                        {transfer.to_club ? (
                          <Link
                            href={`/clubs/${transfer.to_club.id}`}
                            style={{
                              color: "#111",
                              textDecoration: "none",
                            }}
                          >
                            {transfer.to_club.name}
                          </Link>
                        ) : (
                          "Unknown"
                        )}
                      </td>

                      <td style={{ padding: "16px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            background: "#f1f1f1",
                            borderRadius: 999,
                            padding: "5px 9px",
                            fontSize: 12,
                          }}
                        >
                          {formatTransferType(
                            transfer.transfer_type
                          )}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: "16px",
                          fontWeight: 650,
                        }}
                      >
                        {formatFee(
                          transfer.fee,
                          transfer.currency,
                          transfer.transfer_type
                        )}
                      </td>

                      <td
                        style={{
                          padding: "16px",
                          color: "#555",
                        }}
                      >
                        {formatDate(
                          transfer.transfer_date
                        )}
                      </td>

                      <td
                        style={{
                          padding: "16px",
                          color: "#555",
                        }}
                      >
                        {formatConfidence(
                          transfer.confidence
                        )}
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
          background: "#fff",
          padding: "28px 6vw",
          color: "#777",
          fontSize: 13,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          Women&apos;s Football Market · Data-driven
          women&apos;s football intelligence.
        </div>
      </footer>
    </main>
  );
}
