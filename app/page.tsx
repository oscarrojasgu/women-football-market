'use client'

import Link from 'next/link'
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
}

type ContractInfo = {
  player_id: string
  annual_salary: number | null
  weekly_salary: number | null
  currency: string | null
  status: string | null
  start_date: string | null
  end_date: string | null
  confidence: string | null
  club:
    | {
        name: string
        league: string | null
        logo_url: string | null
      }
    | null
}

const featuredPlayers = [
  {
    name: 'Sophia Wilson',
    club: 'Kansas City Current',
    league: 'NWSL',
    position: 'Forward',
    age: 25,
    contract: '2026-12-31',
    salary: '$842,400',
    status: 'Verified',
  },
  {
    name: 'Temwa Chawinga',
    club: 'Kansas City Current',
    league: 'NWSL',
    position: 'Forward',
    age: 27,
    contract: '2027-12-31',
    salary: 'Unknown',
    status: 'Reported',
  },
  {
    name: 'Barbra Banda',
    club: 'Orlando Pride',
    league: 'NWSL',
    position: 'Forward',
    age: 26,
    contract: '2027-12-31',
    salary: 'Unknown',
    status: 'Reported',
  },
  {
    name: 'Trinity Rodman',
    club: 'Washington Spirit',
    league: 'NWSL',
    position: 'Forward',
    age: 24,
    contract: '2026-12-31',
    salary: 'Unknown',
    status: 'Reported',
  },
  {
    name: 'Lucy Bronze',
    club: 'Chelsea FC Women',
    league: 'WSL',
    position: 'Defender',
    age: 34,
    contract: '2027-06-30',
    salary: 'Unknown',
    status: 'Estimated',
  },
  {
    name: 'Aitana Bonmatí',
    club: 'FC Barcelona Femení',
    league: 'Liga F',
    position: 'Midfielder',
    age: 28,
    contract: '2028-06-30',
    salary: 'Unknown',
    status: 'Reported',
  },
]

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

function formatSalary(
  annualSalary: number | null,
  currency: string | null
) {
  if (annualSalary === null) return 'Unknown'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(annualSalary)
}

function formatConfidence(confidence: string | null) {
  if (!confidence) return 'Database'

  return confidence.charAt(0).toUpperCase() + confidence.slice(1)
}

export default function Home() {
  const [q, setQ] = useState('')
  const [databasePlayers, setDatabasePlayers] = useState<Player[]>([])
  const [contracts, setContracts] = useState<ContractInfo[]>([])
  const [databaseStats, setDatabaseStats] = useState({
    players: 0,
    clubs: 0,
    contracts: 0,
    transfers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPlayers() {
      const [
        { data: playerData, error: playerError, count: playerCount },
        { data: contractData, error: contractError, count: contractCount },
        { count: clubCount, error: clubError },
        { count: transferCount, error: transferError },
      ] = await Promise.all([
        supabase
          .from('players')
          .select(
            'id, full_name, date_of_birth, nationality, position, preferred_foot, agency',
            { count: 'exact' }
          )
          .order('full_name', { ascending: true }),

        supabase
          .from('contracts')
          .select(`
            player_id,
            annual_salary,
            weekly_salary,
            currency,
            status,
            start_date,
            end_date,
            confidence,
            club:clubs (
              name,
              league,
              logo_url
            )
          `, { count: 'exact' }),

        supabase.from('clubs').select('id', { count: 'exact', head: true }),

        supabase.from('transfers').select('id', { count: 'exact', head: true }),
      ])

      if (playerError) {
        console.error('Error loading players:', playerError)
      }

      if (contractError) {
        console.error('Error loading contracts:', contractError)
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
      setLoading(false)
    }

    loadPlayers()
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

  const filteredDatabasePlayers = useMemo(() => {
    if (!q.trim()) return databasePlayers

    const search = q.toLowerCase()

    return databasePlayers.filter((player) => {
      const contract = contracts.find(
        (item) => item.player_id === player.id
      )

      const clubName = contract?.club?.name || ''
      const league = contract?.club?.league || ''

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
  }, [q, databasePlayers, contracts])

  const filteredFeaturedPlayers = useMemo(() => {
    if (!q.trim()) return featuredPlayers

    const search = q.toLowerCase()

    return featuredPlayers.filter((player) =>
      [
        player.name,
        player.club,
        player.league,
        player.position,
      ]
        .join(' ')
        .toLowerCase()
        .includes(search)
    )
  }, [q])

  const hasDatabaseResults = filteredDatabasePlayers.length > 0
  const hasFeaturedResults = filteredFeaturedPlayers.length > 0

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
      <nav
  style={{
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    padding: '18px 32px',
    borderBottom: '1px solid #e5e5e5',
    background: '#fff',
  }}
>
        <Link
          href="/"
          style={{
            fontSize: '24px',
            fontWeight: 800,
            textDecoration: 'none',
            color: '#111',
            marginRight: '40px',
          }}
        >
          WFM<span style={{ color: '#777' }}>•</span>
        </Link>

        <div
          style={{
            display: 'flex',
            gap: '28px',
            alignItems: 'center',
          }}
        >
          <Link
            href="/players"
            style={{ color: '#111', textDecoration: 'none' }}
          >
            Players
          </Link>

          <Link
            href="/contracts"
            style={{ color: '#111', textDecoration: 'none' }}
          >
            Contracts
          </Link>

          <Link
            href="/transfers"
            style={{ color: '#111', textDecoration: 'none' }}
          >
            Transfers
          </Link>

          <Link
            href="/salaries"
            style={{ color: '#111', textDecoration: 'none' }}
          >
            Salaries
          </Link>

          <Link
            href="/clubs"
            style={{ color: '#111', textDecoration: 'none' }}
          >
            Clubs
          </Link>
        </div>

        <button
          className="login"
          style={{
            marginLeft: 'auto',
            border: '1px solid #ddd',
            background: '#fff',
            borderRadius: '8px',
            padding: '9px 16px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Sign in
        </button>
      </nav>

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
          >
            THE WOMEN’S FOOTBALL DATABASE
          </div>

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
            >
              Built differently.
            </em>
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
              placeholder="Search player, club or league…"
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
          >
            Players
          </b>

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
          >
            Clubs
          </b>

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
          >
            Contracts
          </b>

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
          >
            Transfers
          </b>

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
              {q.trim() ? 'Search results' : 'Market leaders'}
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
              ? 'Searching database…'
              : `${filteredDatabasePlayers.length + filteredFeaturedPlayers.length} result${
                  filteredDatabasePlayers.length +
                    filteredFeaturedPlayers.length !==
                  1
                    ? 's'
                    : ''
                } found`}
          </div>
        )}

        <div
          className="table"
          style={{
            border: '1px solid #e3e3e3',
            borderRadius: '14px',
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          <div
            className="thead"
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
            <span>PLAYER</span>
            <span>CLUB</span>
            <span>LEAGUE</span>
            <span>CONTRACT</span>
            <span>SALARY</span>
            <span>CONFIDENCE</span>
          </div>

          {filteredDatabasePlayers.map((player) => {
            const age = calculateAge(player.date_of_birth)
            const contract = getContract(player.id)

            return (
              <Link
                href={`/players/${player.id}`}
                className="row"
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
                <span>
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

                <span>
                  {contract?.club?.name || 'Unknown'}
                </span>

                <span style={{ color: '#666' }}>
                  {contract?.club?.league || 'Unknown'}
                </span>

                <span>
                  {contract?.end_date || 'Unknown'}
                </span>

                <span>
                  {formatSalary(
                    contract?.annual_salary ?? null,
                    contract?.currency ?? null
                  )}
                </span>

                <span>
                  <i
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

          {!q.trim() &&
            filteredFeaturedPlayers.map((player) => (
              <div
                className="row"
                key={`featured-${player.name}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1.8fr 1.5fr 1fr 1.2fr 1.3fr 1fr',
                  gap: '16px',
                  padding: '16px 20px',
                  borderBottom: '1px solid #eeeeee',
                  alignItems: 'center',
                  fontSize: '14px',
                }}
              >
                <span>
                  <b>{player.name}</b>

                  <small
                    style={{
                      display: 'block',
                      marginTop: '4px',
                      color: '#888',
                      fontSize: '12px',
                    }}
                  >
                    {player.position} · {player.age}
                  </small>
                </span>

                <span>{player.club}</span>

                <span style={{ color: '#666' }}>{player.league}</span>

                <span>{player.contract}</span>

                <span>{player.salary}</span>

                <span>
                  <i
                    className={
                      'badge ' + player.status.toLowerCase()
                    }
                    style={{
                      display: 'inline-block',
                      fontStyle: 'normal',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '5px 8px',
                      borderRadius: '999px',
                      background:
                        player.status === 'Verified'
                          ? '#e9f7ee'
                          : player.status === 'Reported'
                            ? '#f3f3f3'
                            : '#f5f0e8',
                      color:
                        player.status === 'Verified'
                          ? '#237a43'
                          : player.status === 'Reported'
                            ? '#666'
                            : '#806b45',
                    }}
                  >
                    {player.status}
                  </i>
                </span>
              </div>
            ))}

          {q.trim() &&
            !hasDatabaseResults &&
            !hasFeaturedResults && (
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
            !hasDatabaseResults &&
            filteredFeaturedPlayers.length === 0 && (
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
        <article
          style={{
            border: '1px solid #e3e3e3',
            borderRadius: '14px',
            padding: '22px',
            background: '#fff',
          }}
        >
          <span style={{ fontSize: '11px', color: '#999', fontWeight: 700 }}>
            01
          </span>

          <h3 style={{ margin: '28px 0 8px', fontSize: '18px' }}>
            Contracts
          </h3>

          <p
            style={{
              margin: 0,
              color: '#777',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            Expiration dates, options, extensions and free-agent status.
          </p>
        </article>

        <article
          style={{
            border: '1px solid #e3e3e3',
            borderRadius: '14px',
            padding: '22px',
            background: '#fff',
          }}
        >
          <span style={{ fontSize: '11px', color: '#999', fontWeight: 700 }}>
            02
          </span>

          <h3 style={{ margin: '28px 0 8px', fontSize: '18px' }}>
            Transfers
          </h3>

          <p
            style={{
              margin: 0,
              color: '#777',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            Permanent moves, loans, trades, releases and fees.
          </p>
        </article>

        <article
          style={{
            border: '1px solid #e3e3e3',
            borderRadius: '14px',
            padding: '22px',
            background: '#fff',
          }}
        >
          <span style={{ fontSize: '11px', color: '#999', fontWeight: 700 }}>
            03
          </span>

          <h3 style={{ margin: '28px 0 8px', fontSize: '18px' }}>
            Salaries
          </h3>

          <p
            style={{
              margin: 0,
              color: '#777',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            Reported and estimated compensation with source confidence.
          </p>
        </article>

        <article
          style={{
            border: '1px solid #e3e3e3',
            borderRadius: '14px',
            padding: '22px',
            background: '#fff',
          }}
        >
          <span style={{ fontSize: '11px', color: '#999', fontWeight: 700 }}>
            04
          </span>

          <h3 style={{ margin: '28px 0 8px', fontSize: '18px' }}>
            Scouting
          </h3>

          <p
            style={{
              margin: 0,
              color: '#777',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            Find players by position, age, league and contract status.
          </p>
        </article>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '28px 20px 45px',
          borderTop: '1px solid #e5e5e5',
        }}
      >
        <div
          className="logo"
          style={{
            fontSize: '22px',
            fontWeight: 800,
          }}
        >
          WFM<span style={{ color: '#777' }}>•</span>
        </div>

        <p
          style={{
            color: '#777',
            fontSize: '14px',
            margin: '10px 0',
          }}
        >
          Built for Women’s Football.
        </p>

        <small
          style={{
            color: '#999',
            fontSize: '12px',
          }}
        >
          Data confidence is shown on every record. Estimates are never
          presented as confirmed facts.
        </small>
      </footer>
    </main>
  )
}
