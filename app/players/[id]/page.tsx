'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import PositionMap from '../../components/PositionMap'

type Player = {
  id: string
  full_name: string
  date_of_birth: string | null
  nationality: string | null
  position: string | null
  preferred_foot: string | null
  agency: string | null
  photo_url: string | null
  height_cm: number | null
  birthplace: string | null
  secondary_position: string | null
  current_club_since: string | null
  youth_clubs: string | null
}

type Club = {
  id: string
  name: string
  country: string | null
  league: string | null
  logo_url: string | null
}

type Contract = {
  id: string
  start_date: string | null
  end_date: string | null
  annual_salary: number | null
  weekly_salary: number | null
  currency: string | null
  status: string | null
  confidence: string | null
  notes: string | null
  clubs: Club | null
}

type Transfer = {
  id: string
  transfer_date: string | null
  transfer_type: string | null
  fee: number | null
  currency: string | null
  confidence: string | null
  from_club: Club | null
  to_club: Club | null
}

type MarketValue = {
  id: string
  valuation_date: string | null
  market_value: number | null
  currency: string | null
  confidence: string | null
  notes: string | null
}

function formatDate(date: string | null) {
  if (!date) return '—'

  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatSalary(
  amount: number | null,
  currency: string | null,
  weekly = false
) {
  if (amount === null || amount === undefined) return '—'

  const symbol =
    currency === 'EUR'
      ? '€'
      : currency === 'GBP'
        ? '£'
        : currency === 'DKK'
          ? 'kr '
          : '$'

  const formatted = amount.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })

  return weekly
    ? `${symbol}${formatted} / week`
    : `${symbol}${formatted} / year`
}

function formatMarketValue(
  amount: number | null,
  currency: string | null
) {
  if (amount === null || amount === undefined) return '—'

  const symbol =
    currency === 'EUR'
      ? '€'
      : currency === 'GBP'
        ? '£'
        : currency === 'DKK'
          ? 'kr '
          : '$'

  if (amount >= 1000000) {
    return `${symbol}${(amount / 1000000).toFixed(1)}M`
  }

  if (amount >= 1000) {
    return `${symbol}${Math.round(amount / 1000)}K`
  }

  return `${symbol}${amount.toLocaleString('en-US')}`
}

function formatTransferFee(
  amount: number | null,
  currency: string | null
) {
  if (amount === null || amount === undefined) return null

  const symbol =
    currency === 'EUR'
      ? '€'
      : currency === 'GBP'
        ? '£'
        : currency === 'DKK'
          ? 'kr '
          : '$'

  return `${symbol}${amount.toLocaleString('en-US')}`
}

function formatTransferType(type: string | null) {
  if (!type) return 'Transfer'

  const value = type.toLowerCase()

  if (value === 'free') return 'Free'
  if (value === 'loan') return 'Loan'
  if (value === 'permanent') return 'Transfer'

  return type.charAt(0).toUpperCase() + type.slice(1)
}

function calculateAge(dateOfBirth: string | null) {
  if (!dateOfBirth) return null

  const birthDate = new Date(dateOfBirth + 'T00:00:00')
  const today = new Date()

  let age = today.getFullYear() - birthDate.getFullYear()

  const monthDifference = today.getMonth() - birthDate.getMonth()

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birthDate.getDate())
  ) {
    age--
  }

  return age
}

function getFlagUrl(nationality: string | null) {
  if (!nationality) return null

  const flags: Record<string, string> = {
    USA: 'us',
    'United States': 'us',
    Canada: 'ca',
    Mexico: 'mx',
    Colombia: 'co',
    Brazil: 'br',
    Argentina: 'ar',
    England: 'gb-eng',
    France: 'fr',
    Germany: 'de',
    Spain: 'es',
    Italy: 'it',
    Netherlands: 'nl',
    Denmark: 'dk',
    Sweden: 'se',
    Norway: 'no',
    Australia: 'au',
    Japan: 'jp',
    Korea: 'kr',
    'South Korea': 'kr',
    Nigeria: 'ng',
    Ghana: 'gh',
    Jamaica: 'jm',
    Haiti: 'ht',
    Portugal: 'pt',
    Ireland: 'ie',
    Scotland: 'gb-sct',
    Wales: 'gb-wls',
  }

  const code = flags[nationality]

  if (!code) return null

  return `https://flagcdn.com/w80/${code}.png`
}

export default function PlayerPage({
  params,
}: {
  params: { id: string }
}) {
  const [player, setPlayer] = useState<Player | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [marketValues, setMarketValues] = useState<MarketValue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadPlayer() {
      setLoading(true)
      setError('')

      try {
        const playerId = params.id

        if (!playerId) {
          setError('Player ID is missing.')
          setLoading(false)
          return
        }

        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select(
            'id, full_name, date_of_birth, nationality, position, preferred_foot, agency, photo_url, height_cm, birthplace, secondary_position, current_club_since, youth_clubs'
          )
          .eq('id', playerId)
          .single()

        if (playerError) {
          console.error('Player query error:', playerError)
          setError(playerError.message)
          setLoading(false)
          return
        }

        if (!playerData) {
          setError('Player not found.')
          setLoading(false)
          return
        }

        setPlayer(playerData)

        const { data: contractData, error: contractError } =
          await supabase
            .from('contracts')
            .select(
              'id, start_date, end_date, annual_salary, weekly_salary, currency, status, confidence, notes, clubs(id, name, country, league, logo_url)'
            )
            .eq('player_id', playerId)
            .order('start_date', { ascending: false })

        if (contractError) {
          console.error('Contract query error:', contractError)
        } else {
          setContracts(contractData || [])
        }

        const { data: transferData, error: transferError } =
          await supabase
            .from('transfers')
            .select(
              'id, transfer_date, transfer_type, fee, currency, confidence, from_club:clubs!transfers_from_club_id_fkey(id, name, country, league, logo_url), to_club:clubs!transfers_to_club_id_fkey(id, name, country, league, logo_url)'
            )
            .eq('player_id', playerId)
            .order('transfer_date', { ascending: false })

        if (transferError) {
          console.error('Transfer query error:', transferError)
        } else {
          setTransfers(transferData || [])
        }

        const { data: marketValueData, error: marketValueError } =
          await supabase
            .from('market_values')
            .select(
              'id, valuation_date, market_value, currency, confidence, notes'
            )
            .eq('player_id', playerId)
            .order('valuation_date', { ascending: false })

        if (marketValueError) {
          console.error('Market value query error:', marketValueError)
        } else {
          setMarketValues(marketValueData || [])
        }
      } catch (err) {
        console.error('Unexpected player page error:', err)
        setError('Unable to load player.')
      } finally {
        setLoading(false)
      }
    }

    loadPlayer()
  }, [params.id])

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-slate-400">Loading player...</p>
        </div>
      </main>
    )
  }

  if (error || !player) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/players"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            ← Back to Players
          </Link>

          <div className="mt-8 rounded-xl border border-red-900 bg-red-950/40 p-6">
            <h1 className="text-xl font-semibold">Player not found</h1>
            <p className="mt-2 text-sm text-red-300">
              {error || 'This player could not be loaded.'}
            </p>
          </div>
        </div>
      </main>
    )
  }

  const age = calculateAge(player.date_of_birth)
  const flagUrl = getFlagUrl(player.nationality)

  const currentContract =
    contracts.find(
      (contract) =>
        contract.status?.toLowerCase() === 'active'
    ) || contracts[0]

  const currentClub =
    currentContract?.clubs ||
    transfers[0]?.to_club ||
    null

  const currentMarketValue = marketValues[0] || null

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        <Link
          href="/players"
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          ← Back to Players
        </Link>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

              <div className="h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-slate-700 bg-slate-800">
                {player.photo_url ? (
                  <img
                    src={player.photo_url}
                    alt={player.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-slate-500">
                    {player.full_name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold sm:text-4xl">
                    {player.full_name}
                  </h1>

                  {flagUrl && (
                    <img
                      src={flagUrl}
                      alt={player.nationality || ''}
                      className="h-6 w-9 rounded-sm object-cover"
                    />
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {player.position && (
                    <span className="rounded-full bg-blue-600/20 px-3 py-1 text-sm font-medium text-blue-300">
                      {player.position}
                    </span>
                  )}

                  {player.secondary_position && (
                    <span className="rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-300">
                      {player.secondary_position}
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <div>
                    <div className="text-slate-500">Age</div>
                    <div className="mt-1 font-medium">
                      {age ?? '—'}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-500">Nationality</div>
                    <div className="mt-1 font-medium">
                      {player.nationality || '—'}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-500">Preferred Foot</div>
                    <div className="mt-1 font-medium">
                      {player.preferred_foot || '—'}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-500">Current Club</div>
                    <div className="mt-1 font-medium">
                      {currentClub?.name || '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
              Player Information
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-sm text-slate-500">
                  Date of Birth
                </div>
                <div className="mt-1">
                  {formatDate(player.date_of_birth)}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-500">
                  Height
                </div>
                <div className="mt-1">
                  {player.height_cm
                    ? `${player.height_cm} cm`
                    : '—'}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-500">
                  Birthplace
                </div>
                <div className="mt-1">
                  {player.birthplace || '—'}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-500">
                  Agency
                </div>
                <div className="mt-1">
                  {player.agency || '—'}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-500">
                  Current Club Since
                </div>
                <div className="mt-1">
                  {formatDate(player.current_club_since)}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-500">
                  Youth Club
                </div>
                <div className="mt-1">
                  {player.youth_clubs || '—'}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
              Position Map
            </h2>

            <div className="mt-4">
              <PositionMap
                primaryPosition={player.position}
                secondaryPosition={player.secondary_position}
              />
            </div>
          </div>

        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
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
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-800 text-xs text-slate-500">
                    No Logo
                  </div>
                )}

                <div>
                  <div className="text-lg font-semibold">
                    {currentClub.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    {currentClub.league || '—'}
                  </div>
                  <div className="text-sm text-slate-500">
                    {currentClub.country || '—'}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-slate-500">
                No current club information.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
              Market Value
            </h2>

            <div className="mt-4">
              <div className="text-3xl font-bold">
                {currentMarketValue
                  ? formatMarketValue(
                      currentMarketValue.market_value,
                      currentMarketValue.currency
                    )
                  : '—'}
              </div>

              {currentMarketValue?.valuation_date && (
                <div className="mt-1 text-sm text-slate-500">
                  As of {formatDate(currentMarketValue.valuation_date)}
                </div>
              )}

              {currentMarketValue?.confidence && (
                <div className="mt-3 inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                  {currentMarketValue.confidence}
                </div>
              )}
            </div>

            {marketValues.length > 1 && (
              <div className="mt-6">
                <div className="mb-3 text-sm font-medium text-slate-400">
                  Previous Valuations
                </div>

                <div className="space-y-2">
                  {marketValues.slice(1).map((value) => (
                    <div
                      key={value.id}
                      className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2 text-sm"
                    >
                      <span className="text-slate-400">
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

        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">
            Current Contract
          </h2>

          {currentContract ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              <div>
                <div className="text-sm text-slate-500">
                  Club
                </div>
                <div className="mt-1 font-medium">
                  {currentContract.clubs?.name || '—'}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-500">
                  Contract
                </div>
                <div className="mt-1 font-medium">
                  {formatDate(currentContract.start_date)} –{' '}
                  {formatDate(currentContract.end_date)}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-500">
                  Annual Salary
                </div>
                <div className="mt-1 font-medium">
                  {formatSalary(
                    currentContract.annual_salary,
                    currentContract.currency
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-500">
                  Weekly Salary
                </div>
                <div className="mt-1 font-medium">
                  {formatSalary(
                    currentContract.weekly_salary,
                    currentContract.currency,
                    true
                  )}
                </div>
              </div>

            </div>
          ) : (
            <p className="mt-4 text-slate-500">
              No contract information available.
            </p>
          )}

          {currentContract?.notes && (
            <div className="mt-5 rounded-lg bg-slate-800/50 p-4 text-sm text-slate-400">
              {currentContract.notes}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">
            Contract History
          </h2>

          {contracts.length > 0 ? (
            <div className="mt-5 space-y-3">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row">

                    <div>
                      <div className="font-semibold">
                        {contract.clubs?.name || 'Unknown Club'}
                      </div>

                      <div className="mt-1 text-sm text-slate-500">
                        {formatDate(contract.start_date)} –{' '}
                        {formatDate(contract.end_date)}
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="font-medium">
                        {formatSalary(
                          contract.annual_salary,
                          contract.currency
                        )}
                      </div>

                      {contract.status && (
                        <div className="mt-1 text-xs text-slate-500">
                          {contract.status}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-slate-500">
              No contract history available.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">
            Transfer History
          </h2>

          {transfers.length > 0 ? (
            <div className="mt-5 space-y-4">
              {transfers.map((transfer) => {
                const fee = formatTransferFee(
                  transfer.fee,
                  transfer.currency
                )

                const type = formatTransferType(
                  transfer.transfer_type
                )

                return (
                  <div
                    key={transfer.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
                  >
                    <div className="text-sm text-slate-500">
                      {formatDate(transfer.transfer_date)}
                    </div>

                    <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div className="flex items-center gap-3">
                        {transfer.from_club?.logo_url ? (
                          <img
                            src={transfer.from_club.logo_url}
                            alt={transfer.from_club.name}
                            className="h-10 w-10 object-contain"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-slate-800" />
                        )}

                        <div>
                          <div className="font-medium">
                            {transfer.from_club?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {transfer.from_club?.league || ''}
                          </div>
                        </div>
                      </div>

                      <div className="text-center text-slate-500">
                        →
                      </div>

                      <div className="flex items-center gap-3">
                        {transfer.to_club?.logo_url ? (
                          <img
                            src={transfer.to_club.logo_url}
                            alt={transfer.to_club.name}
                            className="h-10 w-10 object-contain"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-slate-800" />
                        )}

                        <div>
                          <div className="font-medium">
                            {transfer.to_club?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {transfer.to_club?.league || ''}
                          </div>
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <div className="font-medium">
                          {fee
                            ? `${type} · ${fee}`
                            : type}
                        </div>

                        {transfer.confidence && (
                          <div className="mt-1 text-xs text-slate-500">
                            {transfer.confidence}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="mt-4 text-slate-500">
              No transfer history available.
            </p>
          )}
        </section>

      </div>
    </main>
  )
}
