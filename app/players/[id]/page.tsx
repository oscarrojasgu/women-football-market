'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import PositionMap from '../../components/PositionMap'

type Club = {
id: string
name: string
country: string | null
league: string | null
logo_url: string | null
}

type Player = {
id: string
full_name: string
date_of_birth: string | null
nationality: string | null
position: string | null
secondary_position: string | null
preferred_foot: string | null
agency: string | null
photo_url: string | null
height_cm: number | null
birthplace: string | null
current_club_since: string | null
youth_clubs: string | null
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

const parsed = new Date(date)

if (Number.isNaN(parsed.getTime())) return date

return parsed.toLocaleDateString('en-US', {
month: 'short',
day: 'numeric',
year: 'numeric',
})
}

function formatSalary(
amount: number | null,
currency: string | null
) {
if (amount === null || amount === undefined) return 'Not disclosed'

return new Intl.NumberFormat('en-US', {
style: 'currency',
currency: currency || 'USD',
maximumFractionDigits: 0,
}).format(amount)
}

function formatMarketValue(
amount: number | null,
currency: string | null
) {
if (amount === null || amount === undefined) return 'Not available'

return new Intl.NumberFormat('en-US', {
style: 'currency',
currency: currency || 'EUR',
maximumFractionDigits: 0,
}).format(amount)
}

function formatTransferFee(
fee: number | null,
currency: string | null
) {
if (fee === null || fee === undefined) return null

return new Intl.NumberFormat('en-US', {
style: 'currency',
currency: currency || 'USD',
maximumFractionDigits: 0,
}).format(fee)
}

function formatTransferType(type: string | null) {
if (!type) return ''

return type.charAt(0).toUpperCase() + type.slice(1)
}

function calculateAge(dateOfBirth: string | null) {
if (!dateOfBirth) return null

const birthDate = new Date(dateOfBirth)

if (Number.isNaN(birthDate.getTime())) return null

const today = new Date()

let age = today.getFullYear() - birthDate.getFullYear()

const monthDifference =
today.getMonth() - birthDate.getMonth()

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
England: 'gb-eng',
Scotland: 'gb-sct',
Wales: 'gb-wls',
France: 'fr',
Germany: 'de',
Spain: 'es',
Brazil: 'br',
Colombia: 'co',
Mexico: 'mx',
Canada: 'ca',
Australia: 'au',
Japan: 'jp',
Netherlands: 'nl',
Denmark: 'dk',
Sweden: 'se',
Norway: 'no',
Italy: 'it',
Argentina: 'ar',
Chile: 'cl',
Portugal: 'pt',
}

const code = flags[nationality]

if (!code) return null

return `https://flagcdn.com/w40/${code}.png`
}

export default function PlayerPage() {
const params = useParams<{ id: string }>()

const playerId = params?.id

const [player, setPlayer] = useState<Player | null>(null)
const [contracts, setContracts] = useState<Contract[]>([])
const [transfers, setTransfers] = useState<Transfer[]>([])
const [marketValues, setMarketValues] = useState<MarketValue[]>([])

const [loading, setLoading] = useState(true)
const [error, setError] = useState('')

useEffect(() => {
if (!playerId) return


async function loadPlayer() {
  setLoading(true)
  setError('')

  try {
    const {
      data: playerData,
      error: playerError,
    } = await supabase
      .from('players')
      .select(`
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
      `)
      .eq('id', playerId)
      .single()

    if (playerError) {
      console.error('Player query error:', playerError)
      throw new Error(playerError.message)
    }

    if (!playerData) {
      throw new Error('Player not found.')
    }

    setPlayer(playerData)

    const {
      data: contractData,
      error: contractError,
    } = await supabase
      .from('contracts')
      .select(`
        id,
        start_date,
        end_date,
        annual_salary,
        weekly_salary,
        currency,
        status,
        confidence,
        notes,
        clubs (
          id,
          name,
          country,
          league,
          logo_url
        )
      `)
      .eq('player_id', playerId)
      .order('start_date', { ascending: false })

    if (contractError) {
      console.error('Contract query error:', contractError)
    }

    setContracts(
      (contractData || []).map((contract: any) => ({
        ...contract,
        clubs: Array.isArray(contract.clubs)
          ? contract.clubs[0] || null
          : contract.clubs || null,
      }))
    )

    const {
      data: transferData,
      error: transferError,
    } = await supabase
      .from('transfers')
      .select(`
        id,
        transfer_date,
        transfer_type,
        fee,
        currency,
        confidence,
        from_club:clubs!transfers_from_club_id_fkey (
          id,
          name,
          country,
          league,
          logo_url
        ),
        to_club:clubs!transfers_to_club_id_fkey (
          id,
          name,
          country,
          league,
          logo_url
        )
      `)
      .eq('player_id', playerId)
      .order('transfer_date', { ascending: false })

    if (transferError) {
      console.error('Transfer query error:', transferError)
    }

    setTransfers(
      (transferData || []).map((transfer: any) => ({
        ...transfer,
        from_club: Array.isArray(transfer.from_club)
          ? transfer.from_club[0] || null
          : transfer.from_club || null,
        to_club: Array.isArray(transfer.to_club)
          ? transfer.to_club[0] || null
          : transfer.to_club || null,
      }))
    )

    const {
      data: marketValueData,
      error: marketValueError,
    } = await supabase
      .from('market_values')
      .select(`
        id,
        valuation_date,
        market_value,
        currency,
        confidence,
        notes
      `)
      .eq('player_id', playerId)
      .order('valuation_date', { ascending: false })

    if (marketValueError) {
      console.error(
        'Market value query error:',
        marketValueError
      )
    }

    setMarketValues(marketValueData || [])
  } catch (err: any) {
    console.error('Player page error:', err)
    setError(err?.message || 'Unable to load player.')
  } finally {
    setLoading(false)
  }
}

loadPlayer()


}, [playerId])

if (loading) {
return ( <main className="min-h-screen bg-slate-50 px-6 py-12"> <div className="mx-auto max-w-6xl"> <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"> <div className="animate-pulse space-y-6"> <div className="h-8 w-64 rounded bg-slate-200" /> <div className="h-4 w-96 rounded bg-slate-200" /> <div className="h-40 rounded bg-slate-200" /> </div> </div> </div> </main>
)
}

if (error || !player) {
return ( <main className="min-h-screen bg-slate-50 px-6 py-12"> <div className="mx-auto max-w-3xl"> <Link
         href="/players"
         className="mb-6 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-800"
       >
← Back to Players </Link>


      <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Player not found
        </h1>

        <p className="mt-3 text-slate-600">
          {error || 'This player could not be loaded.'}
        </p>

        <p className="mt-4 break-all text-xs text-slate-400">
          Player ID: {playerId || 'No ID received'}
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

const currentMarketValue =
marketValues.length > 0
? marketValues[0]
: null

return ( <main className="min-h-screen bg-slate-50"> <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">


    <Link
      href="/players"
      className="mb-6 inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800"
    >
      ← Back to Players
    </Link>

    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-slate-900 px-6 py-8 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

          <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl border-4 border-white/20 bg-slate-800">
            {player.photo_url ? (
              <img
                src={player.photo_url}
                alt={player.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-white">
                {player.full_name
                  .split(' ')
                  .map((name) => name[0])
                  .join('')
                  .slice(0, 2)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {player.full_name}
              </h1>

              {flagUrl && (
                <img
                  src={flagUrl}
                  alt={player.nationality || 'Nationality'}
                  className="h-6 w-9 rounded-sm object-cover shadow-sm"
                />
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {player.position && (
                <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white">
                  {player.position}
                </span>
              )}

              {player.secondary_position && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-slate-200">
                  {player.secondary_position}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
              {age !== null && <span>{age} years old</span>}

              {player.nationality && (
                <span>{player.nationality}</span>
              )}

              {currentClub && (
                <span>{currentClub.name}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-slate-200 border-t border-slate-200 sm:grid-cols-4">
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Position
          </p>
          <p className="mt-1 font-bold text-slate-900">
            {player.position || '—'}
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Age
          </p>
          <p className="mt-1 font-bold text-slate-900">
            {age !== null ? age : '—'}
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current Club
          </p>
          <p className="mt-1 truncate font-bold text-slate-900">
            {currentClub?.name || '—'}
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Market Value
          </p>
          <p className="mt-1 font-bold text-slate-900">
            {formatMarketValue(
              currentMarketValue?.market_value ?? null,
              currentMarketValue?.currency ?? null
            )}
          </p>
        </div>
      </div>
    </section>

    <div className="mt-8 grid gap-8 lg:grid-cols-3">

      <div className="space-y-8 lg:col-span-2">

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Player Information
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date of Birth
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {formatDate(player.date_of_birth)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Nationality
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {player.nationality || '—'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Preferred Foot
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {player.preferred_foot || '—'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Height
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {player.height_cm
                  ? `${player.height_cm} cm`
                  : '—'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Birthplace
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {player.birthplace || '—'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Agency
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {player.agency || '—'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Current Club Since
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {formatDate(player.current_club_since)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Youth Club
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {player.youth_clubs || '—'}
              </p>
            </div>

          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Position Map
          </h2>

          <div className="mt-5">
            <PositionMap
              primaryPosition={player.position}
              secondaryPosition={player.secondary_position}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-900">
              Current Club
            </h2>

            {currentClub && (
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                Current
              </span>
            )}
          </div>

          {currentClub ? (
            <div className="mt-5 flex items-center gap-4">

              <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-200 bg-white p-2">
                {currentClub.logo_url ? (
                  <img
                    src={currentClub.logo_url}
                    alt={currentClub.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs font-bold text-slate-400">
                    CLUB
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {currentClub.name}
                </h3>

                <p className="text-sm text-slate-500">
                  {currentClub.league || 'League not available'}
                  {currentClub.country
                    ? ` · ${currentClub.country}`
                    : ''}
                </p>
              </div>

            </div>
          ) : (
            <p className="mt-4 text-slate-500">
              Current club information is not available.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Transfer History
          </h2>

          {transfers.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">
              No transfer history available.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">From</th>
                    <th className="pb-3 pr-4">To</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3">Fee</th>
                  </tr>
                </thead>

                <tbody>
                  {transfers.map((transfer) => {
                    const feeText = formatTransferFee(
                      transfer.fee,
                      transfer.currency
                    )

                    const typeText = formatTransferType(
                      transfer.transfer_type
                    )

                    return (
                      <tr
                        key={transfer.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-4 pr-4 text-sm text-slate-600">
                          {formatDate(
                            transfer.transfer_date
                          )}
                        </td>

                        <td className="py-4 pr-4 font-medium text-slate-900">
                          {transfer.from_club?.name || '—'}
                        </td>

                        <td className="py-4 pr-4 font-medium text-slate-900">
                          {transfer.to_club?.name || '—'}
                        </td>

                        <td className="py-4 pr-4 text-sm text-slate-600">
                          {typeText || '—'}
                        </td>

                        <td className="py-4 text-sm font-semibold text-slate-900">
                          {feeText || (
                            transfer.transfer_type?.toLowerCase() ===
                            'free'
                              ? 'Free'
                              : '—'
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Contract History
          </h2>

          {contracts.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">
              No contract history available.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {contract.clubs?.name || 'Club not available'}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(contract.start_date)}
                        {' — '}
                        {formatDate(contract.end_date)}
                      </p>
                    </div>

                    <span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {contract.status || 'Contract'}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Annual Salary
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {formatSalary(
                          contract.annual_salary,
                          contract.currency
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Weekly Salary
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {formatSalary(
                          contract.weekly_salary,
                          contract.currency
                        )}
                      </p>
                    </div>

                  </div>

                  {contract.notes && (
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {contract.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      <aside className="space-y-8">

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Market Value
          </h2>

          {currentMarketValue ? (
            <div className="mt-5">
              <p className="text-3xl font-bold text-slate-900">
                {formatMarketValue(
                  currentMarketValue.market_value,
                  currentMarketValue.currency
                )}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Valuation date:{' '}
                {formatDate(
                  currentMarketValue.valuation_date
                )}
              </p>

              <div className="mt-4">
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  {currentMarketValue.confidence ||
                    'Estimated'}
                </span>
              </div>

              {currentMarketValue.notes && (
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {currentMarketValue.notes}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-500">
              No market value available.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Previous Valuations
          </h2>

          {marketValues.length <= 1 ? (
            <p className="mt-5 text-sm text-slate-500">
              No previous valuations available.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {marketValues.slice(1).map((value) => (
                <div
                  key={value.id}
                  className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatDate(value.valuation_date)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {value.confidence || 'Estimated'}
                    </p>
                  </div>

                  <p className="font-bold text-slate-900">
                    {formatMarketValue(
                      value.market_value,
                      value.currency
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Current Contract
          </h2>

          {currentContract ? (
            <div className="mt-5 space-y-4">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Club
                </p>

                <p className="mt-1 font-bold text-slate-900">
                  {currentContract.clubs?.name || '—'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Annual Salary
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {formatSalary(
                    currentContract.annual_salary,
                    currentContract.currency
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Weekly Salary
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {formatSalary(
                    currentContract.weekly_salary,
                    currentContract.currency
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contract Period
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {formatDate(currentContract.start_date)}
                  {' — '}
                  {formatDate(currentContract.end_date)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Verification
                </p>

                <span className="mt-2 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                  {currentContract.confidence ||
                    'Verified'}
                </span>
              </div>

            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-500">
              No current contract available.
            </p>
          )}
        </section>

      </aside>
    </div>
  </div>
</main>


)
}
