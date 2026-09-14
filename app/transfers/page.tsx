```tsx
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
  const [type, setType] = useState("All");
  const [league, setLeague] = useState("All");

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

  const transferTypes = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          transfers
            .map((transfer) => transfer.transfer_type)
            .filter(Boolean)
        )
      ),
    ],
    [transfers]
  );

  const leagues = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          transfers
            .map((transfer) => transfer.to_club?.league)
            .filter(Boolean)
        )
      ),
    ],
    [transfers]
  );

  const filteredTransfers = transfers.filter((transfer) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      (transfer.player?.full_name || "")
        .toLowerCase()
        .includes(searchText) ||
      (transfer.from_club?.name || "")
        .toLowerCase()
        .includes(searchText) ||
      (transfer.to_club?.name || "")
        .toLowerCase()
        .includes(searchText);

    const matchesType =
      type === "All" ||
      transfer.transfer_type === type;

    const matchesLeague =
      league === "All" ||
      transfer.to_club?.league === league;

    return (
      matchesSearch &&
      matchesType &&
      matchesLeague
    );
  });

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

  const formatFee = (
    fee: number | null,
    currency: string | null,
    transferType: string | null
  ) => {
    if (fee === null || fee === undefined) {
      if (transferType === "free") return "Free";
      return "Undisclosed";
    }

    return `${currency || "USD"} ${Number(
      fee
    ).toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })}`;
  };

  const getTypeLabel = (value: string | null) => {
    if (!value) return "Unknown";

    if (value === "contract_expiration") {
      return "Contract Expiration";
    }

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

      {/* TRANSFER DATABASE */}

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
            Transfer Database
          </div>

          <h1
            style={{
              fontSize: "42px",
              margin: "0 0 10px",
              letterSpacing: "-1px",
            }}
          >
            Player Transfers
          </h1>

          <p
            style={{
              color: "#666",
              margin: 0,
              fontSize: "17px",
            }}
          >
            Transfers, loans, free moves and player movement across women's football.
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
              placeholder="Search players, clubs..."
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
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{
                padding: "14px 16px",
                border: "1px solid #d5d5d5",
                borderRadius: "9px",
                fontSize: "15px",
                background: "#fff",
              }}
            >
              {transferTypes.map((item) => (
                <option key={item} value={item || ""}>
                  {item === "All"
                    ? "All Transfer Types"
                    : getTypeLabel(item)}
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
              {filteredTransfers.length}
            </strong>{" "}
            transfer
            {filteredTransfers.length !== 1 ? "s" : ""}
          </div>
        )}

        {/* RESULTS */}

        {loading ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#777",
            }}
          >
            Loading transfers...
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div
            style={{
              padding: "50px",
              border: "1px solid #e5e5e5",
              borderRadius: "14px",
              textAlign: "center",
            }}
          >
            <h2>No transfers found</h2>

            <p style={{ color: "#666" }}>
              Try changing your search or filters.
            </p>
          </div>
        ) : (
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
                  "1.8fr 1.5fr 40px 1.5fr 1.1fr 1fr",
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
              <span>From</span>
              <span></span>
              <span>To</span>
              <span>Fee</span>
              <span>Date</span>
            </div>

            {/* TRANSFER ROWS */}

            {filteredTransfers.map((transfer) => {
              const confidence = getConfidenceLabel(
                transfer.confidence
              );

              return (
                <Link
                  key={transfer.id}
                  href={`/players/${transfer.player_id}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1.8fr 1.5fr 40px 1.5fr 1.1fr 1fr",
                      gap: "15px",
                      padding: "18px 20px"
```
