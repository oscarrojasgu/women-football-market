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
  if (!date) return "Date unknown";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatMonth(date: string | null) {
  if (!date) return "Date unknown";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Date unknown";
  return parsed.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatTransferType(type: string | null) {
  if (!type) return "Unknown";
  return type.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatConfidence(confidence: string | null) {
  if (!confidence) return "Unknown";
  return confidence.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCurrency(value: number, currency: string | null) {
  const code = currency || "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
      notation: value >= 1000000 ? "compact" : "standard",
    }).format(value);
  } catch {
    return `${code} ${value.toLocaleString("en-US")}`;
  }
}

function formatFee(fee: number | null, currency: string | null, transferType: string | null) {
  const normalizedType = transferType?.toLowerCase();
  if (normalizedType === "free") return "Free transfer";
  if (normalizedType === "loan") return fee === null ? "Loan" : formatCurrency(fee, currency);
  if (fee === null || fee === undefined) return "Undisclosed";
  return formatCurrency(fee, currency);
}

function getTypeTone(type: string | null) {
  const normalized = type?.toLowerCase();
  if (normalized === "free") return "free";
  if (normalized === "loan") return "loan";
  if (normalized === "permanent") return "permanent";
  if (normalized === "trade") return "trade";
  if (normalized === "release") return "release";
  if (normalized === "contract_expiration") return "expiration";
  return "default";
}

function getConfidenceTone(confidence: string | null) {
  const normalized = confidence?.toLowerCase();
  if (normalized === "verified") return "verified";
  if (normalized === "reported") return "reported";
  if (normalized === "estimated") return "estimated";
  if (normalized === "rumored") return "rumored";
  return "unknown";
}

function Asset({ src, alt, kind }: { src: string | null | undefined; alt: string; kind: "player" | "club" }) {
  const fallback = kind === "player" ? "/wfm-player-placeholder.svg" : "/wfm-club-placeholder.svg";
  return (
    <div
      style={{
        width: kind === "player" ? 44 : 34,
        height: kind === "player" ? 44 : 34,
        minWidth: kind === "player" ? 44 : 34,
        borderRadius: kind === "player" ? "50%" : 8,
        overflow: "hidden",
        background: "#f2f2ef",
        border: "1px solid #e6e5df",
      }}
    >
      <img
        src={src || fallback}
        alt={alt}
        width={kind === "player" ? 44 : 34}
        height={kind === "player" ? 44 : 34}
        onError={(event) => {
          const image = event.currentTarget;
          if (image.src.endsWith(fallback)) return;
          image.src = fallback;
        }}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [confidenceFilter, setConfidenceFilter] = useState("All");
  const [leagueFilter, setLeagueFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");

  useEffect(() => {
    async function loadTransfers() {
      setLoading(true);
      setError("");

      const { data: transferData, error: transferError } = await supabase
        .from("transfers")
        .select("id, player_id, from_club_id, to_club_id, transfer_date, transfer_type, fee, currency, confidence")
        .order("transfer_date", { ascending: false });

      if (transferError) {
        console.error("Error loading transfers:", transferError);
        setError("We couldn't load the transfer market right now.");
        setTransfers([]);
        setLoading(false);
        return;
      }

      const rows = transferData || [];
      const playerIds = [...new Set(rows.map((transfer) => transfer.player_id).filter(Boolean))];
      const clubIds = [...new Set(rows.flatMap((transfer) => [transfer.from_club_id, transfer.to_club_id].filter(Boolean)))];

      const [{ data: playerData, error: playerError }, { data: clubData, error: clubError }] = await Promise.all([
        playerIds.length > 0
          ? supabase.from("players").select("id, full_name, nationality, position, photo_url").in("id", playerIds)
          : Promise.resolve({ data: [], error: null }),
        clubIds.length > 0
          ? supabase.from("clubs").select("id, name, country, league, logo_url").in("id", clubIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (playerError || clubError) console.error("Error loading transfer relationships:", playerError || clubError);

      const playerMap = new Map((playerData || []).map((player) => [player.id, player]));
      const clubMap = new Map((clubData || []).map((club) => [club.id, club]));

      setTransfers(
        rows.map((transfer) => ({
          ...transfer,
          player: playerMap.get(transfer.player_id) || null,
          from_club: transfer.from_club_id ? clubMap.get(transfer.from_club_id) || null : null,
          to_club: transfer.to_club_id ? clubMap.get(transfer.to_club_id) || null : null,
        }))
      );
      setLoading(false);
    }

    loadTransfers();
  }, []);

  const transferTypes = useMemo(() => {
    const types = transfers.map((transfer) => transfer.transfer_type).filter(Boolean) as string[];
    return ["All", ...Array.from(new Set(types))];
  }, [transfers]);

  const confidenceOptions = useMemo(() => {
    const values = transfers.map((transfer) => transfer.confidence).filter(Boolean) as string[];
    return ["All", ...Array.from(new Set(values))];
  }, [transfers]);

  const leagueOptions = useMemo(() => {
    const values = transfers.flatMap((transfer) => [transfer.to_club?.league, transfer.from_club?.league]).filter(Boolean) as string[];
    return ["All", ...Array.from(new Set(values)).sort()];
  }, [transfers]);

  const yearOptions = useMemo(() => {
    const years = transfers.map((transfer) => transfer.transfer_date?.slice(0, 4)).filter(Boolean) as string[];
    return ["All", ...Array.from(new Set(years)).sort((a, b) => Number(b) - Number(a))];
  }, [transfers]);

  const filteredTransfers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transfers.filter((transfer) => {
      const playerName = transfer.player?.full_name?.toLowerCase() || "";
      const playerNationality = transfer.player?.nationality?.toLowerCase() || "";
      const position = transfer.player?.position?.toLowerCase() || "";
      const fromClub = transfer.from_club?.name?.toLowerCase() || "";
      const toClub = transfer.to_club?.name?.toLowerCase() || "";
      const fromLeague = transfer.from_club?.league?.toLowerCase() || "";
      const toLeague = transfer.to_club?.league?.toLowerCase() || "";
      const year = transfer.transfer_date?.slice(0, 4) || "";

      const matchesSearch = !query || playerName.includes(query) || playerNationality.includes(query) || position.includes(query) || fromClub.includes(query) || toClub.includes(query) || fromLeague.includes(query) || toLeague.includes(query);
      const matchesType = typeFilter === "All" || transfer.transfer_type === typeFilter;
      const matchesConfidence = confidenceFilter === "All" || transfer.confidence === confidenceFilter;
      const matchesLeague = leagueFilter === "All" || transfer.from_club?.league === leagueFilter || transfer.to_club?.league === leagueFilter;
      const matchesYear = yearFilter === "All" || year === yearFilter;

      return matchesSearch && matchesType && matchesConfidence && matchesLeague && matchesYear;
    });
  }, [transfers, search, typeFilter, confidenceFilter, leagueFilter, yearFilter]);

  const metrics = useMemo(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const recent = transfers.filter((transfer) => {
      if (!transfer.transfer_date) return false;
      const time = new Date(transfer.transfer_date).getTime();
      return !Number.isNaN(time) && time >= thirtyDaysAgo && time <= now;
    }).length;
    const permanent = transfers.filter((transfer) => transfer.transfer_type?.toLowerCase() === "permanent").length;
    const free = transfers.filter((transfer) => transfer.transfer_type?.toLowerCase() === "free").length;
    const loans = transfers.filter((transfer) => transfer.transfer_type?.toLowerCase() === "loan").length;
    const knownFees = transfers.filter((transfer) => transfer.fee !== null && transfer.fee !== undefined && transfer.transfer_type?.toLowerCase() !== "free").length;
    const verified = transfers.filter((transfer) => transfer.confidence?.toLowerCase() === "verified").length;
    return { recent, permanent, free, loans, knownFees, verified };
  }, [transfers]);

  const groupedTransfers = useMemo(() => {
    const groups = new Map<string, Transfer[]>();
    for (const transfer of filteredTransfers) {
      const key = formatMonth(transfer.transfer_date);
      const existing = groups.get(key) || [];
      existing.push(transfer);
      groups.set(key, existing);
    }
    return Array.from(groups.entries());
  }, [filteredTransfers]);

  const hasFilters = search.trim() !== "" || typeFilter !== "All" || confidenceFilter !== "All" || leagueFilter !== "All" || yearFilter !== "All";

  function clearFilters() {
    setSearch("");
    setTypeFilter("All");
    setConfidenceFilter("All");
    setLeagueFilter("All");
    setYearFilter("All");
  }

  return (
    <main className="transfers-page" style={{ minHeight: "100vh", background: "#f5f4ef", color: "#111" }}>
      <section style={{ background: "#111", color: "#fff", padding: "54px 24px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 11, letterSpacing: 2.2, fontWeight: 800, color: "#aaa", marginBottom: 12 }}>
            WOMEN&apos;S FOOTBALL MARKET · LIVE DATABASE
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "clamp(36px, 5vw, 58px)", lineHeight: 1, letterSpacing: "-2px" }}>
                Transfer Market
              </h1>
              <p style={{ maxWidth: 720, margin: "18px 0 0", color: "#c8c8c8", fontSize: 16, lineHeight: 1.6 }}>
                A chronological view of player movement across the women&apos;s game — with clubs, transfer type, reported fees, dates, and source confidence connected to the database.
              </p>
            </div>
            <div style={{ padding: "10px 14px", border: "1px solid #3a3a3a", borderRadius: 999, color: "#ddd", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
              {transfers.length} recorded moves
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "30px 24px 70px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 22 }}>
          {[
            ["Recent · 30 days", metrics.recent.toString()],
            ["Permanent", metrics.permanent.toString()],
            ["Free", metrics.free.toString()],
            ["Loans", metrics.loans.toString()],
            ["Known fees", metrics.knownFees.toString()],
            ["Verified", metrics.verified.toString()],
          ].map(([label, value]) => (
            <div key={label} style={{ background: "#fff", border: "1px solid #e2e1dc", borderRadius: 12, padding: "16px 17px" }}>
              <div style={{ fontSize: 11, color: "#777", fontWeight: 700, marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: "-0.5px" }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e1dc", borderRadius: 14, padding: 18, marginBottom: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) repeat(4, minmax(125px, 160px))", gap: 10 }}>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search player, club, league, position..." style={{ ...inputStyle }} />
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} style={selectStyle}>
              {transferTypes.map((type) => <option key={type} value={type}>{type === "All" ? "All types" : formatTransferType(type)}</option>)}
            </select>
            <select value={leagueFilter} onChange={(event) => setLeagueFilter(event.target.value)} style={selectStyle}>
              {leagueOptions.map((league) => <option key={league} value={league}>{league === "All" ? "All leagues" : league}</option>)}
            </select>
            <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} style={selectStyle}>
              {yearOptions.map((year) => <option key={year} value={year}>{year === "All" ? "All years" : year}</option>)}
            </select>
            <select value={confidenceFilter} onChange={(event) => setConfidenceFilter(event.target.value)} style={selectStyle}>
              {confidenceOptions.map((confidence) => <option key={confidence} value={confidence}>{confidence === "All" ? "All confidence" : formatConfidence(confidence)}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginTop: 13 }}>
            <div style={{ fontSize: 13, color: "#777" }}>
              Showing <strong style={{ color: "#111" }}>{filteredTransfers.length}</strong> of {transfers.length} transfers
            </div>
            {hasFilters && <button type="button" onClick={clearFilters} style={clearLinkStyle}>Clear filters</button>}
          </div>
        </div>

        {loading ? (
          <div style={emptyStateStyle}>Loading the transfer market...</div>
        ) : error ? (
          <div style={emptyStateStyle}>{error}</div>
        ) : filteredTransfers.length === 0 ? (
          <div style={emptyStateStyle}>
            <div style={{ fontWeight: 800, color: "#111", marginBottom: 6 }}>No transfers found</div>
            <div>Try changing your filters or clearing the search.</div>
            {hasFilters && <button type="button" onClick={clearFilters} style={clearButtonStyle}>Clear filters</button>}
          </div>
        ) : (
          <div>
            {groupedTransfers.map(([month, monthTransfers]) => (
              <section key={month} style={{ marginBottom: 30 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <h2 style={{ margin: 0, fontSize: 14, letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 850 }}>{month}</h2>
                  <div style={{ height: 1, background: "#d9d8d2", flex: 1 }} />
                  <span style={{ color: "#888", fontSize: 12, fontWeight: 700 }}>{monthTransfers.length} {monthTransfers.length === 1 ? "move" : "moves"}</span>
                </div>

                <div style={{ display: "grid", gap: 9 }}>
                  {monthTransfers.map((transfer) => {
                    const typeTone = getTypeTone(transfer.transfer_type);
                    const confidenceTone = getConfidenceTone(transfer.confidence);
                    return (
                      <article key={transfer.id} style={{ background: "#fff", border: "1px solid #e2e1dc", borderRadius: 14, padding: "14px 16px", display: "grid", gridTemplateColumns: "90px minmax(190px, 1.1fr) minmax(230px, 1.3fr) 110px 130px 105px", alignItems: "center", gap: 14, boxShadow: "0 1px 0 rgba(0,0,0,0.02)" }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800 }}>{formatDate(transfer.transfer_date)}</div>
                          <div style={{ fontSize: 10, color: "#999", marginTop: 3, textTransform: "uppercase", letterSpacing: 0.7 }}>Move date</div>
                        </div>

                        <Link href={transfer.player ? `/players/${transfer.player.id}` : "#"} style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, textDecoration: "none", color: "#111", pointerEvents: transfer.player ? "auto" : "none" }}>
                          <Asset src={transfer.player?.photo_url} alt={transfer.player?.full_name || "Player"} kind="player" />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{transfer.player?.full_name || "Unknown player"}</div>
                            <div style={{ fontSize: 11, color: "#777", marginTop: 3 }}>{transfer.player?.position || "Position unknown"}{transfer.player?.nationality ? ` · ${transfer.player.nationality}` : ""}</div>
                          </div>
                        </Link>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 34px 1fr", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <ClubCell club={transfer.from_club} direction="From" />
                          <div style={{ textAlign: "center", color: "#999", fontSize: 18, fontWeight: 700 }}>→</div>
                          <ClubCell club={transfer.to_club} direction="To" />
                        </div>

                        <div><span style={{ ...badgeBase, ...typeBadgeStyles[typeTone] }}>{formatTransferType(transfer.transfer_type)}</span></div>

                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800 }}>{formatFee(transfer.fee, transfer.currency, transfer.transfer_type)}</div>
                          {transfer.fee !== null && transfer.transfer_type?.toLowerCase() !== "free" && <div style={{ fontSize: 10, color: "#999", marginTop: 3 }}>Reported fee</div>}
                        </div>

                        <div style={{ textAlign: "right" }}><span style={{ ...badgeBase, ...confidenceBadgeStyles[confidenceTone] }}>{formatConfidence(transfer.confidence)}</span></div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ClubCell({ club, direction }: { club: Club | null; direction: "From" | "To" }) {
  if (!club) {
    return <div style={{ minWidth: 0 }}><div style={clubLabelStyle}>{direction}</div><div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>Unknown club</div></div>;
  }

  return (
    <Link href={`/clubs/${club.id}`} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, color: "#111", textDecoration: "none" }}>
      <Asset src={club.logo_url} alt={club.name} kind="club" />
      <div style={{ minWidth: 0 }}>
        <div style={clubLabelStyle}>{direction}</div>
        <div style={{ fontSize: 12, fontWeight: 750, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{club.name}</div>
        <div style={{ fontSize: 10, color: "#888", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{club.league || club.country || "League unknown"}</div>
      </div>
    </Link>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: "1px solid #d9d8d3",
  borderRadius: 9,
  padding: "11px 12px",
  fontSize: 14,
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  border: "1px solid #d9d8d3",
  borderRadius: 9,
  padding: "11px 12px",
  fontSize: 13,
  background: "#fff",
  color: "#111",
};

const badgeBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 25,
  padding: "4px 8px",
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 0.2,
  whiteSpace: "nowrap",
};

const typeBadgeStyles: Record<string, React.CSSProperties> = {
  permanent: { background: "#e8f2ea", color: "#245b32" },
  free: { background: "#eef2f5", color: "#40505b" },
  loan: { background: "#f3ecdf", color: "#76591e" },
  trade: { background: "#eee9f5", color: "#5a4375" },
  release: { background: "#f5e8e8", color: "#7b3c3c" },
  expiration: { background: "#f0eeee", color: "#666" },
  default: { background: "#eeeeeb", color: "#555" },
};

const confidenceBadgeStyles: Record<string, React.CSSProperties> = {
  verified: { background: "#e8f2ea", color: "#245b32" },
  reported: { background: "#eef2f5", color: "#40505b" },
  estimated: { background: "#f3ecdf", color: "#76591e" },
  rumored: { background: "#f5e8e8", color: "#7b3c3c" },
  unknown: { background: "#eeeeeb", color: "#666" },
};

const clubLabelStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#999",
  textTransform: "uppercase",
  letterSpacing: 0.7,
};

const clearLinkStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  padding: 0,
  color: "#111",
  fontSize: 13,
  fontWeight: 750,
  cursor: "pointer",
};

const emptyStateStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e1dc",
  borderRadius: 14,
  padding: "46px 24px",
  textAlign: "center",
  color: "#777",
  fontSize: 14,
};

const clearButtonStyle: React.CSSProperties = {
  marginTop: 16,
  border: "1px solid #cccac3",
  background: "#fff",
  borderRadius: 8,
  padding: "9px 13px",
  fontSize: 13,
  fontWeight: 750,
  cursor: "pointer",
};
