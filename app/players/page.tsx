"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { getPlayerRoleGroup, roleLabels, type PlayerRoleGroup } from "../lib/player-roles";
import { getScoutingArchetype } from "../lib/scouting";

type Player = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  position: string | null;
  secondary_position: string | null;
  preferred_foot: string | null;
  agency: string | null;
  photo_url: string | null;
};

type ContractInfo = {
  player_id: string;
  annual_salary_usd: number | null;
  weekly_salary_usd: number | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  confidence: string | null;
  club: {
    name: string;
    league: string | null;
    logo_url: string | null;
  } | null;
};

type SeasonIntel = {
  player_id: string;
  season: string;
  club_name: string | null;
  league: string | null;
  position: string | null;
  minutes: number | null;
  goals: number | null;
  assists: number | null;
  xg: number | null;
  xa: number | null;
  goals_per90: number | null;
  assists_per90: number | null;
  xg_per90: number | null;
  xa_per90: number | null;
  chances_created_per90: number | null;
  key_passes_per90: number | null;
  tackles_per90: number | null;
  interceptions_per90: number | null;
  progressive_carries_per90: number | null;
};

type MarketValue = {
  player_id: string;
  valuation_date: string;
  market_value_usd: number | null;
};

type PeerBenchmark = {
  player_id: string;
  season: string;
  league: string | null;
  position: string | null;
  peer_count: number | null;
  goals_per90_percentile: number | null;
  assists_per90_percentile: number | null;
  xg_per90_percentile: number | null;
  xa_per90_percentile: number | null;
  chances_created_per90_percentile: number | null;
  key_passes_per90_percentile: number | null;
  tackles_per90_percentile: number | null;
  interceptions_per90_percentile: number | null;
  progressive_carries_per90_percentile: number | null;
};

type SavedWorkflow = { name: string; playerIds: string[]; createdAt: string };\n\ntype SortKey =
  | "name"
  | "age"
  | "minutes"
  | "goals90"
  | "assists90"
  | "xg90"
  | "value"
  | "salary"
  | "contract";

const seasonStart = (season: string | null) => {
  if (!season) return 0;
  const match = season.match(/(19|20)\d{2}/);
  return match ? Number(match[0]) : 0;
};

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [contracts, setContracts] = useState<ContractInfo[]>([]);
  const [seasonIntel, setSeasonIntel] = useState<SeasonIntel[]>([]);
  const [marketValues, setMarketValues] = useState<MarketValue[]>([]);
  const [peerBenchmarks, setPeerBenchmarks] = useState<PeerBenchmark[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<PlayerRoleGroup | "All">("All");
  const [nationality, setNationality] = useState("All");
  const [league, setLeague] = useState("All");
  const [club, setClub] = useState("All");
  const [minimumMinutes, setMinimumMinutes] = useState("0");
  const [scoutingFocus, setScoutingFocus] = useState("All");
  const [minimumPercentile, setMinimumPercentile] = useState("0");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [shortlist, setShortlist] = useState<string[]>([]);\n  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const router = useRouter();\n\n  useEffect(() => {\n    try {\n      const storedShortlist = localStorage.getItem("wfm_scouting_shortlist");\n      if (storedShortlist) setShortlist(JSON.parse(storedShortlist));\n      const storedWorkflows = localStorage.getItem("wfm_scouting_workflows");\n      if (storedWorkflows) setSavedWorkflows(JSON.parse(storedWorkflows));\n    } catch {\n      setShortlist([]);\n      setSavedWorkflows([]);\n    }\n  }, []);\n\n  useEffect(() => {\n    try { localStorage.setItem("wfm_scouting_shortlist", JSON.stringify(shortlist)); } catch {}\n  }, [shortlist]);

  useEffect(() => {
    async function loadPlayers() {
      setLoading(true);

      const [playerResult, contractResult, intelResult, valueResult, peerResult] =
        await Promise.all([
          supabase
            .from("players")
            .select(`
              id,
              full_name,
              date_of_birth,
              nationality,
              position,
              secondary_position,
              preferred_foot,
              agency,
              photo_url
            `)
            .order("full_name", { ascending: true }),

          supabase
            .from("contracts")
            .select(`
              player_id,
              annual_salary_usd,
              weekly_salary_usd,
              status,
              start_date,
              end_date,
              confidence,
              club:clubs (
                name,
                league,
                logo_url
              )
            `),

          supabase
            .from("player_season_intelligence")
            .select(`
              player_id,
              season,
              club_name,
              league,
              position,
              minutes,
              goals,
              assists,
              xg,
              xa,
              goals_per90,
              assists_per90,
              xg_per90,
              xa_per90,
              chances_created_per90,
              key_passes_per90,
              tackles_per90,
              interceptions_per90,
              progressive_carries_per90
            `),

          supabase
            .from("market_values")
            .select("player_id, valuation_date, market_value_usd")
            .order("valuation_date", { ascending: false }),

          supabase
            .from("player_peer_benchmarks")
            .select("player_id,season,league,position,peer_count,goals_per90_percentile,assists_per90_percentile,xg_per90_percentile,xa_per90_percentile,chances_created_per90_percentile,key_passes_per90_percentile,tackles_per90_percentile,interceptions_per90_percentile,progressive_carries_per90_percentile"),
        ]);

      if (playerResult.error) {
        console.error("Error loading players:", playerResult.error);
        setPlayers([]);
      } else {
        setPlayers(playerResult.data || []);
      }

      if (contractResult.error) {
        console.error("Error loading contracts:", contractResult.error);
      } else {
        setContracts(
          (contractResult.data || []).map((contract: any) => ({
            player_id: contract.player_id,
            annual_salary_usd: contract.annual_salary_usd,
            weekly_salary_usd: contract.weekly_salary_usd,
            status: contract.status,
            start_date: contract.start_date,
            end_date: contract.end_date,
            confidence: contract.confidence,
            club: Array.isArray(contract.club)
              ? contract.club[0] || null
              : contract.club || null,
          }))
        );
      }

      if (intelResult.error) {
        console.error("Error loading player intelligence:", intelResult.error);
      } else {
        setSeasonIntel((intelResult.data || []) as SeasonIntel[]);
      }

      if (valueResult.error) {
        console.error("Error loading market values:", valueResult.error);
      } else {
        setMarketValues((valueResult.data || []) as MarketValue[]);
      }

      if (peerResult.error) {
        console.error("Error loading peer benchmarks:", peerResult.error);
      } else {
        setPeerBenchmarks((peerResult.data || []) as PeerBenchmark[]);
      }

      setLoading(false);
    }

    loadPlayers();
  }, []);

  const contractByPlayer = useMemo(() => {
    const map = new Map<string, ContractInfo>();

    for (const contract of contracts) {
      const current = map.get(contract.player_id);
      const isActive = contract.status?.toLowerCase() === "active";
      const currentIsActive = current?.status?.toLowerCase() === "active";

      if (!current || (isActive && !currentIsActive)) {
        map.set(contract.player_id, contract);
        continue;
      }

      if (
        current &&
        isActive === currentIsActive &&
        (contract.end_date || "") > (current.end_date || "")
      ) {
        map.set(contract.player_id, contract);
      }
    }

    return map;
  }, [contracts]);

  const latestIntelByPlayer = useMemo(() => {
    const map = new Map<string, SeasonIntel>();

    for (const row of seasonIntel) {
      const current = map.get(row.player_id);
      const rowYear = seasonStart(row.season);
      const currentYear = seasonStart(current?.season || null);

      if (
        !current ||
        rowYear > currentYear ||
        (rowYear === currentYear &&
          Number(row.minutes || 0) > Number(current.minutes || 0))
      ) {
        map.set(row.player_id, row);
      }
    }

    return map;
  }, [seasonIntel]);

  const latestPeerByPlayer = useMemo(() => {
    const map = new Map<string, PeerBenchmark>();
    for (const row of peerBenchmarks) {
      const current = map.get(row.player_id);
      const year = seasonStart(row.season);
      const currentYear = seasonStart(current?.season || null);
      if (!current || year > currentYear) map.set(row.player_id, row);
    }
    return map;
  }, [peerBenchmarks]);

  const scoutingMetricValues = (benchmark: PeerBenchmark | undefined, focus: string) => {
    if (!benchmark || focus === "All") return [];
    const metrics: Record<string, (keyof PeerBenchmark)[]> = {
      attack: ["goals_per90_percentile", "xg_per90_percentile", "assists_per90_percentile"],
      creation: ["assists_per90_percentile", "xa_per90_percentile", "chances_created_per90_percentile", "key_passes_per90_percentile"],
      defending: ["tackles_per90_percentile", "interceptions_per90_percentile"],
      progression: ["progressive_carries_per90_percentile"],
    };
    return (metrics[focus] || []).map((key) => Number(benchmark[key] ?? -1)).filter((value) => value >= 0);
  };

  const latestValueByPlayer = useMemo(() => {
    const map = new Map<string, MarketValue>();

    for (const value of marketValues) {
      if (!map.has(value.player_id)) {
        map.set(value.player_id, value);
      }
    }

    return map;
  }, [marketValues]);

  const nationalities = useMemo(
    () =>
      Array.from(
        new Set(
          players
            .map((player) => player.nationality)
            .filter(Boolean) as string[]
        )
      ).sort(),
    [players]
  );

  const roles = useMemo(
    () =>
      Array.from(
        new Set(
          players.map((player) =>
            getPlayerRoleGroup(player.position, player.secondary_position)
          )
        )
      ).sort((a, b) => roleLabels[a].localeCompare(roleLabels[b])),
    [players]
  );

  const leagues = useMemo(() => {
    const values = new Set<string>();

    for (const player of players) {
      const contract = contractByPlayer.get(player.id);
      const intel = latestIntelByPlayer.get(player.id);
      if (contract?.club?.league) values.add(contract.club.league);
      else if (intel?.league) values.add(intel.league);
    }

    return Array.from(values).sort();
  }, [players, contractByPlayer, latestIntelByPlayer]);

  const clubs = useMemo(() => {
    const values = new Set<string>();

    for (const player of players) {
      const contract = contractByPlayer.get(player.id);
      const intel = latestIntelByPlayer.get(player.id);
      if (contract?.club?.name) values.add(contract.club.name);
      else if (intel?.club_name) values.add(intel.club_name);
    }

    return Array.from(values).sort();
  }, [players, contractByPlayer, latestIntelByPlayer]);

  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return null;

    const birthDate = new Date(`${dateOfBirth}T00:00:00`);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const formatNumber = (value: number | null, digits = 1) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "—";
    }
    return Number(value).toFixed(digits);
  };

  const formatMoney = (value: number | null) => {
    if (value === null || value === undefined) return "—";

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
      notation: "compact",
    }).format(Number(value));
  };

  const formatDate = (value: string | null) => {
    if (!value) return "—";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
  };

  const toggleShortlist = (playerId: string) => {
    setShortlist((current) => {
      const next = current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId];
      localStorage.setItem("wfm_scouting_shortlist", JSON.stringify(next));
      return next;
    });
  };

  const compareShortlist = () => {
    if (shortlist.length < 2) return;
    router.push(`/compare?player1=${encodeURIComponent(shortlist[0])}&player2=${encodeURIComponent(shortlist[1])}`);
  };

  const filtersActive =
    search.trim() !== "" ||
    role !== "All" ||
    nationality !== "All" ||
    league !== "All" ||
    club !== "All" ||
    minimumMinutes !== "0" ||
    scoutingFocus !== "All" ||
    minimumPercentile !== "0";

  const clearFilters = () => {
    setSearch("");
    setRole("All");
    setNationality("All");
    setLeague("All");
    setClub("All");
    setMinimumMinutes("0");
    setScoutingFocus("All");
    setMinimumPercentile("0");
  };

  const changeSort = (next: SortKey) => {
    if (sortKey === next) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(next);
      setSortDirection(next === "name" ? "asc" : "desc");
    }
  };

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDirection === "asc" ? " ↑" : " ↓") : "";

  const filteredPlayers = useMemo(() => {
    const query = search.toLowerCase().trim();
    const minMinutes = Number(minimumMinutes);

    const rows = players.filter((player) => {
      const intel = latestIntelByPlayer.get(player.id);
      const contract = contractByPlayer.get(player.id);
      const playerRole = getPlayerRoleGroup(
        player.position,
        player.secondary_position
      );
      const benchmark = latestPeerByPlayer.get(player.id);
      const percentileThreshold = Number(minimumPercentile);
      const focusValues = scoutingMetricValues(benchmark, scoutingFocus);
      const matchesScoutingFocus = scoutingFocus === "All" || (
        focusValues.length > 0 && Math.max(...focusValues) >= percentileThreshold
      );

      const searchValues = [
        player.full_name,
        player.nationality,
        player.position,
        player.secondary_position,
        player.preferred_foot,
        player.agency,
        contract?.club?.name,
        contract?.club?.league,
        intel?.club_name,
        intel?.league,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      const matchesSearch =
        !query || searchValues.some((value) => value.includes(query));

      return (
        matchesSearch &&
        (role === "All" || playerRole === role) &&
        (nationality === "All" || player.nationality === nationality) &&
        (league === "All" ||
          contract?.club?.league === league ||
          (!contract?.club?.league && intel?.league === league)) &&
        (club === "All" ||
          contract?.club?.name === club ||
          (!contract?.club?.name && intel?.club_name === club)) &&
        Number(intel?.minutes || 0) >= minMinutes &&
        matchesScoutingFocus
      );
    });

    return rows.sort((a, b) => {
      const aIntel = latestIntelByPlayer.get(a.id);
      const bIntel = latestIntelByPlayer.get(b.id);
      const aContract = contractByPlayer.get(a.id);
      const bContract = contractByPlayer.get(b.id);
      const aValue = latestValueByPlayer.get(a.id);
      const bValue = latestValueByPlayer.get(b.id);

      let comparison = 0;

      if (sortKey === "name") {
        comparison = a.full_name.localeCompare(b.full_name);
      } else if (sortKey === "age") {
        comparison =
          Number(calculateAge(a.date_of_birth) || 0) -
          Number(calculateAge(b.date_of_birth) || 0);
      } else if (sortKey === "minutes") {
        comparison =
          Number(aIntel?.minutes || 0) - Number(bIntel?.minutes || 0);
      } else if (sortKey === "goals90") {
        comparison =
          Number(aIntel?.goals_per90 || 0) -
          Number(bIntel?.goals_per90 || 0);
      } else if (sortKey === "assists90") {
        comparison =
          Number(aIntel?.assists_per90 || 0) -
          Number(bIntel?.assists_per90 || 0);
      } else if (sortKey === "xg90") {
        comparison =
          Number(aIntel?.xg_per90 || 0) - Number(bIntel?.xg_per90 || 0);
      } else if (sortKey === "value") {
        comparison =
          Number(aValue?.market_value_usd || 0) -
          Number(bValue?.market_value_usd || 0);
      } else if (sortKey === "salary") {
        comparison =
          Number(aContract?.annual_salary_usd || 0) -
          Number(bContract?.annual_salary_usd || 0);
      } else if (sortKey === "contract") {
        comparison = (aContract?.end_date || "9999-12-31").localeCompare(
          bContract?.end_date || "9999-12-31"
        );
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [
    players,
    search,
    role,
    nationality,
    league,
    club,
    minimumMinutes,
    scoutingFocus,
    minimumPercentile,
    sortKey,
    sortDirection,
    latestIntelByPlayer,
    contractByPlayer,
    latestValueByPlayer,
    latestPeerByPlayer,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / pageSize));

  useEffect(() => { setPage(1); }, [search, role, nationality, league, club, minimumMinutes, scoutingFocus, minimumPercentile, sortKey, sortDirection]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const visiblePlayers = filteredPlayers.slice((page - 1) * pageSize, page * pageSize);
  const pageStart = filteredPlayers.length ? (page - 1) * pageSize + 1 : 0;
  const pageEnd = Math.min(page * pageSize, filteredPlayers.length);

  const playersWithStats = players.filter((player) =>
    latestIntelByPlayer.has(player.id)
  ).length;

  const activeContracts = players.filter(
    (player) => contractByPlayer.get(player.id)?.status?.toLowerCase() === "active"
  ).length;

  const leagueCount = new Set(
    players
      .map(
        (player) =>
          contractByPlayer.get(player.id)?.club?.league ||
          latestIntelByPlayer.get(player.id)?.league
      )
      .filter(Boolean)
  ).size;

  return (
    <>
      <section className="players-scout-hero">
        <div className="players-scout-shell">
          <div className="players-scout-eyebrow">WOMEN&apos;S FOOTBALL MARKET</div>
          <h1>Player Scouting Database</h1>
          <p>
            Search the WFM player pool by role, league, club, age, playing time,
            performance output, contract context and recorded market value.
          </p>
        </div>
      </section>

      <main className="players-page players-scout-page">
        <section className="scout-stat-grid">
          <div className="scout-stat">
            <span>PLAYER POOL</span>
            <strong>{players.length}</strong>
          </div>
          <div className="scout-stat">
            <span>WITH RECORDED STATS</span>
            <strong>{playersWithStats}</strong>
          </div>
          <div className="scout-stat">
            <span>ACTIVE CONTRACTS</span>
            <strong>{activeContracts}</strong>
          </div>
          <div className="scout-stat">
            <span>LEAGUES</span>
            <strong>{leagueCount}</strong>
          </div>
        </section>

        <section className="scout-controls">
          <div className="scout-control-grid">
            <input
              type="text"
              placeholder="Search player, club, league, nationality or agency..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value as PlayerRoleGroup | "All")
              }
            >
              <option value="All">All Roles</option>
              {roles.map((item) => (
                <option key={item} value={item}>
                  {roleLabels[item]}
                </option>
              ))}
            </select>

            <select
              value={nationality}
              onChange={(event) => setNationality(event.target.value)}
            >
              <option value="All">All Nationalities</option>
              {nationalities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={league}
              onChange={(event) => {
                setLeague(event.target.value);
                setClub("All");
              }}
            >
              <option value="All">All Leagues</option>
              {leagues.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={club}
              onChange={(event) => setClub(event.target.value)}
            >
              <option value="All">All Clubs</option>
              {clubs.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select value={scoutingFocus} onChange={(event) => setScoutingFocus(event.target.value)}>
              <option value="All">All Scouting Focus</option>
              <option value="attack">Goal Threat</option>
              <option value="creation">Chance Creation</option>
              <option value="defending">Defensive Work</option>
              <option value="progression">Ball Progression</option>
            </select>

            <select value={minimumPercentile} onChange={(event) => setMinimumPercentile(event.target.value)} disabled={scoutingFocus === "All"}>
              <option value="0">Any Peer Percentile</option>
              <option value="50">50th+ Percentile</option>
              <option value="60">60th+ Percentile</option>
              <option value="75">75th+ Percentile</option>
              <option value="90">90th+ Percentile</option>
            </select>

            <select
              value={minimumMinutes}
              onChange={(event) => setMinimumMinutes(event.target.value)}
            >
              <option value="0">Any Minutes</option>
              <option value="450">450+ Minutes</option>
              <option value="900">900+ Minutes</option>
              <option value="1350">1,350+ Minutes</option>
              <option value="1800">1,800+ Minutes</option>
            </select>
          </div>

          <div className="scout-control-footer">
            <span>
              {loading
                ? "Loading scouting database..."
                : `${filteredPlayers.length} player${filteredPlayers.length === 1 ? "" : "s"} match your criteria`}
            </span>

            <div>
              <button
                type="button"
                onClick={clearFilters}
                disabled={!filtersActive}
              >
                Clear filters
              </button>
            </div>
          </div>
        </section>

        <div className="scout-shortlist-bar">
          <div><strong>{shortlist.length}</strong> player{shortlist.length === 1 ? "" : "s"} in shortlist</div>
          <div className="scout-shortlist-actions">
            <button type="button" onClick={compareShortlist} disabled={shortlist.length < 2}>Compare first 2</button>
            <button type="button" onClick={() => { const name = window.prompt("Name this scouting workflow"); if (!name?.trim() || !shortlist.length) return; const next = [{ name: name.trim(), playerIds: shortlist, createdAt: new Date().toISOString() }, ...savedWorkflows.filter((w) => w.name !== name.trim())].slice(0, 10); setSavedWorkflows(next); localStorage.setItem("wfm_scouting_workflows", JSON.stringify(next)); }}>Save workflow</button>
            <button type="button" onClick={() => { localStorage.removeItem("wfm_scouting_shortlist"); setShortlist([]); }} disabled={!shortlist.length}>Clear shortlist</button>
          </div>
        </div>
        {savedWorkflows.length > 0 && (
          <div className="scout-note">
            <strong>Saved scouting workflows:</strong> {savedWorkflows.map((workflow) => (
              <span key={workflow.name} style={{display:"inline-flex",gap:5,alignItems:"center",marginLeft:8,marginBottom:4}}>
                <button type="button" onClick={() => setShortlist(workflow.playerIds)}>{workflow.name} ({workflow.playerIds.length})</button>
                <button type="button" aria-label={`Delete ${workflow.name}`} onClick={() => { const next = savedWorkflows.filter((w) => w.name !== workflow.name); setSavedWorkflows(next); localStorage.setItem("wfm_scouting_workflows", JSON.stringify(next)); }}>×</button>
              </span>
            ))}
          </div>
        )}
        <div className="scout-note">
          <strong>Scouting context:</strong> performance figures use the latest
          recorded season available for each player. Peer-percentile filters use
          the latest eligible league/position benchmark. They are descriptive
          research context, not WFM ratings or predictions.
          Players without recorded season statistics remain searchable but are
          excluded when a minimum-minutes filter is applied.
        </div>

        <section className="scout-table-wrap">
          <div className="scout-table-header">
            <button type="button" onClick={() => changeSort("name")}>
              PLAYER{sortIndicator("name")}
            </button>
            <button type="button" onClick={() => changeSort("age")}>
              AGE{sortIndicator("age")}
            </button>
            <button type="button" onClick={() => changeSort("minutes")}>
              MINUTES{sortIndicator("minutes")}
            </button>
            <button type="button" onClick={() => changeSort("goals90")}>
              G/90{sortIndicator("goals90")}
            </button>
            <button type="button" onClick={() => changeSort("assists90")}>
              A/90{sortIndicator("assists90")}
            </button>
            <button type="button" onClick={() => changeSort("xg90")}>
              xG/90{sortIndicator("xg90")}
            </button>
            <button type="button" onClick={() => changeSort("value")}>
              MARKET VALUE{sortIndicator("value")}
            </button>
            <button type="button" onClick={() => changeSort("salary")}>
              SALARY{sortIndicator("salary")}
            </button>
          </div>

          {visiblePlayers.map((player) => {
            const intel = latestIntelByPlayer.get(player.id);
            const contract = contractByPlayer.get(player.id);
            const value = latestValueByPlayer.get(player.id);
            const playerRole = getPlayerRoleGroup(player.position, player.secondary_position);
            const age = calculateAge(player.date_of_birth);
            const playerClub = contract?.club?.name || intel?.club_name || "Club unavailable";
            const playerLeague = contract?.club?.league || intel?.league || "League unavailable";

            return (
              <div className={`scout-row ${shortlist.includes(player.id) ? "is-shortlisted" : ""}`} key={player.id}>
                <button
                  type="button"
                  className="scout-shortlist-toggle"
                  onClick={() => toggleShortlist(player.id)}
                  aria-label={shortlist.includes(player.id) ? `Remove ${player.full_name} from shortlist` : `Add ${player.full_name} to shortlist`}
                >{shortlist.includes(player.id) ? "✓" : "+"}</button>
                <Link href={`/players/${player.id}`} className="scout-player">
                  <img
                    src={player.photo_url || "/wfm-player-placeholder.svg"}
                    alt={player.full_name}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = "/wfm-player-placeholder.svg";
                    }}
                    width={48}
                    height={48}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                  <span>
                    <strong>{player.full_name}</strong>
                    <small>{roleLabels[playerRole]} · {player.nationality || "Nationality unavailable"}</small>
                    <small>{playerClub} · {playerLeague}</small>
                    {latestPeerByPlayer.get(player.id) && (() => { const peer = latestPeerByPlayer.get(player.id)!; const archetype = getScoutingArchetype(playerRole,{goals:peer.goals_per90_percentile,assists:peer.assists_per90_percentile,xg:peer.xg_per90_percentile,xa:peer.xa_per90_percentile,chancesCreated:peer.chances_created_per90_percentile,keyPasses:peer.key_passes_per90_percentile,tackles:peer.tackles_per90_percentile,interceptions:peer.interceptions_per90_percentile,progressiveCarries:peer.progressive_carries_per90_percentile}); return <small>{archetype.label}</small>; })()}
                  </span>
                </Link>
                <span className="scout-age">{age ?? "—"}</span>
                <span>{intel?.minutes ?? "—"}</span>
                <span>{formatNumber(intel?.goals_per90 ?? null)}</span>
                <span>{formatNumber(intel?.assists_per90 ?? null)}</span>
                <span>{formatNumber(intel?.xg_per90 ?? null)}</span>
                <span>
                  {value?.market_value_usd != null ? formatMoney(value.market_value_usd) : "—"}
                  {value?.valuation_date && <small>as of {formatDate(value.valuation_date)}</small>}
                </span>
                <span>
                  {contract?.annual_salary_usd != null ? formatMoney(contract.annual_salary_usd) : "—"}
                  {contract?.end_date && <small>ends {formatDate(contract.end_date)}</small>}
                </span>
              </div>
            );
          })}

          {!loading && filteredPlayers.length > 0 && (
            <div className="scout-pagination">
              <span>Showing {pageStart}–{pageEnd} of {filteredPlayers.length}</span>
              <div>
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
                <strong>Page {page} of {totalPages}</strong>
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
              </div>
            </div>
          )}

          {!loading && filteredPlayers.length === 0 && (
            <div className="scout-empty">
              <strong>No players match the current filters</strong>
              <span>Broaden the role, league, club or minutes criteria.</span>
              <button type="button" onClick={clearFilters}>
                Reset scouting filters
              </button>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
