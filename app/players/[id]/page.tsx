"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import PositionMap from "../../components/PositionMap";

type Player = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  position: string | null;
  secondary_position: string | null;
  preferred_foot: string | null;
  agency: string | null;
  photo_url: string | null;
  height_cm: number | null;
  birthplace: string | null;
  current_club_since: string | null;
  youth_clubs: string | null;
};

type Club = {
  id: string;
  name: string;
  league: string | null;
  country: string | null;
  logo_url: string | null;
};

type Contract = {
  id: string;
  start_date: string | null;
  end_date: string | null;
  annual_salary: number | null;
  weekly_salary: number | null;
  currency: string | null;
  status: string | null;
  confidence: string | null;
  notes: string | null;
  club: Club | null;
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
  confidence: string | null;
  notes: string | null;
};

function formatDate(date: string | null) {
  if (!date) return "—";

  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSalary(amount: number | null, currency: string | null) {
  if (amount === null || amount === undefined) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMarketValue(
  amount: number | null,
  currency: string | null
) {
  if (amount === null || amount === undefined) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTransferFee(
  amount: number | null,
  currency: string | null
) {
  if (amount === null || amount === undefined) return "Free";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTransferType(type: string | null) {
  if (!type) return "Transfer";

  return type.charAt(0).toUpperCase() + type.slice(1);
}

function calculateAge(dateOfBirth: string | null) {
  if (!dateOfBirth) return null;

  const birthDate = new Date(dateOfBirth + "T00:00:00");
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

function getFlagUrl(nationality: string | null) {
  if (!nationality) return null;

  const countryCodes: Record<string, string> = {
    USA: "us",
    United States: "us",
    Canada: "ca",
    Mexico: "mx",
    Colombia: "co",
    Brazil: "br",
    Argentina: "ar",
    England: "gb-eng",
    France: "fr",
    Germany: "de",
    Spain: "es",
    Italy: "it",
    Netherlands: "nl",
    Denmark: "dk",
    Sweden: "se",
    Norway: "no",
    Australia: "au",
    Japan: "jp",
    Korea: "kr",
    "South Korea": "kr",
    Nigeria: "ng",
    Ghana: "gh",
    Jamaica: "jm",
    Haiti: "ht",
    Portugal: "pt",
    Ireland: "ie",
    Scotland: "gb-sct",
    Wales: "gb-wls",
  };

  const code = countryCodes[nationality];

  if (!code) return null;

  return `https://flagcdn.com/w40/${code}.png`;
}

export default function PlayerPage({
  params,
}: {
  params: { id: string };
}) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [marketValues, setMarketValues] = useState<MarketValue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlayer() {
      setLoading(true);

      const { data: playerData } = await supabase
        .from("players")
        .select(
          `
          id,
          full_name,
          date_of_birth,
          nationality,
          position,
          secondary_position,
          preferred_foot,
          agency,
          photo_url,
          height_cm,
          birthplace,
          current_club_since,
          youth_clubs
        `
        )
        .eq("id", params.id)
        .single();

      if (playerData) {
        setPlayer(playerData);
      }

      const { data: contractData } = await supabase
        .from("contracts")
        .select(
          `
          id,
          start_date,
          end_date,
          annual_salary,
          weekly_salary,
          currency,
          status,
          confidence,
          notes,
          club:clubs(
            id,
            name,
            league,
            country,
            logo_url
          )
        `
        )
        .eq("player_id", params.id)
        .order("start_date", { ascending: false });

      if (contractData) {
        setContracts(contractData as unknown as Contract[]);
      }

      const { data: transferData } = await supabase
        .from("transfers")
        .select(
          `
          id,
          transfer_date,
          transfer_type,
          fee,
          currency,
          confidence,
          from_club:clubs!transfers_from_club_id_fkey(
            id,
            name,
            league,
            country,
            logo_url
          ),
          to_club:clubs!transfers_to_club_id_fkey(
            id,
            name,
            league,
            country,
            logo_url
          )
        `
        )
        .eq("player_id", params.id)
        .order("transfer_date", { ascending: false });

      if (transferData) {
        setTransfers(transferData as unknown as Transfer[]);
      }

      const { data: marketValueData } = await supabase
        .from("market_values")
        .select(
          `
          id,
          valuation_date,
          market_value,
          currency,
          confidence,
          notes
        `
        )
        .eq("player_id", params.id)
        .order("valuation_date", { ascending: false });

      if (marketValueData) {
        setMarketValues(marketValueData as MarketValue[]);
      }

      setLoading(false);
    }

    loadPlayer();
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-slate-400">Loading player...</p>
        </div>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold">Player not found</h1>

          <Link
            href="/players"
            className="mt-4 inline-block text-blue-400 hover:text-blue-300"
          >
            ← Back to players
          </Link>
        </div>
      </main>
    );
  }

  const age = calculateAge(player.date_of_birth);
  const flagUrl = getFlagUrl(player.nationality);

  const currentContract = contracts.find(
    (contract) =>
      contract.status?.toLowerCase() === "active"
  );

  const currentClub = currentContract?.club || null;

  const currentMarketValue = marketValues[0] || null;
  const previousMarketValues = marketValues.slice(1);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Link
          href="/players"
          className="mb-6 inline-block text-sm text-slate-400 hover:text-white"
        >
          ← Back to players
        </Link>

        {/* PROFILE HEADER */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-800">
              {player.photo_url ? (
                <img
                  src={player.photo_url}
                  alt={player.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-slate-500">
                  {player.full_name.charAt(0)}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold md:text-4xl">
                  {player.full_name}
                </h1>

                {flagUrl && (
                  <img
                    src={flagUrl}
                    alt={player.nationality || ""}
                    className="h-auto w-8 rounded-sm"
                  />
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                {player.position && (
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-white">
                    {player.position}
                  </span>
                )}

                {player.secondary_position && (
                  <span className="rounded-full bg-slate-800 px-3 py-1">
                    {player.secondary_position}
                  </span>
                )}

                {age !== null && (
                  <span>{age} years old</span>
                )}

                {currentClub && (
                  <>
                    <span>•</span>
                    <span className="text-white">
                      {currentClub.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* PLAYER INFORMATION */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-5 text-xl font-bold">
            Player Information
          </h2>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Nationality
              </p>

              <div className="mt-1 flex items-center gap-2">
                {flagUrl && (
                  <img
                    src={flagUrl}
                    alt={player.nationality || ""}
                    className="h-auto w-7 rounded-sm"
                  />
                )}

                <p className="font-medium">
                  {player.nationality || "—"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Date of Birth
              </p>
              <p className="mt-1 font-medium">
                {formatDate(player.date_of_birth)}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Age
              </p>
              <p className="mt-1 font-medium">
                {age !== null ? age : "—"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Position
              </p>
              <p className="mt-1 font-medium">
                {player.position || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Secondary Position
              </p>
              <p className="mt-1 font-medium">
                {player.secondary_position || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Preferred Foot
              </p>
              <p className="mt-1 font-medium">
                {player.preferred_foot || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Height
              </p>
              <p className="mt-1 font-medium">
                {player.height_cm
                  ? `${player.height_cm} cm`
                  : "—"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Birthplace
              </p>
              <p className="mt-1 font-medium">
                {player.birthplace || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Agency
              </p>
              <p className="mt-1 font-medium">
                {player.agency || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Current Club Since
              </p>
              <p className="mt-1 font-medium">
                {formatDate(player.current_club_since)}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Youth Club
              </p>
              <p className="mt-1 font-medium">
                {player.youth_clubs || "—"}
              </p>
            </div>
          </div>
        </section>

        {/* POSITION MAP */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-5 text-xl font-bold">
            Position Map
          </h2>

          <PositionMap
            primaryPosition={player.position}
            secondaryPosition={player.secondary_position}
          />
        </section>

        {/* CURRENT CLUB */}
        {currentClub && (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-5 text-xl font-bold">
              Current Club
            </h2>

            <div className="flex items-center gap-4">
              {currentClub.logo_url && (
                <img
                  src={currentClub.logo_url}
                  alt={currentClub.name}
                  className="h-16 w-16 object-contain"
                />
              )}

              <div>
                <p className="text-xl font-semibold">
                  {currentClub.name}
                </p>

                <p className="text-sm text-slate-400">
                  {currentClub.league || "—"}
                  {currentClub.country
                    ? ` • ${currentClub.country}`
                    : ""}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* MARKET VALUE */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              Market Value
            </h2>

            {currentMarketValue?.confidence && (
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                {currentMarketValue.confidence}
              </span>
            )}
          </div>

          {currentMarketValue ? (
            <div className="mt-5">
              <p className="text-4xl font-bold">
                {formatMarketValue(
                  currentMarketValue.market_value,
                  currentMarketValue.currency
                )}
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Valuation date:{" "}
                {formatDate(
                  currentMarketValue.valuation_date
                )}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Source: Third-party
              </p>

              {currentMarketValue.notes && (
                <p className="mt-4 max-w-3xl text-sm text-slate-500">
                  {currentMarketValue.notes}
                </p>
              )}

              {previousMarketValues.length > 0 && (
                <div className="mt-6 border-t border-slate-800 pt-5">
                  <h3 className="mb-3 text-sm font-semibold text-slate-300">
                    Previous Valuations
                  </h3>

                  <div className="space-y-3">
                    {previousMarketValues.map((value) => (
                      <div
                        key={value.id}
                        className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-3"
                      >
                        <span className="text-sm text-slate-400">
                          {formatDate(value.valuation_date)}
                        </span>

                        <span className="font-medium">
                          {formatMarketValue(
                            value.market_value,
                            value.currency
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-slate-400">
              No market value available.
            </p>
          )}
        </section>

        {/* CURRENT CONTRACT */}
        {currentContract && (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-5 text-xl font-bold">
              Current Contract
            </h2>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Club
                </p>
                <p className="mt-1 font-medium">
                  {currentContract.club?.name || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Contract
                </p>
                <p className="mt-1 font-medium">
                  {formatDate(currentContract.start_date)}
                  {" — "}
                  {formatDate(currentContract.end_date)}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Annual Salary
                </p>
                <p className="mt-1 font-medium">
                  {formatSalary(
                    currentContract.annual_salary,
                    currentContract.currency
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Weekly Salary
                </p>
                <p className="mt-1 font-medium">
                  {formatSalary(
                    currentContract.weekly_salary,
                    currentContract.currency
                  )}
                </p>
              </div>
            </div>

            {currentContract.confidence && (
              <div className="mt-5">
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  Confidence: {currentContract.confidence}
                </span>
              </div>
            )}

            {currentContract.notes && (
              <p className="mt-4 text-sm text-slate-500">
                {currentContract.notes}
              </p>
            )}
          </section>
        )}

        {/* CONTRACT HISTORY */}
        {contracts.length > 1 && (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-5 text-xl font-bold">
              Contract History
            </h2>

            <div className="space-y-4">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">
                        {contract.club?.name || "Unknown club"}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {formatDate(contract.start_date)}
                        {" — "}
                        {formatDate(contract.end_date)}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="font-medium">
                        {formatSalary(
                          contract.annual_salary,
                          contract.currency
                        )}
                      </p>

                      {contract.status && (
                        <p className="mt-1 text-xs text-slate-500">
                          {contract.status}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TRANSFER HISTORY */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-5 text-xl font-bold">
            Transfer History
          </h2>

          {transfers.length === 0 ? (
            <p className="text-slate-400">
              No transfer history available.
            </p>
          ) : (
            <div className="space-y-4">
              {transfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
                >
                  <div className="grid items-center gap-4 md:grid-cols-[120px_1fr_50px_1fr_180px]">
                    <div>
                      <p className="text-sm font-medium">
                        {formatDate(transfer.transfer_date)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {transfer.from_club?.logo_url && (
                        <img
                          src={transfer.from_club.logo_url}
                          alt={transfer.from_club.name}
                          className="h-10 w-10 object-contain"
                        />
                      )}

                      <div>
                        <p className="font-medium">
                          {transfer.from_club?.name ||
                            "Unknown club"}
                        </p>

                        {transfer.from_club?.league && (
                          <p className="text-xs text-slate-500">
                            {transfer.from_club.league}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-center text-xl text-slate-500">
                      →
                    </div>

                    <div className="flex items-center gap-3">
                      {transfer.to_club?.logo_url && (
                        <img
                          src={transfer.to_club.logo_url}
                          alt={transfer.to_club.name}
                          className="h-10 w-10 object-contain"
                        />
                      )}

                      <div>
                        <p className="font-medium">
                          {transfer.to_club?.name ||
                            "Unknown club"}
                        </p>

                        {transfer.to_club?.league && (
                          <p className="text-xs text-slate-500">
                            {transfer.to_club.league}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="font-medium">
                        {transfer.fee === null ||
                        transfer.fee === undefined ? (
                          transfer.transfer_type?.toLowerCase() ===
                          "free" ? (
                            "Free"
                          ) : (
                            <>
                              {formatTransferType(
                                transfer.transfer_type
                              )}
                              {" · "}
                              Free
                            </>
                          )
                        ) : (
                          <>
                            {formatTransferType(
                              transfer.transfer_type
                            )}
                            {" · "}
                            {formatTransferFee(
                              transfer.fee,
                              transfer.currency
                            )}
                          </>
                        )}
                      </p>

                      {transfer.confidence && (
                        <p className="mt-1 text-xs text-slate-500">
                          Confidence: {transfer.confidence}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
