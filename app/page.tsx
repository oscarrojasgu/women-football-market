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
  {name:'Sophia Wilson', club:'Kansas City Current', league:'NWSL', position:'Forward', age:25, contract:'2026-12-31', salary:'$842,400', status:'Verified'},
  {name:'Temwa Chawinga', club:'Kansas City Current', league:'NWSL', position:'Forward', age:27, contract:'2027-12-31', salary:'Unknown', status:'Reported'},
  {name:'Barbra Banda', club:'Orlando Pride', league:'NWSL', position:'Forward', age:26, contract:'2027-12-31', salary:'Unknown', status:'Reported'},
  {name:'Trinity Rodman', club:'Washington Spirit', league:'NWSL', position:'Forward', age:24, contract:'2026-12-31', salary:'Unknown', status:'Reported'},
  {name:'Lucy Bronze', club:'Chelsea FC Women', league:'WSL', position:'Defender', age:34, contract:'2027-06-30', salary:'Unknown', status:'Estimated'},
  {name:'Aitana Bonmatí', club:'FC Barcelona Femení', league:'Liga F', position:'Midfielder', age:28, contract:'2028-06-30', salary:'Unknown', status:'Reported'}
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
        player.agency
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
        player.position
      ]
        .join(' ')
        .toLowerCase()
        .includes(search)
    )
  }, [q])

  const hasDatabaseResults = filteredDatabasePlayers.length > 0
  const hasFeaturedResults = filteredFeaturedPlayers.length > 0

  return (
    <main>
      <nav>
        <div className="logo">
          WFM<span>•</span>
        </div>

        <div className="navlinks">
  <Link href="/players">Players</Link>
  <Link href="/contracts">Contracts</Link>
  <Link href="/transfers">Transfers</Link>
  <Link href="/salaries">Salaries</Link>
  <Link href="/clubs">Clubs</Link>
</div>

        <button className="login">Sign in</button>
      </nav>

      <section className="hero">
        <div className="eyebrow">THE WOMEN’S FOOTBALL DATABASE</div>

        <h1>
          Know the market.
          <br />
          <em>Know the player.</em>
        </h1>

        <p>
          Track women’s football salaries, contracts, transfers and player
          movement — in one place.
        </p>

        <div className="search">
          <span>⌕</span>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search player, club or league…"
          />
        </div>
      </section>

      <section className="stats">
        <div>
          <b>Players</b>
          <strong>8,700+</strong>
        </div>

        <div>
          <b>Leagues</b>
          <strong>23</strong>
        </div>

        <div>
          <b>Clubs</b>
          <strong>1,900+</strong>
        </div>

        <div>
          <b>Contract data</b>
          <strong>Growing daily</strong>
        </div>
      </section>

      <section className="content">
        <div className="sectionhead">
          <div>
            <span className="eyebrow">PLAYER DATABASE</span>
            <h2>
              {q.trim() ? 'Search results' : 'Market leaders'}
            </h2>
          </div>

         <Link href="/players" className="outline">
  View all players →
</Link>
        </div>

        {q.trim() && (
          <div style={{ marginBottom: '18px', opacity: 0.65 }}>
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

        <div className="table">
          <div className="thead">
            <span>PLAYER</span>
            <span>CLUB</span>
            <span>LEAGUE</span>
            <span>CONTRACT</span>
            <span>SALARY</span>
            <span>CONFIDENCE</span>
          </div>

          {filteredDatabasePlayers.map((player) => {
            const age = calculateAge(player.date_of_birth)

            return (
              <div className="row" key={`db-${player.id}`}>
                <span>
                  <b>{player.full_name}</b>

                  <small>
                    {player.position || 'Unknown'}
                    {age !== null ? ` · ${age}` : ''}
                  </small>
                </span>

                <span>—</span>

                <span>—</span>

                <span>—</span>

                <span>Unknown</span>

                <span>
                  <i className="badge reported">
                    Database
                  </i>
                </span>
              </div>
            )
          })}

          {!q.trim() &&
            filteredFeaturedPlayers.map((player) => (
              <div className="row" key={`featured-${player.name}`}>
                <span>
                  <b>{player.name}</b>
                  <small>
                    {player.position} · {player.age}
                  </small>
                </span>

                <span>{player.club}</span>

                <span>{player.league}</span>

                <span>{player.contract}</span>

                <span>{player.salary}</span>

                <span>
                  <i
                    className={
                      'badge ' + player.status.toLowerCase()
                    }
                  >
                    {player.status}
                  </i>
                </span>
              </div>
            ))}

          {q.trim() &&
            !hasDatabaseResults &&
            !hasFeaturedResults && (
              <div className="empty">
                No players found. Try another search.
              </div>
            )}

          {!q.trim() && loading && (
            <div className="empty">
              Loading players...
            </div>
          )}

          {!q.trim() &&
            !loading &&
            !hasDatabaseResults &&
            filteredFeaturedPlayers.length === 0 && (
              <div className="empty">
                No players found.
              </div>
            )}
        </div>
      </section>

      <section className="cards">
        <article>
          <span>01</span>
          <h3>Contracts</h3>
          <p>
            Expiration dates, options, extensions and free-agent status.
          </p>
        </article>

        <article>
          <span>02</span>
          <h3>Transfers</h3>
          <p>
            Permanent moves, loans, trades, releases and fees.
          </p>
        </article>

        <article>
          <span>03</span>
          <h3>Salaries</h3>
          <p>
            Reported and estimated compensation with source confidence.
          </p>
        </article>

        <article>
          <span>04</span>
          <h3>Scouting</h3>
          <p>
            Find players by position, age, league and contract status.
          </p>
        </article>
      </section>

      <footer>
        <div className="logo">
          WFM<span>•</span>
        </div>

        <p>Built for women’s football.</p>

        <small>
          Data confidence is shown on every record. Estimates are never
          presented as confirmed facts.
        </small>
      </footer>
    </main>
  )
}
