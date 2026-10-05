"use client"

import Link from "next/link"
import { useWfmT } from "../../lib/use-wfm-t"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "../../lib/supabase"

type ClubParticipation = {
  club_id: string
  competition_name: string | null
  competition_id: string | null
  season_key: string | null
  season_label: string | null
}

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

type Source = { id: string; publisher: string | null; url: string | null; published_at: string | null; reliability: string | null; accessed_at: string | null }

const normalizeSource = (value: unknown): Source | null => Array.isArray(value) ? ((value[0] as Source | undefined) || null) : ((value as Source | null | undefined) || null)

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
  source: Source | null
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
  source: Source | null
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
  const t = useWfmT()
  const params = useParams()
  const id = params.id as string

  const [club, setClub] = useState<Club | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState("salary")
  const [officialVerification, setOfficialVerification] = useState<any>(null)
  const [clubParticipations, setClubParticipations] = useState<ClubParticipation[]>([])
  const [rosterPlayers, setRosterPlayers] = useState<Player[]>([])
  const [selectedSeason, setSelectedSeason] = useState("all")

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

      const { data: participationData } = await supabase
        .from("club_competitions")
        .select("id,club_id,competition_season:competition_seasons(competition:competitions(id,canonical_name),season:seasons(season_key,label))")
        .eq("club_id", id)

      const normalizedParticipations: ClubParticipation[] = (participationData || []).map((row: any) => {
        const competitionSeason = Array.isArray(row.competition_season) ? row.competition_season[0] : row.competition_season
        const competition = Array.isArray(competitionSeason?.competition) ? competitionSeason.competition[0] : competitionSeason?.competition
        const season = Array.isArray(competitionSeason?.season) ? competitionSeason.season[0] : competitionSeason?.season
        return {
          club_id: row.club_id,
          competition_name: competition?.canonical_name || null,
          competition_id: competition?.id || null,
          season_key: season?.season_key || null,
          season_label: season?.label || null,
        }
      })

      setClubParticipations(normalizedParticipations)

      const currentSeasonParticipation = (participationData || []).find((row: any) => {
        const cs = Array.isArray(row.competition_season) ? row.competition_season[0] : row.competition_season
        const season = Array.isArray(cs?.season) ? cs.season[0] : cs?.season
        return season?.season_key === "2026-2027"
      })
      const currentClubCompetition = (participationData || []).find((row: any) => {
        const cs = Array.isArray(row.competition_season) ? row.competition_season[0] : row.competition_season
        const season = Array.isArray(cs?.season) ? cs.season[0] : cs?.season
        return season?.season_key === "2026-2027"
      })
      let rosterRows: any[] = []
      if (currentClubCompetition?.id) {
        const { data: rosterData } = await supabase
          .from("player_competitions")
          .select("player_id,player:players(id,full_name,nationality,position,photo_url)")
          .eq("club_competition_id", currentClubCompetition.id)
        rosterRows = rosterData || []
      }
      setRosterPlayers(rosterRows.map((row: any) => Array.isArray(row.player) ? row.player[0] : row.player).filter(Boolean))

      const { data: officialData } = await supabase
        .from("official_verification_public")
        .select("verification_type,verified_at")
        .eq("club_id", id)
        .eq("status", "verified")
        .maybeSingle()

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
          source:sources(id,publisher,url,published_at,reliability,accessed_at)
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
        contractRows.map((contract): Contract => ({
          ...contract,
          source: normalizeSource(contract.source),
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
          confidence,
          source:sources(id,publisher,url,published_at,reliability,accessed_at)
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
        transferRows.map((transfer): Transfer => ({
          ...transfer,
          source: normalizeSource(transfer.source),
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
      setOfficialVerification(officialData || null)
      setContracts(contractsWithPlayers)
      setTransfers(transfersWithDetails)
      setLoading(false)
    }

    loadData()
  }, [id])

  const seasons = useMemo(() => {
    const values = new Map<string, string>()
    for (const row of clubParticipations) {
      if (row.season_key) values.set(row.season_key, row.season_label || row.season_key)
    }
    return Array.from(values.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [clubParticipations])

  const competitionsForSeason = useMemo(() => {
    const rows = selectedSeason === "all"
      ? clubParticipations
      : clubParticipations.filter((row) => row.season_key === selectedSeason)
    return Array.from(new Set(rows.map((row) => row.competition_name).filter(Boolean) as string[])).sort()
  }, [clubParticipations, selectedSeason])

  const currentCompetitionLabel = useMemo(() => {
    const rows = selectedSeason === "all"
      ? clubParticipations
      : clubParticipations.filter((row) => row.season_key === selectedSeason)
    return rows[0]?.competition_name || club?.league || "Competition unavailable"
  }, [clubParticipations, selectedSeason, club])

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

  const linkedSources = useMemo(() => {
    const map = new Map<string, Source>()
    for (const record of [...contracts, ...transfers]) {
      if (record.source?.id) map.set(record.source.id, record.source)
    }
    return Array.from(map.values())
  }, [contracts, transfers])

  const incomingTransfers = transfers.filter(
    (transfer) =>
      transfer.to_club?.id === id
  )

  const outgoingTransfers = transfers.filter(
    (transfer) =>
      transfer.from_club?.id === id
  )

  const clubIntelligence = useMemo(() => {
    const today = new Date()
    const plus180 = new Date(today)
    plus180.setDate(plus180.getDate() + 180)
    const active = currentContracts
    const positions = new Map<string, number>()
    for (const contract of active) {
      const key = contract.player?.position || "Unknown"
      positions.set(key, (positions.get(key) || 0) + 1)
    }
    const expiring180 = active.filter(contract => {
      if (!contract.end_date) return false
      const end = new Date(contract.end_date + "T00:00:00")
      return end >= today && end <= plus180
    })
    return {
      positions: Array.from(positions.entries()).sort((a, b) => b[1] - a[1]),
      expiring180,
      unknownSalary: active.filter(contract => contract.annual_salary === null).length,
      incoming: incomingTransfers.length,
      outgoing: outgoingTransfers.length,
    }
  }, [currentContracts, incomingTransfers.length, outgoingTransfers.length])

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
      <>
        <section className="players-scout-hero">
          <div className="players-scout-shell">
            <div className="players-scout-eyebrow">WOMEN&apos;S FOOTBALL MARKET</div>
            <h1>{t("Club Profile")}</h1>
            <p>{t("Loading club information, squad records, contract context and transfer activity.")}</p>
          </div>
        </section>
        <main className="players-page players-scout-page clubs-profile-page">
          <div className="scout-empty">{t("Loading club...")}</div>
        </main>
      </>
    );
  }

  if (!club) {
    return (
      <>
        <section className="players-scout-hero">
          <div className="players-scout-shell">
            <div className="players-scout-eyebrow">WOMEN&apos;S FOOTBALL MARKET</div>
            <h1>{t("Club Profile")}</h1>
            <p>{t("The requested club could not be found.")}</p>
          </div>
        </section>
        <main className="players-page players-scout-page clubs-profile-page">
          <div className="scout-empty">{t("Club not found.")}</div>
        </main>
      </>
    );
  }

  return (
    <>
      <section className="players-scout-hero club-profile-hero">
        <div className="players-scout-shell">
          <div className="club-profile-heading">
            {club.logo_url ? (
              <img
                src={club.logo_url}
                alt={club.name}
                className="club-profile-logo"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : null}
            <div className="club-profile-heading-copy">
              <div className="players-scout-eyebrow">CLUB PROFILE</div>
              <div className="club-profile-title-row">
                <h1>{club.name}</h1>
                {officialVerification ? (
                  <span className="club-verified-badge">✓ OFFICIAL WFM REPRESENTATIVE</span>
                ) : null}
              </div>
              <p>{[club.country, currentCompetitionLabel].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="players-page players-scout-page clubs-profile-page">
        <section className="scout-stat-grid">
          <div className="scout-stat"><span>ACTIVE PLAYERS</span><strong>{rosterPlayers.length || currentContracts.length}</strong></div>
          <div className="scout-stat"><span>CONTRACT RECORDS</span><strong>{contracts.length}</strong></div>
          <div className="scout-stat"><span>KNOWN PAYROLL</span><strong>{formatSalary(totalKnownPayroll, "USD")}</strong></div>
          <div className="scout-stat"><span>TRANSFER RECORDS</span><strong>{transfers.length}</strong></div>
        </section>

        <section className="club-context-card">
          <div className="club-context-main">
            <div>
              <span className="club-section-eyebrow">CLUB CONTEXT</span>
              <h2>Competition &amp; Season</h2>
              <p>{competitionsForSeason.length ? competitionsForSeason.join(" · ") : "No competition participation recorded."}</p>
            </div>
            <div className="club-context-controls">
              <label>
                <span>{t("Season")}</span>
                <select value={selectedSeason} onChange={(event) => setSelectedSeason(event.target.value)}>
                  <option value="all">{t("All seasons")}</option>
                  {seasons.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </label>
              <Link href={`/scouting?club=${id}`} className="club-dark-button">{t("Scout this club")} →</Link>
            </div>
          </div>
        </section>

        <section className="club-intelligence-card">
          <div className="club-section-heading">
            <div>
              <span className="club-section-eyebrow">CLUB INTELLIGENCE</span>
              <h2>Squad &amp; Contract Context</h2>
              <p>Descriptive intelligence derived from WFM roster, contract and transfer records. It does not assign a recruitment need or player rating.</p>
            </div>
          </div>

          <div className="club-mini-stat-grid">
            <div><span>CONTRACTS EXPIRING ≤180 DAYS</span><strong>{clubIntelligence.expiring180.length}</strong></div>
            <div><span>SALARY DATA UNAVAILABLE</span><strong>{clubIntelligence.unknownSalary}</strong></div>
            <div><span>INCOMING TRANSFERS</span><strong>{clubIntelligence.incoming}</strong></div>
            <div><span>OUTGOING TRANSFERS</span><strong>{clubIntelligence.outgoing}</strong></div>
          </div>

          <div className="club-intelligence-grid">
            <div>
              <h3>Position mix</h3>
              {clubIntelligence.positions.length ? clubIntelligence.positions.map(([position, count]) => (
                <div className="club-intelligence-line" key={position}><span>{position}</span><strong>{count}</strong></div>
              )) : <p className="club-muted">No position data recorded.</p>}
            </div>
            <div>
              <h3>Contracts ending soon</h3>
              {clubIntelligence.expiring180.length ? clubIntelligence.expiring180.slice(0, 8).map(contract => (
                <div className="club-intelligence-line" key={contract.id}>
                  <Link href={contract.player ? `/players/${contract.player.id}` : "#"}>{contract.player?.full_name || "Unknown player"}</Link>
                  <span>{formatDate(contract.end_date)}</span>
                </div>
              )) : <p className="club-muted">No active contracts ending within 180 days based on available dates.</p>}
            </div>
          </div>
        </section>

        <section className="club-profile-section">
          <div className="club-profile-section-heading">
            <div>
              <span className="club-section-eyebrow">SQUAD</span>
              <h2>{t("Current Players")}</h2>
              <p>Active roster and known contract information for the club profile.</p>
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="club-sort-select">
              <option value="salary">{t("Sort by Salary")}</option>
              <option value="name">{t("Sort by Name")}</option>
              <option value="position">{t("Sort by Position")}</option>
            </select>
          </div>

          <div className="club-player-table">
            <div className="club-player-table-header">
              <span>PLAYER</span><span>STATUS</span><span>EXPIRY</span><span>ANNUAL SALARY</span>
            </div>
            {rosterPlayers.length ? rosterPlayers.map((player) => {
              const contract = currentContracts.find((item) => item.player_id === player.id)
              return (
                <div className="club-player-row" key={player.id}>
                  <span className="club-player-cell club-player">
                    <Link href={`/players/${player.id}`} className="club-player-link">
                      {player.photo_url ? <img src={player.photo_url} alt={player.full_name} onError={(event) => { event.currentTarget.src = "/wfm-player-placeholder.svg" }} /> : <img src="/wfm-player-placeholder.svg" alt="" />}
                      <span><strong>{player.full_name}</strong><small>{[player.position, player.nationality].filter(Boolean).join(" · ") || "Player details unavailable"}</small></span>
                    </Link>
                  </span>
                  <span className="club-player-cell" data-label="Status">{contract?.status || "Roster"}</span>
                  <span className="club-player-cell" data-label="Expiry">{contract ? <strong>{formatDate(contract.end_date)}</strong> : "Not published"}</span>
                  <span className="club-player-cell" data-label="Annual Salary">{contract ? formatSalary(contract.annual_salary, contract.currency) : "Unknown"}</span>
                </div>
              )
            }) : sortedContracts.map((contract) => {
              const player = contract.player
              return (
                <div className="club-player-row" key={contract.id}>
                  <span className="club-player-cell club-player">
                    <Link href={player ? `/players/${player.id}` : "#"} className="club-player-link">
                      {player?.photo_url ? <img src={player.photo_url} alt={player.full_name} onError={(event) => { event.currentTarget.src = "/wfm-player-placeholder.svg" }} /> : <img src="/wfm-player-placeholder.svg" alt="" />}
                      <span><strong>{player?.full_name || "Unknown Player"}</strong><small>{[player?.position, player?.nationality].filter(Boolean).join(" · ") || "Player details unavailable"}</small></span>
                    </Link>
                  </span>
                  <span className="club-player-cell" data-label="Status">{contract.status || "Unknown"}</span>
                  <span className="club-player-cell" data-label="Expiry"><strong>{formatDate(contract.end_date)}</strong></span>
                  <span className="club-player-cell club-salary-cell" data-label="Salary"><strong>{formatSalary(contract.annual_salary, contract.currency)}</strong></span>
                </div>
              )
            })}
            {!rosterPlayers.length && sortedContracts.length === 0 ? <div className="scout-empty">{t("No current players found.")}</div> : null}
          </div>
        </section>

        <section className="club-profile-section">
          <div className="club-profile-section-heading">
            <div>
              <span className="club-section-eyebrow">MARKET ACTIVITY</span>
              <h2>{t("Transfer Activity")}</h2>
              <p>Recorded incoming and outgoing transfer activity connected to this club.</p>
            </div>
          </div>

          <div className="club-transfer-table">
            <div className="club-transfer-header">
              <span>PLAYER</span><span>FROM</span><span></span><span>TO</span><span>DATE</span><span>FEE</span>
            </div>
            {transfers.map((transfer) => (
              <div className="club-transfer-row" key={transfer.id}>
                <span><Link href={transfer.player ? `/players/${transfer.player.id}` : "#"}>{transfer.player?.full_name || "Unknown Player"}</Link></span>
                <span>{transfer.from_club ? <Link href={`/clubs/${transfer.from_club.id}`}>{transfer.from_club.name}</Link> : "Unknown"}</span>
                <span className="club-transfer-arrow">→</span>
                <span>{transfer.to_club ? <Link href={`/clubs/${transfer.to_club.id}`}>{transfer.to_club.name}</Link> : "Unknown"}</span>
                <span>{formatDate(transfer.transfer_date)}</span>
                <span><strong>{transfer.fee !== null ? formatSalary(transfer.fee, transfer.currency) : transfer.transfer_type || "Unknown"}</strong></span>
              </div>
            ))}
            {transfers.length === 0 ? <div className="scout-empty">{t("No transfer activity found.")}</div> : null}
          </div>
        </section>

        <section className="club-provenance-card">
          <div className="club-section-heading">
            <div>
              <span className="club-section-eyebrow">DATA PROVENANCE</span>
              <h2>{t("Source Context")}</h2>
              <p>WFM keeps uncertainty visible rather than presenting unsupported assumptions as facts.</p>
            </div>
            <span className="club-source-count">{linkedSources.length} linked source{linkedSources.length === 1 ? "" : "s"}</span>
          </div>

          {linkedSources.length > 0 ? (
            <div className="club-source-list">
              {linkedSources.map(source => (
                <div className="club-source-row" key={source.id}>
                  <div>
                    <strong>{source.publisher || "Source publisher not recorded"}</strong>
                    <small>
                      {source.published_at ? "Published " + formatDate(source.published_at) : "Publication date not recorded"}
                      {source.reliability ? " · " + source.reliability + " reliability" : ""}
                      {source.accessed_at ? " · Accessed " + new Date(source.accessed_at).toLocaleDateString("en-US") : ""}
                    </small>
                  </div>
                  {source.url ? <a href={source.url} target="_blank" rel="noreferrer">View source →</a> : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="club-source-empty">No linked source records are currently available for this club. WFM does not infer a source when one is not recorded.</div>
          )}
        </section>
      </main>

      <footer className="club-profile-footer">
        Women&apos;s Football Market · Data focused on the women&apos;s game
      </footer>
    </>
  );
}

