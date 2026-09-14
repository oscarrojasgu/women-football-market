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

export default function Home() {
  const [q, setQ] = useState('')
  const [databasePlayers, setDatabasePlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPlayers() {
      const { data, error } = await supabase
        .from('players')
        .select(
          'id, full_name, date_of_birth, nationality, position, preferred_foot, agency'
        )
        .order('full_name', { ascending: true })

      if (error) {
        console.error('Error loading players:', error)
        setLoading(false)
        return
      }

      setDatabasePlayers(data || [])
      setLoading(false)
    }

    loadPlayers()
  }, [])

  const filteredDatabasePlayers = useMemo(() => {
    if (!q.trim()) return databasePlayers

    const search = q.toLowerCase()

    return databasePlayers.filter((player) =>
      [
        player.full_name,
        player.nationality,
        player.position,
        player.agency,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search)
    )
  }, [q, databasePlayers])

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

  const totalSearchResults =
    filteredDatabasePlayers.length + filteredFeaturedPlayers.length

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#fff',
        color: '#111',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* HEADER */}
      <nav
        style={{
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

      {/* HERO */}
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '58px 20px 42px',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            color: '#777',
            fontWeight: 700,
            letterSpacing: '1.2px',
            marginBottom: '14px',
          }}
        >
          THE WOMEN’S FOOTBALL DATABASE
        </div>

        <h1
          style={{
            fontSize: '48px',
            lineHeight: 1.05,
            letterSpacing: '-1.8px',
            margin: '0 0 18px',
            fontWeight: 800,
          }}
        >
          Know the market.
          <br />
          <span style={{ color: '#777' }}>Know the player.</span>
        </h1>

        <p
          style={{
            fontSize: '17px',
            lineHeight: 1.6,
            color: '#666',
            maxWidth: '650px',
            margin: '0 0 28px',
          }}
        >
          Track women’s football salaries, contracts, transfers and player
          movement — in one place.
        </p>

        <div
          style={{
            maxWidth: '700px',
            display: 'flex',
            alignItems: 'center',
            border: '1px solid #ddd',
            borderRadius: '10px',
            background: '#fff',
            padding: '0 16px',
            height: '54px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <span
            style={{
              fontSize: '24px',
              color: '#777',
              marginRight: '12px',
              lineHeight: 1,
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
              color: '#111',
              background: 'transparent',
            }}
          />
        </div>
      </section>

      {/* STATS */}
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px 42px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            border: '1px solid #e3e3e3',
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >
          {[
            ['Players', '8,700+'],
            ['Leagues', '23'],
            ['Clubs', '1,900+'],
            ['Contract data', 'Growing daily'],
          ].map(([label, value], index) => (
            <div
              key={label}
              style={{
                padding: '22px 24px',
                borderRight:
                  index < 3 ? '1px solid #e5e5e5' : 'none',
                background: '#fff',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  color: '#777',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  fontWeight: 700,
                  marginBottom: '8px',
                }}
              >
                {label}
              </div>

              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PLAYER DATABASE */}
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px 60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '20px',
            gap: '20px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '13px',
                color: '#777',
                fontWeight: 700,
                letterSpacing: '1.2px',
                marginBottom: '8px',
              }}
            >
              PLAYER DATABASE
            </div>

            <h2
              style={{
                fontSize: '30px',
                lineHeight: 1.15,
                margin: 0,
                fontWeight: 750,
                letterSpacing: '-0.5px',
              }}
            >
              {q.trim() ? 'Search results' : 'Market leaders'}
            </h2>
          </div>

          <Link
            href="/players"
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '10px 15px',
              color: '#111',
              textDecoration: 'none',
              fontSize: '14px',
              whiteSpace: 'nowrap',
            }}
          >
            View all players →
          </Link>
        </div>

        {q.trim() && (
          <div
            style={{
              fontSize: '14px',
              color: '#777',
              marginBottom: '12px',
            }}
          >
            {loading
              ? 'Searching database…'
              : `${totalSearchResults} result${
                  totalSearchResults !== 1 ? 's' : ''
                } found`}
          </div>
        )}

        <div
          style={{
            border: '1px solid #e3e3e3',
            borderRadius: '14px',
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          {/* TABLE HEADER */}
          <div
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

          {/* DATABASE PLAYERS */}
          {filteredDatabasePlayers.map((player) => {
            const age = calculateAge(player.date_of_birth)

            return (
              <Link
                href={`/players/${player.id}`}
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
                  <b
                    style={{
                      display: 'block',
                      fontSize: '14px',
                    }}
                  >
                    {player.full_name}
                  </b>

                  <small
                    style={{
                      display: 'block',
                      color: '#888',
                      marginTop: '4px',
                      fontSize: '12px',
                    }}
                  >
                    {player.position || 'Unknown'}
                    {age !== null ? ` · ${age}` : ''}
                  </small>
                </span>

                <span style={{ color: '#777' }}>—</span>

                <span style={{ color: '#777' }}>—</span>

                <span style={{ color: '#777' }}>—</span>

                <span>
                  <b>Unknown</b>
                </span>

                <span>
                  <i
                    style={{
                      display: 'inline-block',
                      fontStyle: 'normal',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '5px 8px',
                      borderRadius: '999px',
                      background: '#f1f1f1',
                      color: '#555',
                    }}
                  >
                    Database
                  </i>
                </span>
              </Link>
            )
          })}

          {/* FEATURED PLAYERS */}
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
                  <b
                    style={{
                      display: 'block',
                    }}
                  >
                    {player.name}
                  </b>

                  <small
                    style={{
                      display: 'block',
                      color: '#888',
                      marginTop: '4px',
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

          {/* EMPTY STATES */}
          {q.trim() &&
            !hasDatabaseResults &&
            !hasFeaturedResults && (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#777',
                  fontSize: '14px',
                }}
              >
                No players found. Try another search.
              </div>
            )}

          {!q.trim() && loading && (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#777',
                fontSize: '14px',
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
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#777',
                  fontSize: '14px',
                }}
              >
                No players found.
              </div>
            )}
        </div>
      </section>

      {/* DATABASE FEATURES */}
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px 70px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
          }}
        >
          {[
            {
              number: '01',
              title: 'Contracts',
              text: 'Expiration dates, options, extensions and free-agent status.',
              href: '/contracts',
            },
            {
              number: '02',
              title: 'Transfers',
              text: 'Permanent moves, loans, trades, releases and fees.',
              href: '/transfers',
            },
            {
              number: '03',
              title: 'Salaries',
              text: 'Reported and estimated compensation with source confidence.',
              href: '/salaries',
            },
            {
              number: '04',
              title: 'Scouting',
              text: 'Find players by position, age, league and contract status.',
              href: '/players',
            },
          ].map((card) => (
            <Link
              href={card.href}
              key={card.number}
              style={{
                display: 'block',
                padding: '22px',
                border: '1px solid #e3e3e3',
                borderRadius: '14px',
                textDecoration: 'none',
                color: '#111',
                background: '#fff',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#999',
                  letterSpacing: '0.8px',
                  marginBottom: '28px',
                }}
              >
                {card.number}
              </span>

              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: '18px',
                  fontWeight: 700,
                }}
              >
                {card.title}
              </h3>

              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  lineHeight: 1.5,
                  color: '#777',
                }}
              >
                {card.text}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: '1px solid #e5e5e5',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '28px 20px 45px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '14px',
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: '22px',
              fontWeight: 800,
              textDecoration: 'none',
              color: '#111',
            }}
          >
            WFM<span style={{ color: '#777' }}>•</span>
          </Link>

          <span
            style={{
              fontSize: '14px',
              color: '#777',
            }}
          >
            Built for women’s football.
          </span>
        </div>

        <small
          style={{
            display: 'block',
            color: '#999',
            fontSize: '12px',
            lineHeight: 1.5,
            maxWidth: '600px',
          }}
        >
          Data confidence is shown on every record. Estimates are never
          presented as confirmed facts.
        </small>
      </footer>
    </main>
  )
}
