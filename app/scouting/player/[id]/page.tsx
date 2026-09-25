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

export default async function ScoutingReportPage({ params, searchParams }: PageProps) {
  const { returnTo } = await searchParams;
  const workspaceHref = returnTo && returnTo.startsWith("/scouting/profiles/") ? returnTo : "/scouting";
  const profileId = workspaceHref.startsWith("/scouting/profiles/") ? workspaceHref.split("/")[3] || null : null;
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

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id || null;

  const [{ data: intelligence }, { data: contracts }, { data: values }, { data: peers }, { data: memberships }, { data: notes }, { data: pipelines }, { data: scoutingProfile }, { data: sourceStats }] = await Promise.all([
    supabase.from("player_season_intelligence").select("season,club_name,league,position,minutes,goals,assists,goals_per90,assists_per90,xg_per90,xa_per90,chances_created_per90,key_passes_per90,tackles_per90,interceptions_per90,progressive_carries_per90,duels_won_per90").eq("player_id", id).order("season", { ascending: false }),
    supabase.from("contracts").select("status,start_date,end_date,annual_salary_usd,weekly_salary_usd,club:clubs(name),source:sources(id,publisher,reliability,published_at,url)").eq("player_id", id).order("start_date", { ascending: false }),
    supabase.from("market_values").select("market_value_usd,valuation_date,source:sources(id,publisher,reliability,published_at,url)").eq("player_id", id).order("valuation_date", { ascending: false }).limit(1),
    supabase.from("player_global_peer_benchmarks").select("season,league,position,peer_count_global,goals_per90_global_percentile,assists_per90_global_percentile,xg_per90_global_percentile,xa_per90_global_percentile,chances_created_per90_global_percentile,key_passes_per90_global_percentile,tackles_per90_global_percentile,interceptions_per90_global_percentile,progressive_carries_per90_global_percentile").eq("player_id", id).order("season", { ascending: false }),
    userId ? supabase.from("scouting_list_players").select("id,list_id,note,scouting_lists(id,name,status)").eq("player_id", id) : Promise.resolve({ data: [], error: null } as any),
    userId ? supabase.from("scouting_notes").select("id,note_type,content,created_at,list_id").eq("player_id", id).eq("user_id", userId).order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null } as any),
    userId ? supabase.from("scouting_pipeline").select("id,list_player_id,stage,priority,fit_status,next_action,target_date,evaluation").eq("user_id", userId) : Promise.resolve({ data: [], error: null } as any),
    profileId && userId ? supabase.from("scouting_profiles").select("id,name,description,criteria").eq("id", profileId).eq("user_id", userId).single() : Promise.resolve({ data: null, error: null } as any),
    supabase.from("player_stats").select("season,confidence,source_id,source:sources(id,publisher,reliability,published_at,url)").eq("player_id", id),
  ]);

  const latest = intelligence?.[0] || null;
  const contract = (contracts || []).find((c: any) => c.status?.toLowerCase() === "active") || contracts?.[0] || null;
  const value = values?.[0] || null;
  const peer = (peers || []).find((p: any) => p.season === latest?.season) || null;
  const club = Array.isArray(contract?.club) ? contract.club[0] : contract?.club;
  const photo = player.photo_url as string | null;
  const listRows = (memberships || []) as any[];
  const listNames = listRows.map(row => Array.isArray(row.scouting_lists) ? row.scouting_lists[0] : row.scouting_lists).filter(Boolean);
  const pipelineMap: Record<string, any> = {};
  (pipelines || []).forEach((row: any) => { pipelineMap[row.list_player_id] = row; });
  const playerPipelines = listRows.map(row => pipelineMap[row.id]).filter(Boolean);
  const primaryPipeline = playerPipelines[0] || null;
  const latestNotes = ((notes || []) as any[]).slice(0, 5);
  const statsEvidence = (sourceStats || []) as any[];
  const distinctStatSeasons = new Set(statsEvidence.map(row => row.season).filter(Boolean)).size;
  const sourcedStatRows = statsEvidence.filter(row => row.source_id).length;
  const verifiedStatRows = statsEvidence.filter(row => String(row.confidence || "").toLowerCase() === "verified").length;
  const statSources = Array.from(new Map(statsEvidence.map(row => [row.source_id, row.source]).filter(([sourceId, source]) => sourceId && source)).values()) as any[];
  const contractSource = contract?.source || null;
  const valueSource = value?.source || null;
  const evidenceItems = [["Player identity", Boolean(player.full_name && player.date_of_birth && player.nationality), player.date_of_birth && player.nationality ? "Core identity fields present" : "Identity fields need review"],["Performance data", statsEvidence.length > 0, statsEvidence.length ? `${statsEvidence.length} source rows · ${distinctStatSeasons} season${distinctStatSeasons === 1 ? "" : "s"}` : "No player-stat source rows"],["Stat sources", sourcedStatRows > 0, sourcedStatRows ? `${sourcedStatRows} stat row${sourcedStatRows === 1 ? "" : "s"} linked to a source` : "No linked stat source records"],["Verified stat rows", verifiedStatRows > 0, verifiedStatRows ? `${verifiedStatRows} stat row${verifiedStatRows === 1 ? "" : "s"} marked verified` : "No stat rows marked verified"],["Contract", Boolean(contract), contract ? (contract.confidence ? `Confidence: ${contract.confidence}` : "Contract record present") : "No contract record"],["Market value", Boolean(value), value ? (value.confidence ? `Confidence: ${value.confidence}` : "Market-value record present") : "No market-value record"],["Photo rights metadata", Boolean(player.photo_source || player.photo_credit || player.photo_license), player.photo_license || player.photo_credit || player.photo_source || "Photo metadata unavailable"]];
  const evidencePresent = evidenceItems.filter(item => item[1]).length;
  const evidencePercent = Math.round((evidencePresent / evidenceItems.length) * 100);
  const profileCriteria = (scoutingProfile?.criteria && typeof scoutingProfile.criteria === "object") ? scoutingProfile.criteria : null;
  const profileCriteriaRows = profileCriteria ? [
    ["Position", Array.isArray(profileCriteria.positions) && profileCriteria.positions.length ? profileCriteria.positions.join(", ") : null],
    ["Age", profileCriteria.age_min != null || profileCriteria.age_max != null ? `${profileCriteria.age_min ?? "Any"}–${profileCriteria.age_max ?? "Any"}` : null],
    ["Minimum minutes", profileCriteria.min_minutes != null ? String(profileCriteria.min_minutes) : null],
    ["Global percentile", profileCriteria.global_percentile_min != null ? `${profileCriteria.global_percentile_min}th minimum` : null],
    ["Salary range", profileCriteria.salary_min_usd != null || profileCriteria.salary_max_usd != null ? `${money(profileCriteria.salary_min_usd ?? null)}–${money(profileCriteria.salary_max_usd ?? null)}` : null],
    ["Market value", profileCriteria.market_value_min_usd != null || profileCriteria.market_value_max_usd != null ? `${money(profileCriteria.market_value_min_usd ?? null)}–${money(profileCriteria.market_value_max_usd ?? null)}` : null],
    ["Contract status", profileCriteria.contract_status && profileCriteria.contract_status !== "any" ? String(profileCriteria.contract_status).replace(/_/g, " ") : null],
  ].filter(([, value]) => value != null) : [];

  const availabilityLabel = contract?.status?.toLowerCase() === "active"
    ? contract?.end_date
      ? `Contracted through ${contract.end_date}`
      : "Currently contracted"
    : "No active contract recorded";
  const latestGoals = latest?.goals_per90;
  const latestAssists = latest?.assists_per90;
  const latestCreation = latest?.chances_created_per90;
  const peerSignals = peer ? [
    ["G/90", peer.goals_per90_global_percentile],
    ["A/90", peer.assists_per90_global_percentile],
    ["Creation", peer.chances_created_per90_global_percentile],
    ["Key passes", peer.key_passes_per90_global_percentile],
    ["Progression", peer.progressive_carries_per90_global_percentile],
  ].filter(([, v]) => v != null) : [];
  const strongestPeerSignal = peerSignals.length ? peerSignals.reduce((best: any[], current: any[]) => Number(current[1]) > Number(best[1]) ? current : best) : null;

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

        {scoutingProfile && profileCriteriaRows.length ? (
          <section style={{ ...cardStyle, marginTop: 14 }}>
            <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.08em", fontWeight: 800 }}>SCOUTING PROFILE CONTEXT</div>
            <h2 style={{ margin: "5px 0 4px" }}>{scoutingProfile.name}</h2>
            <p style={{ color: "#666", fontSize: 12, marginTop: 0 }}>This player reached the report through this saved recruitment profile. The criteria below are shown as search context and are not a subjective player rating.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 12 }}>
              {profileCriteriaRows.map(([label, value]) => <div key={label as string} style={{ border: "1px solid #eee", borderRadius: 6, padding: 10 }}><small style={{ color: "#888" }}>{label}</small><strong style={{ display: "block", marginTop: 4, textTransform: "capitalize" }}>{String(value)}</strong></div>)}
            </div>
          </section>
        ) : null}

          <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.08em", fontWeight: 800 }}>DATA EVIDENCE</div>
          <h2 style={{ margin: "5px 0 4px" }}>Evidence &amp; data quality</h2>
          <p style={{ color: "#666", fontSize: 12, marginTop: 0 }}>A transparent view of the WFM records supporting this report. Presence of data does not by itself establish that every underlying source is current or independently verified.</p>
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 14, alignItems: "start", marginTop: 12 }}>
            <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 14 }}>
              <small style={{ color: "#888", letterSpacing: "0.06em" }}>EVIDENCE COVERAGE</small>
              <strong style={{ display: "block", fontSize: 30, marginTop: 5 }}>{evidencePercent}%</strong>
              <span style={{ color: "#777", fontSize: 11 }}>{evidencePresent} of {evidenceItems.length} evidence areas have data</span>
            </div>
            <div style={{ display: "grid", gap: 7 }}>
              {evidenceItems.map(([label, present, detail]) => <div key={label as string} style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 8, borderBottom: "1px solid #eee", paddingBottom: 7 }}>
                <strong style={{ fontSize: 11 }}>{present ? "✓" : "—"} {label}</strong>
                <span style={{ fontSize: 11, color: "#666" }}>{String(detail)}</span>
              </div>)}
            </div>
          </div>
        </section>

        <section style={{ ...cardStyle, marginTop: 14 }}>
          <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.08em", fontWeight: 800 }}>SOURCE TRACEABILITY</div>
          <h2 style={{ margin: "5px 0 4px" }}>Underlying sources</h2>
          <p style={{ color: "#666", fontSize: 12, marginTop: 0 }}>Where WFM has a linked source record, the report exposes the publisher and reliability metadata used to support the underlying data.</p>
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {[
              ["Performance", statSources[0] || null],
              ["Contract", contractSource],
              ["Market value", valueSource],
            ].map(([label, source]) => (
              <div key={label as string} style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", borderBottom: "1px solid #eee", padding: "8px 0" }}>
                <strong style={{ fontSize: 11 }}>{label}</strong>
                {source ? (
                  <div style={{ fontSize: 11 }}>
                    <strong>{source.publisher || "Publisher unavailable"}</strong>
                    <span style={{ color: "#777", marginLeft: 8 }}>{source.reliability ? "Reliability: " + source.reliability : "Reliability not recorded"}</span>
                    {source.published_at ? <span style={{ color: "#777", marginLeft: 8 }}>Published: {source.published_at}</span> : null}
                    {source.url ? <a href={source.url} target="_blank" rel="noreferrer" style={{ marginLeft: 8 }}>View source</a> : null}
                  </div>
                ) : <span style={{ color: "#888", fontSize: 11 }}>No linked source record</span>}
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...cardStyle, marginTop: 14 }}>
          <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.08em", fontWeight: 800 }}>RECRUITMENT INTELLIGENCE</div>
          <h2 style={{ margin: "5px 0 4px" }}>Decision context</h2>
          <p style={{ color: "#666", fontSize: 12, marginTop: 0 }}>A factual summary of the available WFM data to support recruitment review. It does not assign an overall player rating.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 12 }}>
            <div style={{ border: "1px solid #eee", borderRadius: 6, padding: 11 }}>
              <small style={{ color: "#888" }}>AVAILABILITY</small>
              <strong style={{ display: "block", marginTop: 4 }}>{availabilityLabel}</strong>
            </div>
            <div style={{ border: "1px solid #eee", borderRadius: 6, padding: 11 }}>
              <small style={{ color: "#888" }}>CURRENT OUTPUT</small>
              <strong style={{ display: "block", marginTop: 4 }}>{latestGoals == null ? "G/90 unavailable" : `G/90 ${latestGoals.toFixed(2)}`} · {latestAssists == null ? "A/90 unavailable" : `A/90 ${latestAssists.toFixed(2)}`}</strong>
            </div>
            <div style={{ border: "1px solid #eee", borderRadius: 6, padding: 11 }}>
              <small style={{ color: "#888" }}>PEER SIGNAL</small>
              <strong style={{ display: "block", marginTop: 4 }}>{strongestPeerSignal ? `${strongestPeerSignal[0]} · ${pct(strongestPeerSignal[1] as number)} percentile` : "Peer percentile unavailable"}</strong>
            </div>
          </div>
          <div style={{ marginTop: 10, borderTop: "1px solid #eee", paddingTop: 10, fontSize: 12, color: "#555" }}>
            <strong style={{ color: "#222" }}>Data points to review:</strong>{" "}
            {latest?.minutes != null ? `${latest.minutes} minutes in ${latest.season || "latest season"}` : "Latest-season minutes unavailable"}{" · "}
            {latestCreation == null ? "chance-creation data unavailable" : `chance creation ${latestCreation.toFixed(2)}/90`}{" · "}
            {value?.market_value_usd != null ? `market value ${money(value.market_value_usd)}` : "market value unavailable"}.
          </div>
        </section>

        <section style={{ ...cardStyle, marginTop: 14 }}>
          <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.08em", fontWeight: 800 }}>PERFORMANCE HISTORY</div>
          <h2 style={{ margin: "5px 0 4px" }}>Season trajectory</h2>
          <p style={{ color: "#666", fontSize: 12, marginTop: 0 }}>Historical league and club performance from WFM season intelligence. Blank metrics indicate unavailable source data rather than zero production.</p>
          {intelligence?.length ? (
            <div style={{ overflowX: "auto", marginTop: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720, fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>
                    {["Season","Club / League","Min","G/90","A/90","xG/90","xA/90","Chances/90"].map(label => (
                      <th key={label} style={{ padding: "9px 8px", fontSize: 9, color: "#888", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(intelligence || []).map((season: any) => (
                    <tr key={`${season.season}-${season.club_name || ""}-${season.league || ""}`} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "10px 8px", fontWeight: 800, whiteSpace: "nowrap" }}>{season.season || "—"}</td>
                      <td style={{ padding: "10px 8px", minWidth: 190 }}>
                        <strong style={{ display: "block" }}>{season.club_name || "Club unavailable"}</strong>
                        <small style={{ color: "#777" }}>{season.league || "Competition unavailable"}</small>
                      </td>
                      <td style={{ padding: "10px 8px" }}>{season.minutes ?? "—"}</td>
                      <td style={{ padding: "10px 8px" }}>{season.goals_per90 == null ? "—" : season.goals_per90.toFixed(2)}</td>
                      <td style={{ padding: "10px 8px" }}>{season.assists_per90 == null ? "—" : season.assists_per90.toFixed(2)}</td>
                      <td style={{ padding: "10px 8px" }}>{season.xg_per90 == null ? "—" : season.xg_per90.toFixed(2)}</td>
                      <td style={{ padding: "10px 8px" }}>{season.xa_per90 == null ? "—" : season.xa_per90.toFixed(2)}</td>
                      <td style={{ padding: "10px 8px" }}>{season.chances_created_per90 == null ? "—" : season.chances_created_per90.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p style={{ color: "#777", fontSize: 12 }}>No season history is currently available for this player.</p>}
        </section>

        <section style={{ ...cardStyle, marginTop: 14 }}>
          <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.08em", fontWeight: 800 }}>SCOUTING WORKFLOW</div>
          <h2 style={{ margin: "5px 0 4px" }}>Recruitment context</h2>
          <p style={{ color: "#666", fontSize: 12, marginTop: 0 }}>Persistent list membership, pipeline status and private scouting context for your WFM account.</p>
          {!userId ? (
            <p style={{ color: "#777", fontSize: 12 }}>Sign in to view private scouting workflow information for this player.</p>
          ) : listRows.length ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {listNames.map((list: any) => <span key={list.id} style={{ border: "1px solid #ddd", borderRadius: 5, padding: "6px 9px", fontSize: 11 }}>{list.name}{list.status === "archived" ? " · Archived" : ""}</span>)}
              </div>
              {primaryPipeline ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                  {[["Stage", primaryPipeline.stage],["Priority", primaryPipeline.priority],["Fit", primaryPipeline.fit_status],["Target", primaryPipeline.target_date || "—"]].map(([label, value]) => <div key={label as string} style={{ border: "1px solid #eee", borderRadius: 6, padding: 10 }}><small style={{ color: "#888" }}>{label}</small><strong style={{ display: "block", marginTop: 4, textTransform: "capitalize" }}>{String(value).replace(/_/g, " ")}</strong></div>)}
                </div>
              ) : <p style={{ color: "#777", fontSize: 12 }}>This player is on a scouting list but has no pipeline assessment yet.</p>}
              {primaryPipeline?.next_action && <div style={{ borderTop: "1px solid #eee", paddingTop: 10 }}><small style={{ color: "#888" }}>Next recruitment action</small><strong style={{ display: "block", marginTop: 4 }}>{primaryPipeline.next_action}</strong></div>}
              {primaryPipeline?.evaluation && <div><small style={{ color: "#888" }}>Recruitment evaluation</small><p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap", fontSize: 12 }}>{primaryPipeline.evaluation}</p></div>}
            </div>
          ) : <p style={{ color: "#777", fontSize: 12 }}>This player is not currently on one of your scouting lists.</p>}
        </section>

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
          <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.08em", fontWeight: 800 }}>SCOUTING NOTES</div>
          <h2 style={{ margin: "5px 0 12px" }}>Recent private notes</h2>
          {userId && latestNotes.length ? <div style={{ display: "grid", gap: 8 }}>{latestNotes.map((note: any) => <div key={note.id} style={{ borderTop: "1px solid #eee", paddingTop: 9 }}><small style={{ color: "#888", textTransform: "capitalize" }}>{String(note.note_type).replace(/_/g, " ")}</small><p style={{ margin: "4px 0 0", fontSize: 12, whiteSpace: "pre-wrap" }}>{note.content}</p></div>)}</div> : <p style={{ color: "#777", fontSize: 12 }}>{userId ? "No private scouting notes have been added yet." : "Sign in to view private scouting notes."}</p>}
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
