'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import PlayerPhoto from '../components/PlayerPhoto'

type SalaryRecord = {
  id: string
  player_id: string
  annual_salary: number | null
  weekly_salary: number | null
  annual_salary_usd: number | null
  weekly_salary_usd: number | null
  currency: string | null
  status: string | null
  confidence: string | null
  player: {
    id: string
    full_name: string
    nationality: string | null
    position: string | null
    photo_url: string | null
  } | null
  club: {
    id: string
    name: string
    league: string | null
    country: string | null
  } | null
}

function formatUSD(amount: number | null) {
  if (amount === null || amount === undefined) return 'Unknown'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatOriginal(amount: number | null, currency: string | null) {
  if (amount === null || amount === undefined) return 'Unknown'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency || 'USD'} ${amount.toLocaleString('en-US')}`
  }
}

function label(value: string | null) {
  if (!value) return 'Unknown'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function confidenceTone(value: string | null) {
  const confidence = value?.toLowerCase()
  if (confidence === 'verified') return 'verified'
  if (confidence === 'reported') return 'reported'
  if (confidence === 'estimated') return 'estimated'
  if (confidence === 'rumored') return 'rumored'
  return 'unknown'
}

function salaryBand(value: number | null) {
  if (value === null || value === undefined) return 'Unknown'
  if (value < 50000) return 'Under $50K'
  if (value < 100000) return '$50K–$99K'
  if (value < 200000) return '$100K–$199K'
  if (value < 300000) return '$200K–$299K'
  return '$300K+'
}

function median(values: number[]) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? Math.round((sorted[middle - 1] + sorted[middle]) / 2)
    : sorted[middle]
}

export default function SalariesPage() {
  const [records, setRecords] = useState<SalaryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [leagueFilter, setLeagueFilter] = useState('All')
  const [bandFilter, setBandFilter] = useState('All')
  const [confidenceFilter, setConfidenceFilter] = useState('All')
  const [sort, setSort] = useState('salary-desc')

  useEffect(() => {
    async function loadSalaries() {
      setLoading(true)
      setError('')

      const { data, error: salaryError } = await supabase
        .from('contracts')
        .select(`
          id,
          player_id,
          annual_salary,
          weekly_salary,
          annual_salary_usd,
          weekly_salary_usd,
          currency,
          status,
          confidence,
          player:players (
            id,
            full_name,
            nationality,
            position,
            photo_url
          ),
          club:clubs (
            id,
            name,
            league,
            country
          )
        `)
        .not('annual_salary_usd', 'is', null)
        .order('annual_salary_usd', { ascending: false })

      if (salaryError) {
        console.error('Error loading salaries:', salaryError)
        setError("We couldn't load salary data right now.")
        setRecords([])
      } else {
        setRecords((data || []) as unknown as SalaryRecord[])
      }

      setLoading(false)
    }

    loadSalaries()
  }, [])

  const leagueOptions = useMemo(() => {
    const leagues = records
      .map((record) => record.club?.league)
      .filter(Boolean) as string[]
    return ['All', ...Array.from(new Set(leagues)).sort()]
  }, [records])

  const confidenceOptions = useMemo(() => {
    const values = records
      .map((record) => record.confidence)
      .filter(Boolean) as string[]
    return ['All', ...Array.from(new Set(values))]
  }, [records])

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase()

    const filtered = records.filter((record) => {
      const haystack = [
        record.player?.full_name,
        record.player?.nationality,
        record.player?.position,
        record.club?.name,
        record.club?.league,
        record.club?.country,
        record.currency,
        record.status,
        record.confidence,
      ].filter(Boolean).join(' ').toLowerCase()

      const matchesSearch = !query || haystack.includes(query)
      const matchesLeague = leagueFilter === 'All' || record.club?.league === leagueFilter
      const matchesBand = bandFilter === 'All' || salaryBand(record.annual_salary_usd) === bandFilter
      const matchesConfidence = confidenceFilter === 'All' || record.confidence === confidenceFilter

      return matchesSearch && matchesLeague && matchesBand && matchesConfidence
    })

    return [...filtered].sort((a, b) => {
      if (sort === 'salary-asc') return (a.annual_salary_usd || 0) - (b.annual_salary_usd || 0)
      if (sort === 'player-asc') return (a.player?.full_name || '').localeCompare(b.player?.full_name || '')
      if (sort === 'club-asc') return (a.club?.name || '').localeCompare(b.club?.name || '')
      return (b.annual_salary_usd || 0) - (a.annual_salary_usd || 0)
    })
  }, [records, search, leagueFilter, bandFilter, confidenceFilter, sort])

  const stats = useMemo(() => {
    const values = records
      .map((record) => record.annual_salary_usd)
      .filter((value): value is number => value !== null && value !== undefined)

    const leagues = new Set(records.map((record) => record.club?.league).filter(Boolean))
    const verified = records.filter((record) => record.confidence?.toLowerCase() === 'verified').length

    return {
      count: records.length,
      average: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null,
      median: median(values),
      highest: values.length ? Math.max(...values) : null,
      leagues: leagues.size,
      verified,
    }
  }, [records])

  const hasFilters = search.trim() !== '' || leagueFilter !== 'All' || bandFilter !== 'All' || confidenceFilter !== 'All'

  function clearFilters() {
    setSearch('')
    setLeagueFilter('All')
    setBandFilter('All')
    setConfidenceFilter('All')
  }

  return (
    <main className="salary-page">
      <section className="salary-hero">
        <div className="salary-shell">
          <div className="salary-eyebrow">WOMEN’S FOOTBALL MARKET · LIVE DATABASE</div>
          <h1>Salaries</h1>
          <p>
            Comparable player compensation with normalized USD values, original currency context, and confidence attached to every record.
          </p>
        </div>
      </section>

      <section className="salary-shell salary-content">
        <div className="salary-stat-grid">
          <div className="salary-stat"><span>Salary records</span><strong>{stats.count}</strong></div>
          <div className="salary-stat"><span>Median annual</span><strong>{formatUSD(stats.median)}</strong></div>
          <div className="salary-stat"><span>Average annual</span><strong>{formatUSD(stats.average)}</strong></div>
          <div className="salary-stat"><span>Highest annual</span><strong>{formatUSD(stats.highest)}</strong></div>
          <div className="salary-stat"><span>Leagues covered</span><strong>{stats.leagues}</strong></div>
          <div className="salary-stat"><span>Verified records</span><strong>{stats.verified}</strong></div>
        </div>

        <div className="salary-controls">
          <div className="salary-control-grid">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search player, club, league, position..."
              aria-label="Search salary records"
            />
            <select value={leagueFilter} onChange={(event) => setLeagueFilter(event.target.value)} aria-label="Filter by league">
              {leagueOptions.map((league) => <option key={league} value={league}>{league === 'All' ? 'All leagues' : league}</option>)}
            </select>
            <select value={bandFilter} onChange={(event) => setBandFilter(event.target.value)} aria-label="Filter by salary band">
              {['All', 'Under $50K', '$50K–$99K', '$100K–$199K', '$200K–$299K', '$300K+'].map((band) => <option key={band} value={band}>{band === 'All' ? 'All salary bands' : band}</option>)}
            </select>
            <select value={confidenceFilter} onChange={(event) => setConfidenceFilter(event.target.value)} aria-label="Filter by confidence">
              {confidenceOptions.map((confidence) => <option key={confidence} value={confidence}>{confidence === 'All' ? 'All confidence' : label(confidence)}</option>)}
            </select>
            <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort salary records">
              <option value="salary-desc">Highest salary</option>
              <option value="salary-asc">Lowest salary</option>
              <option value="player-asc">Player A–Z</option>
              <option value="club-asc">Club A–Z</option>
            </select>
          </div>
          <div className="salary-control-footer">
            <span>Showing <strong>{filteredRecords.length}</strong> of {records.length} salary records</span>
            {hasFilters && <button type="button" onClick={clearFilters}>Clear filters</button>}
          </div>
        </div>

        <div className="salary-note">
          <strong>How to read the numbers:</strong> Annual and weekly figures use the database’s normalized USD fields. Original salary and currency are retained for source context. A confidence label indicates how firmly the underlying figure is supported.
        </div>

        {loading ? (
          <div className="salary-empty">Loading salary data...</div>
        ) : error ? (
          <div className="salary-empty">{error}</div>
        ) : filteredRecords.length === 0 ? (
          <div className="salary-empty">
            <strong>No salary records found</strong>
            <span>Try another search or clear the filters.</span>
            {hasFilters && <button type="button" onClick={clearFilters}>Clear filters</button>}
          </div>
        ) : (
          <div className="salary-table-wrap">
            <div className="salary-table-header">
              <span>PLAYER</span>
              <span>CLUB</span>
              <span>POSITION</span>
              <span>ANNUAL USD</span>
              <span>WEEKLY USD</span>
              <span>ORIGINAL</span>
              <span>CONFIDENCE</span>
            </div>

            {filteredRecords.map((record) => (
              <Link key={record.id} href={`/players/${record.player_id}`} className="salary-row">
                <span className="salary-player">
                  <PlayerPhoto
                    src={record.player?.photo_url}
                    alt={record.player?.full_name || 'Player'}
                    width={44}
                    height={54}
                    style={{
                      borderRadius: '8px',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      background: '#eee',
                      flex: '0 0 44px',
                    }}
                  />
                  <span>
                    <strong>{record.player?.full_name || 'Unknown player'}</strong>
                    <small>{record.player?.nationality || 'Nationality unknown'}</small>
                  </span>
                </span>
                <span className="salary-club">
                  <strong>{record.club?.name || 'Unknown club'}</strong>
                  <small>{record.club?.league || record.club?.country || 'League unknown'}</small>
                </span>
                <span>{record.player?.position || 'Unknown'}</span>
                <span className="salary-primary">{formatUSD(record.annual_salary_usd)}</span>
                <span>{formatUSD(record.weekly_salary_usd)}</span>
                <span className="salary-original">
                  {formatOriginal(record.annual_salary, record.currency)}
                  <small>{record.currency || 'USD'}</small>
                </span>
                <span><i className={`salary-confidence ${confidenceTone(record.confidence)}`}>{label(record.confidence)}</i></span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
