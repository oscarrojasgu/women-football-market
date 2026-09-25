import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ returnTo?: string }> };

const ageOf = (dob: string | null) => {
  if (!dob) return null;
  const birth = new Date(`${dob}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
};

const money = (value: number | null) =>
  value == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const pct = (value: number | null) =>
  value == null ? "—" : `${Math.round(value * 100)}th`;

const cardStyle = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: 20,
};

export default async function ScoutingReportPage({ params, searchParams }: PageProps) {\n  const { returnTo } = await searchParams;\n  const workspaceHref = returnTo && returnTo.startsWith("/scouting/profiles/") ? returnTo : "/scouting";
  const { id } = await params;
  const { data: player, error } = await supabase
    .from("players")
    .select("id,full_name,date_of_birth,nationality,position,secondary_position,preferred_foot,agency,photo_url,photo_source,photo_credit,photo_license")
    .eq("id", id)
    .single();

  if (error || !player) {
    return (
      <main className="players-page" style={{ paddingTop: 48 }}>
        <h1>Scouting report unavailable</h1>
        <Link href="/scouting">← Scouting Workspace</Link>
      </main>
    );
  }

  const [{ data: intelligence }, { data: contracts }, { data: values }, { data: peers }] = await Promise.all([
    supabase.from("player_season_intelligence").select("season,club_name,league,position,minutes,goals,assists,goals_per90,assists_per90,xg_per90,xa_per90,chances_created_per90,key_passes_per90,tackles_per90,interceptions_per90,progressive_carries_per90,duels_won_per90").eq("player_id", id).order("season", { ascending: false }),
    supabase.from("contracts").select("status,start_date,end_date,annual_salary_usd,weekly_salary_usd,club:clubs(name)").eq("player_id", id).order("start_date", { ascending: false }),
    supabase.from("market_values").select("market_value_usd,valuation_date").eq("player_id", id).order("valuation_date", { ascending: false }).limit(1),
    supabase.from("player_global_peer_benchmarks").select("season,league,position,peer_count_global,goals_per90_global_percentile,assists_per90_global_percentile,xg_per90_global_percentile,xa_per90_global_percentile,chances_created_per90_global_percentile,key_passes_per90_global_percentile,tackles_per90_global_percentile,interceptions_per90_global_percentile,progressive_carries_per90_global_percentile").eq("player_id", id).order("season", { ascending: false }),
  ]);

  const latest = intelligence?.[0] || null;
  const contract = (contracts || []).find((c: any) => c.status?.toLowerCase() === "active") || contracts?.[0] || null;
  const value = values?.[0] || null;
  const peer = peers?.[0] || null;
  const club = Array.isArray(contract?.club) ? contract.club[0] : contract?.club;
  const photo = player.photo_url as string | null;

  return (
    <main className="players-page" style={{ paddingBottom: 60 }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 18px 0" }}>
        <div style={{ marginBottom: 14 }}>
          <Link href={workspaceHref} style={{ color: "#222", fontWeight: 700, textDecoration: "none", fontSize: 12 }}>← Scouting Workspace</Link>
        </div>

        <section style={{ ...cardStyle, display: "grid", gridTemplateColumns: "170px 1fr", gap: 24, alignItems: "stretch" }}>
          <div style={{ minHeight: 210, background: "#f2f1ed", borderRadius: 8, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {photo ? (
              <img src={photo} alt={`${player.full_name} scouting profile`} style={{ width: "100%", height: "100%", minHeight: 210, objectFit: "cover", display: "block" }} />
            ) : (
              <span style={{ fontSize: 48, fontWeight: 800, color: "#aaa" }}>{player.full_name?.charAt(0) || "?"}</span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ fontSize: 10, letterSpacing: "0.08em", color: "#888", fontWeight: 800 }}>WOMEN&apos;S FOOTBALL MARKET · SCOUTING REPORT</span>
            <h1 style={{ margin: "7px 0 5px", fontSize: "clamp(28px,4vw,44px)", lineHeight: 1 }}>{player.full_name}</h1>
            <p style={{ margin: 0, color: "#555", fontSize: 14 }}>
              {[player.position, player.secondary_position].filter(Boolean).join(" / ") || "Position unavailable"}
              {" · "}{player.nationality || "Nationality unavailable"}
              {ageOf(player.date_of_birth) != null ? ` · ${ageOf(player.date_of_birth)} years` : ""}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18 }}>
              <span style={{ border: "1px solid #ddd", padding: "6px 9px", borderRadius: 5, fontSize: 11 }}>{club?.name || latest?.club_name || "No current club"}</span>
              <span style={{ border: "1px solid #ddd", padding: "6px 9px", borderRadius: 5, fontSize: 11 }}>{latest?.league || "Competition unavailable"}</span>
              <span style={{ border: "1px solid #ddd", padding: "6px 9px", borderRadius: 5, fontSize: 11 }}>Market value {money(value?.market_value_usd ?? null)}</span>
            </div>
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 14 }}>
          {[
            ["MINUTES", latest?.minutes ?? null],
            ["G/90", latest?.goals_per90 == null ? null : latest.goals_per90.toFixed(2)],
            ["A/90", latest?.assists_per90 == null ? null : latest.assists_per90.toFixed(2)],
            ["GLOBAL PEER POOL", peer?.peer_count_global ?? null],
          ].map(([label, value]) => (
            <div key={label as string} style={cardStyle}>
              <div style={{ fontSize: 9, color: "#888", letterSpacing: "0.08em", fontWeight: 800 }}>{label}</div>
              <strong style={{ display: "block", marginTop: 5, fontSize: 22 }}>{value ?? "—"}</strong>
            </div>
          ))}
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr .8fr", gap: 14, marginTop: 14 }}>
          <section style={cardStyle}>
            <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.08em", fontWeight: 800 }}>CURRENT PERFORMANCE</div>
            <h2 style={{ margin: "5px 0 16px" }}>{latest?.season || "Latest season"} profile</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {[
                ["Goals", latest?.goals],
                ["Assists", latest?.assists],
                ["xG/90", latest?.xg_per90?.toFixed(2)],
                ["xA/90", latest?.xa_per90?.toFixed(2)],
                ["Chances/90", latest?.chances_created_per90?.toFixed(2)],
                ["Key passes/90", latest?.key_passes_per90?.toFixed(2)],
                ["Tackles/90", latest?.tackles_per90?.toFixed(2)],
                ["Interceptions/90", latest?.interceptions_per90?.toFixed(2)],
                ["Progressive carries/90", latest?.progressive_carries_per90?.toFixed(2)],
              ].map(([label, value]) => (
                <div key={label as string} style={{ borderTop: "1px solid #eee", paddingTop: 9 }}>
                  <div style={{ fontSize: 10, color: "#888" }}>{label}</div>
                  <strong>{value ?? "—"}</strong>
                </div>
              ))}
            </div>
          </section>

          <section style={cardStyle}>
            <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.08em", fontWeight: 800 }}>CONTRACT & MARKET</div>
            <h2 style={{ margin: "5px 0 16px" }}>Availability context</h2>
            <div style={{ display: "grid", gap: 12 }}>
              <div><small>Status</small><strong style={{ display: "block" }}>{contract?.status || "—"}</strong></div>
              <div><small>Annual salary</small><strong style={{ display: "block" }}>{money(contract?.annual_salary_usd ?? null)}</strong></div>
              <div><small>Contract end</small><strong style={{ display: "block" }}>{contract?.end_date || "—"}</strong></div>
              <div><small>Market value</small><strong style={{ display: "block" }}>{money(value?.market_value_usd ?? null)}</strong></div>
            </div>
          </section>
        </div>

        <section style={{ ...cardStyle, marginTop: 14 }}>
          <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.08em", fontWeight: 800 }}>GLOBAL PEER CONTEXT</div>
          <h2 style={{ margin: "5px 0 4px" }}>Performance context</h2>
          <p style={{ color: "#666", fontSize: 12, marginTop: 0 }}>Descriptive peer context for the same season and position. These percentiles are research context, not a WFM player rating.</p>
          {peer ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
              {[
                ["G/90", peer.goals_per90_global_percentile],
                ["A/90", peer.assists_per90_global_percentile],
                ["xG/90", peer.xg_per90_global_percentile],
                ["xA/90", peer.xa_per90_global_percentile],
                ["Creation", peer.chances_created_per90_global_percentile],
                ["Key passes", peer.key_passes_per90_global_percentile],
                ["Tackles", peer.tackles_per90_global_percentile],
                ["Interceptions", peer.interceptions_per90_global_percentile],
                ["Progression", peer.progressive_carries_per90_global_percentile],
              ].map(([label, value]) => (
                <div key={label as string} style={{ border: "1px solid #eee", borderRadius: 6, padding: 10 }}>
                  <small style={{ color: "#888" }}>{label}</small>
                  <strong style={{ display: "block", marginTop: 4 }}>{pct(value as number | null)}</strong>
                </div>
              ))}
            </div>
          ) : <p style={{ color: "#777" }}>Global peer context is not currently available for this player&apos;s latest season.</p>}
        </section>

        <section style={{ ...cardStyle, marginTop: 14 }}>
          <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.08em", fontWeight: 800 }}>PLAYER DETAILS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 12 }}>
            <div><small>Preferred foot</small><strong style={{ display: "block" }}>{player.preferred_foot || "—"}</strong></div>
            <div><small>Agency</small><strong style={{ display: "block" }}>{player.agency || "—"}</strong></div>
            <div><small>Age</small><strong style={{ display: "block" }}>{ageOf(player.date_of_birth) ?? "—"}</strong></div>
            <div><small>Photo credit</small><strong style={{ display: "block", fontSize: 11 }}>{player.photo_credit || player.photo_source || "—"}</strong></div>
          </div>
        </section>
      </div>
    </main>
  );
}
