import Link from "next/link";
import { supabase } from "../../lib/supabase";
import PositionMap from "../../components/PositionMap";
import PlayerStatistics from "./PlayerStatistics";

type PlayerPageProps = {
  params: Promise<{ id: string }>;
};

type Contract = {
  id: string;
  status: string | null;
  confidence: string | null;
  start_date: string | null;
  end_date: string | null;
  annual_salary: number | null;
  weekly_salary: number | null;
  currency: string | null;
  notes: string | null;
  club_id: string | null;
};

type Club = {
  id: string;
  name: string;
  league: string | null;
  country: string | null;
  logo_url: string | null;
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
  exchange_rate_to_usd: number | null;
  conversion_date: string | null;
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

const getCountryCode = (nationality: string | null) => {
  if (!nationality) return null;

  const value = nationality.trim().toUpperCase();

  const countries: Record<string, string> = {
    USA: "us",
    US: "us",
    "UNITED STATES": "us",
    "UNITED STATES OF AMERICA": "us",
    CAN: "ca",
    CANADA: "ca",
    MEX: "mx",
    MEXICO: "mx",
    ENG: "gb-eng",
    ENGLAND: "gb-eng",
    FRA: "fr",
    FRANCE: "fr",
    ESP: "es",
    SPAIN: "es",
    GER: "de",
    GERMANY: "de",
    BRA: "br",
    BRAZIL: "br",
    COL: "co",
    COLOMBIA: "co",
    ARG: "ar",
    ARGENTINA: "ar",
    CHI: "cl",
    CHILE: "cl",
    ITA: "it",
    ITALY: "it",
    NED: "nl",
    NETHERLANDS: "nl",
    POR: "pt",
    PORTUGAL: "pt",
    SWE: "se",
    SWEDEN: "se",
    NOR: "no",
    NORWAY: "no",
    DEN: "dk",
    DENMARK: "dk",
    JPN: "jp",
    JAPAN: "jp",
    KOR: "kr",
    "SOUTH KOREA": "kr",
    AUS: "au",
    AUSTRALIA: "au",
    NZL: "nz",
    "NEW ZEALAND": "nz",
    NIG: "ng",
    NIGERIA: "ng",
    GHA: "gh",
    GHANA: "gh",
    RSA: "za",
    "SOUTH AFRICA": "za",
    IRL: "ie",
    IRELAND: "ie",
    SCO: "gb-sct",
    SCOTLAND: "gb-sct",
    WAL: "gb-wls",
    WALES: "gb-wls",
    SUI: "ch",
    SWITZERLAND: "ch",
    AUT: "at",
    AUSTRIA: "at",
    BEL: "be",
    BELGIUM: "be",
    POL: "pl",
    POLAND: "pl",
    UKR: "ua",
    UKRAINE: "ua",
    CZE: "cz",
    "CZECH REPUBLIC": "cz",
    JAM: "jm",
    JAMAICA: "jm",
    CRC: "cr",
    "COSTA RICA": "cr",
    PAN: "pa",
    PANAMA: "pa",
    PUR: "pr",
    "PUERTO RICO": "pr",
    PAR: "py",
    PARAGUAY: "py",
    URU: "uy",
    URUGUAY: "uy",
    ECU: "ec",
    ECUADOR: "ec",
    PER: "pe",
    PERU: "pe",
    VEN: "ve",
    VENEZUELA: "ve",
  };

  return countries[value] || null;
};

const formatDate = (date: string | null) => {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatSalary = (
  amount: number | null,
  currency: string | null
) => {
  if (amount === null || amount === undefined) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatMarketValue = (amount: number | null) => {
  if (amount === null || amount === undefined) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatOriginalMarketValue = (
  amount: number | null,
  currency: string | null
) => {
  if (amount === null || amount === undefined) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatTransferFee = (
  amount: number | null,
  currency: string | null
) => {
  if (amount === null || amount === undefined) return "Free";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatTransferType = (type: string | null) => {
  if (!type) return "Transfer";

  return type.charAt(0).toUpperCase() + type.slice(1);
};

const formatConfidence = (confidence: string | null) => {
  if (!confidence) return "Unknown";

  return confidence.charAt(0).toUpperCase() + confidence.slice(1);
};

const calculateAge = (dateOfBirth: string | null) => {
  if (!dateOfBirth) return null;

  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference =
    today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

const labelStyle = {
  fontSize: 10,
  color: "#888",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const valueStyle = {
  fontWeight: 600,
  marginTop: 3,
  fontSize: 14,
  color: "#111",
};

export default async function PlayerPage({
  params,
}: PlayerPageProps) {
  const { id } = await params;

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .single();

  if (playerError || !player) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f5f4ef",
        }}
      >
        <nav
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            padding: "14px 32px",
            borderBottom: "1px solid #e5e5e5",
            background: "#fff",
          }}
        >
          <Link
            href="/"
            style={{
              textDecoration: "none",
              color: "#111",
              fontSize: 24,
              fontWeight: 800,
              marginRight: 40,
            }}
          >
            WFM<span style={{ color: "#777" }}>•</span>
          </Link>

          <div
            style={{
              display: "flex",
              gap: 28,
              alignItems: "center",
            }}
          >
            <Link
              href="/players"
              style={{
                color: "#111",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Players
            </Link>

            <Link
              href="/contracts"
              style={{
                color: "#111",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Contracts
            </Link>

            <Link
              href="/transfers"
              style={{
                color: "#111",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Transfers
            </Link>

            <Link
              href="/salaries"
              style={{
                color: "#111",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Salaries
            </Link>

            <Link
              href="/clubs"
              style={{
                color: "#111",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Clubs
            </Link>
          </div>

          <button
            style={{
              marginLeft: "auto",
              border: "1px solid #ddd",
              background: "#fff",
              borderRadius: 8,
              padding: "9px 16px",
              fontSize: 14,
            }}
          >
            Sign in
          </button>
        </nav>

        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "80px 32px",
          }}
        >
          <h1>Player not found</h1>

          <Link
            href="/players"
            style={{
              color: "#111",
              textDecoration: "underline",
            }}
          >
            Back to players
          </Link>
        </div>
      </main>
    );
  }

  const { data: contractData } = await supabase
    .from("contracts")
    .select(
      "id, status, confidence, start_date, end_date, annual_salary, weekly_salary, currency, notes, club_id"
    )
    .eq("player_id", id)
    .order("start_date", { ascending: false });

  const contracts: Contract[] = contractData || [];

  const { data: playerStatsData } = await supabase
    .from("player_stats")
    .select(
      "id, club_id, season, competition, appearances, starts, minutes, goals, assists, yellow_cards, red_cards, shots, shots_on_target, key_passes, chances_created, crosses, tackles, tackles_won, interceptions, clearances, blocks, recoveries, dispossessions, dribbles_attempted, dribbles_completed, fouls_committed, fouls_drawn, offsides, passes_attempted, passes_completed, progressive_passes, progressive_carries, duels_won, duels_lost, aerials_won, aerials_lost, xg, xa, sca, gca, saves, shots_on_target_faced, goals_against, clean_sheets, penalty_kicks_saved, penalty_kicks_faced, own_goals, confidence, notes"
    )
    .eq("player_id", id)
    .order("season", { ascending: false })
    .order("competition", { ascending: true });

  const playerStats: PlayerStat[] = playerStatsData || [];

  const contractClubIds = [
    ...new Set(
      contracts
        .map((contract) => contract.club_id)
        .filter(
          (clubId): clubId is string => Boolean(clubId)
        )
    ),
  ];

  const statsClubIds = [
    ...new Set(
      playerStats
        .map((stat) => stat.club_id)
        .filter(
          (clubId): clubId is string => Boolean(clubId)
        )
    ),
  ];

  const allClubIds = [
    ...new Set([...contractClubIds, ...statsClubIds]),
  ];

  let profileClubs: Club[] = [];

  if (allClubIds.length > 0) {
    const { data: clubs } = await supabase
      .from("clubs")
      .select("id, name, league, country, logo_url")
      .in("id", allClubIds);

    profileClubs = clubs || [];
  }

  const clubMap = new Map(
    profileClubs.map((club) => [club.id, club])
  );

  const { data: transferData } = await supabase
    .from("transfers")
    .select(
      "id, transfer_date, transfer_type, fee, currency, confidence, from_club:clubs!transfers_from_club_id_fkey(id, name, league, country, logo_url), to_club:clubs!transfers_to_club_id_fkey(id, name, league, country, logo_url)"
    )
    .eq("player_id", id)
    .order("transfer_date", { ascending: false });

  const transfers: Transfer[] = (transferData || []).map(
    (transfer: any) => ({
      id: transfer.id,
      transfer_date: transfer.transfer_date,
      transfer_type: transfer.transfer_type,
      fee: transfer.fee,
      currency: transfer.currency,
      confidence: transfer.confidence,
      from_club: Array.isArray(transfer.from_club)
        ? transfer.from_club[0] || null
        : transfer.from_club || null,
      to_club: Array.isArray(transfer.to_club)
        ? transfer.to_club[0] || null
        : transfer.to_club || null,
    })
  );

  const { data: marketValueData } = await supabase
    .from("market_values")
    .select(
      "id, valuation_date, market_value, currency, market_value_usd, exchange_rate_to_usd, conversion_date, confidence, notes"
    )
    .eq("player_id", id)
    .order("valuation_date", { ascending: false });

  const marketValues: MarketValue[] =
    marketValueData || [];

  const currentContract =
    contracts.find(
      (contract) =>
        contract.status?.toLowerCase() === "active"
    ) ||
    contracts[0] ||
    null;

  const currentClub = currentContract?.club_id
    ? clubMap.get(currentContract.club_id)
    : null;

  const contractHistory = contracts.filter(
    (contract) => contract.id !== currentContract?.id
  );

  const age = calculateAge(player.date_of_birth);
  const countryCode = getCountryCode(player.nationality);

  return (
    <main
      className="player-page"
      style={{
        minHeight: "100vh",
        background: "#f5f4ef",
        color: "#111",
      }}
    >
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          padding: "14px 32px",
          borderBottom: "1px solid #e5e5e5",
          background: "#fff",
        }}
      >
        <Link
          href="/"
          style={{
            textDecoration: "none",
            color: "#111",
            fontSize: 24,
            fontWeight: 800,
            marginRight: 40,
          }}
        >
          WFM<span style={{ color: "#777" }}>•</span>
        </Link>

        <div
          style={{
            display: "flex",
            gap: 28,
            alignItems: "center",
          }}
        >
          <Link
            href="/players"
            style={{
              color: "#111",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Players
          </Link>

          <Link
            href="/contracts"
            style={{
              color: "#111",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Contracts
          </Link>

          <Link
            href="/transfers"
            style={{
              color: "#111",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Transfers
          </Link>

          <Link
            href="/salaries"
            style={{
              color: "#111",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Salaries
          </Link>

          <Link
            href="/clubs"
            style={{
              color: "#111",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Clubs
          </Link>
        </div>

        <button
          style={{
            marginLeft: "auto",
            border: "1px solid #ddd",
            background: "#fff",
            borderRadius: 8,
            padding: "9px 16px",
            fontSize: 14,
          }}
        >
          Sign in
        </button>
      </nav>

      <section
        style={{
          background: "#111",
          color: "#fff",
          padding: "46px 32px 52px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          <Link
            href="/players"
            style={{
              color: "#aaa",
              textDecoration: "none",
              fontSize: 13,
            }}
          >
            ← Players
          </Link>

          <div
            style={{
              display: "flex",
              gap: 34,
              alignItems: "center",
              marginTop: 28,
            }}
          >
            <div
              className="player-photo-frame"
              style={{
                width: 180,
                height: 240,
                flexShrink: 0,
                borderRadius: 10,
                overflow: "hidden",
                background: "#222",
                border: "1px solid #333",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {player.photo_url ? (
                <img
                  src={player.photo_url}
                  alt={player.full_name}
                  loading="eager"
                  decoding="async"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    objectPosition: "center center",
                    display: "block",
                    imageRendering: "auto",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#777",
                    fontSize: 13,
                  }}
                >
                  No photo
                </div>
              )}
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 14,
                  color: "#aaa",
                  marginBottom: 10,
                }}
              >
                {countryCode ? (
                  <img
                    src={`https://flagcdn.com/w40/${countryCode}.png`}
                    alt={player.nationality || "Country flag"}
                    style={{
                      width: 24,
                      height: 16,
                      objectFit: "cover",
                      borderRadius: 2,
                      display: "block",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 16 }}>🌐</span>
                )}

                <span>
                  {player.nationality || "Nationality unknown"}
                </span>
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(34px, 5vw, 58px)",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                  fontWeight: 800,
                }}
              >
                {player.full_name}
              </h1>

              <div
                style={{
                  display: "flex",
                  gap: 18,
                  flexWrap: "wrap",
                  marginTop: 20,
                  color: "#ccc",
                  fontSize: 14,
                }}
              >
                {player.position && (
                  <span>{player.position}</span>
                )}

                {age !== null && (
                  <span>{age} years old</span>
                )}

                {currentClub && (
                  <span>{currentClub.name}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "36px 32px 80px",
        }}
      >
        <div
          style={{
            padding: "22px",
            border: "1px solid #ddd",
            borderRadius: 10,
            background: "#fff",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 750,
            }}
          >
            Player Information
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "22px 24px",
              marginTop: 22,
            }}
          >
            <div>
              <div style={labelStyle}>Nationality</div>

              <div
                style={{
                  ...valueStyle,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {countryCode ? (
                  <img
                    src={`https://flagcdn.com/w40/${countryCode}.png`}
                    alt={player.nationality || "Country flag"}
                    style={{
                      width: 24,
                      height: 16,
                      objectFit: "cover",
                      borderRadius: 2,
                      display: "block",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 16 }}>🌐</span>
                )}

                <span>{player.nationality || "—"}</span>
              </div>
            </div>

            <div>
              <div style={labelStyle}>Date of Birth</div>
              <div style={valueStyle}>
                {formatDate(player.date_of_birth)}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Age</div>
              <div style={valueStyle}>
                {age !== null ? age : "—"}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Position</div>
              <div style={valueStyle}>
                {player.position || "—"}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Secondary Position</div>
              <div style={valueStyle}>
                {player.secondary_position || "—"}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Preferred Foot</div>
              <div style={valueStyle}>
                {player.preferred_foot || "—"}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Height</div>
              <div style={valueStyle}>
                {player.height_cm
                  ? `${player.height_cm} cm`
                  : "—"}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Birthplace</div>
              <div style={valueStyle}>
                {player.birthplace || "—"}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Agency</div>
              <div style={valueStyle}>
                {player.agency || "—"}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Current Club Since</div>
              <div style={valueStyle}>
                {formatDate(player.current_club_since)}
              </div>
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <div style={labelStyle}>Youth Clubs</div>
              <div style={valueStyle}>
                {player.youth_clubs || "—"}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid #eee",
              display: "grid",
              gridTemplateColumns:
                "minmax(190px, 230px) minmax(0, 1fr)",
              gap: 28,
              alignItems: "start",
            }}
          >
            <div>
              <div style={labelStyle}>Position Map</div>

              <PositionMap
                primaryPosition={player.position}
                secondaryPosition={player.secondary_position}
              />
            </div>

            <div
              style={{
                border: "1px solid #e1e1e1",
                borderRadius: 9,
                background: "#fff",
                padding: 18,
                minHeight: 190,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 15,
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 17,
                      fontWeight: 750,
                    }}
                  >
                    Market Value
                  </h2>

                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      color: "#888",
                    }}
                  >
                    Transfer-market valuation · USD
                  </div>
                </div>

                {marketValues.length > 0 && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#888",
                    }}
                  >
                    {marketValues.length} valuation
                    {marketValues.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>

              {marketValues.length === 0 ? (
                <div
                  style={{
                    marginTop: 24,
                    color: "#888",
                    fontSize: 13,
                  }}
                >
                  No market value information available.
                </div>
              ) : (
                <div style={{ marginTop: 22 }}>
                  <div style={labelStyle}>
                    Current Market Value
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      fontSize: 30,
                      fontWeight: 800,
                      letterSpacing: "-0.03em",
                      color: "#111",
                    }}
                  >
                    {formatMarketValue(
                      marketValues[0].market_value_usd
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      color: "#888",
                    }}
                  >
                    Original valuation:{" "}
                    {formatOriginalMarketValue(
                      marketValues[0].market_value,
                      marketValues[0].currency
                    )}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(2, minmax(100px, 1fr))",
                      gap: 16,
                      marginTop: 20,
                      paddingTop: 14,
                      borderTop: "1px solid #eee",
                    }}
                  >
                    <div>
                      <div style={labelStyle}>
                        Valuation Date
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {formatDate(
                          marketValues[0].valuation_date
                        )}
                      </div>
                    </div>

                    <div>
                      <div style={labelStyle}>
                        Confidence
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {formatConfidence(
                          marketValues[0].confidence
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      fontSize: 11,
                      color: "#777",
                    }}
                  >
                    Source: Soccerdonna
                  </div>

                  {marketValues[0].notes && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 11,
                        color: "#777",
                        lineHeight: 1.45,
                      }}
                    >
                      {marketValues[0].notes}
                    </div>
                  )}

                  {marketValues.length > 1 && (
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 14,
                        borderTop: "1px solid #eee",
                      }}
                    >
                      <div style={labelStyle}>
                        Previous Valuations
                      </div>

                      <div style={{ marginTop: 8 }}>
                        {marketValues
                          .slice(1)
                          .map((value) => (
                            <div
                              key={value.id}
                              style={{
                                display: "flex",
                                justifyContent:
                                  "space-between",
                                alignItems: "center",
                                gap: 15,
                                padding: "8px 0",
                                borderTop:
                                  "1px solid #f0f0f0",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#777",
                                }}
                              >
                                {formatDate(
                                  value.valuation_date
                                )}
                              </div>

                              <div
                                style={{
                                  textAlign: "right",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                  }}
                                >
                                  {formatMarketValue(
                                    value.market_value_usd
                                  )}
                                </div>

                                <div
                                  style={{
                                    marginTop: 2,
                                    fontSize: 10,
                                    color: "#999",
                                  }}
                                >
                                  {formatOriginalMarketValue(
                                    value.market_value,
                                    value.currency
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            padding: "22px",
            border: "1px solid #ddd",
            borderRadius: 10,
            background: "#fff",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 750,
            }}
          >
            Contract
          </h2>

          {!currentContract ? (
            <div
              style={{
                marginTop: 20,
                color: "#888",
                fontSize: 14,
              }}
            >
              No contract information available.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 22,
                marginTop: 22,
              }}
            >
              <div>
                <div style={labelStyle}>Club</div>

                <div style={valueStyle}>
                  {currentClub?.name || "—"}
                </div>
              </div>

              <div>
                <div style={labelStyle}>Status</div>

                <div style={valueStyle}>
                  {currentContract.status || "—"}
                </div>
              </div>

              <div>
                <div style={labelStyle}>Start</div>

                <div style={valueStyle}>
                  {formatDate(
                    currentContract.start_date
                  )}
                </div>
              </div>

              <div>
                <div style={labelStyle}>Expiry</div>

                <div style={valueStyle}>
                  {formatDate(
                    currentContract.end_date
                  )}
                </div>
              </div>

              <div>
                <div style={labelStyle}>Annual Salary</div>

                <div style={valueStyle}>
                  {formatSalary(
                    currentContract.annual_salary,
                    currentContract.currency
                  )}
                </div>
              </div>

              <div>
                <div style={labelStyle}>Weekly Salary</div>

                <div style={valueStyle}>
                  {formatSalary(
                    currentContract.weekly_salary,
                    currentContract.currency
                  )}
                </div>
              </div>

              <div>
                <div style={labelStyle}>Confidence</div>

                <div style={valueStyle}>
                  {formatConfidence(
                    currentContract.confidence
                  )}
                </div>
              </div>
            </div>
          )}

          {currentContract?.notes && (
            <div
              style={{
                marginTop: 22,
                paddingTop: 18,
                borderTop: "1px solid #eee",
                fontSize: 12,
                color: "#777",
                lineHeight: 1.5,
              }}
            >
              {currentContract.notes}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 16,
            padding: "22px",
            border: "1px solid #ddd",
            borderRadius: 10,
            background: "#fff",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 750,
            }}
          >
            Current Club
          </h2>

          {!currentClub ? (
            <div
              style={{
                marginTop: 20,
                color: "#888",
                fontSize: 14,
              }}
            >
              No current club information available.
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 20,
              }}
            >
              {currentClub.logo_url ? (
                <img
                  src={currentClub.logo_url}
                  alt={currentClub.name}
                  style={{
                    width: 54,
                    height: 54,
                    objectFit: "contain",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 8,
                    background: "#f5f4ef",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 18,
                  }}
                >
                  {currentClub.name.charAt(0)}
                </div>
              )}

              <div>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 750,
                  }}
                >
                  {currentClub.name}
                </div>

                <div
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    color: "#777",
                  }}
                >
                  {currentClub.league || "League unknown"}
                  {currentClub.country
                    ? ` · ${currentClub.country}`
                    : ""}
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 16,
            padding: "22px",
            border: "1px solid #ddd",
            borderRadius: 10,
            background: "#fff",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 750,
            }}
          >
            Transfer History
          </h2>

          {transfers.length === 0 ? (
            <div
              style={{
                marginTop: 20,
                color: "#888",
                fontSize: 14,
              }}
            >
              No transfer information available.
            </div>
          ) : (
            <div style={{ marginTop: 20 }}>
              {transfers.map((transfer) => (
                <div
                  key={transfer.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "120px 1fr auto 1fr",
                    gap: 18,
                    alignItems: "center",
                    padding: "18px 0",
                    borderTop: "1px solid #eee",
                  }}
                >
                  <div>
                    <div style={labelStyle}>Date</div>

                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {formatDate(
                        transfer.transfer_date
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    {transfer.from_club?.logo_url && (
                      <img
                        src={transfer.from_club.logo_url}
                        alt=""
                        style={{
                          width: 28,
                          height: 28,
                          objectFit: "contain",
                        }}
                      />
                    )}

                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {transfer.from_club?.name || "—"}
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "center",
                      color: "#888",
                      fontSize: 12,
                    }}
                  >
                    →
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    {transfer.to_club?.logo_url && (
                      <img
                        src={transfer.to_club.logo_url}
                        alt=""
                        style={{
                          width: 28,
                          height: 28,
                          objectFit: "contain",
                        }}
                      />
                    )}

                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {transfer.to_club?.name || "—"}
                      </div>

                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 11,
                          color: "#888",
                        }}
                      >
                        {formatTransferType(
                          transfer.transfer_type
                        )}
                        {" · "}
                        {formatTransferFee(
                          transfer.fee,
                          transfer.currency
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      gridColumn: "1 / -1",
                      fontSize: 11,
                      color: "#888",
                    }}
                  >
                    Confidence:{" "}
                    {formatConfidence(
                      transfer.confidence
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <PlayerStatistics
          stats={playerStats}
          clubs={profileClubs}
        />

        <div
          style={{
            marginTop: 16,
            padding: "22px",
            border: "1px solid #ddd",
            borderRadius: 10,
            background: "#fff",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 750,
            }}
          >
            Contract History
          </h2>

          {contractHistory.length === 0 ? (
            <div
              style={{
                marginTop: 20,
                color: "#888",
                fontSize: 14,
              }}
            >
              No previous contracts available.
            </div>
          ) : (
            <div style={{ marginTop: 20 }}>
              {contractHistory.map((contract) => {
                const club = contract.club_id
                  ? clubMap.get(contract.club_id)
                  : null;

                return (
                  <div
                    key={contract.id}
                    style={{
                      padding: "18px 0",
                      borderTop: "1px solid #eee",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "1.5fr repeat(3, 1fr)",
                        gap: 20,
                      }}
                    >
                      <div>
                        <div style={labelStyle}>
                          Club
                        </div>

                        <div style={valueStyle}>
                          {club?.name || "—"}
                        </div>
                      </div>

                      <div>
                        <div style={labelStyle}>
                          Start
                        </div>

                        <div style={valueStyle}>
                          {formatDate(
                            contract.start_date
                          )}
                        </div>
                      </div>

                      <div>
                        <div style={labelStyle}>
                          End
                        </div>

                        <div style={valueStyle}>
                          {formatDate(
                            contract.end_date
                          )}
                        </div>
                      </div>

                      <div>
                        <div style={labelStyle}>
                          Salary
                        </div>

                        <div style={valueStyle}>
                          {formatSalary(
                            contract.annual_salary,
                            contract.currency
                          )}
                        </div>
                      </div>
                    </div>

                    {contract.notes && (
                      <div
                        style={{
                          marginTop: 12,
                          fontSize: 11,
                          color: "#888",
                        }}
                      >
                        {contract.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}