"use client";

type Intelligence = {
  season: string;
  club_name: string | null;
  league: string | null;
  position: string | null;
  minutes: number | null;
  goals: number | null;
  assists: number | null;
  xg: number | null;
  xa: number | null;
  chances_created: number | null;
  key_passes: number | null;
  tackles: number | null;
  interceptions: number | null;
  progressive_carries: number | null;
};

type Peer = {
  season: string;
  league: string;
  position: string;
  peer_count: number;
  goals_per90_percentile: number | null;
  assists_per90_percentile: number | null;
  xg_per90_percentile: number | null;
  xa_per90_percentile: number | null;
  chances_created_per90_percentile: number | null;
  key_passes_per90_percentile: number | null;
  tackles_per90_percentile: number | null;
  interceptions_per90_percentile: number | null;
  progressive_carries_per90_percentile: number | null;
};

type Value = {
  valuation_date: string | null;
  market_value_usd: number | null;
  confidence: string | null;
};

type Aggregate = {
  minutes: number;
  goals: number;
  assists: number;
  xg: number;
  xa: number;
  chances: number;
  key: number;
  tackles: number;
  interceptions: number;
  carries: number;
};

const n = (v: number | null) => v ?? 0;

const money = (v: number | null) =>
  v == null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(v);

const fmt = (v: number | null) =>
  v == null ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: 2 });

const agg = (rows: Intelligence[]): Aggregate =>
  rows.reduce(
    (a, s) => ({
      minutes: a.minutes + n(s.minutes),
      goals: a.goals + n(s.goals),
      assists: a.assists + n(s.assists),
      xg: a.xg + n(s.xg),
      xa: a.xa + n(s.xa),
      chances: a.chances + n(s.chances_created),
      key: a.key + n(s.key_passes),
      tackles: a.tackles + n(s.tackles),
      interceptions: a.interceptions + n(s.interceptions),
      carries: a.carries + n(s.progressive_carries),
    }),
    {
      minutes: 0,
      goals: 0,
      assists: 0,
      xg: 0,
      xa: 0,
      chances: 0,
      key: 0,
      tackles: 0,
      interceptions: 0,
      carries: 0,
    }
  );

const p90 = (v: number, m: number) => (m ? (v * 90) / m : null);
const pct = (v: number | null) => (v == null ? "—" : `${Number(v).toFixed(0)}th`);

export default function PlayerIntelligence({
  rows,
  marketValues,
  peerRows,
}: {
  rows: Intelligence[];
  marketValues: Value[];
  peerRows: Peer[];
}) {
  const seasons = Array.from(new Set(rows.map((s) => s.season))).sort((a, b) =>
    b.localeCompare(a, undefined, { numeric: true })
  );
  const currentSeason = seasons[0] || "";
  const current = agg(rows.filter((s) => s.season === currentSeason));
  const previous = agg(rows.filter((s) => s.season === seasons[1]));
  const change = (a: number, b: number) => (b ? ((a - b) / b) * 100 : null);
  const seasonRows = seasons
    .slice(0, 6)
    .reverse()
    .map((season) => ({ season, ...agg(rows.filter((s) => s.season === season)) }));
  const max = Math.max(1, ...seasonRows.map((r) => r.goals + r.assists));
  const values = [...marketValues]
    .filter((v) => v.market_value_usd != null)
    .slice(0, 8)
    .reverse();
  const valueMax = Math.max(1, ...values.map((v) => v.market_value_usd as number));
  const peer = peerRows.find((p) => p.season === currentSeason) || peerRows[0] || null;

  const metrics: [string, number, number | null][] = [
    ["Minutes", current.minutes, change(current.minutes, previous.minutes)],
    ["Goals", current.goals, change(current.goals, previous.goals)],
    ["Assists", current.assists, change(current.assists, previous.assists)],
    ["xG", current.xg, change(current.xg, previous.xg)],
    ["xA", current.xa, change(current.xa, previous.xa)],
    ["Chances", current.chances, change(current.chances, previous.chances)],
  ];

  const role: [string, number | null][] = [
    ["Goals / 90", p90(current.goals, current.minutes)],
    ["Assists / 90", p90(current.assists, current.minutes)],
    ["xG / 90", p90(current.xg, current.minutes)],
    ["xA / 90", p90(current.xa, current.minutes)],
    ["Key Passes / 90", p90(current.key, current.minutes)],
    ["Chances / 90", p90(current.chances, current.minutes)],
    ["Tackles / 90", p90(current.tackles, current.minutes)],
    ["Interceptions / 90", p90(current.interceptions, current.minutes)],
    ["Progressive Carries / 90", p90(current.carries, current.minutes)],
  ];

  const peerMetrics: [string, number | null][] = peer
    ? [
        ["Goals / 90", peer.goals_per90_percentile],
        ["Assists / 90", peer.assists_per90_percentile],
        ["xG / 90", peer.xg_per90_percentile],
        ["xA / 90", peer.xa_per90_percentile],
        ["Chances / 90", peer.chances_created_per90_percentile],
        ["Key Passes / 90", peer.key_passes_per90_percentile],
        ["Tackles / 90", peer.tackles_per90_percentile],
        ["Interceptions / 90", peer.interceptions_per90_percentile],
        ["Progressive Carries / 90", peer.progressive_carries_per90_percentile],
      ]
    : [];

  return (
    <section className="player-intelligence">
      <div className="intelligence-header">
        <div>
          <h2>Performance Intelligence</h2>
          <p>Season trends, role output, league context and recorded market-value movement.</p>
        </div>
        <a href="/compare">Compare players →</a>
      </div>

      {!rows.length ? (
        <div className="intelligence-empty">
          Performance intelligence will appear as statistics are added.
        </div>
      ) : (
        <>
          <div className="intelligence-stat-grid">
            {metrics.map(([label, value, delta]) => (
              <div className="intelligence-stat" key={label}>
                <span>{label}</span>
                <strong>{fmt(value)}</strong>
                {delta != null && (
                  <small className={delta >= 0 ? "trend-up" : "trend-down"}>
                    {delta >= 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(0)}% vs {seasons[1]}
                  </small>
                )}
              </div>
            ))}
          </div>

          <div className="intelligence-panels">
            <div className="intelligence-panel">
              <b>Season Output</b>
              <small>Goals + assists · aggregated across recorded competitions</small>
              {seasonRows.map((r) => (
                <div className="intelligence-bar" key={r.season}>
                  <span>{r.season}</span>
                  <i>
                    <em style={{ width: `${Math.max(4, ((r.goals + r.assists) / max) * 100)}%` }} />
                  </i>
                  <strong>{r.goals + r.assists}</strong>
                </div>
              ))}
            </div>

            <div className="intelligence-panel">
              <b>Role Metrics · per 90</b>
              <small>{currentSeason} · normalized by recorded minutes</small>
              <div className="role-grid">
                {role.map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{fmt(value)}</strong>
                  </div>
                ))}
              </div>
              <p>Descriptive production measures, not player ratings.</p>
            </div>

            <div className="intelligence-panel">
              <b>League & Position Context</b>
              <small>
                {currentSeason} · {rows.find((r) => r.season === currentSeason)?.league || "League unknown"} · {rows.find((r) => r.season === currentSeason)?.position || "Position unknown"}
              </small>
              {peer ? (
                <>
                  <div className="peer-context">
                    <strong>{peer.peer_count}</strong>
                    <span>eligible peers with ≥450 recorded minutes</span>
                  </div>
                  <div className="peer-grid">
                    {peerMetrics.map(([label, value]) => (
                      <div key={label}>
                        <span>{label}</span>
                        <strong>{pct(value)}</strong>
                      </div>
                    ))}
                  </div>
                  <p>
                    Percentiles compare this record with players in the same season, league and position. No benchmark is shown when the peer group has fewer than 5 eligible players.
                  </p>
                </>
              ) : (
                <p className="intelligence-note">
                  Peer benchmarking is withheld because the recorded same-season league/position sample is too small or lacks sufficient minutes.
                </p>
              )}
            </div>

            <div className="intelligence-panel market-history-panel">
              <b>Market Value History</b>
              <small>Recorded valuations · newest to oldest</small>
              {values.length ? (
                <div className="market-history-chart">
                  {values.map((v, i) => (
                    <div className="market-point" key={v.valuation_date || i}>
                      <span>{v.valuation_date || "—"}</span>
                      <i>
                        <em style={{ width: `${Math.max(5, ((v.market_value_usd as number) / valueMax) * 100)}%` }} />
                      </i>
                      <strong>{money(v.market_value_usd)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="intelligence-note">No market-value history recorded.</p>
              )}
              <small>Values shown are historical records, not forecasts.</small>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
