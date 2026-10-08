'use client'

import Link from 'next/link'
import { useWfmT } from "./lib/use-wfm-t"
import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'

type Player = {
  id: string
  full_name: string
  date_of_birth: string | null
  nationality: string | null
  position: string | null
  preferred_foot: string | null
  agency: string | null
  photo_url: string | null
}

type ContractInfo = {
  player_id: string
  annual_salary: number | null
  weekly_salary: number | null
  annual_salary_usd: number | null
  weekly_salary_usd: number | null
  currency: string | null
  status: string | null
  start_date: string | null
  end_date: string | null
  confidence: string | null
  created_at: string | null
  club:
    | {
        name: string
        league: string | null
        logo_url: string | null
      }
    | null
}



type HomeTransfer = {
  id: string
  player_id: string
  transfer_date: string | null
  transfer_type: string | null
  confidence: string | null
  player: { full_name: string; photo_url: string | null } | null
  from_club: { name: string } | null
  to_club: { name: string } | null
}

type HomeNewsItem = {
  id: string
  title: string
  url: string
  publisher: string
  published_at: string
  summary: string | null
  competition_name: string | null
}

type HomeCompetition = {
  id: string
  canonical_name: string
  country: string | null
  active: boolean | null
  newsCount: number
  recentMatches: number
  nextMatch: string | null
}

type MarketValueInfo = {
  player_id: string;
  market_value_usd: number | null;
  valuation_date: string | null;
  confidence: string | null;
}

type CurrentClubInfo = {
  player_id: string
  current_club_id: string | null
  current_club_name: string | null
  current_club_league: string | null
  current_club_country: string | null
  current_club_logo_url: string | null
  current_club_since: string | null
  resolution_source: string | null
}

type MatchTickerItem = {
  id: string
  competition: string
  home: string
  away: string
  homeScore: number | null
  awayScore: number | null
  status: string
}


function MatchTicker({ items, t }: { items: MatchTickerItem[]; t: (key: string) => string }) {
  return (
    <section className="wfm-match-ticker" aria-label="Women's football match center">
      <div className="wfm-match-ticker-label">
        <span className="wfm-live-dot" />{t("MATCH CENTER")}</div>
      <div className="wfm-match-ticker-viewport">
        {items.length ? (
          <div className="wfm-match-ticker-track">
            {[...items, ...items].map((match, index) => (
              <Link key={match.id + '-' + index} href={'/matches/' + match.id} className="wfm-match-ticker-item">
                <span className="wfm-match-competition">{match.competition}</span>
                <span className="wfm-match-team">{match.home}</span>
                <strong>{match.homeScore ?? '—'}</strong>
                <span className="wfm-match-team">{match.away}</span>
                <strong>{match.awayScore ?? '—'}</strong>
                <span className="wfm-match-status">{match.status}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="wfm-match-ticker-empty">{t("Match center ready — live scores and fixtures will appear here.")}</div>
        )}
      </div>
    </section>
  )
}

function calculateAge(dateOfBirth: string | null) {
  if (!dateOfBirth) return null

  const birthDate = new Date(dateOfBirth)
  const today = new Date()

  let age = today.getFullYear() - birthDate.getFullYear()

  const monthDifference = today.getMonth() - birthDate.getMonth()

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--
  }

  return age
}

function formatSalary(annualSalaryUsd: number | null) {
  if (annualSalaryUsd === null) return 'Unknown'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(annualSalaryUsd)
}

function formatConfidence(confidence: string | null) {
  if (!confidence) return 'Database'

  return confidence.charAt(0).toUpperCase() + confidence.slice(1)
}

export default function Home() {
 const t = useWfmT()
  const [q, setQ] = useState('')
  const [databasePlayers, setDatabasePlayers] = useState<Player[]>([])
  const [contracts, setContracts] = useState<ContractInfo[]>([])
  const [currentClubs, setCurrentClubs] = useState<CurrentClubInfo[]>([])
  const [marketValues, setMarketValues] = useState<MarketValueInfo[]>([])
  const [matchTickerItems, setMatchTickerItems] = useState<MatchTickerItem[]>([])
  const [homeTransfers, setHomeTransfers] = useState<HomeTransfer[]>([])
  const [homeNews, setHomeNews] = useState<HomeNewsItem[]>([])
  const [homeCompetitions, setHomeCompetitions] = useState<HomeCompetition[]>([])
  const [databaseStats, setDatabaseStats] = useState({
    players: 0,
    clubs: 0,
    contracts: 0,
    transfers: 0,
  })
  const [loading, setLoading] = useState(true)
  const [homeSort, setHomeSort] = useState<'player'|'club'|'league'|'contract'|'salary'|'confidence'>('player')
  const [homeSortDir, setHomeSortDir] = useState<'asc'|'desc'>('asc')

  useEffect(() => {
    async function loadPlayers() {
      const [
        { data: playerData, error: playerError, count: playerCount },
        { data: contractData, error: contractError, count: contractCount },
        { data: currentClubData, error: currentClubError },
        { data: marketValueData, error: marketValueError },
        { count: clubCount, error: clubError },
        { count: transferCount, error: transferError },
      ] = await Promise.all([
        supabase
          .from('players')
          .select(
            'id, full_name, date_of_birth, nationality, position, preferred_foot, agency, photo_url',
            { count: 'exact' }
          )
          .order('full_name', { ascending: true }),

        supabase
          .from('contracts')
          .select(`
            player_id,
            annual_salary_usd,
            weekly_salary_usd,
            currency,
            status,
            start_date,
            end_date,
            confidence,
            created_at,
            club:clubs (
              name,
              league,
              logo_url
            )
          `, { count: 'exact' }),

        supabase
          .from('player_current_clubs')
          .select('player_id,current_club_id,current_club_name,current_club_league,current_club_country,current_club_logo_url,current_club_since,resolution_source'),

        supabase.from('market_values').select('player_id,market_value_usd,valuation_date,confidence').order('valuation_date', { ascending: false }),

        supabase.from('clubs').select('id', { count: 'exact', head: true }),

        supabase.from('transfers').select('id', { count: 'exact', head: true }),
      ])

      if (playerError) {
        console.error('Error loading players:', playerError)
      }

      if (contractError) {
        console.error('Error loading contracts:', contractError)
      }

      if (currentClubError) {
        console.error('Error loading current player clubs:', currentClubError)
      }

      if (marketValueError) {
        console.error('Error loading market values:', marketValueError)
      }

      if (clubError) {
        console.error('Error loading clubs:', clubError)
      }

      if (transferError) {
        console.error('Error loading transfers:', transferError)
      }

      setDatabaseStats({
        players: playerCount || 0,
        clubs: clubCount || 0,
        contracts: contractCount || 0,
        transfers: transferCount || 0,
      })

      setDatabasePlayers(playerData || [])
      setContracts((contractData || []) as unknown as ContractInfo[])
      setCurrentClubs((currentClubData || []) as CurrentClubInfo[])
      const latestMarketValues = new Map<string, MarketValueInfo>()
      ;(marketValueData || []).forEach((row) => {
        if (!latestMarketValues.has(row.player_id)) latestMarketValues.set(row.player_id, row as MarketValueInfo)
      })
      setMarketValues(Array.from(latestMarketValues.values()))
      setLoading(false)
    }

    loadPlayers()
  }, [])

  useEffect(() => {
    async function loadHomeNews() {
      const { data, error } = await supabase
        .from('wfm_news_items')
        .select('id,title,url,publisher,published_at,summary,competition_name')
        .eq('active', true)
        .order('published_at', { ascending: false })
        .limit(5)
      if (error) {
        console.error('Error loading homepage news:', error)
        return
      }
      setHomeNews((data || []) as HomeNewsItem[])
    }
    loadHomeNews()
  }, [])

  useEffect(() => {
    async function loadHomeTransfers() {
      const { data, error } = await supabase
        .from('transfers')
        .select('id,player_id,from_club_id,to_club_id,transfer_date,transfer_type,confidence')
        .order('transfer_date', { ascending: false })
        .limit(6)
      if (error) {
        console.error('Error loading homepage transfers:', error)
        return
      }
      const rows = data || []
      const playerIds = [...new Set(rows.map(row => row.player_id).filter(Boolean))]
      const clubIds = [...new Set(rows.flatMap(row => [row.from_club_id, row.to_club_id].filter(Boolean)))]
      const [{ data: players }, { data: clubs }] = await Promise.all([
        playerIds.length ? supabase.from('players').select('id,full_name,photo_url').in('id', playerIds) : Promise.resolve({ data: [] }),
        clubIds.length ? supabase.from('clubs').select('id,name').in('id', clubIds) : Promise.resolve({ data: [] }),
      ])
      const playerMap = new Map((players || []).map(player => [player.id, player]))
      const clubMap = new Map((clubs || []).map(club => [club.id, club]))
      setHomeTransfers(rows.map(row => ({
        ...row,
        player: playerMap.get(row.player_id) || null,
        from_club: row.from_club_id ? clubMap.get(row.from_club_id) || null : null,
        to_club: row.to_club_id ? clubMap.get(row.to_club_id) || null : null,
      })) as HomeTransfer[])
    }
    loadHomeTransfers()
  }, [])

  useEffect(() => {
    async function loadHomeCompetitions() {
      const { data: competitionRows, error: competitionError } = await supabase
        .from('competitions')
        .select('id,canonical_name,country,active')
        .eq('active', true)
        .order('canonical_name')
        .limit(8)

      if (competitionError) {
        console.error('Error loading homepage competitions:', competitionError)
        return
      }

      const rows = competitionRows || []
      if (!rows.length) {
        setHomeCompetitions([])
        return
      }

      const ids = rows.map(row => row.id)
      const { data: matches } = await supabase
        .from('wfm_match_fixtures')
        .select('competition_id,kickoff_at,status')
        .in('competition_id', ids)
        .gte('kickoff_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .lte('kickoff_at', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString())
        .order('kickoff_at', { ascending: true })
        .limit(200)

      const names = rows.map(row => row.canonical_name).filter(Boolean)
      const { data: news } = names.length
        ? await supabase
            .from('wfm_news_items')
            .select('competition_name')
            .eq('active', true)
            .in('competition_name', names)
            .order('published_at', { ascending: false })
            .limit(200)
        : { data: [] }

      const matchRows = matches || []
      const newsRows = news || []

      setHomeCompetitions(rows.map(row => {
        const competitionMatches = matchRows.filter(match => match.competition_id === row.id)
        const competitionNews = newsRows.filter(item => item.competition_name === row.canonical_name)
        const next = competitionMatches.find(match => match.status === 'scheduled')
        return {
          id: row.id,
          canonical_name: row.canonical_name,
          country: row.country,
          active: row.active,
          newsCount: competitionNews.length,
          recentMatches: competitionMatches.length,
          nextMatch: next?.kickoff_at || null,
        }
      }).filter(row => row.newsCount > 0 || row.recentMatches > 0).slice(0, 4))
    }

    loadHomeCompetitions()
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadMatches = async () => {
      const now = Date.now()
      const start = new Date(now - 6 * 60 * 60 * 1000).toISOString()
      const end = new Date(now + 48 * 60 * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from('wfm_match_fixtures')
        .select('id,competition_name,home_team_name,away_team_name,home_score,away_score,status,kickoff_at')
        .gte('kickoff_at', start)
        .lte('kickoff_at', end)
        .order('kickoff_at', { ascending: true })
        .limit(30)

      if (error) {
        console.error('Error loading match center:', error)
        return
      }

      if (!cancelled) {
        setMatchTickerItems((data || []).map((match) => ({
          id: match.id,
          competition: match.competition_name,
          home: match.home_team_name,
          away: match.away_team_name,
          homeScore: match.home_score,
          awayScore: match.away_score,
          status: match.status === 'live' ? 'LIVE' : match.status === 'halftime' ? 'HT' : match.status === 'finished' ? 'FT' : match.status === 'postponed' ? 'POSTPONED' : new Date(match.kickoff_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        })))
      }
    }

    loadMatches()
    const timer = window.setInterval(loadMatches, 60_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  const getContract = (playerId: string) => {
    const playerContracts = contracts
      .filter((contract) => contract.player_id === playerId)
      .sort((a, b) => {
        const aStart = a.start_date
          ? new Date(a.start_date).getTime()
          : 0

        const bStart = b.start_date
          ? new Date(b.start_date).getTime()
          : 0

        return bStart - aStart
      })

    if (playerContracts.length === 0) return null

    const activeContract = playerContracts.find(
      (contract) =>
        contract.status?.toLowerCase() === 'active'
    )

    return activeContract || playerContracts[0]
  }

  const currentClubByPlayer = useMemo(
    () => new Map(currentClubs.map((club) => [club.player_id, club])),
    [currentClubs]
  )

  const filteredDatabasePlayers = useMemo(() => {
    if (!q.trim()) return databasePlayers

    const search = q.toLowerCase()

    return databasePlayers.filter((player) => {
      const contract = contracts.find(
        (item) => item.player_id === player.id
      )
      const currentClub = currentClubByPlayer.get(player.id)

      const clubName = currentClub?.current_club_name || contract?.club?.name || ''
      const league = currentClub?.current_club_league || contract?.club?.league || ''

      return [
        player.full_name,
        player.nationality,
        player.position,
        player.agency,
        clubName,
        league,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search)
    })
  }, [q, databasePlayers, contracts, currentClubByPlayer])

  const sortedDatabasePlayers = useMemo(() => {
    const rows = [...filteredDatabasePlayers];
    const value = (player: Player) => {
      const contract = contracts.find(item => item.player_id === player.id);
      const currentClub = currentClubByPlayer.get(player.id);
      if (homeSort === 'player') return player.full_name || '';
      if (homeSort === 'club') return currentClub?.current_club_name || contract?.club?.name || '';
      if (homeSort === 'league') return currentClub?.current_club_league || contract?.club?.league || '';
      if (homeSort === 'contract') return contract?.end_date || '';
      if (homeSort === 'salary') return contract?.annual_salary_usd ?? null;
      return contract?.confidence || '';
    };
    rows.sort((a,b) => {
      const av=value(a), bv=value(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av-bv : String(av).localeCompare(String(bv), undefined, {numeric:true,sensitivity:'base'});
      return homeSortDir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [filteredDatabasePlayers, contracts, currentClubByPlayer, homeSort, homeSortDir]);

  const changeHomeSort = (key: typeof homeSort) => {
    if (homeSort === key) setHomeSortDir(dir => dir === 'asc' ? 'desc' : 'asc');
    else { setHomeSort(key); setHomeSortDir(key === 'player' || key === 'club' || key === 'league' || key === 'confidence' ? 'asc' : 'desc'); }
  };
  const homeSortIndicator = (key: typeof homeSort) => homeSort === key ? (homeSortDir === 'asc' ? '↑' : '↓') : '';

  const featuredDatabasePlayers = useMemo(() => {
    const marketValueByPlayer = new Map(marketValues.map((value) => [value.player_id, value]))
    const transferIds = new Set(homeTransfers.map((transfer) => transfer.player_id))
    const recentContractIds = new Set(
      contracts
        .filter((contract) => contract.player_id && contract.created_at)
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, 12)
        .map((contract) => contract.player_id)
    )
    const salaryRank = new Map(
      contracts
        .filter((contract) => contract.player_id && contract.annual_salary_usd != null)
        .sort((a, b) => (b.annual_salary_usd || 0) - (a.annual_salary_usd || 0))
        .map((contract, index) => [contract.player_id, index])
    )
    const marketValueRank = new Map(
      [...marketValues]
        .filter((value) => value.market_value_usd != null)
        .sort((a, b) => (b.market_value_usd || 0) - (a.market_value_usd || 0))
        .map((value, index) => [value.player_id, index])
    )

    const score = (player: Player) => {
      let total = 0
      if (transferIds.has(player.id)) total += 1000
      if (recentContractIds.has(player.id)) total += 700
      const salaryRankValue = salaryRank.get(player.id)
      if (salaryRankValue != null) total += Math.max(0, 500 - salaryRankValue)
      const marketValueRankValue = marketValueRank.get(player.id)
      if (marketValueRankValue != null) total += Math.max(0, 400 - marketValueRankValue)
      return total
    }

    return [...filteredDatabasePlayers].sort((a, b) => {
      const scoreDifference = score(b) - score(a)
      if (scoreDifference !== 0) return scoreDifference
      return a.full_name.localeCompare(b.full_name)
    })
  }, [filteredDatabasePlayers, homeTransfers, contracts, marketValues])

  const visibleDatabasePlayers = useMemo(
    () => (q.trim() ? sortedDatabasePlayers : featuredDatabasePlayers).slice(0, 25),
    [q, sortedDatabasePlayers, featuredDatabasePlayers]
  )
  const hasDatabaseResults = filteredDatabasePlayers.length > 0

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f4ef',
        color: '#111',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* HEADER */}
      

      {/* HERO — FULL WIDTH */}
      <section
        className="hero"
        style={{
          width: '100%',
          background: '#111',
          color: '#fff',
          padding: '0',
        }}
      >
        <div
          style={{
            maxWidth: 'none',
            margin: '0',
            padding: '55px 6vw 45px',
          }}
        >
          <div
            className="eyebrow"
            style={{
              fontSize: '13px',
              color: '#aaa',
              fontWeight: 700,
              letterSpacing: '1.2px',
              marginBottom: '14px',
            }}
          >{t("THE WOMEN’S FOOTBALL DATABASE")}</div>

          <h1
            style={{
              margin: '0 0 16px',
              fontSize: '46px',
              lineHeight: 1.08,
              letterSpacing: '-1.5px',
              fontWeight: 800,
            }}
          >
            The Women’s Football Market.
            <br />
            <em
              style={{
                fontStyle: 'normal',
                color: '#c9ff3d',
              }}
            >{t("Built differently.")}</em>
          </h1>

          <p
            style={{
              margin: '0 0 28px',
              maxWidth: '680px',
              fontSize: '17px',
              lineHeight: 1.55,
              color: '#c7c7c7',
            }}
          >
            A modern football intelligence platform for players, clubs,
            scouts, agents and fans — with the data and transparency to
            understand the Women’s game.
          </p>

          <div
            className="search"
            style={{
              maxWidth: '760px',
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #ddd',
              borderRadius: '9px',
              background: '#fff',
              padding: '0 16px',
              height: '54px',
            }}
          >
            <span
              style={{
                fontSize: '23px',
                color: '#777',
                marginRight: '10px',
              }}
            >
              ⌕
            </span>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("Search player, club or league…")}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '15px',
                background: 'transparent',
                color: '#111',
              }}
            />
          </div>
        </div>
      </section>

      <MatchTicker items={matchTickerItems} t={t} />

      {/* STATS */}
      <section
        className="stats"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px 45px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
        }}
      >
        <div
          style={{
            border: '1px solid #e3e3e3',
            borderRadius: '14px',
            padding: '20px',
          }}
        >
          <b
            style={{
              display: 'block',
              fontSize: '12px',
              color: '#777',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '9px',
            }}
          >{t("Players")}</b>

          <strong
            style={{
              display: 'block',
              fontSize: '22px',
            }}
          >
            {loading ? '—' : databaseStats.players.toLocaleString()}
          </strong>
        </div>

        <div
          style={{
            border: '1px solid #e3e3e3',
            borderRadius: '14px',
            padding: '20px',
          }}
        >
          <b
            style={{
              display: 'block',
              fontSize: '12px',
              color: '#777',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '9px',
            }}
          >{t("Clubs")}</b>

          <strong
            style={{
              display: 'block',
              fontSize: '22px',
            }}
          >
            {loading ? '—' : databaseStats.clubs.toLocaleString()}
          </strong>
        </div>

        <div
          style={{
            border: '1px solid #e3e3e3',
            borderRadius: '14px',
            padding: '20px',
          }}
        >
          <b
            style={{
              display: 'block',
              fontSize: '12px',
              color: '#777',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '9px',
            }}
          >{t("Contracts")}</b>

          <strong
            style={{
              display: 'block',
              fontSize: '22px',
            }}
          >
            {loading ? '—' : databaseStats.contracts.toLocaleString()}
          </strong>
        </div>

        <div
          style={{
            border: '1px solid #e3e3e3',
            borderRadius: '14px',
            padding: '20px',
          }}
        >
          <b
            style={{
              display: 'block',
              fontSize: '12px',
              color: '#777',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '9px',
            }}
          >{t("Transfers")}</b>

          <strong
            style={{
              display: 'block',
              fontSize: '22px',
            }}
          >
            {loading ? '—' : databaseStats.transfers.toLocaleString()}
          </strong>
        </div>
      </section>

      {/* WFM INTELLIGENCE */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 55px' }}>
        <div className="sectionhead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
          <div>
            <span className="eyebrow" style={{ fontSize: '13px', color: '#777', fontWeight: 700, letterSpacing: '1.2px' }}>WFM INTELLIGENCE</span>
            <h2 style={{ margin: '8px 0 0', fontSize: '30px', lineHeight: 1.1, letterSpacing: '-.5px' }}>What’s moving in the women’s game.</h2>
          </div>
          <Link href="/transfers" style={{ color: '#111', textDecoration: 'none', fontSize: '13px', fontWeight: 800 }}>View market activity →</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr 1fr 1fr', gap: '12px' }}>
          <div style={{ background: '#fff', border: '1px solid #e3e3e3', borderRadius: '14px', padding: '22px', minHeight: '245px' }}>
            <div style={{ fontSize: '10px', color: '#888', fontWeight: 800, letterSpacing: '1px' }}>WOMEN’S FOOTBALL NEWS</div>
            <h3 style={{ margin: '13px 0 12px', fontSize: '20px' }}>Latest from the game</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {homeNews.slice(0, 4).map(item => (
                <a key={item.id} href={item.url} target="_blank" rel="noreferrer" style={{ color: '#111', textDecoration: 'none' }}>
                  <strong style={{ display: 'block', fontSize: '13px', lineHeight: 1.35 }}>{item.title}</strong>
                  <small style={{ display: 'block', marginTop: '4px', color: '#888' }}>{item.publisher} · {new Date(item.published_at).toLocaleDateString()}</small>
                </a>
              ))}
              {!homeNews.length && <div style={{ color: '#777', fontSize: '13px', lineHeight: 1.5 }}>Source-linked news will appear here as WFM publishes verified external stories.</div>}
            </div>
          </div>
          <div style={{ background: '#111', color: '#fff', borderRadius: '14px', padding: '22px', minHeight: '245px' }}>
            <div style={{ fontSize: '10px', color: '#aaa', fontWeight: 800, letterSpacing: '1px' }}>LATEST TRANSFERS</div>
            <div style={{ marginTop: '16px', display: 'grid', gap: '13px' }}>
              {homeTransfers.slice(0, 4).map(transfer => (
                <Link key={transfer.id} href={transfer.player_id ? `/players/${transfer.player_id}` : '/transfers'} style={{ color: '#fff', textDecoration: 'none', display: 'grid', gridTemplateColumns: '36px 1fr', gap: '10px', alignItems: 'center' }}>
                  <img src={transfer.player?.photo_url || '/wfm-player-placeholder.svg'} alt="" width={36} height={36} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', background: '#222' }} />
                  <span style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block', fontSize: '13px' }}>{transfer.player?.full_name || 'Unknown player'}</strong>
                    <small style={{ display: 'block', marginTop: '3px', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{transfer.from_club?.name || 'Free agent'} → {transfer.to_club?.name || 'Unknown club'}</small>
                  </span>
                </Link>
              ))}
              {!homeTransfers.length && <div style={{ color: '#aaa', fontSize: '13px', lineHeight: 1.5 }}>Transfer activity will appear here as verified WFM records are added.</div>}
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e3e3e3', borderRadius: '14px', padding: '22px', minHeight: '245px' }}>
            <div style={{ fontSize: '10px', color: '#888', fontWeight: 800, letterSpacing: '1px' }}>CONTRACT WATCH</div>
            <h3 style={{ margin: '13px 0 8px', fontSize: '20px' }}>Expiring soon</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {contracts.filter(contract => contract.end_date).sort((a,b) => String(a.end_date).localeCompare(String(b.end_date))).slice(0, 4).map(contract => {
                const player = databasePlayers.find(item => item.id === contract.player_id)
                return <Link key={contract.player_id + '-' + contract.end_date} href={`/players/${contract.player_id}`} style={{ color: '#111', textDecoration: 'none', fontSize: '13px', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player?.full_name || 'Player'}</span>
                  <strong style={{ whiteSpace: 'nowrap' }}>{contract.end_date}</strong>
                </Link>
              })}
              {!contracts.some(contract => contract.end_date) && <div style={{ color: '#777', fontSize: '13px' }}>Contract dates will appear here as WFM coverage expands.</div>}
            </div>
            <Link href="/contracts" style={{ display: 'inline-block', marginTop: '18px', color: '#111', fontSize: '12px', fontWeight: 800, textDecoration: 'none' }}>Explore contracts →</Link>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e3e3e3', borderRadius: '14px', padding: '22px', minHeight: '245px' }}>
            <div style={{ fontSize: '10px', color: '#888', fontWeight: 800, letterSpacing: '1px' }}>DISCOVER</div>
            <h3 style={{ margin: '13px 0 8px', fontSize: '20px' }}>Follow the data.</h3>
            <p style={{ margin: 0, color: '#777', fontSize: '13px', lineHeight: 1.55 }}>Move from matches to players, clubs, contracts and transfers without leaving the WFM ecosystem.</p>
            <div style={{ display: 'grid', gap: '8px', marginTop: '18px' }}>
              {[['/players','Players'],['/clubs','Clubs'],['/competitions','Competitions'],['/scouting','Scouting']].map(([href,label]) => <Link key={href} href={href} style={{ color: '#111', textDecoration: 'none', fontSize: '12px', fontWeight: 800 }}>{label} →</Link>)}
            </div>
          </div>
        </div>
      </section>

      {/* COMPETITION WATCH */}
      {homeCompetitions.length > 0 && (
        <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 55px' }}>
          <div className="sectionhead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
            <div>
              <span className="eyebrow" style={{ fontSize: '13px', color: '#777', fontWeight: 700, letterSpacing: '1.2px' }}>COMPETITION WATCH</span>
              <h2 style={{ margin: '8px 0 0', fontSize: '30px', lineHeight: 1.1, letterSpacing: '-.5px' }}>Follow the competitions.</h2>
            </div>
            <Link href="/competitions" style={{ color: '#111', textDecoration: 'none', fontSize: '13px', fontWeight: 800 }}>View all competitions →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {homeCompetitions.map(competition => (
              <Link key={competition.id} href={`/competitions/${competition.id}`} style={{ background: '#fff', border: '1px solid #e3e3e3', borderRadius: '14px', padding: '20px', color: '#111', textDecoration: 'none', minHeight: '155px' }}>
                <div style={{ fontSize: '10px', color: '#888', fontWeight: 800, letterSpacing: '1px' }}>COMPETITION</div>
                <h3 style={{ margin: '10px 0 5px', fontSize: '19px', lineHeight: 1.15 }}>{competition.canonical_name}</h3>
                <div style={{ color: '#777', fontSize: '12px' }}>{competition.country || 'International'}</div>
                <div style={{ display: 'flex', gap: '14px', marginTop: '18px', fontSize: '11px', color: '#555' }}>
                  <span><strong>{competition.recentMatches}</strong> match records</span>
                  <span><strong>{competition.newsCount}</strong> news</span>
                </div>
                {competition.nextMatch && <div style={{ marginTop: '9px', fontSize: '11px', color: '#888' }}>Next: {new Date(competition.nextMatch).toLocaleDateString()}</div>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* PLAYER DATABASE */}
      <section
        className="content"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px 55px',
        }}
      >
        <div
          className="sectionhead"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '20px',
          }}
        >
          <div>
            <span
              className="eyebrow"
              style={{
                fontSize: '13px',
                color: '#777',
                fontWeight: 700,
                letterSpacing: '1.2px',
              }}
            >
              PLAYER DATABASE
            </span>

            <h2
              style={{
                margin: '8px 0 0',
                fontSize: '30px',
                lineHeight: 1.1,
                letterSpacing: '-0.5px',
              }}
            >
              {q.trim() ? t("Search results") : t("Market movers")}
            </h2>
          </div>

          <Link
            href="/players"
            className="outline"
            style={{
              border: '1px solid #ddd',
              background: '#fff',
              borderRadius: '8px',
              padding: '10px 15px',
              color: '#111',
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            View all players →
          </Link>
        </div>

        {q.trim() && (
          <div
            style={{
              marginBottom: '12px',
              fontSize: '14px',
              color: '#777',
            }}
          >
            {loading
              ? t("Searching database…")
              : `${filteredDatabasePlayers.length} result${
                  filteredDatabasePlayers.length !== 1
                    ? 's'
                    : ''
                } found`}
          </div>
        )}

        <div
          className="table home-player-table"
          style={{
            border: '1px solid #e3e3e3',
            borderRadius: '14px',
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          <div
            className="thead home-player-table-head wfm-sortable-header"
            style={{
              display: 'grid',
              gridTemplateColumns:
                '1.8fr 1.5fr 1fr 1.2fr 1.3fr 1fr',
              gap: '16px',
              padding: '13px 20px',
              background: '#fafafa',
              borderBottom: '1px solid #e5e5e5',
              fontSize: '11px',
              fontWeight: 700,
              color: '#777',
              letterSpacing: '0.8px',
            }}
          >
            {([
              ['PLAYER','player'],['CLUB','club'],['LEAGUE','league'],['CONTRACT','contract'],['SALARY','salary'],['CONFIDENCE','confidence']
            ] as const).map(([label,key]) => (
              <button key={key} type="button" onClick={() => changeHomeSort(key)}>
                <span>{label}</span><span className="wfm-sort-indicator">{homeSortIndicator(key)}</span>
              </button>
            ))}
          </div>

          {visibleDatabasePlayers.map((player) => {
            const age = calculateAge(player.date_of_birth)
            const contract = getContract(player.id)
            const currentClub = currentClubByPlayer.get(player.id)

            return (
              <Link
                href={`/players/${player.id}`}
                className="row home-player-row"
                key={`db-${player.id}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1.8fr 1.5fr 1fr 1.2fr 1.3fr 1fr',
                  gap: '16px',
                  padding: '16px 20px',
                  borderBottom: '1px solid #eeeeee',
                  alignItems: 'center',
                  color: '#111',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
              >
                <span className="home-player-cell home-player-cell--player" style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <img
                    src={player.photo_url || '/wfm-player-placeholder.svg'}
                    alt={player.full_name}
                    onError={(event) => {
                      event.currentTarget.onerror = null
                      event.currentTarget.src = '/wfm-player-placeholder.svg'
                    }}
                    width={48}
                    height={58}
                    loading="eager"
                    decoding="async"
                    style={{
                      width: '48px',
                      height: '48px',
                      display: 'block',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      background: '#eee',
                      flex: '0 0 48px',
                    }}
                  />
                  <span style={{ minWidth: 0 }}>
                    <b>{player.full_name}</b>

                    <small
                    style={{
                      display: 'block',
                      marginTop: '4px',
                      color: '#888',
                      fontSize: '12px',
                    }}
                  >
                    {player.position || 'Unknown'}
                    {age !== null ? ` · ${age}` : ''}
                  </small>
                  </span>
                </span>

                <span className="home-player-cell home-player-cell--club">
                  <small>{t("Club")}</small>{currentClub?.current_club_name || contract?.club?.name || 'Unknown'}
                </span>

                <span className="home-player-cell home-player-cell--league" style={{ color: '#666' }}>
                  <small>{t("League")}</small>{currentClub?.current_club_league || contract?.club?.league || 'Unknown'}
                </span>

                <span className="home-player-cell home-player-cell--contract">
                  <small>Contract</small>{contract?.end_date || 'Unknown'}
                </span>

                <span className="home-player-cell home-player-cell--salary">
                  <small>{t("Salary")}</small>{formatSalary(contract?.annual_salary ?? null)}
                </span>

                <span className="home-player-cell home-player-cell--confidence">
                  <small>Confidence</small><i
                    className="badge"
                    style={{
                      display: 'inline-block',
                      fontStyle: 'normal',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '5px 8px',
                      borderRadius: '999px',
                      background:
                        contract?.confidence?.toLowerCase() === 'verified'
                          ? '#e9f7ee'
                          : contract?.confidence?.toLowerCase() === 'reported'
                            ? '#f3f3f3'
                            : '#f5f0e8',
                      color:
                        contract?.confidence?.toLowerCase() === 'verified'
                          ? '#237a43'
                          : contract?.confidence?.toLowerCase() === 'reported'
                            ? '#666'
                            : '#806b45',
                    }}
                  >
                    {formatConfidence(contract?.confidence ?? null)}
                  </i>
                </span>
              </Link>
            )
          })}

          {q.trim() &&
            !hasDatabaseResults && (
              <div
                className="empty"
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#777',
                }}
              >
                No players found. Try another search.
              </div>
            )}

          {!q.trim() && loading && (
            <div
              className="empty"
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#777',
              }}
            >
              Loading players...
            </div>
          )}

          {!q.trim() &&
            !loading &&
            !hasDatabaseResults && (
              <div
                className="empty"
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#777',
                }}
              >
                No players found.
              </div>
            )}
        </div>
      </section>

      {/* CARDS */}
      <section
        className="cards"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px 70px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
        }}
      >
        <Link href="/contracts" style={{ color: '#111', textDecoration: 'none', border: '1px solid #e3e3e3', borderRadius: '14px', padding: '22px', background: '#fff', transition: 'transform .15s ease' }}>
          <span style={{ fontSize: '11px', color: '#999', fontWeight: 700 }}>01</span>
          <h3 style={{ margin: '28px 0 8px', fontSize: '18px' }}>{t("Contracts")}</h3>
          <p style={{ margin: 0, color: '#777', fontSize: '13px', lineHeight: 1.5 }}>Expiration dates, options, extensions and free-agent status.</p>
          <span style={{ display: 'block', marginTop: '18px', fontSize: '12px', fontWeight: 700 }}>Explore contracts →</span>
        </Link>

        <Link href="/transfers" style={{ color: '#111', textDecoration: 'none', border: '1px solid #e3e3e3', borderRadius: '14px', padding: '22px', background: '#fff' }}>
          <span style={{ fontSize: '11px', color: '#999', fontWeight: 700 }}>02</span>
          <h3 style={{ margin: '28px 0 8px', fontSize: '18px' }}>{t("Transfers")}</h3>
          <p style={{ margin: 0, color: '#777', fontSize: '13px', lineHeight: 1.5 }}>Permanent moves, loans, trades, releases and fees.</p>
          <span style={{ display: 'block', marginTop: '18px', fontSize: '12px', fontWeight: 700 }}>Explore transfers →</span>
        </Link>

        <Link href="/salaries" style={{ color: '#111', textDecoration: 'none', border: '1px solid #e3e3e3', borderRadius: '14px', padding: '22px', background: '#fff' }}>
          <span style={{ fontSize: '11px', color: '#999', fontWeight: 700 }}>03</span>
          <h3 style={{ margin: '28px 0 8px', fontSize: '18px' }}>{t("Salaries")}</h3>
          <p style={{ margin: 0, color: '#777', fontSize: '13px', lineHeight: 1.5 }}>Reported and estimated compensation with source confidence.</p>
          <span style={{ display: 'block', marginTop: '18px', fontSize: '12px', fontWeight: 700 }}>Explore salaries →</span>
        </Link>

        <Link href="/scouting" style={{ color: '#111', textDecoration: 'none', border: '1px solid #e3e3e3', borderRadius: '14px', padding: '22px', background: '#fff' }}>
          <span style={{ fontSize: '11px', color: '#999', fontWeight: 700 }}>04</span>
          <h3 style={{ margin: '28px 0 8px', fontSize: '18px' }}>{t("Scouting")}</h3>
          <p style={{ margin: 0, color: '#777', fontSize: '13px', lineHeight: 1.5 }}>Find players by position, age, league and contract status.</p>
          <span style={{ display: 'block', marginTop: '18px', fontSize: '12px', fontWeight: 700 }}>Open scouting →</span>
        </Link>
      </section>

      {/* PUBLIC PRODUCT CTA */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 70px' }}>
        <div style={{ background: '#111', color: '#fff', borderRadius: '16px', padding: '30px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '700px' }}>
            <div style={{ fontSize: '11px', color: '#aaa', fontWeight: 800, letterSpacing: '1.2px', marginBottom: '10px' }}>FOR CLUBS · AGENTS · SCOUTS</div>
            <h2 style={{ margin: 0, fontSize: '28px', letterSpacing: '-.5px' }}>Go deeper with WFM.</h2>
            <p style={{ margin: '9px 0 0', color: '#c7c7c7', fontSize: '14px', lineHeight: 1.5 }}>Create an account to use private scouting workflows, club and agency workspaces, and request commercial data access.</p>
          </div>
          <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap' }}>
            <Link href="/login" style={{ display: 'inline-block', background: '#c9ff3d', color: '#111', textDecoration: 'none', fontWeight: 800, borderRadius: '8px', padding: '11px 16px', fontSize: '13px' }}>Sign in / create account</Link>
            <Link href="/account/licensing" style={{ display: 'inline-block', border: '1px solid #555', color: '#fff', textDecoration: 'none', borderRadius: '8px', padding: '11px 16px', fontSize: '13px', fontWeight: 700 }}>Commercial access</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #e5e5e5', background: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px 42px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '30px', flexWrap: 'wrap' }}>
            <div style={{ maxWidth: '360px' }}>
              <div className="logo" style={{ fontSize: '22px', fontWeight: 800 }}>WFM<span style={{ color: '#777' }}>•</span></div>
              <p style={{ color: '#777', fontSize: '13px', lineHeight: 1.5, margin: '10px 0 0' }}>Women’s football data for players, clubs, scouts, agents and researchers.</p>
            </div>
            <nav aria-label="WFM public navigation" style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {[
                ['/players','Players'],
                ['/clubs','Clubs'],
                ['/competitions','Competitions'],
                ['/contracts','Contracts'],
                ['/salaries','Salaries'],
                ['/transfers','Transfers'],
                ['/scouting','Scouting'],
              ].map(([href,label]) => <Link key={href} href={href} style={{ color: '#444', textDecoration: 'none', fontSize: '12px', fontWeight: 700 }}>{label}</Link>)}
            </nav>
          </div>
          <div style={{ marginTop: '28px', paddingTop: '18px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', gap: '15px', flexWrap: 'wrap' }}>
            <small style={{ color: '#999', fontSize: '12px' }}>Data confidence is shown on every record. Estimates are never presented as confirmed facts.</small>
            <small style={{ color: '#999', fontSize: '12px' }}>© Women’s Football Market</small>
          </div>
        </div>
      </footer>
</main>
  )
}