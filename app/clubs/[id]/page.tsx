"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "../../lib/supabase"

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
  if (amount === null) return "Unknown"

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string | null) {
  if (!date) return "Present"

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function ClubProfilePage() {
  const params = useParams()
  const id = params.id as string

  const [club, setClub] = useState<Club | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState("salary")

  useEffect(() => {
    async function loadData() {
      setLoading(true)

      const { data: clubData } = await supabase
        .from("clubs")
        .select(`
          id,
          name,
          country,
          league,
          logo_url
        `)
        .eq("id", id)
        .single()

      const { data: contractData } = await supabase
        .from("contracts")
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
        .eq("club_id", id)
        .order("start_date", { ascending: false })

      const { data: transferData } = await supabase
        .from("transfers")
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
        .order("transfer_date", { ascending: false })

      setClub(clubData)
      setContracts(contractData || [])
      setTransfers(transferData || [])
      setLoading(false)
    }

    loadData()
  }, [id])

  const currentContracts = useMemo(() => {
    return contracts.filter(
      (contract) => contract.status?.toLowerCase() === "active"
    )
  }, [contracts])

  const salaryRecords = useMemo(() => {
    return currentContracts.filter(
      (contract) => contract.annual_salary !== null
    )
  }, [currentContracts])

  const totalKnownPayroll = useMemo(() => {
    return salaryRecords.reduce(
      (total, contract) => total + (contract.annual_salary || 0),
      0
    )
  }, [salaryRecords])

  const averageKnownSalary =
    salaryRecords.length > 0
      ? totalKnownPayroll / salaryRecords.length
      : null

  const highestPaidPlayer = useMemo(() => {
    if (salaryRecords.length === 0) return null

    return salaryRecords.reduce((highest, contract) => {
      if (!highest) return contract

      return (contract.annual_salary || 0) >
        (highest.annual_salary || 0)
        ? contract
        : highest
    }, salaryRecords[0])
  }, [salaryRecords])

  const incomingTransfers = transfers.filter(
    (transfer) => transfer.to_club?.id === id
  )

  const outgoingTransfers = transfers.filter(
    (transfer) => transfer.from_club?.id === id
  )

  const sortedContracts = useMemo(() => {
    const sorted = [...currentContracts]

    if (sortBy === "salary") {
      sorted.sort(
        (a, b) =>
          (b.annual_salary || 0) -
          (a.annual_salary || 0)
      )
    }

    if (sortBy === "name") {
      sorted.sort((a, b) =>
        (a.player?.full_name || "").localeCompare(
          b.player?.full_name || ""
        )
      )
    }

    if (sortBy === "position") {
      sorted.sort((a, b) =>
        (a.player?.position || "").localeCompare(
          b.player?.position || ""
        )
      )
    }

    return sorted
  }, [currentContracts, sortBy])

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f5f4ef",
        }}
      >
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
              textDecoration: "none",
              color: "#111",
              fontSize: 24,
              fontWeight: 800,
              marginRight: 40,
            }}
          >
            WFM<span style={{ color: "#777" }}>•</span>
          </Link>

          <div
            style={{
              display: "flex",
              gap: 28,
            }}
          >
            <Link href="/players" style={{ color: "#111", textDecoration: "none" }}>
              Players
            </Link>
            <Link href="/contracts" style={{ color: "#111", textDecoration: "none" }}>
              Contracts
            </Link>
            <Link href="/transfers" style={{ color: "#111", textDecoration: "none" }}>
              Transfers
            </Link>
            <Link href="/salaries" style={{ color: "#111", textDecoration: "none" }}>
              Salaries
            </Link>
            <Link href="/clubs" style={{ color: "#111", textDecoration: "none", fontWeight: 700 }}>
              Clubs
            </Link>
          </div>

          <button
            style={{
              marginLeft: "auto",
              border: "1px solid #ddd",
              background: "#fff",
              borderRadius: 8,
              padding: "9px 16px",
              fontSize: 14,
            }}
          >
            Sign in
          </button>
        </nav>

        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "80px 24px",
          }}
        >
          Loading club...
        </div>
      </main>
    )
  }

  if (!club) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f5f4ef",
        }}
      >
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
              textDecoration: "none",
              color: "#111",
              fontSize: 24,
              fontWeight: 800,
              marginRight: 40,
            }}
          >
            WFM<span style={{ color: "#777" }}>•</span>
          </Link>

          <div style={{ display: "flex", gap: 28 }}>
            <Link href="/players">Players</Link>
            <Link href="/contracts">Contracts</Link>
            <Link href="/transfers">Transfers</Link>
            <Link href="/salaries">Salaries</Link>
            <Link href="/clubs" style={{ fontWeight: 700 }}>
              Clubs
            </Link>
          </div>
        </nav>

        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "80px 24px",
          }}
        >
          Club not found.
        </div>
      </main>
    )
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f4ef",
        color: "#111",
      }}
    >
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
            textDecoration: "none",
            color: "#111",
            fontSize: 24,
            fontWeight: 800,
            marginRight: 40,
          }}
        >
          WFM<span style={{ color: "#777" }}>•</span>
        </Link>

        <div
          style={{
            display: "flex",
            gap: 28,
          }}
        >
          <Link href="/players" style={{ color: "#111", textDecoration: "none" }}>
            Players
          </Link>

          <Link href="/contracts" style={{ color: "#111", textDecoration: "none" }}>
            Contracts
          </Link>

          <Link href="/transfers" style={{ color: "#111", textDecoration: "none" }}>
            Transfers
          </Link>

          <Link href="/salaries" style={{ color: "#111", textDecoration: "none" }}>
            Salaries
          </Link>

          <Link
            href="/clubs"
            style={{
              color: "#111",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Clubs
          </Link>
        </div>

        <button
          style={{
            marginLeft: "auto",
            border: "1px solid #ddd",
            background: "#fff",
            borderRadius: 8,
            padding: "9px 16px",
            fontSize: 14,
          }}
        >
          Sign in
        </button>
      </nav>

      <section
        style={{
          background: "#111",
          color: "#fff",
          padding: "55px 6vw 50px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            {club.logo_url ? (
              <img
                src={club.logo_url}
                alt={club.name}
                style={{
                  width: 90,
                  height: 90,
                  objectFit: "contain",
                  background: "#fff",
                  borderRadius: 12,
                  padding: 10,
                }}
              />
            ) : null}

            <div>
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: 2,
                  fontWeight: 700,
                  marginBottom: 12,
                  color: "#aaa",
                }}
              >
                CLUB PROFILE
              </div>

              <h1
                style={{
                  fontSize: 46,
                  lineHeight: 1.05,
                  margin: 0,
                }}
              >
                {club.name}
              </h1>

              <div
                style={{
                  marginTop: 12,
                  color: "#bbb",
                  fontSize: 16,
                }}
              >
                {[club.country, club.league]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "35px 24px 70px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div style={statCard}>
            <div style={statLabel}>Players</div>
            <div style={statValue}>{currentContracts.length}</div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>Contracts</div>
            <div style={statValue}>{contracts.length}</div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>Known Payroll</div>
            <div style={statValue}>
              {formatSalary(totalKnownPayroll, "USD")}
            </div>
            <div style={statSubtext}>
              {salaryRecords.length} of {currentContracts.length} players with salary data
            </div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>Transfers</div>
            <div style={statValue}>
              {transfers.length}
            </div>
            <div style={statSubtext}>
              {incomingTransfers.length} incoming · {outgoingTransfers.length} outgoing
            </div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>Highest Salary</div>
            <div style={statValue}>
              {highestPaidPlayer
                ? formatSalary(
                    highestPaidPlayer.annual_salary,
                    highestPaidPlayer.currency
                  )
                : "Unknown"}
            </div>
            <div style={statSubtext}>
              {highestPaidPlayer?.player?.full_name || "No salary data"}
            </div>
          </div>
        </div>

        <section style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 26,
                }}
              >
                Current Players
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#666",
                }}
              >
                Active roster and known contract information.
              </p>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: "10px 12px",
                background: "#fff",
                fontSize: 14,
              }}
            >
              <option value="salary">Sort by Salary</option>
              <option value="name">Sort by Name</option>
              <option value="position">Sort by Position</option>
            </select>
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e5e5",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                padding: "14px 18px",
                background: "#fafafa",
                borderBottom: "1px solid #eee",
                fontSize: 12,
                fontWeight: 700,
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              <div>Player</div>
              <div>Status</div>
              <div>End Date</div>
              <div>Annual Salary</div>
            </div>

            {sortedContracts.map((contract, index) => (
              <div
                key={contract.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr",
                  padding: "16px 18px",
                  borderBottom: "1px solid #eee",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {contract.player?.photo_url ? (
                    <img
                      src={contract.player.photo_url}
                      alt={contract.player.full_name}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        background: "#eee",
                      }}
                    />
                  )}

                  <div>
                    <Link
                      href={`/players/${contract.player?.id}`}
                      style={{
                        color: "#111",
                        textDecoration: "none",
                        fontWeight: 700,
                      }}
                    >
                      {contract.player?.full_name || "Unknown Player"}
                    </Link>

                    <div
                      style={{
                        color: "#777",
                        fontSize: 13,
                        marginTop: 3,
                      }}
                    >
                      {[
                        contract.player?.nationality,
                        contract.player?.position,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {contract.status || "Unknown"}
                </div>

                <div
                  style={{
                    fontSize: 14,
                    color: "#555",
                  }}
                >
                  {formatDate(contract.end_date)}
                </div>

                <div
                  style={{
                    fontWeight: 700,
                  }}
                >
                  {formatSalary(
                    contract.annual_salary,
                    contract.currency
                  )}

                  {contract.annual_salary !== null && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#888",
                        marginTop: 3,
                      }}
                    >
                      #{index + 1} roster salary
                    </div>
                  )}
                </div>
              </div>
            ))}

            {sortedContracts.length === 0 && (
              <div
                style={{
                  padding: 30,
                  color: "#777",
                }}
              >
                No active players found.
              </div>
            )}
          </div>
        </section>

        <section>
          <h2
            style={{
              margin: "0 0 16px",
              fontSize: 26,
            }}
          >
            Transfer Activity
          </h2>

          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e5e5",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 1.5fr 1.5fr 1fr 1fr",
                padding: "14px 18px",
                background: "#fafafa",
                borderBottom: "1px solid #eee",
                fontSize: 12,
                fontWeight: 700,
                color: "#666",
                textTransform: "uppercase",
              }}
            >
              <div>Player</div>
              <div>From</div>
              <div>To</div>
              <div>Date</div>
              <div>Fee</div>
            </div>

            {transfers.map((transfer) => (
              <div
                key={transfer.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1.5fr 1.5fr 1fr 1fr",
                  padding: "16px 18px",
                  borderBottom: "1px solid #eee",
                  alignItems: "center",
                }}
              >
                <Link
                  href={`/players/${transfer.player?.id}`}
                  style={{
                    color: "#111",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  {transfer.player?.full_name || "Unknown Player"}
                </Link>

                <Link
                  href={`/clubs/${transfer.from_club?.id}`}
                  style={{
                    color: "#111",
                    textDecoration: "none",
                  }}
                >
                  {transfer.from_club?.name || "Unknown"}
                </Link>

                <Link
                  href={`/clubs/${transfer.to_club?.id}`}
                  style={{
                    color: "#111",
                    textDecoration: "none",
                  }}
                >
                  {transfer.to_club?.name || "Unknown"}
                </Link>

                <div>
                  {formatDate(transfer.transfer_date)}
                </div>

                <div
                  style={{
                    fontWeight: 600,
                  }}
                >
                  {transfer.fee !== null
                    ? formatSalary(
                        transfer.fee,
                        transfer.currency
                      )
                    : transfer.transfer_type || "Unknown"}
                </div>
              </div>
            ))}

            {transfers.length === 0 && (
              <div
                style={{
                  padding: 30,
                  color: "#777",
                }}
              >
                No transfer activity found.
              </div>
            )}
          </div>
        </section>
      </div>

      <footer
        style={{
          borderTop: "1px solid #ddd",
          padding: "30px 24px",
          color: "#777",
          fontSize: 13,
          textAlign: "center",
        }}
      >
        Women Football Market · Data focused on the women&apos;s game
      </footer>
    </main>
  )
}

const statCard = {
  background: "#fff",
  border: "1px solid #e5e5e5",
  borderRadius: 12,
  padding: 20,
}

const statLabel = {
  fontSize: 12,
  color: "#777",
  textTransform: "uppercase" as const,
  letterSpacing: 0.5,
  fontWeight: 700,
}

const statValue = {
  fontSize: 24,
  fontWeight: 800,
  marginTop: 8,
}

const statSubtext = {
  fontSize: 11,
  color: "#888",
  marginTop: 5,
}
