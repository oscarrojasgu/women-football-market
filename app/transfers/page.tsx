"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Transfer = {
  id: string;
  player_id: string;
  transfer_date: string | null;
  transfer_type: string | null;
  fee: number | null;
  currency: string | null;
  confidence: string | null;

  player: {
    full_name: string;
    photo_url: string | null;
    nationality: string | null;
    position: string | null;
  } | null;

  from_club: {
    name: string;
    league: string | null;
    country: string | null;
    logo_url: string | null;
  } | null;

  to_club: {
    name: string;
    league: string | null;
    country: string | null;
    logo_url: string | null;
  } | null;
};

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [leagueFilter, setLeagueFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTransfers() {
      setLoading(true);
      setError("");

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
        console.error(error);
        setError(error.message);
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

  const leagues = Array.from(
    new Set(
      transfers
        .map((transfer) => transfer.to_club?.league)
        .filter(Boolean)
    )
  ) as string[];

  const filteredTransfers = transfers.filter((transfer) => {
    const playerName = transfer.player?.full_name || "";
    const fromClub = transfer.from_club?.name || "";
    const toClub = transfer.to_club?.name || "";

    const matchesSearch =
      playerName.toLowerCase().includes(search.toLowerCase()) ||
      fromClub.toLowerCase().includes(search.toLowerCase()) ||
      toClub.toLowerCase().includes(search.toLowerCase());

    const matchesType =
      typeFilter === "All" ||
      transfer.transfer_type === typeFilter;

    const matchesLeague =
      leagueFilter === "All" ||
      transfer.to_club?.league === leagueFilter;

    return matchesSearch && matchesType && matchesLeague;
  });

  function formatFee(
    fee: number | null,
    currency: string | null,
    transferType: string | null
  ) {
    if (fee === null || fee === undefined) {
      if (transferType === "free") return "Free";
      return "Undisclosed";
    }

    return `${currency || "USD"} ${fee.toLocaleString()}`;
  }

  function formatDate(date: string | null) {
    if (!date) return "—";

    const formatted = new Date(date + "T00:00:00");

    return formatted.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <main className="page">
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

      <section className="content">
        <div className="page-header">
          <div>
            <h1>Transfers</h1>
            <p>Women's football transfer market</p>
          </div>
        </div>

        <div className="filters">
          <input
            type="text"
            placeholder="Search player or club..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All transfer types</option>
            <option value="permanent">Permanent</option>
            <option value="loan">Loan</option>
            <option value="free">Free</option>
            <option value="trade">Trade</option>
            <option value="release">Release</option>
            <option value="contract_expiration">
              Contract expiration
            </option>
          </select>

          <select
            value={leagueFilter}
            onChange={(e) => setLeagueFilter(e.target.value)}
          >
            <option value="All">All leagues</option>

            {leagues.map((league) => (
              <option key={league} value={league}>
                {league}
              </option>
            ))}
          </select>
        </div>

        <div className="results-count">
          {filteredTransfers.length} transfer
          {filteredTransfers.length === 1 ? "" : "s"}
        </div>

        {loading && <p>Loading transfers...</p>}

        {!loading && error && (
          <div className="error">
            <strong>Could not load transfers.</strong>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filteredTransfers.length === 0 && (
          <div className="empty">
            <h2>No transfers found</h2>
            <p>
              Try changing your search or filters.
            </p>
          </div>
        )}

        {!loading && !error && filteredTransfers.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>From</th>
                  <th></th>
                  <th>To</th>
                  <th>Fee</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredTransfers.map((transfer) => (
                  <tr key={transfer.id}>
                    <td>
                      <Link
                        href={`/players/${transfer.player_id}`}
                        className="player-link"
                      >
                        <div className="player-cell">
                          {transfer.player?.photo_url ? (
                            <img
                              src={transfer.player.photo_url}
                              alt={transfer.player.full_name}
                            />
                          ) : (
                            <div className="player-placeholder">
                              {transfer.player?.full_name
                                ?.charAt(0)
                                .toUpperCase() || "?"}
                            </div>
                          )}

                          <div>
                            <strong>
                              {transfer.player?.full_name ||
                                "Unknown player"}
                            </strong>

                            <span>
                              {transfer.player?.position || ""}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </td>

                    <td>
                      <div className="club-cell">
                        {transfer.from_club?.logo_url ? (
                          <img
                            src={transfer.from_club.logo_url}
                            alt={transfer.from_club.name}
                          />
                        ) : null}

                        <div>
                          <strong>
                            {transfer.from_club?.name ||
                              "Free Agent"}
                          </strong>

                          <span>
                            {transfer.from_club?.league || ""}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="arrow">→</td>

                    <td>
                      <div className="club-cell">
                        {transfer.to_club?.logo_url ? (
                          <img
                            src={transfer.to_club.logo_url}
                            alt={transfer.to_club.name}
                          />
                        ) : null}

                        <div>
                          <strong>
                            {transfer.to_club?.name ||
                              "Unknown club"}
                          </strong>

                          <span>
                            {transfer.to_club?.league || ""}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <strong>
                        {formatFee(
                          transfer.fee,
                          transfer.currency,
                          transfer.transfer_type
                        )}
                      </strong>

                      <span className="subtext">
                        {transfer.transfer_type
                          ?.replace("_", " ")
                          .replace(/\b\w/g, (letter) =>
                            letter.toUpperCase()
                          )}
                      </span>
                    </td>

                    <td>
                      <span>
                        {formatDate(transfer.transfer_date)}
                      </span>

                      <span className="subtext">
                        {transfer.confidence || ""}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
