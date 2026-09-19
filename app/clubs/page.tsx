'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

type Club = {
  id: string
  name: string
  country: string | null
  league: string | null
  logo_url: string | null
  organization_type: string | null
}

type ContractRecord = {
  id: string
  club_id: string
  player_id: string
  status: string | null
  annual_salary_usd: number | null
  currency: string | null
}

type MarketValueRecord = {
  player_id: string
  market_value_usd: number | null
  valuation_date: string | null
}

type TransferRecord = {
  from_club_id: string | null
  to_club_id: string | null
}

type SortKey = 'name' | 'players' | 'payroll' | 'value'

function formatMoney(value: number | null) {
  if (value === null || !Number.isFinite(value)) return '—'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    notation: value >= 1000000 ? 'compact' : 'standard',
  }).format(value)
}

function normalize(value: string | null | undefined) {
  return (value || '').toLowerCase().trim()
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [contracts, setContracts] = useState<ContractRecord[]>([])
  const [marketValues, setMarketValues] = useState<MarketValueRecord[]>([])
  const [transfers, setTransfers] = useState<TransferRecord[]>([])
  const [q, setQ] = useState('')
  const [leagueFilter, setLeagueFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState<SortKey>('name')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadClubs() {
      setLoading(true)

      const [clubResult, contractResult, valueResult, transferResult] = await Promise.all([
        supabase
          .from('clubs')
          .select(`
            id,
            name,
            country,
            league,
            logo_url,
            organization_type
          `)
          .order('name', { ascending: true }),
        supabase
          .from('contracts')
          .select(`
            id,
            club_id,
            player_id,
            status,
            annual_salary_usd,
            currency
          `),
        supabase
          .from('market_values')
          .select(`
            player_id,
            market_value_usd,
            valuation_date
          `),
        supabase
          .from('transfers')
          .select('from_club_id, to_club_id'),
      ])

      if (clubResult.error) console.error('Error loading clubs:', clubResult.error)
      if (contractResult.error) console.error('Error loading club contracts:', contractResult.error)
      if (valueResult.error) console.error('Error loading market values:', valueResult.error)
      if (transferResult.error) console.error('Error loading club transfers:', transferResult.error)

      setClubs((clubResult.data || []) as Club[])
      setContracts((contractResult.data || []) as ContractRecord[])
      setMarketValues((valueResult.data || []) as MarketValueRecord[])
      setTransfers((transferResult.data || []) as TransferRecord[])
      setLoading(false)
    }

    loadClubs()
  }, [])

  const latestMarketValues = useMemo(() => {
    const map: Record<string, MarketValueRecord> = {}

    for (const record of marketValues) {
      if (!record.player_id || record.market_value_usd === null) continue

      const existing = map[record.player_id]
      if (!existing || (record.valuation_date || '') > (existing.valuation_date || '')) {
        map[record.player_id] = record
      }
    }

    return map
  }, [marketValues])

  const clubStats = useMemo(() => {
    const stats: Record<
      string,
      {
        playerIds: Set<string>
        payroll: number
        salaryCount: number
        marketValue: number
        marketValueCount: number
        transfers: number
      }
    > = {}

    for (const club of clubs) {
      stats[club.id] = {
        playerIds: new Set(),
        payroll: 0,
        salaryCount: 0,
        marketValue: 0,
        marketValueCount: 0,
        transfers: 0,
      }
    }

    for (const contract of contracts) {
      if (!stats[contract.club_id]) continue
      if (normalize(contract.status) !== 'active') continue

      stats[contract.club_id].playerIds.add(contract.player_id)

      if (contract.annual_salary_usd !== null) {
        stats[contract.club_id].payroll += contract.annual_salary_usd
        stats[contract.club_id].salaryCount += 1
      }

      const value = latestMarketValues[contract.player_id]?.market_value_usd
      if (value !== undefined && value !== null) {
        stats[contract.club_id].marketValue += value
        stats[contract.club_id].marketValueCount += 1
      }
    }

    for (const transfer of transfers) {
      if (transfer.from_club_id && stats[transfer.from_club_id]) {
        stats[transfer.from_club_id].transfers += 1
      }
      if (transfer.to_club_id && stats[transfer.to_club_id]) {
        stats[transfer.to_club_id].transfers += 1
      }
    }

    return stats
  }, [clubs, contracts, latestMarketValues, transfers])

  const leagues = useMemo(
    () => Array.from(new Set(clubs.map((club) => club.league).filter(Boolean) as string[])).sort(),
    [clubs]
  )

  const countries = useMemo(
    () => Array.from(new Set(clubs.map((club) => club.country).filter(Boolean) as string[])).sort(),
    [clubs]
  )

  const organizationTypes = useMemo(
    () => Array.from(new Set(clubs.map((club) => club.organization_type || 'club'))).sort(),
    [clubs]
  )

  const filteredClubs = useMemo(() => {
    const search = normalize(q)

    const filtered = clubs.filter((club) => {
      const stats = clubStats[club.id]
      const searchable = [club.name, club.league, club.country, club.organization_type]
        .filter(Boolean)
        .join(' ')

      const matchesSearch = !search || normalize(searchable).includes(search)
      const matchesLeague = leagueFilter === 'all' || club.league === leagueFilter
      const matchesCountry = countryFilter === 'all' || club.country === countryFilter
      const matchesType =
        typeFilter === 'all' || (club.organization_type || 'club') === typeFilter

      return matchesSearch && matchesLeague && matchesCountry && matchesType && Boolean(stats)
    })

    return [...filtered].sort((a, b) => {
      const aStats = clubStats[a.id]
      const bStats = clubStats[b.id]

      if (sortBy === 'players') {
        return bStats.playerIds.size - aStats.playerIds.size || a.name.localeCompare(b.name)
      }

      if (sortBy === 'payroll') {
        return bStats.payroll - aStats.payroll || a.name.localeCompare(b.name)
      }

      if (sortBy === 'value') {
        return bStats.marketValue - aStats.marketValue || a.name.localeCompare(b.name)
      }

      return a.name.localeCompare(b.name)
    })
  }, [clubs, clubStats, q, leagueFilter, countryFilter, typeFilter, sortBy])

  const totalPlayers = useMemo(
    () => new Set(contracts.filter((contract) => normalize(contract.status) === 'active').map((contract) => contract.player_id)).size,
    [contracts]
  )

  const clubsWithSalary = useMemo(
    () => clubs.filter((club) => (clubStats[club.id]?.salaryCount || 0) > 0).length,
    [clubs, clubStats]
  )

  const clubsWithValues = useMemo(
    () => clubs.filter((club) => (clubStats[club.id]?.marketValueCount || 0) > 0).length,
    [clubs, clubStats]
  )

  const hasFilters =
    Boolean(q.trim()) ||
    leagueFilter !== 'all' ||
    countryFilter !== 'all' ||
    typeFilter !== 'all'

  function clearFilters() {
    setQ('')
    setLeagueFilter('all')
    setCountryFilter('all')
    setTypeFilter('all')
  }

  return (
    <main className="clubs-page" style={{ minHeight: '100vh', background: '#f5f4ef', color: '#111' }}>
      <section style={{ background: '#111', color: '#fff', padding: '52px 6vw 46px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontSize: 12, color: '#aaa', fontWeight: 800, letterSpacing: 1.6, marginBottom: 14 }}>
            WOMEN’S FOOTBALL MARKET
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(42px, 6vw, 68px)', lineHeight: 0.98, letterSpacing: '-2.5px', fontWeight: 800 }}>
            Clubs
          </h1>
          <p style={{ margin: '18px 0 0', maxWidth: 720, fontSize: 17, lineHeight: 1.55, color: '#c7c7c7' }}>
            A connected view of clubs, leagues, rosters, compensation, market values, and transfer activity.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          {[
            ['CLUBS', loading ? '—' : clubs.length.toString()],
            ['ACTIVE PLAYERS', loading ? '—' : totalPlayers.toString()],
            ['WITH SALARY DATA', loading ? '—' : clubsWithSalary.toString()],
            ['WITH MARKET VALUES', loading ? '—' : clubsWithValues.toString()],
          ].map(([label, value]) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #e2e2e2', borderRadius: 12, padding: '17px 18px' }}>
              <div style={{ fontSize: 11, color: '#777', fontWeight: 800, letterSpacing: 1, marginBottom: 7 }}>{label}</div>
              <div style={{ fontSize: 25, fontWeight: 800 }}>{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 60px' }}>
        <div style={{ background: '#fff', border: '1px solid #e1e1e1', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '20px 22px', borderBottom: '1px solid #e8e8e8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Club intelligence</h2>
                <p style={{ margin: '6px 0 0', color: '#777', fontSize: 13 }}>
                  {loading ? 'Loading clubs…' : `${filteredClubs.length} of ${clubs.length} clubs shown`}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', width: 'min(100%, 720px)', justifyContent: 'flex-end' }}>
                <input
                  type="search"
                  aria-label="Search clubs"
                  placeholder="Search club, league, country…"
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  style={{ flex: '1 1 230px', minWidth: 200, border: '1px solid #d8d8d8', borderRadius: 9, padding: '11px 13px', fontSize: 14, outline: 'none' }}
                />
                <select value={leagueFilter} onChange={(event) => setLeagueFilter(event.target.value)} style={{ flex: '0 1 180px', border: '1px solid #d8d8d8', borderRadius: 9, padding: '11px 30px 11px 11px', background: '#fff', fontSize: 13 }}>
                  <option value="all">All leagues</option>
                  {leagues.map((league) => <option key={league} value={league}>{league}</option>)}
                </select>
                <select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)} style={{ flex: '0 1 150px', border: '1px solid #d8d8d8', borderRadius: 9, padding: '11px 30px 11px 11px', background: '#fff', fontSize: 13 }}>
                  <option value="all">All countries</option>
                  {countries.map((country) => <option key={country} value={country}>{country}</option>)}
                </select>
                <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} style={{ flex: '0 1 150px', border: '1px solid #d8d8d8', borderRadius: 9, padding: '11px 30px 11px 11px', background: '#fff', fontSize: 13 }}>
                  <option value="all">All types</option>
                  {organizationTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#777', fontWeight: 700 }}>SORT</span>
                {[
                  ['name', 'Name'],
                  ['players', 'Roster'],
                  ['payroll', 'Payroll'],
                  ['value', 'Market value'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSortBy(value as SortKey)}
                    style={{ border: '1px solid #ddd', borderRadius: 99, padding: '7px 11px', background: sortBy === value ? '#111' : '#fff', color: sortBy === value ? '#fff' : '#444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {hasFilters && (
                <button type="button" onClick={clearFilters} style={{ border: 0, background: 'transparent', color: '#555', textDecoration: 'underline', fontSize: 12, cursor: 'pointer' }}>
                  Clear filters
                </button>
              )}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}>
                  {['Club', 'League', 'Country', 'Active roster', 'Known payroll', 'Squad market value', 'Transfers'].map((heading, index) => (
                    <th key={heading} style={{ textAlign: index === 0 ? 'left' : index >= 3 ? 'right' : 'left', padding: '13px 18px', fontSize: 10, color: '#888', letterSpacing: 0.9, textTransform: 'uppercase', fontWeight: 800 }}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: 50, textAlign: 'center', color: '#777' }}>Loading club database…</td></tr>
                ) : filteredClubs.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 50, textAlign: 'center', color: '#777' }}>No clubs match these filters.</td></tr>
                ) : (
                  filteredClubs.map((club) => {
                    const stats = clubStats[club.id]
                    const payroll = stats.salaryCount > 0 ? formatMoney(stats.payroll) : 'Unknown'
                    const marketValue = stats.marketValueCount > 0 ? formatMoney(stats.marketValue) : 'Unknown'

                    return (
                      <tr key={club.id} style={{ borderBottom: '1px solid #eeeeee' }}>
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 220 }}>
                            {club.logo_url ? (
                              <img src={club.logo_url} alt="" loading="lazy" style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 7, background: '#f7f7f7', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: 38, height: 38, borderRadius: 7, background: '#f0f0ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#777', flexShrink: 0 }}>
                                {club.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <Link href={`/clubs/${club.id}`} style={{ color: '#111', textDecoration: 'none', fontWeight: 800 }}>
                                {club.name}
                              </Link>
                              <div style={{ marginTop: 3, fontSize: 11, color: '#888' }}>{club.organization_type || 'club'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 18px', color: '#555', fontSize: 13 }}>{club.league || '—'}</td>
                        <td style={{ padding: '16px 18px', color: '#555', fontSize: 13 }}>{club.country || '—'}</td>
                        <td style={{ padding: '16px 18px', textAlign: 'right', fontWeight: 800 }}>{stats.playerIds.size || 0}</td>
                        <td style={{ padding: '16px 18px', textAlign: 'right', fontWeight: 700 }}>{payroll}</td>
                        <td style={{ padding: '16px 18px', textAlign: 'right', fontWeight: 700 }}>{marketValue}</td>
                        <td style={{ padding: '16px 18px', textAlign: 'right', color: '#555' }}>{stats.transfers}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #e5e5e5', padding: '28px 20px', textAlign: 'center', fontSize: 12, color: '#888', background: '#fff' }}>
        Club figures are calculated from the WFM database. Payroll and market-value totals only include records with known USD values.
      </footer>
    </main>
  )
}
