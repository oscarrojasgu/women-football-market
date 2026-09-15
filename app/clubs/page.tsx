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
}

type ContractRecord = {
  club_id: string
  player_id: string
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [contracts, setContracts] = useState<ContractRecord[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadClubs() {
      const [{ data: clubData, error: clubError }, { data: contractData, error: contractError }] =
        await Promise.all([
          supabase
            .from('clubs')
            .select(`
              id,
              name,
              country,
              league,
              logo_url
            `)
            .order('name', { ascending: true }),

          supabase
            .from('contracts')
            .select('club_id, player_id'),
        ])

      if (clubError) {
        console.error('Error loading clubs:', clubError)
      }

      if (contractError) {
        console.error('Error loading club contracts:', contractError)
      }

      setClubs((clubData || []) as Club[])
      setContracts((contractData || []) as ContractRecord[])
      setLoading(false)
    }

    loadClubs()
  }, [])

  const playerCounts = useMemo(() => {
    const counts: Record<string, Set<string>> = {}

    contracts.forEach((contract) => {
      if (!contract.club_id || !contract.player_id) return

      if (!counts[contract.club_id]) {
        counts[contract.club_id] = new Set()
      }

      counts[contract.club_id].add(contract.player_id)
    })

    return counts
  }, [contracts])

  const contractCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    contracts.forEach((contract) => {
      if (!contract.club_id) return

      counts[contract.club_id] = (counts[contract.club_id] || 0) + 1
    })

    return counts
  }, [contracts])

  const filteredClubs = useMemo(() => {
    if (!q.trim()) return clubs

    const search = q.toLowerCase()

    return clubs.filter((club) => {
      return [
        club.name,
        club.league,
        club.country,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search)
    })
  }, [q, clubs])

  const leagueCount = new Set(
    clubs
      .map((club) => club.league)
      .filter(Boolean)
  ).size

  const countryCount = new Set(
    clubs
      .map((club) => club.country)
      .filter(Boolean)
  ).size

  const clubsWithContracts = clubs.filter(
    (club) => (contractCounts[club.id] || 0) > 0
  ).length

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
            style={{
              color: '#111',
              textDecoration: 'none',
            }}
          >
            Players
          </Link>

          <Link
            href="/contracts"
            style={{
              color: '#111',
              textDecoration: 'none',
            }}
          >
            Contracts
          </Link>

          <Link
            href="/transfers"
            style={{
              color: '#111',
              textDecoration: 'none',
            }}
          >
            Transfers
          </Link>

          <Link
            href="/salaries"
            style={{
              color: '#111',
              textDecoration: 'none',
            }}
          >
            Salaries
          </Link>

          <Link
            href="/clubs"
            style={{
              color: '#111',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Clubs
          </Link>
        </div>

        <button
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

      {/* PAGE HEADER */}
      <section
        style={{
          background: '#111',
          color: '#fff',
          padding: '55px 6vw 50px',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              color: '#aaa',
              fontWeight: 700,
              letterSpacing: '1.2px',
              marginBottom: '14px',
            }}
          >
            WOMEN’S FOOTBALL MARKET
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: '46px',
              lineHeight: 1.05,
              letterSpacing: '-1.5px',
              fontWeight: 800,
            }}
          >
            Clubs
          </h1>

          <p
            style={{
              margin: '18px 0 0',
              maxWidth: '680px',
              fontSize: '17px',
              lineHeight: 1.55,
              color: '#c7c7c7',
            }}
          >
            Explore clubs, leagues, countries, and the players
            connected to them across women’s football.
          </p>
        </div>
      </section>

      {/* STATS */}
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '35px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e5e5',
            borderRadius: '14px',
            padding: '22px',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: '#888',
              fontWeight: 700,
              letterSpacing: '0.8px',
            }}
          >
            CLUBS
          </div>

          <div
            style={{
              marginTop: '8px',
              fontSize: '30px',
              fontWeight: 800,
            }}
          >
            {loading ? '—' : clubs.length}
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e5e5',
            borderRadius: '14px',
            padding: '22px',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: '#888',
              fontWeight: 700,
              letterSpacing: '0.8px',
            }}
          >
            LEAGUES
          </div>

          <div
            style={{
              marginTop: '8px',
              fontSize: '30px',
              fontWeight: 800,
            }}
          >
            {loading ? '—' : leagueCount}
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e5e5',
            borderRadius: '14px',
            padding: '22px',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: '#888',
              fontWeight: 700,
              letterSpacing: '0.8px',
            }}
          >
            COUNTRIES
          </div>

          <div
            style={{
              marginTop: '8px',
              fontSize: '30px',
              fontWeight: 800,
            }}
          >
            {loading ? '—' : countryCount}
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e5e5',
            borderRadius: '14px',
            padding: '22px',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: '#888',
              fontWeight: 700,
              letterSpacing: '0.8px',
            }}
          >
            WITH CONTRACT DATA
          </div>

          <div
            style={{
              marginTop: '8px',
              fontSize: '30px',
              fontWeight: 800,
            }}
          >
            {loading ? '—' : clubsWithContracts}
          </div>
        </div>
      </section>

      {/* CLUB TABLE */}
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px 60px',
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid #e3e3e3',
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >
          {/* TABLE HEADER */}
          <div
            style={{
              padding: '20px 22px',
              borderBottom: '1px solid #e8e8e8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 800,
                }}
              >
                Club Database
              </h2>

              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: '13px',
                  color: '#888',
                }}
              >
                {loading
                  ? 'Loading clubs...'
                  : `${filteredClubs.length} club${
                      filteredClubs.length === 1 ? '' : 's'
                    }`}
              </p>
            </div>

            <input
              type="text"
              placeholder="Search clubs..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{
                width: '260px',
                border: '1px solid #ddd',
                borderRadius: '9px',
                padding: '11px 13px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* TABLE */}
          <div
            style={{
              overflowX: 'auto',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: '#fafafa',
                    borderBottom: '1px solid #e8e8e8',
                  }}
                >
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '13px 22px',
                      fontSize: '11px',
                      color: '#888',
                      letterSpacing: '0.8px',
                    }}
                  >
                    CLUB
                  </th>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '13px 22px',
                      fontSize: '11px',
                      color: '#888',
                      letterSpacing: '0.8px',
                    }}
                  >
                    LEAGUE
                  </th>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '13px 22px',
                      fontSize: '11px',
                      color: '#888',
                      letterSpacing: '0.8px',
                    }}
                  >
                    COUNTRY
                  </th>

                  <th
                    style={{
                      textAlign: 'right',
                      padding: '13px 22px',
                      fontSize: '11px',
                      color: '#888',
                      letterSpacing: '0.8px',
                    }}
                  >
                    PLAYERS
                  </th>

                  <th
                    style={{
                      textAlign: 'right',
                      padding: '13px 22px',
                      fontSize: '11px',
                      color: '#888',
                      letterSpacing: '0.8px',
                    }}
                  >
                    CONTRACTS
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: '40px 22px',
                        textAlign: 'center',
                        color: '#888',
                      }}
                    >
                      Loading clubs...
                    </td>
                  </tr>
                ) : filteredClubs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: '40px 22px',
                        textAlign: 'center',
                        color: '#888',
                      }}
                    >
                      No clubs found.
                    </td>
                  </tr>
                ) : (
                  filteredClubs.map((club) => (
                    <tr
                      key={club.id}
                      style={{
                        borderBottom: '1px solid #eeeeee',
                      }}
                    >
                      <td
                        style={{
                          padding: '17px 22px',
                          fontWeight: 700,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                          }}
                        >
                          {club.logo_url ? (
                            <img
                              src={
  club.name === 'Orlando Pride'
    ? 'https://a.espncdn.com/i/teamlogos/soccer/500/15366.png'
    : club.name === 'Tampa Bay Sun FC'
    ? 'https://a.espncdn.com/i/teamlogos/soccer/500/22021.png'
    : club.name === 'Washington Spirit'
    ? 'https://a.espncdn.com/i/teamlogos/soccer/500/15417.png'
    : club.logo_url
}
                              alt=""
                              style={{
                                width: '34px',
                                height: '34px',
                                objectFit: 'contain',
                                borderRadius: '6px',
                                background: '#f7f7f7',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '6px',
                                background: '#f1f1f1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 800,
                                color: '#777',
                              }}
                            >
                              {club.name
                                ? club.name.charAt(0).toUpperCase()
                                : '?'}
                            </div>
                          )}

                          <Link
  href={`/clubs/${club.id}`}
  style={{
    color: '#111',
    textDecoration: 'none',
  }}
>
  {club.name}
</Link>
                        </div>
                      </td>

                      <td
                        style={{
                          padding: '17px 22px',
                          color: '#555',
                        }}
                      >
                        {club.league || '—'}
                      </td>

                      <td
                        style={{
                          padding: '17px 22px',
                          color: '#555',
                        }}
                      >
                        {club.country || '—'}
                      </td>

                      <td
                        style={{
                          padding: '17px 22px',
                          textAlign: 'right',
                          fontWeight: 700,
                        }}
                      >
                        {playerCounts[club.id]?.size || 0}
                      </td>

                      <td
                        style={{
                          padding: '17px 22px',
                          textAlign: 'right',
                          color: '#555',
                        }}
                      >
                        {contractCounts[club.id] || 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: '1px solid #e5e5e5',
          padding: '28px 20px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#888',
          background: '#fff',
        }}
      >
        Women’s Football Market · Data is continuously updated
      </footer>
    </main>
  )
}
