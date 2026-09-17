import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "../../lib/supabase";

import PositionMap from "../../../components/PositionMap";

type PlayerPageProps = {
  params: Promise<{ id: string }>;
};

type Player = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  position: string | null;
  preferred_foot: string | null;
  agency: string | null;
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

type Contract = {
  id: string;
  player_id: string;
  club_id: string;
  start_date: string | null;
  end_date: string | null;
  annual_salary: number | null;
  weekly_salary: number | null;
  currency: string | null;
  annual_salary_usd: number | null;
  weekly_salary_usd: number | null;
  guaranteed: boolean | null;
  option_year: boolean | null;
  status: string;
  confidence: string;
  notes: string | null;
  source_id: string | null;
};

type ContractWithClub = Contract & {
  club: Club | null;
  source: Source | null;
};

type Source = {
  id: string;
  url: string | null;
  publisher: string | null;
  reliability: string | null;
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
  confidence: string;
  notes: string | null;
};

type TransferWithClubs = Transfer & {
  from_club: Club | null;
  to_club: Club | null;
};

type MarketValue = {
  id: string;
  player_id: string;
  valuation_date: string;
  market_value: number;
  currency: string | null;
  confidence: string;
  market_value_usd: number | null;
  exchange_rate_to_usd: number | null;
  conversion_date: string | null;
  notes: string | null;
  source_id: string | null;
};

const EUR_TO_USD = 1.17;
const GBP_TO_USD = 1.35;
const CAD_TO_USD = 0.73;
const AUD_TO_USD = 0.66;

function getCountryCode(nationality: string | null): string | null {
  if (!nationality) return null;

  const normalized = nationality.trim().toLowerCase();

  const countries: Record<string, string> = {
    usa: "us",
    "united states": "us",
    "united states of america": "us",
    us: "us",

    canada: "ca",
    mexico: "mx",
    brazil: "br",
    argentina: "ar",
    colombia: "co",
    chile: "cl",
    peru: "pe",
    uruguay: "uy",
    ecuador: "ec",
    venezuela: "ve",
    costa rica: "cr",
    panama: "pa",

    england: "gb-eng",
    "england": "gb-eng",
    "united kingdom": "gb",
    uk: "gb",
    scotland: "gb-sct",
    wales: "gb-wls",
    ireland: "ie",
    "republic of ireland": "ie",
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
    poland: "pl",
    ukraine: "ua",
    "czech republic": "cz",
    czechia: "cz",
    croatia: "hr",
    serbia: "rs",
    slovenia: "si",
    romania: "ro",
    hungary: "hu",
    greece: "gr",
    turkey: "tr",

    australia: "au",
    japan: "jp",
    "south korea": "kr",
    korea: "kr",
    china: "cn",
    philippines: "ph",
    thailand: "th",
    vietnam: "vn",
    india: "in",
    newzealand: "nz",
    "new zealand": "nz",

    nigeria: "ng",
    ghana: "gh",
    zambia: "zm",
    south africa: "za",
    cameroon: "cm",
    morocco: "ma",
    egypt: "eg",
    tunisia: "tn",
    algeria: "dz",
    mali: "ml",
    senegal: "sn",
    ivorycoast: "ci",
    "ivory coast": "ci",

    jamaica: "jm",
    haiti: "ht",
    "trinidad and tobago": "tt",
    bermuda: "bm",
    puerto rico: "pr",
  };

  return countries[normalized] ?? null;
}

function formatDate(date: string | null): string {
  if (!date) return "—";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatUSD(amount: number | null): string {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return "Not publicly available";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function formatMarketValue(
  amount: number | null,
  currency: string | null
): string {
  if (amount === null || amount === undefined) return "—";

  const numericAmount = Number(amount);

  if (Number.isNaN(numericAmount)) return "—";

  let usdAmount = numericAmount;

  switch ((currency ?? "USD").toUpperCase()) {
    case "EUR":
      usdAmount = numericAmount * EUR_TO_USD;
      break;
    case "GBP":
      usdAmount = numericAmount * GBP_TO_USD;
      break;
    case "CAD":
      usdAmount = numericAmount * CAD_TO_USD;
      break;
    case "AUD":
      usdAmount = numericAmount * AUD_TO_USD;
      break;
    case "USD":
    default:
      usdAmount = numericAmount;
      break;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(usdAmount);
}

function formatTransferFee(
  amount: number | null,
  currency: string | null
): string {
  if (amount === null || amount === undefined) return "Free";

  const numericAmount = Number(amount);

  if (Number.isNaN(numericAmount)) return "—";

  const code = (currency ?? "USD").toUpperCase();

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(numericAmount);
}

function formatTransferType(type: string | null): string {
  if (!type) return "Transfer";

  const normalized = type.toLowerCase();

  if (normalized === "free") return "Free Transfer";
  if (normalized === "loan") return "Loan";
  if (normalized === "permanent") return "Permanent Transfer";
  if (normalized === "transfer") return "Transfer";

  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatConfidence(confidence: string | null): string {
  if (!confidence) return "Unknown";

  switch (confidence.toLowerCase()) {
    case "verified":
      return "Verified";
    case "reported":
      return "Reported";
    case "reliable":
      return "Reliable";
    case "estimated":
      return "Estimated";
    case "estimate":
      return "Estimated";
    default:
      return confidence.charAt(0).toUpperCase() + confidence.slice(1);
  }
}

function getConfidenceStyle(confidence: string | null): string {
  switch ((confidence ?? "").toLowerCase()) {
    case "verified":
      return "bg-emerald-100 text-emerald-700";
    case "reported":
      return "bg-blue-100 text-blue-700";
    case "reliable":
      return "bg-blue-100 text-blue-700";
    case "estimated":
    case "estimate":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;

  const birth = new Date(`${dateOfBirth}T00:00:00`);

  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDifference = today.getMonth() - birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

function salaryStatus(contract: ContractWithClub | null): string {
  if (!contract || contract.annual_salary_usd === null) {
    return "Not publicly available";
  }

  return formatConfidence(contract.confidence);
}

function salaryStatusClass(contract: ContractWithClub | null): string {
  if (!contract || contract.annual_salary_usd === null) {
    return "bg-gray-100 text-gray-600";
  }

  return getConfidenceStyle(contract.confidence);
}

const cardStyle =
  "rounded-2xl border border-gray-200 bg-white shadow-sm";

const sectionTitleStyle =
  "text-lg font-bold tracking-tight text-gray-900";

const labelStyle =
  "text-xs font-semibold uppercase tracking-wide text-gray-500";

const valueStyle =
  "mt-1 text-sm font-medium text-gray-900";

export default async function PlayerPage({
  params,
}: PlayerPageProps) {
  const { id } = await params;

  const {
    data: player,
    error: playerError,
  } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .single();

  if (playerError || !player) {
    notFound();
  }

  const typedPlayer = player as Player;

  const [
    contractsResponse,
    transfersResponse,
    marketValuesResponse,
  ] = await Promise.all([
    supabase
      .from("contracts")
      .select("*")
      .eq("player_id", id)
      .order("start_date", { ascending: false }),

    supabase
      .from("transfers")
      .select("*")
      .eq("player_id", id)
      .order("transfer_date", { ascending: false }),

    supabase
      .from("market_values")
      .select("*")
      .eq("player_id", id)
      .order("valuation_date", { ascending: false }),
  ]);

  const contracts = (contractsResponse.data ?? []) as Contract[];

  const transfers = (transfersResponse.data ?? []) as Transfer[];

  const marketValues = (marketValuesResponse.data ?? []) as MarketValue[];

  const clubIds = Array.from(
    new Set(
      [
        ...contracts.map((contract) => contract.club_id),
        ...transfers.flatMap((transfer) => [
          transfer.from_club_id,
          transfer.to_club_id,
        ]),
      ].filter(Boolean)
    )
  );

  let clubs: Club[] = [];

  if (clubIds.length > 0) {
    const { data: clubsData } = await supabase
      .from("clubs")
      .select("*")
      .in("id", clubIds);

    clubs = (clubsData ?? []) as Club[];
  }

  const clubMap = new Map<string, Club>(
    clubs.map((club) => [club.id, club])
  );

  const sourceIds = Array.from(
    new Set(
      [
        ...contracts.map((contract) => contract.source_id),
        ...transfers.map((transfer) => transfer.source_id),
        ...marketValues.map((marketValue) => marketValue.source_id),
      ].filter(Boolean)
    )
  );

  let sources: Source[] = [];

  if (sourceIds.length > 0) {
    const { data: sourcesData } = await supabase
      .from("sources")
      .select("*")
      .in("id", sourceIds);

    sources = (sourcesData ?? []) as Source[];
  }

  const sourceMap = new Map<string, Source>(
    sources.map((source) => [source.id, source])
  );

  const contractsWithClubs: ContractWithClub[] = contracts.map(
    (contract) => ({
      ...contract,
      club: clubMap.get(contract.club_id) ?? null,
      source: contract.source_id
        ? sourceMap.get(contract.source_id) ?? null
        : null,
    })
  );

  const transfersWithClubs: TransferWithClubs[] = transfers.map(
    (transfer) => ({
      ...transfer,
      from_club: transfer.from_club_id
        ? clubMap.get(transfer.from_club_id) ?? null
        : null,
      to_club: transfer.to_club_id
        ? clubMap.get(transfer.to_club_id) ?? null
        : null,
    })
  );

  const activeContract =
    contractsWithClubs.find(
      (contract) =>
        contract.status?.toLowerCase() === "active" &&
        contract.club_id
    ) ??
    contractsWithClubs.find(
      (contract) => contract.status?.toLowerCase() === "active"
    ) ??
    contractsWithClubs[0] ??
    null;

  const currentClub = activeContract?.club ?? null;

  const currentMarketValue = marketValues[0] ?? null;
  const previousMarketValue = marketValues[1] ?? null;

  const age = calculateAge(typedPlayer.date_of_birth);
  const countryCode = getCountryCode(typedPlayer.nationality);

  const annualSalary =
    activeContract?.annual_salary_usd ?? null;

  const weeklySalary =
    activeContract?.weekly_salary_usd ?? null;

  const hasSalary =
    annualSalary !== null || weeklySalary !== null;

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-xl font-black tracking-tight text-gray-900"
          >
            Women&apos;s Football Market
          </Link>

          <div className="flex items-center gap-5 text-sm font-semibold text-gray-600">
            <Link
              href="/"
              className="transition hover:text-gray-900"
            >
              Home
            </Link>

            <Link
              href="/players"
              className="transition hover:text-gray-900"
            >
              Players
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/players"
            className="text-sm font-semibold text-gray-500 transition hover:text-gray-900"
          >
            ← Back to Players
          </Link>
        </div>

        <section className={`${cardStyle} overflow-hidden`}>
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 px-6 py-8 text-white sm:px-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-5">
                {typedPlayer.photo_url ? (
                  <img
                    src={typedPlayer.photo_url}
                    alt={typedPlayer.full_name}
                    className="h-28 w-28 rounded-full border-4 border-white/20 object-cover shadow-lg"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/20 bg-white/10 text-3xl font-black">
                    {typedPlayer.full_name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                )}

                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                      {typedPlayer.full_name}
                    </h1>

                    {countryCode ? (
                      <img
                        src={`https://flagcdn.com/w40/${countryCode}.png`}
                        srcSet={`https://flagcdn.com/w80/${countryCode}.png 2x`}
                        width="40"
                        height="30"
                        alt={typedPlayer.nationality ?? "Nationality"}
                        className="h-6 w-8 rounded object-cover shadow-sm"
                      />
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-300">
                    {typedPlayer.position ? (
                      <span>{typedPlayer.position}</span>
                    ) : null}

                    {age !== null ? (
                      <span>{age} years old</span>
                    ) : null}

                    {typedPlayer.nationality ? (
                      <span>{typedPlayer.nationality}</span>
                    ) : null}
                  </div>
                </div>
              </div>

              {currentClub ? (
                <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
                  {currentClub.logo_url ? (
                    <img
                      src={currentClub.logo_url}
                      alt={currentClub.name}
                      className="h-12 w-12 object-contain"
                    />
                  ) : null}

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Current Club
                    </div>
                    <div className="font-bold text-white">
                      {currentClub.name}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className={`${cardStyle} p-6 lg:col-span-2`}>
            <h2 className={sectionTitleStyle}>
              Player Information
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className={labelStyle}>Nationality</div>
                <div className={valueStyle}>
                  {typedPlayer.nationality || "—"}
                </div>
              </div>

              <div>
                <div className={labelStyle}>Position</div>
                <div className={valueStyle}>
                  {typedPlayer.position || "—"}
                </div>
              </div>

              <div>
                <div className={labelStyle}>Secondary Position</div>
                <div className={valueStyle}>
                  {typedPlayer.secondary_position || "—"}
                </div>
              </div>

              <div>
                <div className={labelStyle}>Date of Birth</div>
                <div className={valueStyle}>
                  {formatDate(typedPlayer.date_of_birth)}
                </div>
              </div>

              <div>
                <div className={labelStyle}>Age</div>
                <div className={valueStyle}>
                  {age !== null ? `${age} years` : "—"}
                </div>
              </div>

              <div>
                <div className={labelStyle}>Height</div>
                <div className={valueStyle}>
                  {typedPlayer.height_cm
                    ? `${typedPlayer.height_cm} cm`
                    : "—"}
                </div>
              </div>

              <div>
                <div className={labelStyle}>Birthplace</div>
                <div className={valueStyle}>
                  {typedPlayer.birthplace || "—"}
                </div>
              </div>

              <div>
                <div className={labelStyle}>Preferred Foot</div>
                <div className={valueStyle}>
                  {typedPlayer.preferred_foot || "—"}
                </div>
              </div>

              <div>
                <div className={labelStyle}>Agency</div>
                <div className={valueStyle}>
                  {typedPlayer.agency || "—"}
                </div>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <div className={labelStyle}>Youth Clubs</div>
                <div className={valueStyle}>
                  {typedPlayer.youth_clubs || "—"}
                </div>
              </div>
            </div>
          </section>

          <section className={`${cardStyle} p-6`}>
            <h2 className={sectionTitleStyle}>
              Position Map
            </h2>

            <div className="mt-4">
              <PositionMap
                position={typedPlayer.position ?? ""}
                secondaryPosition={
                  typedPlayer.secondary_position ?? ""
                }
              />
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className={`${cardStyle} p-6`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className={sectionTitleStyle}>
                  Market Value
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Transfer-market valuation · USD
                </p>
              </div>

              {currentMarketValue ? (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${getConfidenceStyle(
                    currentMarketValue.confidence
                  )}`}
                >
                  {formatConfidence(currentMarketValue.confidence)}
                </span>
              ) : null}
            </div>

            {currentMarketValue ? (
              <div className="mt-6">
                <div className="text-4xl font-black tracking-tight text-gray-900">
                  {formatMarketValue(
                    currentMarketValue.market_value_usd ??
                      currentMarketValue.market_value,
                    currentMarketValue.market_value_usd !== null
                      ? "USD"
                      : currentMarketValue.currency
                  )}
                </div>

                <div className="mt-2 text-sm text-gray-500">
                  Valuation date:{" "}
                  {formatDate(currentMarketValue.valuation_date)}
                </div>

                {previousMarketValue ? (
                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <div className={labelStyle}>
                      Previous Valuation
                    </div>

                    <div className="mt-1 text-lg font-bold text-gray-900">
                      {formatMarketValue(
                        previousMarketValue.market_value_usd ??
                          previousMarketValue.market_value,
                        previousMarketValue.market_value_usd !== null
                          ? "USD"
                          : previousMarketValue.currency
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      {formatDate(
                        previousMarketValue.valuation_date
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-6 rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
                No market value currently available.
              </div>
            )}
          </section>

          <section className={`${cardStyle} p-6`}>
            <h2 className={sectionTitleStyle}>
              Current Club
            </h2>

            {currentClub ? (
              <div className="mt-5 flex items-center gap-4">
                {currentClub.logo_url ? (
                  <img
                    src={currentClub.logo_url}
                    alt={currentClub.name}
                    className="h-16 w-16 object-contain"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-xl font-black text-gray-400">
                    {currentClub.name.charAt(0)}
                  </div>
                )}

                <div>
                  <div className="text-xl font-black text-gray-900">
                    {currentClub.name}
                  </div>

                  <div className="mt-1 text-sm text-gray-500">
                    {currentClub.country || "—"}
                    {currentClub.league
                      ? ` · ${currentClub.league}`
                      : ""}
                  </div>

                  {typedPlayer.current_club_since ? (
                    <div className="mt-1 text-xs text-gray-500">
                      Since{" "}
                      {formatDate(
                        typedPlayer.current_club_since
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
                Current club not available.
              </div>
            )}
          </section>
        </div>

        <section className={`${cardStyle} mt-6 p-6`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className={sectionTitleStyle}>
                Contract
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Current contract and publicly available compensation
              </p>
            </div>

            {activeContract ? (
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${getConfidenceStyle(
                  activeContract.confidence
                )}`}
              >
                {formatConfidence(activeContract.confidence)}
              </span>
            ) : null}
          </div>

          {activeContract ? (
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <div className={labelStyle}>
                  Annual Salary
                </div>

                <div className="mt-2 text-2xl font-black text-gray-900">
                  {formatUSD(annualSalary)}
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <div className={labelStyle}>
                  Weekly Salary
                </div>

                <div className="mt-2 text-2xl font-black text-gray-900">
                  {formatUSD(weeklySalary)}
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <div className={labelStyle}>
                  Salary Status
                </div>

                <div className="mt-3">
                  <span
                    className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${salaryStatusClass(
                      activeContract
                    )}`}
                  >
                    {salaryStatus(activeContract)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <div className={labelStyle}>
                  Contract Status
                </div>

                <div className="mt-2 text-lg font-bold text-gray-900">
                  {activeContract.status || "—"}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
              No contract information currently available.
            </div>
          )}

          {activeContract ? (
            <div className="mt-6 grid gap-5 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className={labelStyle}>
                  Club
                </div>
                <div className={valueStyle}>
                  {activeContract.club?.name || "—"}
                </div>
              </div>

              <div>
                <div className={labelStyle}>
                  Start Date
                </div>
                <div className={valueStyle}>
                  {formatDate(activeContract.start_date)}
                </div>
              </div>

              <div>
                <div className={labelStyle}>
                  End Date
                </div>
                <div className={valueStyle}>
                  {formatDate(activeContract.end_date)}
                </div>
              </div>

              <div>
                <div className={labelStyle}>
                  Guaranteed
                </div>
                <div className={valueStyle}>
                  {activeContract.guaranteed === null
                    ? "—"
                    : activeContract.guaranteed
                    ? "Yes"
                    : "No"}
                </div>
              </div>
            </div>
          ) : null}

          {activeContract?.notes ? (
            <div className="mt-5 rounded-xl border border-gray-100 bg-white p-4">
              <div className={labelStyle}>Salary / Contract Note</div>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {activeContract.notes}
              </p>
            </div>
          ) : null}

          {activeContract?.source?.url ? (
            <div className="mt-5 border-t border-gray-100 pt-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span>Salary source:</span>

                <a
                  href={activeContract.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-gray-900 underline decoration-gray-300 underline-offset-2 transition hover:decoration-gray-900"
                >
                  {activeContract.source.publisher ||
                    "View source"}
                </a>
              </div>
            </div>
          ) : null}

          {!hasSalary && activeContract ? (
            <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
              The contract is publicly documented, but an
              individual salary figure is not currently publicly
              available from a defensible source.
            </div>
          ) : null}
        </section>

        <section className={`${cardStyle} mt-6 p-6`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className={sectionTitleStyle}>
                Transfer History
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Recorded club movements
              </p>
            </div>

            <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
              {transfersWithClubs.length}{" "}
              {transfersWithClubs.length === 1
                ? "transfer"
                : "transfers"}
            </div>
          </div>

          {transfersWithClubs.length > 0 ? (
            <div className="mt-6 overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[120px_1fr_80px_1fr_140px] gap-4 border-b border-gray-200 px-3 pb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
                  <div>Date</div>
                  <div>From</div>
                  <div></div>
                  <div>To</div>
                  <div>Fee</div>
                </div>

                <div className="divide-y divide-gray-100">
                  {transfersWithClubs.map((transfer) => (
                    <div
                      key={transfer.id}
                      className="grid grid-cols-[120px_1fr_80px_1fr_140px] items-center gap-4 px-3 py-4"
                    >
                      <div className="text-sm font-medium text-gray-600">
                        {formatDate(transfer.transfer_date)}
                      </div>

                      <div className="font-semibold text-gray-900">
                        {transfer.from_club?.name || "—"}
                      </div>

                      <div className="text-center text-gray-400">
                        →
                      </div>

                      <div className="font-semibold text-gray-900">
                        {transfer.to_club?.name || "—"}
                      </div>

                      <div>
                        <div className="font-bold text-gray-900">
                          {formatTransferFee(
                            transfer.fee,
                            transfer.currency
                          )}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {formatTransferType(
                            transfer.transfer_type
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
              No transfer history currently available.
            </div>
          )}
        </section>

        <section className={`${cardStyle} mt-6 p-6`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className={sectionTitleStyle}>
                Contract History
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Historical and current contracts
              </p>
            </div>

            <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
              {contractsWithClubs.length}{" "}
              {contractsWithClubs.length === 1
                ? "contract"
                : "contracts"}
            </div>
          </div>

          {contractsWithClubs.length > 0 ? (
            <div className="mt-6 space-y-4">
              {contractsWithClubs.map((contract) => {
                const contractAnnualSalary =
                  contract.annual_salary_usd;

                const contractWeeklySalary =
                  contract.weekly_salary_usd;

                const salaryAvailable =
                  contractAnnualSalary !== null ||
                  contractWeeklySalary !== null;

                return (
                  <div
                    key={contract.id}
                    className="rounded-xl border border-gray-200 p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="text-lg font-black text-gray-900">
                          {contract.club?.name || "Unknown Club"}
                        </div>

                        <div className="mt-1 text-sm text-gray-500">
                          {formatDate(contract.start_date)}{" "}
                          →{" "}
                          {formatDate(contract.end_date)}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getConfidenceStyle(
                            contract.confidence
                          )}`}
                        >
                          {formatConfidence(
                            contract.confidence
                          )}
                        </span>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                          {contract.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <div className={labelStyle}>
                          Annual Salary
                        </div>
                        <div className={valueStyle}>
                          {formatUSD(
                            contractAnnualSalary
                          )}
                        </div>
                      </div>

                      <div>
                        <div className={labelStyle}>
                          Weekly Salary
                        </div>
                        <div className={valueStyle}>
                          {formatUSD(
                            contractWeeklySalary
                          )}
                        </div>
                      </div>

                      <div>
                        <div className={labelStyle}>
                          Guaranteed
                        </div>
                        <div className={valueStyle}>
                          {contract.guaranteed === null
                            ? "—"
                            : contract.guaranteed
                            ? "Yes"
                            : "No"}
                        </div>
                      </div>

                      <div>
                        <div className={labelStyle}>
                          Option Year
                        </div>
                        <div className={valueStyle}>
                          {contract.option_year === null
                            ? "—"
                            : contract.option_year
                            ? "Yes"
                            : "No"}
                        </div>
                      </div>
                    </div>

                    {!salaryAvailable ? (
                      <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
                        Salary not publicly available.
                      </div>
                    ) : null}

                    {contract.source?.url ? (
                      <div className="mt-4 border-t border-gray-100 pt-4 text-xs text-gray-500">
                        Source:{" "}
                        <a
                          href={contract.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-gray-900 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-900"
                        >
                          {contract.source.publisher ||
                            "View source"}
                        </a>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
              No contract history currently available.
            </div>
          )}
        </section>

        <footer className="py-10 text-center text-xs text-gray-400">
          Women&apos;s Football Market · Player data and valuations
        </footer>
      </div>
    </main>
  );
}
