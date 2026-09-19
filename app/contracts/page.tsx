"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type PlayerData = { full_name: string; photo_url: string | null; nationality: string | null; position: string | null };
type ClubData = { name: string; league: string | null; country: string | null; logo_url: string | null };
type Contract = {
  id: string; player_id: string; status: string | null; confidence: string | null;
  start_date: string | null; end_date: string | null; annual_salary_usd: number | null;
  currency: string | null; player: PlayerData | null; club: ClubData | null;
};

function daysUntil(date: string | null) {
  if (!date) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const end = new Date(`${date}T00:00:00`);
  return Math.ceil((end.getTime() - today.getTime()) / 86400000);
}
function formatDate(date: string | null) {
  if (!date) return "Unknown";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function formatSalary(value: number | null) {
  if (value === null || value === undefined) return "Not available";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
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
      if (error) { console.error("Error loading contracts:", error); setContracts([]); }
      else setContracts((data || []).map((c: any) => ({ ...c, player: Array.isArray(c.player) ? c.player[0] || null : c.player || null, club: Array.isArray(c.club) ? c.club[0] || null : c.club || null })));
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
      const matchesSearch = !query || [c.player?.full_name, c.club?.name, c.club?.league, c.player?.nationality, c.player?.position].filter(Boolean).join(" ").toLowerCase().includes(query);
      const matchesStatus = status === "All" || c.status === status;
      const matchesLeague = league === "All" || c.club?.league === league;
      const matchesExpiry = expiry === "All" || expiryBucket(c) === expiry;
      return matchesSearch && matchesStatus && matchesLeague && matchesExpiry;
    });
  }, [contracts, search, status, league, expiry]);

  const clearFilters = () => { setSearch(""); setStatus("All"); setLeague("All"); setExpiry("All"); };
  const hasFilters = search || status !== "All" || league !== "All" || expiry !== "All";

  return (
    <main className="contracts-page" style={{ minHeight: "100vh", background: "#f5f4ef", color: "#111" }}>
      <section style={{ background: "#111", color: "#fff", padding: "55px 6vw 50px" }}><div style={{ maxWidth: 1200, margin: "0 auto" }}><div style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700, color: "#aaa", marginBottom: 14 }}>WOMEN&apos;S FOOTBALL MARKET</div><h1 style={{ fontSize: 46, lineHeight: 1.05, margin: 0, fontWeight: 800 }}>Contract Intelligence</h1><p style={{ margin: "18px 0 0", maxWidth: 720, color: "#ccc", fontSize: 17, lineHeight: 1.6 }}>Track active deals, contract expiry windows, salary information and confidence across the database.</p></div></section>
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px 0" }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>{[["Active Contracts", activeContracts.length.toString()],["Expiring ≤90 Days", expiring90.length.toString()],["Expiring ≤6 Months", (expiring90.length + expiring180.length).toString()],["Expiring ≤1 Year", (expiring90.length + expiring180.length + expiring365.length).toString()],["Known Payroll", formatSalary(knownPayroll)]].map(([label, value]) => <div key={label} style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, padding: "18px 20px" }}><div style={{ fontSize: 11, color: "#777", fontWeight: 700, letterSpacing: .8 }}>{label}</div><div style={{ fontSize: 25, fontWeight: 800, marginTop: 7 }}>{loading ? "—" : value}</div></div>)}</div></section>
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px 60px" }}>
        <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 12, padding: 20, marginBottom: 18 }}><div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12 }}><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search player, club, league, position..." style={{ padding: "12px 14px", border: "1px solid #ccc", borderRadius: 8, fontSize: 14, minWidth: 0 }} /><select value={expiry} onChange={e => setExpiry(e.target.value)} style={{ padding: "12px 14px", border: "1px solid #ccc", borderRadius: 8, background: "#fff", fontSize: 14 }}><option value="All">All Expiry Windows</option><option value="90">Next 90 Days</option><option value="180">3–6 Months</option><option value="365">6–12 Months</option><option value="long">12+ Months</option><option value="expired">Expired</option><option value="unknown">Unknown</option></select><select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: "12px 14px", border: "1px solid #ccc", borderRadius: 8, background: "#fff", fontSize: 14 }}>{statuses.map(v => <option key={v} value={v}>{v === "All" ? "All Statuses" : statusLabel(v)}</option>)}</select><select value={league} onChange={e => setLeague(e.target.value)} style={{ padding: "12px 14px", border: "1px solid #ccc", borderRadius: 8, background: "#fff", fontSize: 14 }}>{leagues.map(v => <option key={v} value={v}>{v === "All" ? "All Leagues" : v}</option>)}</select></div>{hasFilters && <button onClick={clearFilters} style={{ marginTop: 12, border: 0, background: "transparent", padding: 0, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#555" }}>Clear filters</button>}</div>
        <div style={{ marginBottom: 12, color: "#555", fontSize: 14 }}>{loading ? "Loading contracts..." : `${filteredContracts.length} contract${filteredContracts.length === 1 ? "" : "s"}`}</div>
        <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 12, overflow: "hidden" }}><div style={{ display: "grid", gridTemplateColumns: "2fr 1.45fr .9fr 1.15fr 1.15fr .9fr", gap: 12, padding: "14px 18px", background: "#f7f7f7", borderBottom: "1px solid #ddd", fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: .6 }}><div>Player</div><div>Club</div><div>Status</div><div>Expiry</div><div>Salary</div><div>Confidence</div></div>
          {loading ? <div style={{ padding: 35, textAlign: "center", color: "#777" }}>Loading...</div> : filteredContracts.length === 0 ? <div style={{ padding: 35, textAlign: "center", color: "#777" }}>No contracts found.</div> : filteredContracts.map(c => { const days = daysUntil(c.end_date); const urgent = days !== null && days >= 0 && days <= 90; return <Link key={c.id} href={`/players/${c.player_id}`} style={{ display: "grid", gridTemplateColumns: "2fr 1.45fr .9fr 1.15fr 1.15fr .9fr", gap: 12, padding: "16px 18px", borderBottom: "1px solid #eee", textDecoration: "none", color: "#111", alignItems: "center" }}><div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>{c.player?.photo_url ? <img src={c.player.photo_url} alt={c.player.full_name || "Player"} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#eee", flexShrink: 0 }} />}<div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.player?.full_name || "Unknown Player"}</div><div style={{ color: "#777", fontSize: 12, marginTop: 3 }}>{c.player?.position || "—"}</div></div></div><div style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.club?.name || "Unknown Club"}</div><div style={{ color: "#777", fontSize: 11, marginTop: 3 }}>{c.club?.league || "—"}</div></div><div style={{ fontSize: 12, fontWeight: 700 }}>{statusLabel(c.status)}</div><div><div style={{ fontSize: 13, fontWeight: urgent ? 800 : 600 }}>{formatDate(c.end_date)}</div><div style={{ color: urgent ? "#111" : "#777", fontSize: 11, marginTop: 3 }}>{expiryLabel(c)}</div></div><div style={{ fontSize: 13, fontWeight: 700 }}>{formatSalary(c.annual_salary_usd)}</div><div style={{ fontSize: 12, color: "#555" }}>{c.confidence ? statusLabel(c.confidence) : "Unknown"}</div></Link>; })}
        </div>
      </section>
    </main>
  );
}
