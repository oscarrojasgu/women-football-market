'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

type SalaryRecord = {
  id: string
  player_id: string
  annual_salary: number | null
  weekly_salary: number | null
  currency: string | null
  status: string | null
  confidence: string | null
  player: {
    id: string
    full_name: string
  } | null
  club: {
    id: string
    name: string
    league: string | null
    country: string | null
  } | null
}

function formatSalary(
  amount: number | null,
  currency: string | null
) {
  if (amount === null) return 'Unknown'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatConfidence(confidence: string | null) {
  if (!confidence) return 'Database'

  return confidence.charAt(0).toUpperCase() + confidence.slice(1)
}

function confidenceStyle(confidence: string | null) {
  const value = confidence?.toLowerCase()

  if (value === 'verified') {
    return {
      background: '#e9f7ee',
      color: '#237a43',
    }
  }

  if (value === 'reported') {
    return {
      background: '#f3f3f3',
      color: '#666',
    }
  }

  return {
    background: '#f5f0e8',
    color: '#806b45',
  }
}

export default function SalariesPage() {
  const [records, setRecords] = useState<SalaryRecord[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSalaries() {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          id,
          player_id,
          annual_salary,
          weekly_salary,
          currency,
          status,
          confidence,
          player:players (
            id,
            full_name
          ),
          club:clubs (
            id,
            name,
            league,
            country
          )
        `)
        .order('annual_salary', {
          ascending: false,
          nullsFirst: false,
        })

      if (error) {
        console.error('Error loading salaries:', error)
      }

      setRecords((data || []) as unknown as SalaryRecord[])
      setLoading(false)
    }

    loadSalaries()
  }, [])

  const filteredRecords = useMemo(() => {
    if (!q.trim()) return records

    const search = q.toLowerCase()

    return records.filter((record) => {
      return [
        record.player?.full_name,
        record.club?.name,
        record.club?.league,
        record.club?.country,
        record.currency,
        record.status,
        record.confidence,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search)
    })
  }, [q, records])

  const salaryRecords = records.filter(
    (record) => record.annual_salary !== null
  )

  const highestSalary =
    salaryRecords.length > 0
      ? Math.max(
          ...salaryRecords.map(
            (record) => record.annual_salary || 0
          )
        )
      : null

  const averageSalary =
    salaryRecords.length > 0
      ? salaryRecords.reduce(
          (total, record) =>
            total + (record.annual_salary || 0),
          0
        ) / salaryRecords.length
      : null

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
            style={{
              color: '#111',
              textDecoration: 'none',
              fontWeight: 700,
            }}
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
            Salaries
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
            Reported and estimated player compensation across
            women’s football.
          </p>
        </div>
      </section>

      {/* STATS */}
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '32px 24px 60px',
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            border: '1px solid #e3e3e3',
            borderRadius: '12px',
            padding: '18px 20px',
            background: '#fff',
          }}
        >
          <b
            style={{
              display: 'block',
              fontSize: '12px',
              color: '#777',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '6px',
            }}
          >
            Salary records
          </b>

          <strong
            style={{
              display: 'block',
              fontSize: '26px',
            }}
          >
            {records.length}
          </strong>
        </div>

        <div
          style={{
            border: '1px solid #e3e3e3',
            borderRadius: '12px',
            padding: '18px 20px',
            background: '#fff',
          }}
        >
          <b
            style={{
              display: 'block',
              fontSize: '12px',
              color: '#777',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '6px',
            }}
          >
            Highest annual salary
          </b>

          <strong
            style={{
              display: 'block',
              fontSize: '26px',
            }}
          >
            {formatSalary(
              highestSalary,
              salaryRecords[0]?.currency || 'USD'
            )}
          </strong>
        </div>

        <div
          style={{
            border: '1px solid #e3e3e3',
            borderRadius: '12px',
            padding: '18px 20px',
            background: '#fff',
          }}
        >
          <b
            style={{
              display: 'block',
              fontSize: '12px',
              color: '#777',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '6px',
            }}
          >
            Average annual salary
          </b>

          <strong
            style={{
              display: 'block',
              fontSize: '26px',
            }}
          >
            {formatSalary(
              averageSalary !== null
                ? Math.round(averageSalary)
                : null,
              salaryRecords[0]?.currency || 'USD'
            )}
          </strong>
        </div>
      </section>

      {/* SALARY TABLE */}
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px 60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '20px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '13px',
                color: '#777',
                fontWeight: 700,
                letterSpacing: '1.2px',
              }}
            >
              SALARY DATABASE
            </div>

            <h2
              style={{
                margin: '8px 0 0',
                fontSize: '30px',
                lineHeight: 1.1,
                letterSpacing: '-0.5px',
              }}
            >
              Player salaries
            </h2>
          </div>

          <div
            style={{
              width: '300px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #ddd',
              borderRadius: '8px',
              background: '#fff',
              padding: '0 13px',
            }}
          >
            <span
              style={{
                fontSize: '20px',
                color: '#777',
                marginRight: '8px',
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
                fontSize: '14px',
                background: 'transparent',
                color: '#111',
              }}
            />
          </div>
        </div>

        <div
          style={{
            border: '1px solid #e3e3e3',
            borderRadius: '14px',
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                '1.7fr 1.5fr 1fr 1.2fr 1.2fr 1fr',
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
            <span>ANNUAL</span>
            <span>WEEKLY</span>
            <span>CONFIDENCE</span>
          </div>

          {loading && (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#777',
              }}
            >
              Loading salary data...
            </div>
          )}

          {!loading &&
            filteredRecords.map((record) => {
              const confidence = confidenceStyle(
                record.confidence
              )

              return (
                <Link
                  key={record.id}
                  href={`/players/${record.player_id}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1.7fr 1.5fr 1fr 1.2fr 1.2fr 1fr',
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
                    <b>
                      {record.player?.full_name || 'Unknown'}
                    </b>

                    <small
                      style={{
                        display: 'block',
                        marginTop: '4px',
                        color: '#888',
                        fontSize: '12px',
                      }}
                    >
                      {record.status || 'Unknown'}
                    </small>
                  </span>

                  <span>
                    {record.club?.name || 'Unknown'}
                  </span>

                  <span style={{ color: '#666' }}>
                    {record.club?.league || 'Unknown'}
                  </span>

                  <span>
                    {formatSalary(
                      record.annual_salary,
                      record.currency
                    )}
                  </span>

                  <span>
                    {formatSalary(
                      record.weekly_salary,
                      record.currency
                    )}
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
                        background: confidence.background,
                        color: confidence.color,
                      }}
                    >
                      {formatConfidence(record.confidence)}
                    </i>
                  </span>
                </Link>
              )
            })}

          {!loading &&
            filteredRecords.length === 0 && (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#777',
                }}
              >
                No salary records found.
              </div>
            )}
          </div>
        </div>
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
          Built for women’s football.
        </p>

        <small
          style={{
            color: '#999',
            fontSize: '12px',
          }}
        >
          Salary figures are presented according to their source
          confidence. Estimates are never presented as confirmed
          facts.
        </small>
      </footer>
    </main>
  )
}
