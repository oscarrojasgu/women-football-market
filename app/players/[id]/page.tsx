import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Player = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  position: string | null;
  preferred_foot: string | null;
  agency: string | null;
  created_at: string;
  photo_url: string | null;
  height_cm: number | null;
  birthplace: string | null;
  secondary_position: string | null;
  current_club_since: string | null;
  youth_clubs: string | null;
};

type Club = {
  id: string;
  name: string;
  country: string | null;
  league: string | null;
  logo_url: string | null;
};

type Source = {
  id: string;
  publisher: string | null;
  url: string | null;
  reliability: string | null;
};

type Contract = {
  id: string;
  player_id: string;
  club_id: string | null;
  start_date: string | null;
  end_date: string | null;
  annual_salary: number | null;
  weekly_salary: number | null;
  currency: string | null;
  guaranteed: boolean | null;
  option_year: boolean | null;
  status: string | null;
  source_id: string | null;
  confidence: string | null;
  notes: string | null;
  annual_salary_usd: number | null;
  weekly_salary_usd: number | null;
  exchange_rate_to_usd: number | null;
  conversion_date: string | null;
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
  source_id: string | null;
  confidence: string | null;
  notes: string | null;
};

type MarketValue = {
  id: string;
  player_id: string;
  valuation_date: string | null;
  market_value: number | null;
  currency: string | null;
  confidence: string | null;
  source_id: string | null;
  notes: string | null;
  created_at: string | null;
  market_value_usd: number | null;
  exchange_rate_to_usd: number | null;
  conversion_date: string | null;
};

type PlayerPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const countryCodes: Record<string, string> = {
  usa: "us",
  us: "us",
  "united states": "us",
  "united states of america": "us",

  canada: "ca",
  mexico: "mx",

  brazil: "br",
  argentina: "ar",
  colombia: "co",
  chile: "cl",
  peru: "pe",
  ecuador: "ec",
  venezuela: "ve",
  "costa rica": "cr",
  panama: "pa",

  england: "gb-eng",
  scotland: "gb-sct",
  wales: "gb-wls",
  "northern ireland": "gb-nir",
  "united kingdom": "gb",

  france: "fr",
  germany: "de",
  spain: "es",
  italy: "it",
  portugal: "pt",
  netherlands: "nl",
  belgium: "be",
  switzerland: "ch",
  austria: "at",
  norway: "no",
  sweden: "se",
  denmark: "dk",
  finland: "fi",
  iceland: "is",
  ireland: "ie",
  poland: "pl",
  czechia: "cz",
  "czech republic": "cz",
  croatia: "hr",
  serbia: "rs",
  slovenia: "si",
  slovakia: "sk",
  romania: "ro",
  hungary: "hu",
  ukraine: "ua",
  russia: "ru",
  turkey: "tr",
  greece: "gr",

  australia: "au",
  "new zealand": "nz",
  japan: "jp",
  "south korea": "kr",
  korea: "kr",
  china: "cn",
  india: "in",
  philippines: "ph",
  thailand: "th",
  vietnam: "vn",

  nigeria: "ng",
  ghana: "gh",
  cameroon: "cm",
  "south africa": "za",
  zambia: "zm",
  "ivory coast": "ci",
  "cote d'ivoire": "ci",
  morocco: "ma",
  egypt: "eg",

  jamaica: "jm",
  "trinidad and tobago": "tt",
  "puerto rico": "pr",
  "dominican republic": "do",

  "bosnia and herzegovina": "ba",
  "north macedonia": "mk",
  albania: "al",
  bulgaria: "bg",
  estonia: "ee",
  latvia: "lv",
  lithuania: "lt",
};

function getCountryCode(nationality: string | null) {
  if (!nationality) {
    return null;
  }

  const normalized = nationality
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  return countryCodes[normalized] ?? null;
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatUSD(value: number | null) {
  if (value === null || value === undefined) {
    return "Not publicly available";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMarketValue(
  value: number | null,
  currency: string | null,
  usdValue: number | null
) {
  if (usdValue !== null && usdValue !== undefined) {
    return formatUSD(usdValue);
  }

  if (value === null || value === undefined) {
    return "Not available";
  }

  const normalizedCurrency = (currency ?? "USD").toUpperCase();

  const conversionRates: Record<string, number> = {
    USD: 1,
    EUR: 1.17,
    GBP: 1.35,
    CAD: 0.73,
    AUD: 0.66,
  };

  const rate = conversionRates[normalizedCurrency] ?? 1;

  return formatUSD(value * rate);
}

function formatTransferFee(
  fee: number | null,
  currency: string | null
) {
  if (fee === null || fee === undefined) {
    return "Undisclosed";
  }

  if (fee === 0) {
    return "Free";
  }

  const normalizedCurrency = (currency ?? "USD").toUpperCase();

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 0,
    }).format(fee);
  } catch {
    return `${fee.toLocaleString()} ${normalizedCurrency}`;
  }
}

function formatLabel(value: string | null) {
  if (!value) {
    return "—";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function calculateAge(dateOfBirth: string | null) {
  if (!dateOfBirth) {
    return null;
  }

  const birthDate = new Date(`${dateOfBirth}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

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
}

function getConfidenceStyle(value: string | null) {
  const normalized = (value ?? "").toLowerCase();

  if (normalized === "verified") {
    return {
      background: "#dcfce7",
      color: "#166534",
      border: "#86efac",
    };
  }

  if (normalized === "reported") {
    return {
      background: "#dbeafe",
      color: "#1d4ed8",
      border: "#93c5fd",
    };
  }

  if (normalized === "estimated") {
    return {
      background: "#fef3c7",
      color: "#92400e",
      border: "#fcd34d",
    };
  }

  return {
    background: "#f3f4f6",
    color: "#4b5563",
    border: "#d1d5db",
  };
}

function getSalaryStatus(contract: Contract | null) {
  if (!contract) {
    return "Not publicly available";
  }

  if (
    contract.annual_salary_usd !== null ||
    contract.weekly_salary_usd !== null
  ) {
    const confidence = (
      contract.confidence ?? ""
    ).toLowerCase();

    if (confidence === "reported") {
      return "Reported";
    }

    if (confidence === "verified") {
      return "Verified";
    }

    if (confidence === "estimated") {
      return "Estimated";
    }

    return "Available";
  }

  return "Not publicly available";
}

function getSalaryStatusStyle(status: string) {
  if (status === "Reported") {
    return {
      background: "#dbeafe",
      color: "#1d4ed8",
      border: "#93c5fd",
    };
  }

  if (status === "Verified") {
    return {
      background: "#dcfce7",
      color: "#166534",
      border: "#86efac",
    };
  }

  if (status === "Estimated") {
    return {
      background: "#fef3c7",
      color: "#92400e",
      border: "#fcd34d",
    };
  }

  return {
    background: "#f3f4f6",
    color: "#4b5563",
    border: "#d1d5db",
  };
}

function getPositionColor(position: string) {
  const normalized = position.toLowerCase();

  if (
    normalized.includes("goalkeeper") ||
    normalized === "gk"
  ) {
    return "#f59e0b";
  }

  if (
    normalized.includes("defender") ||
    normalized.includes("back") ||
    normalized.includes("center back") ||
    normalized.includes("centre back")
  ) {
    return "#3b82f6";
  }

  if (
    normalized.includes("midfielder") ||
    normalized.includes("midfield")
  ) {
    return "#10b981";
  }

  if (
    normalized.includes("forward") ||
    normalized.includes("striker") ||
    normalized.includes("winger")
  ) {
    return "#ef4444";
  }

  return "#6b7280";
}

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 18,
  fontSize: 19,
  fontWeight: 800,
  color: "#111827",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const valueStyle: React.CSSProperties = {
  marginTop: 5,
  fontSize: 15,
  fontWeight: 600,
  color: "#111827",
};

export default async function PlayerPage({
  params,
}: PlayerPageProps) {
  const { id } = await params;

  const { data: player, error: playerError } =
    await supabase
      .from("players")
      .select("*")
      .eq("id", id)
      .single();

  if (playerError || !player) {
    notFound();
  }

  const typedPlayer = player as Player;

  const [
    contractsResult,
    transfersResult,
    marketValuesResult,
  ] = await Promise.all([
    supabase
      .from("contracts")
      .select("*")
      .eq("player_id", id)
      .order("start_date", {
        ascending: false,
        nullsFirst: false,
      }),

    supabase
      .from("transfers")
      .select("*")
      .eq("player_id", id)
      .order("transfer_date", {
        ascending: false,
        nullsFirst: false,
      }),

    supabase
      .from("market_values")
      .select("*")
      .eq("player_id", id)
      .order("valuation_date", {
        ascending: false,
        nullsFirst: false,
      }),
  ]);

  const contracts = (contractsResult.data ??
    []) as Contract[];

  const transfers = (transfersResult.data ??
    []) as Transfer[];

  const marketValues = (marketValuesResult.data ??
    []) as MarketValue[];

  const clubIds = Array.from(
    new Set(
      [
        ...contracts.map(
          (contract) => contract.club_id
        ),
        ...transfers.map(
          (transfer) => transfer.from_club_id
        ),
        ...transfers.map(
          (transfer) => transfer.to_club_id
        ),
      ].filter(Boolean) as string[]
    )
  );

  const sourceIds = Array.from(
    new Set(
      [
        ...contracts.map(
          (contract) => contract.source_id
        ),
        ...transfers.map(
          (transfer) => transfer.source_id
        ),
        ...marketValues.map(
          (marketValue) => marketValue.source_id
        ),
      ].filter(Boolean) as string[]
    )
  );

  const [clubsResult, sourcesResult] =
    await Promise.all([
      clubIds.length > 0
        ? supabase
            .from("clubs")
            .select("*")
            .in("id", clubIds)
        : Promise.resolve({ data: [] }),

      sourceIds.length > 0
        ? supabase
            .from("sources")
            .select("*")
            .in("id", sourceIds)
        : Promise.resolve({ data: [] }),
    ]);

  const clubs = (clubsResult.data ??
    []) as Club[];

  const sources = (sourcesResult.data ??
    []) as Source[];

  const clubMap = new Map(
    clubs.map((club) => [club.id, club])
  );

  const sourceMap = new Map(
    sources.map((source) => [source.id, source])
  );

  const activeContract =
    contracts.find(
      (contract) =>
        (contract.status ?? "").toLowerCase() ===
          "active" &&
        contract.club_id !== null
    ) ??
    contracts.find(
      (contract) =>
        (contract.status ?? "").toLowerCase() ===
        "active"
    ) ??
    contracts[0] ??
    null;

  const currentClub = activeContract?.club_id
    ? clubMap.get(activeContract.club_id) ?? null
    : null;

  const latestMarketValue =
    marketValues.length > 0
      ? marketValues[0]
      : null;

  const age = calculateAge(
    typedPlayer.date_of_birth
  );

  const countryCode = getCountryCode(
    typedPlayer.nationality
  );

  const currentSalaryStatus =
    getSalaryStatus(activeContract);

  const salaryStatusStyle =
    getSalaryStatusStyle(
      currentSalaryStatus
    );

  const currentSource =
    activeContract?.source_id
      ? sourceMap.get(
          activeContract.source_id
        ) ?? null
      : null;

  const primaryPosition =
    typedPlayer.position ?? "";

  const secondaryPosition =
    typedPlayer.secondary_position ?? "";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        color: "#111827",
      }}
    >
      <nav
        style={{
          background: "#111827",
          color: "#ffffff",
          padding: "14px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <Link
            href="/"
            style={{
              color: "#ffffff",
              textDecoration: "none",
              fontSize: 20,
              fontWeight: 900,
            }}
          >
            Women&apos;s Football Market
          </Link>

          <div
            style={{
              display: "flex",
              gap: 20,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            <Link
              href="/"
              style={{
                color: "#d1d5db",
                textDecoration: "none",
              }}
            >
              Home
            </Link>

            <Link
              href="/players"
              style={{
                color: "#ffffff",
                textDecoration: "none",
              }}
            >
              Players
            </Link>
          </div>
        </div>
      </nav>

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "28px 20px 60px",
        }}
      >
        <Link
          href="/players"
          style={{
            display: "inline-flex",
            marginBottom: 20,
            color: "#2563eb",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          ← Back to Players
        </Link>

        <section
          style={{
            ...cardStyle,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 16,
                overflow: "hidden",
                background: "#e5e7eb",
                border: "1px solid #d1d5db",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {typedPlayer.photo_url ? (
                <img
                  src={typedPlayer.photo_url}
                  alt={typedPlayer.full_name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: 40,
                    fontWeight: 900,
                    color: "#9ca3af",
                  }}
                >
                  {typedPlayer.full_name
                    .split(" ")
                    .map(
                      (part) => part[0]
                    )
                    .slice(0, 2)
                    .join("")}
                </span>
              )}
            </div>

            <div
              style={{
                flex: 1,
                minWidth: 250,
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: 34,
                  lineHeight: 1.1,
                  fontWeight: 900,
                  color: "#111827",
                }}
              >
                {typedPlayer.full_name}
              </h1>

              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                {typedPlayer.nationality && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      fontSize: 15,
                      fontWeight: 700,
                    }}
                  >
                    {countryCode ? (
                      <img
                        src={`https://flagcdn.com/w40/${countryCode}.png`}
                        srcSet={`https://flagcdn.com/w80/${countryCode}.png 2x`}
                        width={28}
                        height={20}
                        alt={`${typedPlayer.nationality} flag`}
                        style={{
                          width: 28,
                          height: 20,
                          objectFit: "cover",
                          borderRadius: 2,
                          border:
                            "1px solid #d1d5db",
                          display: "block",
                        }}
                      />
                    ) : null}

                    <span>
                      {typedPlayer.nationality}
                    </span>
                  </span>
                )}

                {primaryPosition && (
                  <span
                    style={{
                      padding: "5px 9px",
                      borderRadius: 6,
                      background:
                        getPositionColor(
                          primaryPosition
                        ),
                      color: "#ffffff",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    {primaryPosition}
                  </span>
                )}
              </div>

              {currentClub && (
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 15,
                    color: "#4b5563",
                  }}
                >
                  Current Club:{" "}
                  <strong
                    style={{
                      color: "#111827",
                    }}
                  >
                    {currentClub.name}
                  </strong>
                </div>
              )}
            </div>
          </div>
        </section>

        <section
          style={{
            ...cardStyle,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <h2 style={sectionTitleStyle}>
            Player Information
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 22,
            }}
          >
            <div>
              <div style={labelStyle}>
                Nationality
              </div>
              <div style={valueStyle}>
                {typedPlayer.nationality ?? "—"}
              </div>
            </div>

            <div>
              <div style={labelStyle}>
                Date of Birth
              </div>
              <div style={valueStyle}>
                {formatDate(
                  typedPlayer.date_of_birth
                )}
              </div>
            </div>

            <div>
              <div style={labelStyle}>
                Age
              </div>
              <div style={valueStyle}>
                {age !== null ? age : "—"}
              </div>
            </div>

            <div>
              <div style={labelStyle}>
                Position
              </div>
              <div style={valueStyle}>
                {primaryPosition || "—"}
              </div>
            </div>

            <div>
              <div style={labelStyle}>
                Secondary Position
              </div>
              <div style={valueStyle}>
                {secondaryPosition || "—"}
              </div>
            </div>

            <div>
              <div style={labelStyle}>
                Preferred Foot
              </div>
              <div style={valueStyle}>
                {typedPlayer.preferred_foot ?? "—"}
              </div>
            </div>

            <div>
              <div style={labelStyle}>
                Height
              </div>
              <div style={valueStyle}>
                {typedPlayer.height_cm
                  ? `${typedPlayer.height_cm} cm`
                  : "—"}
              </div>
            </div>

            <div>
              <div style={labelStyle}>
                Birthplace
              </div>
              <div style={valueStyle}>
                {typedPlayer.birthplace ?? "—"}
              </div>
            </div>

            <div>
              <div style={labelStyle}>
                Agency
              </div>
              <div style={valueStyle}>
                {typedPlayer.agency ?? "—"}
              </div>
            </div>

            <div>
              <div style={labelStyle}>
                Current Club Since
              </div>
              <div style={valueStyle}>
                {formatDate(
                  typedPlayer.current_club_since
                )}
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            ...cardStyle,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <h2 style={sectionTitleStyle}>
            Position
          </h2>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {primaryPosition && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "8px 12px",
                  borderRadius: 8,
                  background:
                    getPositionColor(
                      primaryPosition
                    ),
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                {primaryPosition}
              </span>
            )}

            {secondaryPosition && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "#f3f4f6",
                  color: "#374151",
                  border:
                    "1px solid #d1d5db",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Also: {secondaryPosition}
              </span>
            )}

            {!primaryPosition &&
              !secondaryPosition && (
                <span
                  style={{
                    color: "#6b7280",
                  }}
                >
                  Position not available
                </span>
              )}
          </div>
        </section>

        <section
          style={{
            ...cardStyle,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <h2 style={sectionTitleStyle}>
            Market Value
          </h2>

          {latestMarketValue ? (
            <>
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  color: "#111827",
                }}
              >
                {formatMarketValue(
                  latestMarketValue.market_value,
                  latestMarketValue.currency,
                  latestMarketValue.market_value_usd
                )}
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: "#6b7280",
                }}
              >
                Valuation date:{" "}
                {formatDate(
                  latestMarketValue.valuation_date
                )}
              </div>

              {latestMarketValue.confidence && (
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 12,
                    padding: "5px 9px",
                    borderRadius: 6,
                    background:
                      getConfidenceStyle(
                        latestMarketValue.confidence
                      ).background,
                    color:
                      getConfidenceStyle(
                        latestMarketValue.confidence
                      ).color,
                    border:
                      `1px solid ${
                        getConfidenceStyle(
                          latestMarketValue.confidence
                        ).border
                      }`,
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {formatLabel(
                    latestMarketValue.confidence
                  )}
                </span>
              )}
            </>
          ) : (
            <div
              style={{
                fontSize: 15,
                color: "#6b7280",
              }}
            >
              No market value is currently available.
            </div>
          )}
        </section>

        <section
          style={{
            ...cardStyle,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <h2 style={sectionTitleStyle}>
            Current Club & Contract
          </h2>

          {currentClub || activeContract ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: 24,
                }}
              >
                <div>
                  <div style={labelStyle}>
                    Club
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    {currentClub?.logo_url && (
                      <img
                        src={currentClub.logo_url}
                        alt={currentClub.name}
                        width={38}
                        height={38}
                        style={{
                          objectFit: "contain",
                        }}
                      />
                    )}

                    <span
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                      }}
                    >
                      {currentClub?.name ??
                        "Club not available"}
                    </span>
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>
                    Contract Dates
                  </div>

                  <div style={valueStyle}>
                    {activeContract
                      ? `${formatDate(
                          activeContract.start_date
                        )} — ${formatDate(
                          activeContract.end_date
                        )}`
                      : "—"}
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>
                    Contract Status
                  </div>

                  <div style={valueStyle}>
                    {formatLabel(
                      activeContract?.status ?? null
                    )}
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>
                    Salary Status
                  </div>

                  <div
                    style={{
                      marginTop: 7,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "6px 10px",
                        borderRadius: 7,
                        background:
                          salaryStatusStyle.background,
                        color:
                          salaryStatusStyle.color,
                        border:
                          `1px solid ${salaryStatusStyle.border}`,
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {currentSalaryStatus}
                    </span>
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>
                    Annual Salary
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 21,
                      fontWeight: 900,
                      color: "#111827",
                    }}
                  >
                    {formatUSD(
                      activeContract?.annual_salary_usd ??
                        null
                    )}
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>
                    Weekly Salary
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 18,
                      fontWeight: 800,
                      color: "#111827",
                    }}
                  >
                    {formatUSD(
                      activeContract?.weekly_salary_usd ??
                        null
                    )}
                  </div>
                </div>

                {currentSource?.publisher && (
                  <div>
                    <div style={labelStyle}>
                      Salary Source
                    </div>

                    <div
                      style={{
                        marginTop: 7,
                      }}
                    >
                      {currentSource.url ? (
                        <a
                          href={currentSource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#2563eb",
                            fontWeight: 700,
                            textDecoration:
                              "none",
                          }}
                        >
                          {currentSource.publisher}
                        </a>
                      ) : (
                        <span
                          style={{
                            fontWeight: 700,
                          }}
                        >
                          {currentSource.publisher}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {activeContract &&
                activeContract.annual_salary_usd ===
                  null &&
                activeContract.weekly_salary_usd ===
                  null && (
                  <div
                    style={{
                      marginTop: 20,
                      padding: 14,
                      borderRadius: 9,
                      background: "#fffbeb",
                      border:
                        "1px solid #fde68a",
                      color: "#92400e",
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    The contract is publicly
                    documented, but an individual
                    salary figure is not currently
                    publicly available from a
                    defensible source.
                  </div>
                )}
            </>
          ) : (
            <div
              style={{
                color: "#6b7280",
                fontSize: 15,
              }}
            >
              No current contract information is
              available.
            </div>
          )}
        </section>

        <section
          style={{
            ...cardStyle,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <h2 style={sectionTitleStyle}>
            Transfer History
          </h2>

          {transfers.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {transfers.map((transfer) => {
                const fromClub =
                  transfer.from_club_id
                    ? clubMap.get(
                        transfer.from_club_id
                      )
                    : null;

                const toClub =
                  transfer.to_club_id
                    ? clubMap.get(
                        transfer.to_club_id
                      )
                    : null;

                return (
                  <div
                    key={transfer.id}
                    style={{
                      padding: 16,
                      border:
                        "1px solid #e5e7eb",
                      borderRadius: 10,
                      background: "#fafafa",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "140px 1fr 140px",
                        gap: 18,
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={labelStyle}>
                          Date
                        </div>

                        <div style={valueStyle}>
                          {formatDate(
                            transfer.transfer_date
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent:
                            "center",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 800,
                          }}
                        >
                          {fromClub?.name ??
                            "Unknown"}
                        </span>

                        <span
                          style={{
                            color: "#9ca3af",
                            fontSize: 20,
                          }}
                        >
                          →
                        </span>

                        <span
                          style={{
                            fontWeight: 800,
                          }}
                        >
                          {toClub?.name ??
                            "Unknown"}
                        </span>
                      </div>

                      <div
                        style={{
                          textAlign: "right",
                        }}
                      >
                        <div style={labelStyle}>
                          Fee
                        </div>

                        <div
                          style={{
                            marginTop: 4,
                            fontWeight: 800,
                          }}
                        >
                          {formatTransferFee(
                            transfer.fee,
                            transfer.currency
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 12,
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          padding: "5px 8px",
                          borderRadius: 6,
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {formatLabel(
                          transfer.transfer_type
                        )}
                      </span>

                      {transfer.confidence && (
                        <span
                          style={{
                            padding: "5px 8px",
                            borderRadius: 6,
                            background:
                              getConfidenceStyle(
                                transfer.confidence
                              ).background,
                            color:
                              getConfidenceStyle(
                                transfer.confidence
                              ).color,
                            border:
                              `1px solid ${
                                getConfidenceStyle(
                                  transfer.confidence
                                ).border
                              }`,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {formatLabel(
                            transfer.confidence
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                color: "#6b7280",
                fontSize: 15,
              }}
            >
              No transfer history is currently
              available.
            </div>
          )}
        </section>

        <section
          style={{
            ...cardStyle,
            padding: 24,
          }}
        >
          <h2 style={sectionTitleStyle}>
            Contract History
          </h2>

          {contracts.length > 0 ? (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 820,
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom:
                        "1px solid #e5e7eb",
                      textAlign: "left",
                    }}
                  >
                    <th
                      style={{
                        padding: "10px 8px",
                        ...labelStyle,
                      }}
                    >
                      Club
                    </th>

                    <th
                      style={{
                        padding: "10px 8px",
                        ...labelStyle,
                      }}
                    >
                      Dates
                    </th>

                    <th
                      style={{
                        padding: "10px 8px",
                        ...labelStyle,
                      }}
                    >
                      Annual Salary
                    </th>

                    <th
                      style={{
                        padding: "10px 8px",
                        ...labelStyle,
                      }}
                    >
                      Weekly Salary
                    </th>

                    <th
                      style={{
                        padding: "10px 8px",
                        ...labelStyle,
                      }}
                    >
                      Status
                    </th>

                    <th
                      style={{
                        padding: "10px 8px",
                        ...labelStyle,
                      }}
                    >
                      Confidence
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {contracts.map((contract) => {
                    const club =
                      contract.club_id
                        ? clubMap.get(
                            contract.club_id
                          )
                        : null;

                    const confidenceStyle =
                      getConfidenceStyle(
                        contract.confidence
                      );

                    return (
                      <tr
                        key={contract.id}
                        style={{
                          borderBottom:
                            "1px solid #f0f0f0",
                        }}
                      >
                        <td
                          style={{
                            padding:
                              "14px 8px",
                            fontWeight: 800,
                          }}
                        >
                          {club?.name ??
                            "Unknown club"}
                        </td>

                        <td
                          style={{
                            padding:
                              "14px 8px",
                            color: "#4b5563",
                          }}
                        >
                          {formatDate(
                            contract.start_date
                          )}{" "}
                          —{" "}
                          {formatDate(
                            contract.end_date
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "14px 8px",
                            fontWeight: 800,
                          }}
                        >
                          {formatUSD(
                            contract.annual_salary_usd
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "14px 8px",
                            fontWeight: 700,
                          }}
                        >
                          {formatUSD(
                            contract.weekly_salary_usd
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "14px 8px",
                            color: "#4b5563",
                          }}
                        >
                          {formatLabel(
                            contract.status
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "14px 8px",
                          }}
                        >
                          {contract.confidence ? (
                            <span
                              style={{
                                display:
                                  "inline-block",
                                padding:
                                  "5px 8px",
                                borderRadius: 6,
                                background:
                                  confidenceStyle.background,
                                color:
                                  confidenceStyle.color,
                                border:
                                  `1px solid ${confidenceStyle.border}`,
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              {formatLabel(
                                contract.confidence
                              )}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{
                color: "#6b7280",
                fontSize: 15,
              }}
            >
              No contract history is currently
              available.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
