import Link from "next/link";
import { supabase } from "../../lib/supabase";
import PositionMap from "../../components/PositionMap";
import PlayerStatistics from "./PlayerStatistics";
import PlayerIntelligence from "./PlayerIntelligence";

type PlayerPageProps = { params: Promise<{ id: string }> };

type Club = {
  id: string;
  name: string;
  league: string | null;
  country: string | null;
  logo_url: string | null;
};

type Contract = {
  id: string;
  status: string | null;
  confidence: string | null;
  start_date: string | null;
  end_date: string | null;
  annual_salary: number | null;
  weekly_salary: number | null;
  annual_salary_usd: number | null;
  weekly_salary_usd: number | null;
  currency: string | null;
  notes: string | null;
  club_id: string | null;
};

type Transfer = {
  id: string;
  transfer_date: string | null;
  transfer_type: string | null;
  fee: number | null;
  currency: string | null;
  confidence: string | null;
  from_club: Club | null;
  to_club: Club | null;
};

type MarketValue = {
  id: string;
  valuation_date: string | null;
  market_value: number | null;
  currency: string | null;
  market_value_usd: number | null;
  confidence: string | null;
  notes: string | null;
};

type PlayerStat = {
  id: string;
  club_id: string | null;
  season: string;
  competition: string;
  appearances: number | null;
  starts: number | null;
  minutes: number | null;
  goals: number | null;
  assists: number | null;
  yellow_cards: number | null;
  red_cards: number | null;
  shots: number | null;
  shots_on_target: number | null;
  key_passes: number | null;
  chances_created: number | null;
  crosses: number | null;
  tackles: number | null;
  tackles_won: number | null;
  interceptions: number | null;
  clearances: number | null;
  blocks: number | null;
  recoveries: number | null;
  dispossessions: number | null;
  dribbles_attempted: number | null;
  dribbles_completed: number | null;
  fouls_committed: number | null;
  fouls_drawn: number | null;
  offsides: number | null;
  passes_attempted: number | null;
  passes_completed: number | null;
  progressive_passes: number | null;
  progressive_carries: number | null;
  duels_won: number | null;
  duels_lost: number | null;
  aerials_won: number | null;
  aerials_lost: number | null;
  xg: number | null;
  xa: number | null;
  sca: number | null;
  gca: number | null;
  saves: number | null;
  shots_on_target_faced: number | null;
  goals_against: number | null;
  clean_sheets: number | null;
  penalty_kicks_saved: number | null;
  penalty_kicks_faced: number | null;
  own_goals: number | null;
  confidence: string | null;
  notes: string | null;
};

const flagCode = (nationality: string | null) => {
  const key = nationality?.trim().toUpperCase();
  if (!key) return null;
  const map: Record<string, string> = {
    USA: "us", "UNITED STATES": "us", US: "us", CAN: "ca", CANADA: "ca",
    MEX: "mx", MEXICO: "mx", ENG: "gb-eng", ENGLAND: "gb-eng", FRA: "fr", FRANCE: "fr",
    ESP: "es", SPAIN: "es", GER: "de", GERMANY: "de", BRA: "br", BRAZIL: "br",
    COL: "co", COLOMBIA: "co", ARG: "ar", ARGENTINA: "ar", CHI: "cl", CHILE: "cl",
    ITA: "it", ITALY: "it", NED: "nl", NETHERLANDS: "nl", POR: "pt", PORTUGAL: "pt",
    SWE: "se", SWEDEN: "se", NOR: "no", NORWAY: "no", DEN: "dk", DENMARK: "dk",
    JPN: "jp", JAPAN: "jp", KOR: "kr", "SOUTH KOREA": "kr", AUS: "au", AUSTRALIA: "au",
    NZL: "nz", "NEW ZEALAND": "nz", NIG: "ng", NIGERIA: "ng", GHA: "gh", GHANA: "gh",
    RSA: "za", "SOUTH AFRICA": "za", IRL: "ie", IRELAND: "ie", SUI: "ch", SWITZERLAND: "ch",
    AUT: "at", AUSTRIA: "at", BEL: "be", BELGIUM: "be", POL: "pl", POLAND: "pl",
    UKR: "ua", UKRAINE: "ua", CZE: "cz", "CZECH REPUBLIC": "cz", JAM: "jm", JAMAICA: "jm",
    CRC: "cr", "COSTA RICA": "cr", PAN: "pa", PANAMA: "pa", PUR: "pr", "PUERTO RICO": "pr",
    PAR: "py", PARAGUAY: "py", URU: "uy", URUGUAY: "uy", ECU: "ec", ECUADOR: "ec",
    PER: "pe", PERU: "pe", VEN: "ve", VENEZUELA: "ve", ZAM: "zm", ZAMBIA: "zm", MWI: "mw", MALAWI: "mw",
  };
  return map[key] || null;
};

const dateText = (value: string | null) => value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const usd = (value: number | null) => value == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const original = (value: number | null, currency: string | null) => value == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(value);
const titleCase = (value: string | null) => value ? value.charAt(0).toUpperCase() + value.slice(1) : "Unknown";
const ageOf = (dob: string | null) => {
  if (!dob) return null;
  const birth = new Date(`${dob}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
};

const card = { background: "#fff", border: "1px solid #ddd", borderRadius: 12, padding: 22 };
const label = { fontSize: 10, color: "#888", textTransform: "uppercase" as const, letterSpacing: "0.06em" };

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { id } = await params;
  const { data: player, error } = await supabase.from("players").select("*").eq("id", id).single();

  if (error || !player) {
    return <main className="player-page" style={{ minHeight: "100vh", background: "#f5f4ef", padding: "80px 20px" }}><div style={{ maxWidth: 1200, margin: "0 auto" }}><h1>Player not found</h1><Link href="/players">Back to players</Link></div></main>;
  }

  const [{ data: contractData }, { data: statsData }, { data: transferData }, { data: valueData }] = await Promise.all([
    supabase.from("contracts").select("id,status,confidence,start_date,end_date,annual_salary,weekly_salary,annual_salary_usd,weekly_salary_usd,currency,notes,club_id").eq("player_id", id).order("start_date", { ascending: false }),
    supabase.from("player_stats").select("id,club_id,season,competition,appearances,starts,minutes,goals,assists,yellow_cards,red_cards,shots,shots_on_target,key_passes,chances_created,crosses,tackles,tackles_won,interceptions,clearances,blocks,recoveries,dispossessions,dribbles_attempted,dribbles_completed,fouls_committed,fouls_drawn,offsides,passes_attempted,passes_completed,progressive_passes,progressive_carries,duels_won,duels_lost,aerials_won,aerials_lost,xg,xa,sca,gca,saves,shots_on_target_faced,goals_against,clean_sheets,penalty_kicks_saved,penalty_kicks_faced,own_goals,confidence,notes").eq("player_id", id).order("season", { ascending: false }).order("competition", { ascending: true }),
    supabase.from("transfers").select("id,transfer_date,transfer_type,fee,currency,confidence,from_club:clubs!transfers_from_club_id_fkey(id,name,league,country,logo_url),to_club:clubs!transfers_to_club_id_fkey(id,name,league,country,logo_url)").eq("player_id", id).order("transfer_date", { ascending: false }),
    supabase.from("market_values").select("id,valuation_date,market_value,currency,market_value_usd,confidence,notes").eq("player_id", id).order("valuation_date", { ascending: false }),
  ]);

  const contracts = (contractData || []) as Contract[];
  const stats = (statsData || []) as PlayerStat[];
  const marketValues = (valueData || []) as MarketValue[];
  const transfers: Transfer[] = (transferData || []).map((item: any) => ({ ...item, from_club: Array.isArray(item.from_club) ? item.from_club[0] || null : item.from_club || null, to_club: Array.isArray(item.to_club) ? item.to_club[0] || null : item.to_club || null }));

  const clubIds = Array.from(new Set(contracts.map(c => c.club_id).concat(stats.map(s => s.club_id)).filter((v): v is string => Boolean(v))));
  const { data: clubData } = clubIds.length ? await supabase.from("clubs").select("id,name,league,country,logo_url").in("id", clubIds) : { data: [] };
  const clubs = (clubData || []) as Club[];
  const clubMap = new Map(clubs.map(c => [c.id, c]));

  const currentContract = contracts.find(c => c.status?.toLowerCase() === "active") || contracts[0] || null;
  const currentClub = currentContract?.club_id ? clubMap.get(currentContract.club_id) || null : null;
  const currentValue = marketValues[0] || null;
  const age = ageOf(player.date_of_birth);
  const code = flagCode(player.nationality);
  const contractHistory = contracts.filter(c => c.id !== currentContract?.id);
  const latestTransfer = transfers[0] || null;

  return (
    <main className="player-page" style={{ minHeight: "100vh", background: "#f5f4ef", color: "#111" }}>
      <section className="player-hero" style={{ background: "#111", color: "#fff", padding: "34px 20px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Link href="/players" style={{ color: "#aaa", textDecoration: "none", fontSize: 12 }}>← Players</Link>
          <div className="player-hero-grid" style={{ display: "grid", gridTemplateColumns: "140px minmax(0,1fr) auto", gap: 26, alignItems: "center", marginTop: 22 }}>
            <div style={{ width: 140, height: 140, borderRadius: 12, overflow: "hidden", background: "#222", border: "1px solid #333" }}>
              <img src={player.photo_url || "/wfm-player-placeholder.svg"} alt={player.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, fontSize: "clamp(28px,5vw,48px)", lineHeight: 1 }}>{player.full_name}</h1>
                {code && <img src={`https://flagcdn.com/w40/${code}.png`} alt={player.nationality || "Nationality"} width={28} height={19} style={{ objectFit: "cover", borderRadius: 2 }} />}
              </div>
              <div style={{ marginTop: 13, color: "#bbb", fontSize: 15 }}>{player.nationality || "Nationality unknown"} · {player.position || "Position unknown"}{player.secondary_position ? ` / ${player.secondary_position}` : ""}{age !== null ? ` · ${age}` : ""}</div>
              {currentClub && <Link href={`/clubs/${currentClub.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 15, color: "#fff", textDecoration: "none", fontWeight: 700 }}><img src={currentClub.logo_url || "/wfm-club-placeholder.svg"} alt="" width={26} height={26} style={{ objectFit: "contain" }} />{currentClub.name}</Link>}
            </div>
            <div className="player-hero-value" style={{ minWidth: 190, textAlign: "right" }}>
              <div style={{ ...label, color: "#888" }}>Current Market Value</div>
              <div style={{ fontSize: 30, fontWeight: 800, marginTop: 5 }}>{currentValue?.market_value_usd != null ? usd(currentValue.market_value_usd) : "—"}</div>
              {currentValue && <div style={{ marginTop: 5, color: "#999", fontSize: 11 }}>{dateText(currentValue.valuation_date)} · {titleCase(currentValue.confidence)}</div>}
            </div>
          </div>
        </div>
      </section>

      <div className="player-content" style={{ maxWidth: 1200, margin: "0 auto", padding: "22px 20px 60px" }}>
        <div className="player-overview-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12 }}>
          <div style={card}><div style={label}>Club</div><div style={{ marginTop: 7, fontWeight: 750 }}>{currentClub?.name || "—"}</div><div style={{ color: "#888", fontSize: 12, marginTop: 3 }}>{currentClub?.league || ""}</div></div>
          <div style={card}><div style={label}>Contract Expiry</div><div style={{ marginTop: 7, fontWeight: 750 }}>{currentContract?.end_date ? dateText(currentContract.end_date) : "Unknown"}</div><div style={{ color: "#888", fontSize: 12, marginTop: 3 }}>{titleCase(currentContract?.confidence || null)} confidence</div></div>
          <div style={card}><div style={label}>Annual Salary</div><div style={{ marginTop: 7, fontWeight: 750 }}>{usd(currentContract?.annual_salary_usd ?? null)}</div><div style={{ color: "#888", fontSize: 12, marginTop: 3 }}>{currentContract ? original(currentContract.annual_salary, currentContract.currency) : "No record"}</div></div>
          <div style={card}><div style={label}>Agency</div><div style={{ marginTop: 7, fontWeight: 750 }}>{player.agency || "Not reported"}</div><div style={{ color: "#888", fontSize: 12, marginTop: 3 }}>{player.preferred_foot ? `${player.preferred_foot} foot` : ""}</div></div>
        </div>

        <div className="player-main-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(280px,1fr)", gap: 16, marginTop: 16 }}>
          <section style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div><h2 style={{ margin: 0, fontSize: 19 }}>Player Intelligence</h2><p style={{ margin: "4px 0 0", color: "#888", fontSize: 12 }}>The central record connecting performance, contracts, market value and movement.</p></div>
              <div style={{ fontSize: 11, color: "#888" }}>{stats.length} club stat record{stats.length === 1 ? "" : "s"} · {transfers.length} transfer{transfers.length === 1 ? "" : "s"}</div>
            </div>
            <div style={{ marginTop: 20 }}><div style={label}>Position Map</div><div style={{ marginTop: 8 }}><PositionMap primaryPosition={player.position} secondaryPosition={player.secondary_position} /></div></div>
            <div className="player-links-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10, marginTop: 20 }}>
              <a href="#contract" style={{ textDecoration: "none", color: "#111", border: "1px solid #ddd", borderRadius: 9, padding: 13, background: "#fafafa" }}><div style={label}>Contracts</div><strong>{contracts.length}</strong> record{contracts.length === 1 ? "" : "s"}</a>
              <a href="#market-value" style={{ textDecoration: "none", color: "#111", border: "1px solid #ddd", borderRadius: 9, padding: 13, background: "#fafafa" }}><div style={label}>Market Value</div><strong>{marketValues.length}</strong> valuation{marketValues.length === 1 ? "" : "s"}</a>
              <a href="#transfers" style={{ textDecoration: "none", color: "#111", border: "1px solid #ddd", borderRadius: 9, padding: 13, background: "#fafafa" }}><div style={label}>Transfers</div><strong>{transfers.length}</strong> movement{transfers.length === 1 ? "" : "s"}</a>
            </div>
          </section>

          <aside style={card}>
            <h2 style={{ margin: 0, fontSize: 19 }}>Data Coverage</h2>
            <p style={{ margin: "5px 0 18px", color: "#888", fontSize: 12 }}>What WFM currently knows about this player.</p>
            {["Player identity", player.photo_url ? "Player photo" : "Player photo placeholder", currentClub ? "Current club" : "Current club unknown", contracts.length ? "Contract history" : "Contract data unavailable", marketValues.length ? "Market value history" : "Market value unavailable", transfers.length ? "Transfer history" : "Transfer history unavailable", stats.length ? "Club statistics" : "Club statistics unavailable"].map((text, index) => <div key={text} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "9px 0", borderBottom: index === 6 ? 0 : "1px solid #eee", fontSize: 12 }}><span>{text}</span><strong style={{ color: index === 1 && !player.photo_url ? "#888" : "#111" }}>{index === 1 && !player.photo_url ? "Placeholder" : "Available"}</strong></div>)}
          </aside>
        </div>

        <section id="contract" style={{ ...card, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><h2 style={{ margin: 0, fontSize: 19 }}>Contract & Salary</h2><p style={{ margin: "4px 0 0", color: "#888", fontSize: 12 }}>Current terms plus historical contract records. USD values are normalized; original currency remains visible.</p></div><Link href="/contracts" style={{ fontSize: 12, color: "#111" }}>View all contracts →</Link></div>
          {currentContract ? <div className="profile-contract-card" style={{ marginTop: 18, border: "1px solid #ddd", borderRadius: 10, padding: 16, background: "#fafafa" }}><div className="profile-contract-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(4,1fr)", gap: 14, alignItems: "center" }}><div><div style={label}>Current club</div><div style={{ marginTop: 5, fontWeight: 750 }}>{currentClub ? <Link href={`/clubs/${currentClub.id}`} style={{ color: "#111" }}>{currentClub.name}</Link> : "Unknown"}</div></div><div><div style={label}>Status</div><div style={{ marginTop: 5, fontWeight: 650 }}>{titleCase(currentContract.status)}</div></div><div><div style={label}>Expires</div><div style={{ marginTop: 5, fontWeight: 650 }}>{dateText(currentContract.end_date)}</div></div><div><div style={label}>Annual USD</div><div style={{ marginTop: 5, fontWeight: 750 }}>{usd(currentContract.annual_salary_usd)}</div></div><div><div style={label}>Weekly USD</div><div style={{ marginTop: 5, fontWeight: 650 }}>{usd(currentContract.weekly_salary_usd)}</div></div></div>{currentContract.annual_salary != null && <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #e5e5e5", color: "#777", fontSize: 11 }}>Original reported salary: {original(currentContract.annual_salary, currentContract.currency)} · {titleCase(currentContract.confidence)} · Source context retained in the database.</div>}</div> : <div style={{ marginTop: 18, color: "#888", fontSize: 14 }}>No current contract record available.</div>}
          {contractHistory.length > 0 && <div style={{ marginTop: 20, overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 650 }}><thead><tr>{["CLUB","START","END","SALARY USD","STATUS","CONFIDENCE"].map(h => <th key={h} style={{ ...label, textAlign: "left", padding: "8px 7px", borderBottom: "1px solid #ddd" }}>{h}</th>)}</tr></thead><tbody>{contractHistory.map(contract => <tr key={contract.id}><td style={{ padding: "10px 7px", borderBottom: "1px solid #eee" }}>{contract.club_id && clubMap.get(contract.club_id) ? <Link href={`/clubs/${contract.club_id}`} style={{ color: "#111", fontWeight: 650 }}>{clubMap.get(contract.club_id)!.name}</Link> : "Unknown"}</td><td style={{ padding: "10px 7px", borderBottom: "1px solid #eee" }}>{dateText(contract.start_date)}</td><td style={{ padding: "10px 7px", borderBottom: "1px solid #eee" }}>{dateText(contract.end_date)}</td><td style={{ padding: "10px 7px", borderBottom: "1px solid #eee", fontWeight: 650 }}>{usd(contract.annual_salary_usd)}</td><td style={{ padding: "10px 7px", borderBottom: "1px solid #eee" }}>{titleCase(contract.status)}</td><td style={{ padding: "10px 7px", borderBottom: "1px solid #eee" }}>{titleCase(contract.confidence)}</td></tr>)}</tbody></table></div>}
        </section>

        <section id="market-value" style={{ ...card, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><h2 style={{ margin: 0, fontSize: 19 }}>Market Value History</h2><p style={{ margin: "4px 0 0", color: "#888", fontSize: 12 }}>Valuation timeline with normalized USD and confidence.</p></div></div>
          {marketValues.length ? <div className="market-value-list" style={{ marginTop: 16, display: "grid", gap: 8 }}>{marketValues.map((value, index) => <div key={value.id} style={{ display: "grid", gridTemplateColumns: "120px 1fr auto auto", gap: 14, alignItems: "center", padding: "12px 0", borderBottom: index === marketValues.length - 1 ? 0 : "1px solid #eee" }}><div style={{ fontSize: 12, color: "#777" }}>{dateText(value.valuation_date)}</div><div><strong>{usd(value.market_value_usd)}</strong>{value.market_value != null && <span style={{ marginLeft: 8, color: "#888", fontSize: 11 }}>Original: {original(value.market_value, value.currency)}</span>}</div><div style={{ fontSize: 11, color: "#777" }}>{titleCase(value.confidence)}</div><div style={{ fontSize: 11, color: "#999", textAlign: "right" }}>{index === 0 ? "Latest" : ""}</div></div>)}</div> : <div style={{ marginTop: 18, color: "#888" }}>No market value records available.</div>}
        </section>

        <section id="transfers" style={{ ...card, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><h2 style={{ margin: 0, fontSize: 19 }}>Transfer History</h2><p style={{ margin: "4px 0 0", color: "#888", fontSize: 12 }}>Every recorded movement connected to this player.</p></div><Link href="/transfers" style={{ fontSize: 12, color: "#111" }}>View transfer market →</Link></div>
          {transfers.length ? <div style={{ marginTop: 16, display: "grid", gap: 8 }}>{transfers.map((transfer, index) => <article key={transfer.id} style={{ display: "grid", gridTemplateColumns: "110px minmax(0,1fr) 150px", gap: 14, alignItems: "center", padding: "14px 0", borderBottom: index === transfers.length - 1 ? 0 : "1px solid #eee" }}><div><div style={label}>Date</div><div style={{ marginTop: 5, fontSize: 12 }}>{dateText(transfer.transfer_date)}</div></div><div><div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><span style={{ fontWeight: 700 }}>{transfer.from_club?.name || "Previous club"}</span><span style={{ color: "#999" }}>→</span><span style={{ fontWeight: 700 }}>{transfer.to_club?.name || "New club"}</span></div><div style={{ marginTop: 5, color: "#888", fontSize: 11 }}>{titleCase(transfer.transfer_type)} · {titleCase(transfer.confidence)}</div></div><div style={{ textAlign: "right" }}><div style={label}>Fee</div><div style={{ marginTop: 5, fontWeight: 750 }}>{transfer.fee == null ? "Free" : original(transfer.fee, transfer.currency)}</div></div></article>)}</div> : <div style={{ marginTop: 18, color: "#888" }}>No transfer records available.</div>}
        </section>

        <PlayerIntelligence stats={stats} marketValues={marketValues} position={player.position} />

        <section style={{ marginTop: 16 }}><PlayerStatistics stats={stats} clubs={clubs} /></section>

        <section style={{ ...card, marginTop: 16 }}>
          <h2 style={{ margin: 0, fontSize: 19 }}>Player Data Sources</h2>
          <p style={{ margin: "5px 0 0", color: "#888", fontSize: 12 }}>WFM keeps source and confidence metadata attached to important records rather than presenting estimates as facts.</p>
          <div style={{ marginTop: 16, padding: 14, background: "#fafafa", border: "1px solid #eee", borderRadius: 9, fontSize: 12, lineHeight: 1.6 }}>Contract, salary, transfer, market-value and statistics records retain their source/confidence fields in the database. Where a value or date is unknown, WFM displays that uncertainty instead of filling the gap with an unsupported assumption.</div>
        </section>

        <div style={{ marginTop: 18, fontSize: 11, color: "#999", lineHeight: 1.6 }}>Profile coverage: {player.full_name} · {contracts.length} contract record{contracts.length === 1 ? "" : "s"} · {marketValues.length} market-value record{marketValues.length === 1 ? "" : "s"} · {transfers.length} transfer record{transfers.length === 1 ? "" : "s"} · {stats.length} club-stat record{stats.length === 1 ? "" : "s"}. Latest transfer: {latestTransfer ? dateText(latestTransfer.transfer_date) : "none recorded"}.</div>
      </div>
    </main>
  );
}
