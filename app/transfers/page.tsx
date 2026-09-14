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

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [leagueFilter, setLeagueFilter] = useState("All");

  useEffect(() => {
    async function loadTransfers() {
      setLoading(true);

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
            name,
            league,
            country,
            logo_url
          ),
          to_club:clubs!transfers_to_club_id_fkey (
            name,
            league,
            country,
            logo_url
          )
        `)
        .order("transfer_date", { ascending: false });

      if (error) {
        console.error("Error loading transfers:", error);
        setTransfers([]);
        setLoading(false);
        return;
      }

      const normalizedTransfers: Transfer[] = (data || []).map(
        (transfer: any) => ({
          id: transfer.id,
          player_id: transfer.player_id,
          transfer_date: transfer.transfer_date,
          transfer_type: transfer.transfer_type,
          fee: transfer.fee,
          currency: transfer.currency,
          confidence: transfer.confidence,
          player: Array.isArray(transfer.player)
            ? transfer.player[0] || null
            : transfer.player || null,
          from_club: Array.isArray(transfer.from_club)
            ? transfer.from_club[0] || null
            : transfer.from_club || null,
          to_club: Array.isArray(transfer.to_club)
            ? transfer.to_club[0] || null
            : transfer.to_club || null,
        })
      );

      setTransfers(normalizedTransfers);
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
      .map(
        (transfer) =>
          transfer.to_club?.league || transfer.from_club?.league
      )
      .filter(Boolean) as string[];

    return ["All", ...Array.from(new Set(values))];
  }, [transfers]);

  const filteredTransfers = useMemo(() => {
    const query = search.toLowerCase().trim();

    return transfers.filter((transfer) => {
      const playerName = transfer.player?.full_name?.toLowerCase() || "";
      const fromClub = transfer.from_club?.name?.toLowerCase() || "";
      const toClub = transfer.to_club?.name?.toLowerCase() || "";

      const matchesSearch =
        !query ||
        playerName.includes(query) ||
        fromClub.includes(query) ||
        toClub.includes(query);

      const matchesType =
        typeFilter === "All" ||
        transfer.transfer_type === typeFilter;

      const transferLeague =
        transfer.to_club?.league || transfer.from_club?.league;

      const matchesLeague =
        leagueFilter === "All" || transferLeague === leagueFilter;

      return matchesSearch && matchesType && matchesLeague;
    });
  }, [transfers, search, typeFilter, leagueFilter]);

  function formatDate(date: string | null) {
    if (!date) return "—";

    return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatFee(transfer: Transfer) {
    if (transfer.transfer_type === "free") {
      return "Free";
    }

    if (transfer.fee === null || transfer.fee === undefined) {
      return "Undisclosed";
    }

    const currency = transfer.currency || "USD";

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(transfer.fee);
  }

  function getTypeLabel(type: string | null) {
    if (!type) return "";

    return type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function getConfidenceLabel(confidence: string | null) {
    if (!confidence) return "";

    return confidence
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 20px 60px",
        fontFamily: "Arial, sans-serif",
      }}
    >
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
          Transfer Database
        </div>

        <h1
          style={{
            fontSize: "42px",
            lineHeight: 1.1,
            margin: 0,
            marginBottom: "10px",
          }}
        >
          Transfers
        </h1>

        <p
          style={{
            fontSize: "17px",
            color: "#666",
            margin: 0,
          }}
        >
          Track player moves across women&apos;s football.
        </p>
      </div>

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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: "14px 16px",
              border: "1px solid #ddd",
              borderRadius: "9px",
              fontSize: "15px",
              background: "#fff",
            }}
          >
            {transferTypes.map((type) => (
              <option key={type} value={type}>
                {type === "All" ? "All Transfer Types" : getTypeLabel(type)}
              </option>
            ))}
          </select>

          <select
            value={leagueFilter}
            onChange={(e) => setLeagueFilter(e.target.value)}
            style={{
              padding: "14px 16px",
              border: "1px solid #ddd",
              borderRadius: "9px",
              fontSize: "15px",
              background: "#fff",
            }}
          >
            {leagues.map((league) => (
              <option key={league} value={league}>
                {league === "All" ? "All Leagues" : league}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          fontSize: "14px",
          color: "#666",
          marginBottom: "12px",
        }}
      >
        {loading
          ? "Loading transfers..."
          : `${filteredTransfers.length} transfer${
              filteredTransfers.length === 1 ? "" : "s"
            } found`}
      </div>

      <div
        style={{
          border: "1px solid #e3e3e3",
          borderRadius: "14px",
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.8fr 1.5fr 40px 1.5fr 1.1fr 1fr",
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
          <div>From</div>
          <div></div>
          <div>To</div>
          <div>Fee</div>
          <div>Date</div>
        </div>

        {loading ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#777",
            }}
          >
            Loading transfers...
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#777",
            }}
          >
            No transfers found.
          </div>
        ) : (
          filteredTransfers.map((transfer) => (
            <Link
              key={transfer.id}
              href={`/players/${transfer.player_id}`}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1.8fr 1.5fr 40px 1.5fr 1.1fr 1fr",
                gap: "12px",
                padding: "18px 20px",
                borderBottom: "1px solid #eee",
                alignItems: "center",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  minWidth: 0,
                }}
              >
                {transfer.player?.photo_url ? (
                  <img
                    src={transfer.player.photo_url}
                    alt={transfer.player.full_name}
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
                    {transfer.player?.full_name || "Unknown Player"}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#777",
                      marginTop: "3px",
                    }}
                  >
                    {transfer.player?.position || "—"}
                    {transfer.player?.nationality
                      ? ` • ${transfer.player.nationality}`
                      : ""}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  minWidth: 0,
                }}
              >
                {transfer.from_club?.logo_url ? (
                  <img
                    src={transfer.from_club.logo_url}
                    alt={transfer.from_club.name}
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
                    {transfer.from_club?.name || "—"}
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      color: "#888",
                      marginTop: "2px",
                    }}
                  >
                    {transfer.from_club?.league || ""}
                  </div>
                </div>
              </div>

              <div
                style={{
                  textAlign: "center",
                  fontSize: "20px",
                  color: "#999",
                }}
              >
                →
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  minWidth: 0,
                }}
              >
                {transfer.to_club?.logo_url ? (
                  <img
                    src={transfer.to_club.logo_url}
                    alt={transfer.to_club.name}
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
                    {transfer.to_club?.name || "—"}
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      color: "#888",
                      marginTop: "2px",
                    }}
                  >
                    {transfer.to_club?.league || ""}
                  </div>
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  {formatFee(transfer)}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#888",
                    marginTop: "3px",
                  }}
                >
                  {getTypeLabel(transfer.transfer_type)}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {formatDate(transfer.transfer_date)}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#888",
                    marginTop: "3px",
                  }}
                >
                  {getConfidenceLabel(transfer.confidence)}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
