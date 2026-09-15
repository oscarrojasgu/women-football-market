'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'

type Club = {
  id: string
  name: string
  country: string | null
  league: string | null
  logo_url: string | null
}

type Contract = {
  id: string
  player_id: string
  status: string | null
  confidence: string | null
  start_date: string | null
  end_date: string | null
  annual_salary: number | null
  weekly_salary: number | null
  currency: string | null
  player: {
  id: string
  full_name: string
  nationality: string | null
  position: string | null
  photo_url: string | null
} | null
}

type Transfer = {
  id: string
  player_id: string
  transfer_date: string | null
  transfer_type: string | null
  fee: number | null
  currency: string | null
  confidence: string | null
  player: {
    id: string
    full_name: string
  } | null
  from_club: {
    id: string
    name: string
  } | null
  to_club: {
    id: string
    name: string
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

function formatDate(date: string | null) {
  if (!date) return 'Unknown'

  return new Date(`${date}T00:00:00`).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  )
}

export default function ClubProfilePage() {
  const params = useParams()
  const id = params.id as string

  const [club, setClub] = useState<Club | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadClub() {
      const [
        { data: clubData, error: clubError },
        { data: contractData, error: contractError },
        { data: transferData, error: transferError },
      ] = await Promise.all([
        supabase
          .from('clubs')
          .select(`
            id,
            name,
            country,
            league,
            logo_url
          `)
          .eq('id', id)
          .single(),

        supabase
          .from('contracts')
          .select(`
            id,
            player_id,
            status,
            confidence,
            start_date,
            end_date,
            annual_salary,
            weekly_salary,
            currency,
player:players (
  id,
  full_name,
  nationality,
  position,
  photo_url
)
          `)
          .eq('club_id', id)
          .order('start_date', {
            ascending: false,
          }),

        supabase
          .from('transfers')
          .select(`
            id,
            player_id,
            transfer_date,
            transfer_type,
            fee,
            currency,
            confidence,
            player:players (
              id,
              full_name
            ),
            from_club:clubs!transfers_from_club_id_fkey (
              id,
              name
            ),
            to_club:clubs!transfers_to_club_id_fkey (
              id,
              name
            )
          `)
          .or(`from_club_id.eq.${id},to_club_id.eq.${id}`)
          .order('transfer_date', {
            ascending: false,
          }),
      ])

      if (clubError) {
        console.error('Error loading club:', clubError)
      }

      if (contractError) {
        console.error(
          'Error loading club contracts:',
          contractError
        )
      }

      if (transferError) {
        console.error(
          'Error loading club transfers:',
          transferError
        )
      }

      setClub(clubData as Club | null)
      setContracts(
        (contractData || []) as unknown as Contract[]
      )
      setTransfers(
        (transferData || []) as unknown as Transfer[]
      )

      setLoading(false)
    }

    if (id) {
      loadClub()
    }
  }, [id])

  const currentContracts = contracts.filter(
    (contract) => contract.status?.toLowerCase() === 'active'
  )

  const salaryRecords = currentContracts.filter(
    (contract) => contract.annual_salary !== null
  )

  const totalKnownPayroll = salaryRecords.reduce(
    (total, contract) =>
      total + (contract.annual_salary || 0),
    0
  )

  const incomingTransfers = transfers.filter(
    (transfer) =>
      transfer.to_club?.id === id
  )

  const outgoingTransfers = transfers.filter(
    (transfer) =>
      transfer.from_club?.id === id
  )

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#f5f4ef',
          color: '#111',
          fontFamily: 'Arial, sans-serif',
          padding: '60px 20px',
          textAlign: 'center',
        }}
      >
        Loading club...
      </main>
    )
  }

  if (!club) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#f5f4ef',
          color: '#111',
          fontFamily: 'Arial, sans-serif',
          padding: '60px 20px',
          textAlign: 'center',
        }}
      >
        <h1>Club not found</h1>

        <Link
          href="/clubs"
          style={{
            color: '#111',
            fontWeight: 700,
          }}
        >
          ← Back to Clubs
        </Link>
      </main>
    )
  }

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
    position: "sticky",
    top: 0,
    zIndex: 1000,
    width: "100%",
    display: "flex",
    alignItems: "center",
    padding: "18px 32px",
    borderBottom: "1px solid #e5e5e5",
    background: "#fff",
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

      {/* CLUB HERO */}
      <section
        style={{
          background: '#111',
          color: '#fff',
          padding: '50px 6vw',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          <Link
            href="/clubs"
            style={{
              color: '#aaa',
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            ← Back to Clubs
          </Link>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              marginTop: '30px',
            }}
          >
            {club.logo_url ? (
              <img
                src={club.logo_url}
                alt={club.name}
                style={{
                  width: '90px',
                  height: '90px',
                  objectFit: 'contain',
                  background: '#fff',
                  borderRadius: '14px',
                  padding: '8px',
                }}
              />
            ) : (
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '14px',
                  background: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '34px',
                  fontWeight: 800,
                }}
              >
                {club.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#aaa',
                  fontWeight: 700,
                  letterSpacing: '1.2px',
                  marginBottom: '8px',
                }}
              >
                CLUB PROFILE
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
                {club.name}
              </h1>

              <p
                style={{
                  margin: '12px 0 0',
                  color: '#c7c7c7',
                  fontSize: '16px',
                }}
              >
                {club.league || 'League unknown'}
                {club.country
                  ? ` · ${club.country}`
                  : ''}
              </p>
            </div>
          </div>
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
            PLAYERS
          </div>

          <div
            style={{
              marginTop: '8px',
              fontSize: '30px',
              fontWeight: 800,
            }}
          >
            {currentContracts.length}
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
            CONTRACTS
          </div>

          <div
            style={{
              marginTop: '8px',
              fontSize: '30px',
              fontWeight: 800,
            }}
          >
            {contracts.length}
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
            KNOWN PAYROLL
          </div>

          <div
            style={{
              marginTop: '8px',
              fontSize: '26px',
              fontWeight: 800,
            }}
          >
            {salaryRecords.length > 0
              ? formatSalary(
                  totalKnownPayroll,
                  salaryRecords[0].currency
                )
              : 'Unknown'}
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
            TRANSFERS
          </div>

          <div
            style={{
              marginTop: '8px',
              fontSize: '30px',
              fontWeight: 800,
            }}
          >
            {transfers.length}
          </div>
        </div>
      </section>

      {/* CURRENT PLAYERS */}
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px 30px',
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
          <div
            style={{
              padding: '20px 22px',
              borderBottom: '1px solid #e8e8e8',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 800,
              }}
            >
              Current Players
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
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
                    PLAYER
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
                    CONTRACT
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
                    END DATE
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
                    ANNUAL SALARY
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentContracts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        padding: '40px 22px',
                        textAlign: 'center',
                        color: '#888',
                      }}
                    >
                      No active contract data available.
                    </td>
                  </tr>
                ) : (
                  currentContracts.map((contract) => (
                    <tr
                      key={contract.id}
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
                        {contract.player ? (
                          <Link
                            href={`/players/${contract.player.id}`}
                            style={{
                              color: '#111',
                              textDecoration: 'none',
                            }}
                          >
                            {contract.player.full_name}
                          </Link>
                        ) : (
                          'Unknown player'
                        )}
                      </td>

                      <td
                        style={{
                          padding: '17px 22px',
                          color: '#555',
                        }}
                      >
                        {contract.status || '—'}
                      </td>

                      <td
                        style={{
                          padding: '17px 22px',
                          color: '#555',
                        }}
                      >
                        {formatDate(contract.end_date)}
                      </td>

                      <td
                        style={{
                          padding: '17px 22px',
                          textAlign: 'right',
                          fontWeight: 700,
                        }}
                      >
                        {formatSalary(
                          contract.annual_salary,
                          contract.currency
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* TRANSFERS */}
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
          <div
            style={{
              padding: '20px 22px',
              borderBottom: '1px solid #e8e8e8',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 800,
              }}
            >
              Transfer Activity
            </h2>

            <p
              style={{
                margin: '6px 0 0',
                fontSize: '13px',
                color: '#888',
              }}
            >
              Incoming and outgoing player movements.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
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
                    PLAYER
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
                    FROM
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
                    TO
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
                    DATE
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
                    FEE
                  </th>
                </tr>
              </thead>

              <tbody>
                {transfers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: '40px 22px',
                        textAlign: 'center',
                        color: '#888',
                      }}
                    >
                      No transfer data available.
                    </td>
                  </tr>
                ) : (
                  transfers.map((transfer) => (
                    <tr
                      key={transfer.id}
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
                        {transfer.player ? (
                          <Link
                            href={`/players/${transfer.player.id}`}
                            style={{
                              color: '#111',
                              textDecoration: 'none',
                            }}
                          >
                            {transfer.player.full_name}
                          </Link>
                        ) : (
                          'Unknown player'
                        )}
                      </td>

                      <td
                        style={{
                          padding: '17px 22px',
                          color:
                            transfer.from_club?.id === id
                              ? '#111'
                              : '#555',
                          fontWeight:
                            transfer.from_club?.id === id
                              ? 700
                              : 400,
                        }}
                      >
                        {transfer.from_club?.name || '—'}
                      </td>

                      <td
                        style={{
                          padding: '17px 22px',
                          color:
                            transfer.to_club?.id === id
                              ? '#111'
                              : '#555',
                          fontWeight:
                            transfer.to_club?.id === id
                              ? 700
                              : 400,
                        }}
                      >
                        {transfer.to_club?.name || '—'}
                      </td>

                      <td
                        style={{
                          padding: '17px 22px',
                          color: '#555',
                        }}
                      >
                        {formatDate(
                          transfer.transfer_date
                        )}
                      </td>

                      <td
                        style={{
                          padding: '17px 22px',
                          textAlign: 'right',
                          fontWeight: 700,
                        }}
                      >
                        {transfer.fee !== null
                          ? formatSalary(
                              transfer.fee,
                              transfer.currency
                            )
                          : transfer.transfer_type
                            ? transfer.transfer_type
                                .charAt(0)
                                .toUpperCase() +
                              transfer.transfer_type.slice(1)
                            : 'Unknown'}
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
