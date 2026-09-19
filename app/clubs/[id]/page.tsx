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

type Player = {
  id: string
  full_name: string
  nationality: string | null
  position: string | null
  photo_url: string | null
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
  player: Player | null
}

type Transfer = {
  id: string
  player_id: string
  from_club_id: string | null
  to_club_id: string | null
  transfer_date: string | null
  transfer_type: string | null
  fee: number | null
  currency: string | null
  confidence: string | null
  player: Player | null
  from_club: Club | null
  to_club: Club | null
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

      if (!clubData) {
        setLoading(false)
        return
      }

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
          currency
        `)
        .eq("club_id", id)
        .order("start_date", { ascending: false })

      const contractRows = contractData || []

      const playerIds = [
        ...new Set(
          contractRows.map((contract) => contract.player_id)
        ),
      ]

      let playerMap: Record<string, Player> = {}

      if (playerIds.length > 0) {
        const { data: playerData } = await supabase
          .from("players")
          .select(`
            id,
            full_name,
            nationality,
            position,
            photo_url
          `)
          .in("id", playerIds)

        playerMap = Object.fromEntries(
          (playerData || []).map((player) => [
            player.id,
            player,
          ])
        )
      }

      const contractsWithPlayers: Contract[] =
        contractRows.map((contract) => ({
          ...contract,
          player:
            playerMap[contract.player_id] || null,
        }))

      const { data: transferData } = await supabase
        .from("transfers")
        .select(`
          id,
          player_id,
          from_club_id,
          to_club_id,
          transfer_date,
          transfer_type,
          fee,
          currency,
          confidence
        `)
        .or(
          `from_club_id.eq.${id},to_club_id.eq.${id}`
        )
        .order("transfer_date", {
          ascending: false,
        })

      const transferRows = transferData || []

      const transferPlayerIds = [
        ...new Set(
          transferRows.map(
            (transfer) => transfer.player_id
          )
        ),
      ]

      const transferClubIds = [
        ...new Set(
          transferRows.flatMap((transfer) =>
            [
              transfer.from_club_id,
              transfer.to_club_id,
            ].filter(Boolean)
          )
        ),
      ]

      let transferPlayerMap: Record<string, Player> = {}
      let transferClubMap: Record<string, Club> = {}

      if (transferPlayerIds.length > 0) {
        const { data: transferPlayers } =
          await supabase
            .from("players")
            .select(`
              id,
              full_name,
              nationality,
              position,
              photo_url
            `)
            .in("id", transferPlayerIds)

        transferPlayerMap = Object.fromEntries(
          (transferPlayers || []).map((player) => [
            player.id,
            player,
          ])
        )
      }

      if (transferClubIds.length > 0) {
        const { data: transferClubs } =
          await supabase
            .from("clubs")
            .select(`
              id,
              name,
              country,
              league,
              logo_url
            `)
            .in("id", transferClubIds)

        transferClubMap = Object.fromEntries(
          (transferClubs || []).map((club) => [
            club.id,
            club,
          ])
        )
      }

      const transfersWithDetails: Transfer[] =
        transferRows.map((transfer) => ({
          ...transfer,
          player:
            transferPlayerMap[transfer.player_id] ||
            null,
          from_club: transfer.from_club_id
            ? transferClubMap[transfer.from_club_id] ||
              null
            : null,
          to_club: transfer.to_club_id
            ? transferClubMap[transfer.to_club_id] ||
              null
            : null,
        }))

      setClub(clubData)
      setContracts(contractsWithPlayers)
      setTransfers(transfersWithDetails)
      setLoading(false)
    }

    loadData()
  }, [id])

  const currentContracts = useMemo(() => {
    return contracts.filter(
      (contract) =>
        contract.status?.toLowerCase() === "active"
    )
  }, [contracts])

  const salaryRecords = useMemo(() => {
    return currentContracts.filter(
      (contract) =>
        contract.annual_salary !== null
    )
  }, [currentContracts])

  const totalKnownPayroll = useMemo(() => {
    return salaryRecords.reduce(
      (total, contract) =>
        total + (contract.annual_salary || 0),
      0
    )
  }, [salaryRecords])

  const averageKnownSalary =
    salaryRecords.length > 0
      ? totalKnownPayroll / salaryRecords.length
      : null

  const highestPaidPlayer = useMemo(() => {
    if (salaryRecords.length === 0) return null

    return salaryRecords.reduce(
      (highest, contract) => {
        if (!highest) return contract

        return (contract.annual_salary || 0) >
          (highest.annual_salary || 0)
          ? contract
          : highest
      },
      salaryRecords[0]
    )
  }, [salaryRecords])

  const incomingTransfers = transfers.filter(
    (transfer) =>
      transfer.to_club?.id === id
  )

  const outgoingTransfers = transfers.filter(
    (transfer) =>
      transfer.from_club?.id === id
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

      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "32px 24px 60px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
            marginBottom: 24,
          }}
        >
          {[
            ["Players", currentContracts.length.toString()],
            ["Contracts", contracts.length.toString()],
            ["Known Payroll", formatSalary(totalKnownPayroll, "USD")],
            ["Transfers", transfers.length.toString()],
            [
              "Highest Salary",
              highestPaidPlayer
                ? formatSalary(
                    highestPaidPlayer.annual_salary,
                    highestPaidPlayer.currency
                  )
                : "Unknown",
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                background: "#fff",
                border: "1px solid #e5e5e5",
                borderRadius: 12,
                padding: "18px 20px",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "#777",
                  marginBottom: 6,
                }}
              >
                {label}
              </div>

              <div
                style={{
                  fontSize: 26,
                  fontWeight: 750,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        <section
          style={{
            marginBottom: 40,
          }}
        >
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
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 900,
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid #e5e5e5",
                      textAlign: "left",
                    }}
                  >
                    {["Player", "Status", "End Date", "Annual Salary"].map(
                      (heading) => (
                        <th
                          key={heading}
                          style={{
                            padding: "15px 16px",
                            fontSize: 11,
                            letterSpacing: 1,
                            textTransform: "uppercase",
                            color: "#888",
                            fontWeight: 700,
                          }}
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {sortedContracts.map((contract) => {
                    const player = contract.player

                    return (
                      <tr
                        key={contract.id}
                        style={{
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <td
                          style={{
                            padding: "16px",
                            fontWeight: 650,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            {player?.photo_url ? (
                              <img
                                src={player.photo_url}
                                alt={player.full_name}
                                style={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: "50%",
                                  objectFit: "contain",
                                  objectPosition: "center",
                                  display: "block",
                                  flexShrink: 0,
                                  background: "#f3f3f3",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: "50%",
                                  background: "#eee",
                                  flexShrink: 0,
                                }}
                              />
                            )}

                            <div>
                              {player ? (
                                <Link
                                  href={`/players/${player.id}`}
                                  style={{
                                    color: "#111",
                                    textDecoration: "none",
                                    fontWeight: 700,
                                  }}
                                >
                                  {player.full_name}
                                </Link>
                              ) : (
                                <div>Unknown Player</div>
                              )}

                              <div
                                style={{
                                  color: "#777",
                                  fontSize: 13,
                                  marginTop: 3,
                                }}
                              >
                                {[player?.nationality, player?.position]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td
                          style={{
                            padding: "16px",
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {contract.status || "Unknown"}
                        </td>

                        <td
                          style={{
                            padding: "16px",
                            fontSize: 14,
                            color: "#555",
                          }}
                        >
                          {formatDate(contract.end_date)}
                        </td>

                        <td
                          style={{
                            padding: "16px",
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
                              #{salaryRecords.findIndex(
                                (record) => record.id === contract.id
                              ) + 1} roster salary
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

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
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 900,
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid #e5e5e5",
                      textAlign: "left",
                    }}
                  >
                    {["Player", "From", "", "To", "Date", "Fee"].map(
                      (heading, index) => (
                        <th
                          key={`${heading}-${index}`}
                          style={{
                            padding: "15px 16px",
                            fontSize: 11,
                            letterSpacing: 1,
                            textTransform: "uppercase",
                            color: "#888",
                            fontWeight: 700,
                          }}
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {transfers.map((transfer) => (
                    <tr
                      key={transfer.id}
                      style={{
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <td
                        style={{
                          padding: "16px",
                          fontWeight: 650,
                        }}
                      >
                        <Link
                          href={`/players/${transfer.player?.id}`}
                          style={{
                            color: "#111",
                            textDecoration: "none",
                          }}
                        >
                          {transfer.player?.full_name || "Unknown Player"}
                        </Link>
                      </td>

                      <td style={{ padding: "16px" }}>
                        {transfer.from_club ? (
                          <Link
                            href={`/clubs/${transfer.from_club.id}`}
                            style={{
                              color: "#111",
                              textDecoration: "none",
                            }}
                          >
                            {transfer.from_club.name}
                          </Link>
                        ) : (
                          "Unknown"
                        )}
                      </td>

                      <td
                        style={{
                          padding: "16px",
                          color: "#999",
                          textAlign: "center",
                        }}
                      >
                        →
                      </td>

                      <td style={{ padding: "16px" }}>
                        {transfer.to_club ? (
                          <Link
                            href={`/clubs/${transfer.to_club.id}`}
                            style={{
                              color: "#111",
                              textDecoration: "none",
                            }}
                          >
                            {transfer.to_club.name}
                          </Link>
                        ) : (
                          "Unknown"
                        )}
                      </td>

                      <td
                        style={{
                          padding: "16px",
                        }}
                      >
                        {formatDate(transfer.transfer_date)}
                      </td>

                      <td
                        style={{
                          padding: "16px",
                          fontWeight: 650,
                        }}
                      >
                        {transfer.fee !== null
                          ? formatSalary(transfer.fee, transfer.currency)
                          : transfer.transfer_type || "Unknown"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

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
          </div>
        </section>
      </section>

      <footer
        style={{
          borderTop: "1px solid #ddd",
          padding: "30px 24px",
          color: "#777",
          fontSize: 13,
          textAlign: "center",
        }}
      >
        Women Football Market · Data focused
        on the women&apos;s game
      </footer>
    </main>
  )
}

const statCard = {
  background: "#fff",
  border: "1px solid #e5e5e5",
  borderRadius: 12,
  padding: "18px 20px",
}

const statLabel = {
  fontSize: 12,
  color: "#777",
  marginBottom: 6,
}

const statValue = {
  fontSize: 26,
  fontWeight: 750,
}

const statSubtext = {
  fontSize: 11,
  color: "#888",
  marginTop: 5,
}
