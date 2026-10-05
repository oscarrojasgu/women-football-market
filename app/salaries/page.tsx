'use client'

import Link from 'next/link'
import { useWfmT } from "../lib/use-wfm-t"
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

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
 const t = useWfmT()
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
      if (sort === 'club-asc' || sort === 'club-desc') { const v=(a.club?.name||'').localeCompare(b.club?.name||''); return sort === 'club-asc' ? v : -v }
      if (sort === 'player-asc' || sort === 'player-desc') { const v=(a.player?.full_name||'').localeCompare(b.player?.full_name||''); return sort === 'player-asc' ? v : -v }
      if (sort === 'position-asc' || sort === 'position-desc') { const v=(a.player?.position||'').localeCompare(b.player?.position||''); return sort === 'position-asc' ? v : -v }
      if (sort === 'weekly-asc' || sort === 'weekly-desc') { const v=(a.weekly_salary_usd||0)-(b.weekly_salary_usd||0); return sort === 'weekly-asc' ? v : -v }
      if (sort === 'original-asc' || sort === 'original-desc') { const v=(a.annual_salary||0)-(b.annual_salary||0); return sort === 'original-asc' ? v : -v }
      if (sort === 'confidence-asc' || sort === 'confidence-desc') { const v=(a.confidence||'').localeCompare(b.confidence||''); return sort === 'confidence-asc' ? v : -v }
      return (sort === 'salary-asc' ? 1 : -1) * ((a.annual_salary_usd||0)-(b.annual_salary_usd||0))
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
          <h1>{t("Salaries")}</h1>
          <p>
            Comparable player compensation with normalized USD values, original currency context, and confidence attached to every record.
          </p>
        </div>
      </section>

      <section className="salary-shell salary-content">
        <div className="salary-stat-grid">
          <div className="salary-stat"><span>{t("Salary records")}</span><strong>{stats.count}</strong></div>
          <div className="salary-stat"><span>{t("Median annual")}</span><strong>{formatUSD(stats.median)}</strong></div>
          <div className="salary-stat"><span>{t("Average annual")}</span><strong>{formatUSD(stats.average)}</strong></div>
          <div className="salary-stat"><span>{t("Highest annual")}</span><strong>{formatUSD(stats.highest)}</strong></div>
          <div className="salary-stat"><span>{t("Leagues covered")}</span><strong>{stats.leagues}</strong></div>
          <div className="salary-stat"><span>{t("Verified records")}</span><strong>{stats.verified}</strong></div>
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
              <option value="salary-desc">{t("Highest salary")}</option>
              <option value="salary-asc">{t("Lowest salary")}</option>
              <option value="player-asc">{t("Player A–Z")}</option>
              <option value="club-asc">{t("Club A–Z")}</option>
            </select>
          </div>
          <div className="salary-control-footer">
            <span>Showing <strong>{filteredRecords.length}</strong> of {records.length} salary records</span>
            {hasFilters && <button type="button" onClick={clearFilters}>{t("Clear filters")}</button>}
          </div>
        </div>

        <div className="salary-note">
          <strong>{t("How to read the numbers:")}</strong> Annual and weekly figures use the database’s normalized USD fields. Original salary and currency are retained for source context. A confidence label indicates how firmly the underlying figure is supported.
        </div>

        {loading ? (
          <div className="salary-empty">{t("Loading salary data...")}</div>
        ) : error ? (
          <div className="salary-empty">{error}</div>
        ) : filteredRecords.length === 0 ? (
          <div className="salary-empty">
            <strong>{t("No salary records found")}</strong>
            <span>{t("Try another search or clear the filters.")}</span>
            {hasFilters && <button type="button" onClick={clearFilters}>{t("Clear filters")}</button>}
          </div>
        ) : (
          <div className="salary-table-wrap">
            <div className="salary-table-header wfm-sortable-header">
              <button type="button" onClick={() => setSort(sort === 'player-asc' ? 'player-desc' : 'player-asc')}>PLAYER {sort === 'player-asc' ? '↑' : sort === 'player-desc' ? '↓' : ''}</button>
              <button type="button" onClick={() => setSort(sort === 'club-asc' ? 'club-desc' : 'club-asc')}>CLUB {sort === 'club-asc' ? '↑' : sort === 'club-desc' ? '↓' : ''}</button>
              <button type="button" onClick={() => setSort(sort === 'position-asc' ? 'position-desc' : 'position-asc')}>POSITION {sort === 'position-asc' ? '↑' : sort === 'position-desc' ? '↓' : ''}</button>
              <button type="button" onClick={() => setSort(sort === 'salary-asc' ? 'salary-desc' : 'salary-asc')}>ANNUAL USD {sort === 'salary-asc' ? '↑' : '↓'}</button>
              <button type="button" onClick={() => setSort(sort === 'weekly-asc' ? 'weekly-desc' : 'weekly-asc')}>WEEKLY USD {sort === 'weekly-asc' ? '↑' : sort === 'weekly-desc' ? '↓' : ''}</button>
              <button type="button" onClick={() => setSort(sort === 'original-asc' ? 'original-desc' : 'original-asc')}>ORIGINAL {sort === 'original-asc' ? '↑' : sort === 'original-desc' ? '↓' : ''}</button>
              <button type="button" onClick={() => setSort(sort === 'confidence-asc' ? 'confidence-desc' : 'confidence-asc')}>CONFIDENCE {sort === 'confidence-asc' ? '↑' : sort === 'confidence-desc' ? '↓' : ''}</button>
            </div>

            {filteredRecords.map((record) => (
              <Link key={record.id} href={`/players/${record.player_id}`} className="salary-row">
                <span className="salary-player">
                  <img
                    src={record.player?.photo_url || '/wfm-player-placeholder.svg'}
                    alt={record.player?.full_name || 'Player'}
                    onError={(event) => {
                      event.currentTarget.onerror = null
                      event.currentTarget.src = '/wfm-player-placeholder.svg'
                    }}
                    width={44}
                    height={54}
                    loading="eager"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    style={{
                      width: '44px',
                      height: '44px',
                      display: 'block',
                      borderRadius: '50%',
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