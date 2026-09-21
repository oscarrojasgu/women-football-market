"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type PlayerData = { full_name: string; photo_url: string | null; nationality: string | null; position: string | null };
type ClubData = { name: string; league: string | null; country: string | null; logo_url: string | null };
type Contract = {
  id: string;
  player_id: string;
  status: string | null;
  confidence: string | null;
  start_date: string | null;
  end_date: string | null;
  annual_salary_usd: number | null;
  currency: string | null;
  player: PlayerData | null;
  club: ClubData | null;
};

function daysUntil(date: string | null) {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${date}T00:00:00`);
  return Math.ceil((end.getTime() - today.getTime()) / 86400000);
}

function formatDate(date: string | null) {
  if (!date) return "Unknown";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatSalary(value: number | null) {
  if (value === null || value === undefined) return "Not available";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: "compact",
  }).format(value);
}

function statusLabel(value: string | null) {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function expiryBucket(contract: Contract) {
  const days = daysUntil(contract.end_date);
  if (days === null) return "unknown";
  if (days < 0) return "expired";
  if (days <= 90) return "90";
  if (days <= 180) return "180";
  if (days <= 365) return "365";
  return "long";
}

function expiryLabel(contract: Contract) {
  const days = daysUntil(contract.end_date);
  if (days === null) return "Unknown expiry";
  if (days < 0) return "Expired";
  if (days === 0) return "Expires today";
  if (days <= 90) return `${days} days`;
  if (days <= 365) return `${Math.ceil(days / 30)} months`;
  return `${Math.ceil(days / 365)}+ years`;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [league, setLeague] = useState("All");
  const [expiry, setExpiry] = useState("All");

  useEffect(() => {
    async function loadContracts() {
      const { data, error } = await supabase.from("contracts").select(`
        id, player_id, status, confidence, start_date, end_date, annual_salary_usd, currency,
        player:players (full_name, photo_url, nationality, position),
        club:clubs (name, league, country, logo_url)
      `).order("end_date", { ascending: true });

      if (error) {
        console.error("Error loading contracts:", error);
        setContracts([]);
      } else {
        setContracts((data || []).map((c: any) => ({
          ...c,
          player: Array.isArray(c.player) ? c.player[0] || null : c.player || null,
          club: Array.isArray(c.club) ? c.club[0] || null : c.club || null,
        })));
      }
      setLoading(false);
    }
    loadContracts();
  }, []);

  const leagues = useMemo(() => ["All", ...Array.from(new Set(contracts.map(c => c.club?.league).filter(Boolean) as string[])).sort()], [contracts]);
  const statuses = useMemo(() => ["All", ...Array.from(new Set(contracts.map(c => c.status).filter(Boolean) as string[])).sort()], [contracts]);
  const activeContracts = useMemo(() => contracts.filter(c => c.status?.toLowerCase() === "active"), [contracts]);
  const expiring90 = useMemo(() => activeContracts.filter(c => expiryBucket(c) === "90"), [activeContracts]);
  const expiring180 = useMemo(() => activeContracts.filter(c => expiryBucket(c) === "180"), [activeContracts]);
  const expiring365 = useMemo(() => activeContracts.filter(c => expiryBucket(c) === "365"), [activeContracts]);
  const knownSalaryContracts = useMemo(() => activeContracts.filter(c => c.annual_salary_usd !== null), [activeContracts]);
  const knownPayroll = useMemo(() => knownSalaryContracts.reduce((sum, c) => sum + (c.annual_salary_usd || 0), 0), [knownSalaryContracts]);

  const filteredContracts = useMemo(() => {
    const query = search.toLowerCase().trim();
    return contracts.filter(c => {
      const matchesSearch = !query || [
        c.player?.full_name,
        c.club?.name,
        c.club?.league,
        c.player?.nationality,
        c.player?.position,
      ].filter(Boolean).join(" ").toLowerCase().includes(query);

      const matchesStatus = status === "All" || c.status === status;
      const matchesLeague = league === "All" || c.club?.league === league;
      const matchesExpiry = expiry === "All" || expiryBucket(c) === expiry;

      return matchesSearch && matchesStatus && matchesLeague && matchesExpiry;
    });
  }, [contracts, search, status, league, expiry]);

  const hasFilters = search !== "" || status !== "All" || league !== "All" || expiry !== "All";

  const clearFilters = () => {
    setSearch("");
    setStatus("All");
    setLeague("All");
    setExpiry("All");
  };

  return (
    <>
      <section className="players-scout-hero">
        <div className="players-scout-shell">
          <div className="players-scout-eyebrow">WOMEN&apos;S FOOTBALL MARKET</div>
          <h1>Contract Intelligence</h1>
          <p>
            Track active deals, contract expiry windows, salary information and confidence across the database.
          </p>
        </div>
      </section>

      <main className="players-page players-scout-page contracts-scout-page">
        <section className="scout-stat-grid">
          <div className="scout-stat"><span>ACTIVE CONTRACTS</span><strong>{loading ? "—" : activeContracts.length}</strong></div>
          <div className="scout-stat"><span>EXPIRING ≤90 DAYS</span><strong>{loading ? "—" : expiring90.length}</strong></div>
          <div className="scout-stat"><span>EXPIRING ≤6 MONTHS</span><strong>{loading ? "—" : expiring90.length + expiring180.length}</strong></div>
          <div className="scout-stat"><span>KNOWN PAYROLL</span><strong>{loading ? "—" : formatSalary(knownPayroll)}</strong></div>
        </section>

        <section className="scout-controls">
          <div className="scout-control-grid contracts-control-grid">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search player, club, league or position..."
            />
            <select value={expiry} onChange={e => setExpiry(e.target.value)}>
              <option value="All">All Expiry Windows</option>
              <option value="90">Next 90 Days</option>
              <option value="180">3–6 Months</option>
              <option value="365">6–12 Months</option>
              <option value="long">12+ Months</option>
              <option value="expired">Expired</option>
              <option value="unknown">Unknown</option>
            </select>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              {statuses.map(v => <option key={v} value={v}>{v === "All" ? "All Statuses" : statusLabel(v)}</option>)}
            </select>
            <select value={league} onChange={e => setLeague(e.target.value)}>
              {leagues.map(v => <option key={v} value={v}>{v === "All" ? "All Leagues" : v}</option>)}
            </select>
          </div>

          <div className="scout-control-footer">
            <span>{loading ? "Loading contract database..." : `${filteredContracts.length} contract${filteredContracts.length === 1 ? "" : "s"} match your criteria`}</span>
            <button type="button" onClick={clearFilters} disabled={!hasFilters}>Clear filters</button>
          </div>
        </section>

        <div className="scout-note">
          <strong>Contract context:</strong> expiry, salary and confidence reflect the recorded WFM contract data. Expired and historical records remain available through the expiry filter.
        </div>

        <section className="scout-table-wrap contracts-scout-table">
          <div className="scout-table-header contracts-table-header">
            <span>PLAYER</span>
            <span>CLUB</span>
            <span>STATUS</span>
            <span>EXPIRY</span>
            <span>SALARY</span>
            <span>CONFIDENCE</span>
          </div>

          {loading ? (
            <div className="scout-empty">Loading...</div>
          ) : filteredContracts.length === 0 ? (
            <div className="scout-empty">
              <strong>No contracts match the current filters</strong>
              <span>Broaden the status, league or expiry criteria.</span>
              <button type="button" onClick={clearFilters}>Reset contract filters</button>
            </div>
          ) : (
            filteredContracts.map(c => {
              const days = daysUntil(c.end_date);
              const urgent = days !== null && days >= 0 && days <= 90;

              return (
                <Link key={c.id} href={`/players/${c.player_id}`} className="scout-row contract-scout-row">
                  <span className="scout-player">
                    <img
                      src={c.player?.photo_url || "/wfm-player-placeholder.svg"}
                      alt={c.player?.full_name || "Player"}
                      width={46}
                      height={46}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={event => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = "/wfm-player-placeholder.svg";
                      }}
                    />
                    <span>
                      <strong>{c.player?.full_name || "Unknown Player"}</strong>
                      <small>{c.player?.position || "Position unavailable"} · {c.player?.nationality || "Nationality unavailable"}</small>
                    </span>
                  </span>

                  <span>
                    <strong>{c.club?.name || "Unknown Club"}</strong>
                    <small>{c.club?.league || "League unavailable"}</small>
                  </span>

                  <span>{statusLabel(c.status)}</span>

                  <span className={urgent ? "contract-urgent" : ""}>
                    <strong>{formatDate(c.end_date)}</strong>
                    <small>{expiryLabel(c)}</small>
                  </span>

                  <span>
                    <strong>{formatSalary(c.annual_salary_usd)}</strong>
                  </span>

                  <span>
                    <em className={`contract-confidence ${c.confidence || "unknown"}`}>{statusLabel(c.confidence)}</em>
                  </span>
                </Link>
              );
            })
          )}
        </section>
      </main>
    </>
  );
}
