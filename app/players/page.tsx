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

type PlayerParticipation = {
  player_id: string;
  club_name: string | null;
  competition_name: string | null;
  competition_id: string | null;
  season_key: string | null;
  season_label: string | null;
};

type MarketValue = {
  player_id: string;
  valuation_date: string;
  market_value_usd: number | null;
};

type GlobalPeerBenchmark = {
  player_id: string;
  season: string;
  position: string | null;
  peer_count_global: number | null;
  goals_per90_global_percentile: number | null;
  assists_per90_global_percentile: number | null;
  xg_per90_global_percentile: number | null;
  xa_per90_global_percentile: number | null;
  chances_created_per90_global_percentile: number | null;
  key_passes_per90_global_percentile: number | null;
  tackles_per90_global_percentile: number | null;
  interceptions_per90_global_percentile: number | null;
  progressive_carries_per90_global_percentile: number | null;
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

type SavedWorkflow = { id: string; name: string; description: string | null; filters: Record<string, unknown>; sort_key: string | null; sort_direction: string | null; created_at: string; };

type SortKey =
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
  const [globalPeerBenchmarks, setGlobalPeerBenchmarks] = useState<GlobalPeerBenchmark[]>([]);
  const [playerParticipations, setPlayerParticipations] = useState<PlayerParticipation[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<PlayerRoleGroup | "All">("All");
  const [nationality, setNationality] = useState("All");
  const [league, setLeague] = useState("All");
  const [season, setSeason] = useState("All");
  const [club, setClub] = useState("All");
  const [minimumMinutes, setMinimumMinutes] = useState("0");
  const [scoutingFocus, setScoutingFocus] = useState("All");
  const [minimumPercentile, setMinimumPercentile] = useState("0");
  const [benchmarkScope, setBenchmarkScope] = useState<"competition" | "global">("competition");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [scoutingLists, setScoutingLists] = useState<{ id: string; name: string; status: string }[]>([]);
  const [selectedScoutingListId, setSelectedScoutingListId] = useState("");
  const [scoutingMessage, setScoutingMessage] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function loadScoutingWorkspace() {
      const { data: authData } = await supabase.auth.getUser();
      if (!mounted) return;

      const currentUserId = authData.user?.id || null;
      setUserId(currentUserId);

      if (!currentUserId) {
        setShortlist([]);
        setSavedWorkflows([]);
        return;
      }

      const [listResult, searchResult] = await Promise.all([
        supabase
          .from("scouting_lists")
          .select("id,name,status")
          .eq("status", "active")
          .order("updated_at", { ascending: false }),
        supabase
          .from("saved_searches")
          .select("id,name,description,filters,sort_key,sort_direction,created_at,updated_at")
          .order("updated_at", { ascending: false }),
      ]);

      if (!mounted) return;

      if (listResult.error) {
        console.error("Error loading scouting lists:", listResult.error);
        setScoutingMessage(listResult.error.message);
      } else {
        const nextLists = (listResult.data || []) as { id: string; name: string; status: string }[];
        setScoutingLists(nextLists);
        if (nextLists.length) setSelectedScoutingListId(nextLists[0].id);
      }

      if (searchResult.error) {
        console.error("Error loading saved searches:", searchResult.error);
        setScoutingMessage(searchResult.error.message);
      } else {
        setSavedWorkflows((searchResult.data || []) as SavedWorkflow[]);
      }
    }

    loadScoutingWorkspace();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    async function loadPlayers() {
      setLoading(true);

      const [playerResult, contractResult, intelResult, valueResult, peerResult, globalPeerResult, participationResult] =
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

          supabase
            .from("player_global_peer_benchmarks")
            .select("player_id,season,position,peer_count_global,goals_per90_global_percentile,assists_per90_global_percentile,xg_per90_global_percentile,xa_per90_global_percentile,chances_created_per90_global_percentile,key_passes_per90_global_percentile,tackles_per90_global_percentile,interceptions_per90_global_percentile,progressive_carries_per90_global_percentile"),

          supabase
            .from("player_competitions")
            .select("player_id,club_competition:club_competitions(club:clubs(name),competition_season:competition_seasons(competition:competitions(id,canonical_name),season:seasons(season_key,label)))"),
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

      if (participationResult.error) {
        console.error("Error loading player competition participation:", participationResult.error);
      } else {
        const normalizedParticipations: PlayerParticipation[] = [];
        for (const row of participationResult.data || []) {
          const cc = Array.isArray((row as any).club_competition) ? (row as any).club_competition[0] : (row as any).club_competition;
          const cs = Array.isArray(cc?.competition_season) ? cc.competition_season[0] : cc?.competition_season;
          const competition = Array.isArray(cs?.competition) ? cs.competition[0] : cs?.competition;
          const season = Array.isArray(cs?.season) ? cs.season[0] : cs?.season;
          const club = Array.isArray(cc?.club) ? cc.club[0] : cc?.club;
          if ((row as any).player_id) {
            normalizedParticipations.push({
              player_id: (row as any).player_id,
              club_name: club?.name || null,
              competition_name: competition?.canonical_name || null,
              competition_id: competition?.id || null,
              season_key: season?.season_key || null,
              season_label: season?.label || null,
            });
          }
        }
        setPlayerParticipations(normalizedParticipations);
      }

      if (peerResult.error) {
        console.error("Error loading peer benchmarks:", peerResult.error);
      } else {
        setPeerBenchmarks((peerResult.data || []) as PeerBenchmark[]);
      }

      if (globalPeerResult.error) {
        console.error("Error loading global peer benchmarks:", globalPeerResult.error);
      } else {
        setGlobalPeerBenchmarks((globalPeerResult.data || []) as GlobalPeerBenchmark[]);
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

  const latestGlobalPeerByPlayer = useMemo(() => {
    const map = new Map<string, GlobalPeerBenchmark>();
    for (const row of globalPeerBenchmarks) {
      const current = map.get(row.player_id);
      const year = seasonStart(row.season);
      const currentYear = seasonStart(current?.season || null);
      if (!current || year > currentYear) map.set(row.player_id, row);
    }
    return map;
  }, [globalPeerBenchmarks]);

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

  const scoutingMetricValues = (benchmark: PeerBenchmark | GlobalPeerBenchmark | undefined, focus: string) => {
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

  const participationByPlayer = useMemo(() => {
    const map = new Map<string, PlayerParticipation[]>();
    for (const row of playerParticipations) {
      const current = map.get(row.player_id) || [];
      current.push(row);
      map.set(row.player_id, current);
    }
    return map;
  }, [playerParticipations]);

  const competitions = useMemo(() => Array.from(new Set(playerParticipations.map((row) => row.competition_name).filter(Boolean) as string[])).sort(), [playerParticipations]);

  const seasons = useMemo(() => {
    const values = new Map<string, string>();
    for (const row of playerParticipations) {
      if (row.season_key) values.set(row.season_key, row.season_label || row.season_key);
    }
    return Array.from(values.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [playerParticipations]);

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

  const leagues = competitions;

  const clubs = useMemo(() => {
    const values = new Set<string>();
    for (const row of playerParticipations) {
      if (league !== "All" && row.competition_name !== league) continue;
      if (season !== "All" && row.season_key !== season) continue;
      if (row.club_name) values.add(row.club_name);
    }
    return Array.from(values).sort();
  }, [playerParticipations, league, season]);

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
      return current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId];
    });
  };

  const createScoutingList = async () => {
    if (!userId) {
      setScoutingMessage("Sign in to create a persistent scouting list.");
      return;
    }

    const name = window.prompt("Name this scouting list")?.trim();
    if (!name) return;

    const { data, error } = await supabase
      .from("scouting_lists")
      .insert({ user_id: userId, name })
      .select("id,name,status")
      .single();

    if (error) {
      setScoutingMessage(error.message);
      return;
    }

    setScoutingLists((current) => [data, ...current]);
    setSelectedScoutingListId(data.id);
    setScoutingMessage("Scouting list created.");
  };

  const addPlayerToScoutingList = async (playerId: string) => {
    if (!userId) {
      setScoutingMessage("Sign in to add players to persistent scouting lists.");
      return;
    }
    if (!selectedScoutingListId) {
      setScoutingMessage("Create or select a scouting list first.");
      return;
    }

    const { error } = await supabase
      .from("scouting_list_players")
      .insert({
        list_id: selectedScoutingListId,
        player_id: playerId,
        added_by: userId,
      });

    if (error) {
      if (error.code === "23505") {
        setScoutingMessage("That player is already in the selected scouting list.");
      } else {
        setScoutingMessage(error.message);
      }
      return;
    }

    const listName = scoutingLists.find((list) => list.id === selectedScoutingListId)?.name || "scouting list";
    setScoutingMessage(`Added player to ${listName}.`);
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
    season !== "All" ||
    club !== "All" ||
    minimumMinutes !== "0" ||
    scoutingFocus !== "All" ||
    minimumPercentile !== "0";

  const clearFilters = () => {
    setSearch("");
    setRole("All");
    setNationality("All");
    setLeague("All");
    setSeason("All");
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
        (league === "All" || (participationByPlayer.get(player.id) || []).some((row) => row.competition_name === league)) &&
        (season === "All" || (participationByPlayer.get(player.id) || []).some((row) => row.season_key === season)) &&
        (club === "All" || (participationByPlayer.get(player.id) || []).some((row) =>
          row.club_name === club &&
          (league === "All" || row.competition_name === league) &&
          (season === "All" || row.season_key === season)
        )) &&
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
    season,
    club,
    minimumMinutes,
    scoutingFocus,
    minimumPercentile,
    benchmarkScope,
    sortKey,
    sortDirection,
    latestIntelByPlayer,
    contractByPlayer,
    latestValueByPlayer,
    latestPeerByPlayer,
    latestGlobalPeerByPlayer,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / pageSize));

  useEffect(() => { setPage(1); }, [search, role, nationality, league, season, club, minimumMinutes, scoutingFocus, minimumPercentile, sortKey, sortDirection]);
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

  const leagueCount = competitions.length;

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
            <span>COMPETITIONS</span>
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
                setSeason("All");
                setClub("All");
              }}
            >
              <option value="All">All Competitions</option>
              {leagues.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={season}
              onChange={(event) => {
                setSeason(event.target.value);
                setClub("All");
              }}
            >
              <option value="All">All Seasons</option>
              {seasons.map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
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

            <select value={benchmarkScope} onChange={(event) => setBenchmarkScope(event.target.value as "competition" | "global")} disabled={scoutingFocus === "All"}>
              <option value="competition">Competition Peer Benchmark</option>
              <option value="global">Global Peer Benchmark</option>
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
          <div>
            <strong>{shortlist.length}</strong> player{shortlist.length === 1 ? "" : "s"} in compare shortlist
          </div>
          <div className="scout-shortlist-actions">
            <select
              value={selectedScoutingListId}
              onChange={(event) => setSelectedScoutingListId(event.target.value)}
              disabled={!userId}
              aria-label="Scouting list"
            >
              <option value="">{userId ? "Select scouting list" : "Sign in for scouting lists"}</option>
              {scoutingLists.map((list) => (
                <option key={list.id} value={list.id}>{list.name}</option>
              ))}
            </select>
            <button type="button" onClick={createScoutingList}>New list</button>
            <button type="button" onClick={compareShortlist} disabled={shortlist.length < 2}>Compare first 2</button>
            <button
              type="button"
              onClick={async () => {
                if (!userId) {
                  setScoutingMessage("Sign in to save persistent scouting workflows.");
                  return;
                }
                const name = window.prompt("Name this scouting workflow")?.trim();
                if (!name) return;

                const filters = {
                  search,
                  role,
                  nationality,
                  league,
                  club,
                  minimumMinutes,
                  scoutingFocus,
                  minimumPercentile,
                  benchmarkScope,
                };

                const { data, error } = await supabase
                  .from("saved_searches")
                  .insert({
                    user_id: userId,
                    name,
                    filters,
                    sort_key: sortKey,
                    sort_direction: sortDirection,
                  })
                  .select("id,name,description,filters,sort_key,sort_direction,created_at,updated_at")
                  .single();

                if (error) {
                  setScoutingMessage(error.message);
                  return;
                }

                setSavedWorkflows((current) => [data as SavedWorkflow, ...current]);
                setScoutingMessage("Scouting workflow saved.");
              }}
            >
              Save workflow
            </button>
            <button type="button" onClick={() => setShortlist([])} disabled={!shortlist.length}>Clear shortlist</button>
          </div>
        </div>
        {savedWorkflows.length > 0 && (
          <div className="scout-note">
            <strong>Saved scouting workflows:</strong>{" "}
            {savedWorkflows.map((workflow) => (
              <span key={workflow.id} style={{display:"inline-flex",gap:5,alignItems:"center",marginLeft:8,marginBottom:4}}>
                <button
                  type="button"
                  onClick={() => {
                    const filters = workflow.filters || {};
                    setSearch(String(filters.search || ""));
                    setRole((filters.role || "All") as PlayerRoleGroup | "All");
                    setNationality(String(filters.nationality || "All"));
                    setLeague(String(filters.league || filters.competition || "All"));
                    setSeason(String(filters.season || "All"));
                    setClub(String(filters.club || "All"));
                    setMinimumMinutes(String(filters.minimumMinutes || "0"));
                    setScoutingFocus(String(filters.scoutingFocus || "All"));
                    setMinimumPercentile(String(filters.minimumPercentile || "0"));
                    setBenchmarkScope((filters.benchmarkScope || "competition") as "competition" | "global");
                    if (workflow.sort_key) setSortKey(workflow.sort_key as SortKey);
                    if (workflow.sort_direction === "asc" || workflow.sort_direction === "desc") setSortDirection(workflow.sort_direction);
                  }}
                >
                  {workflow.name}
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${workflow.name}`}
                  onClick={async () => {
                    const { error } = await supabase.from("saved_searches").delete().eq("id", workflow.id);
                    if (error) setScoutingMessage(error.message);
                    else setSavedWorkflows((current) => current.filter((item) => item.id !== workflow.id));
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="scout-note">
          <strong>Persistent scouting:</strong>{" "}
          {userId ? "Signed in. Use the list selector below to save players to your WFM scouting workspace." : "Sign in to save players and workflows to your private WFM scouting workspace."}
          {scoutingMessage && <span style={{marginLeft:8}}>{scoutingMessage}</span>}
        </div>
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
            const playerLeague = participationByPlayer.get(player.id)?.find((row) => row.season_key === intel?.season)?.competition_name || contract?.club?.league || intel?.league || "Competition unavailable";

            return (
              <div className={`scout-row ${shortlist.includes(player.id) ? "is-shortlisted" : ""}`} key={player.id}>
                <div className="scout-row-actions">
                  <button
                    type="button"
                    className="scout-shortlist-toggle"
                    onClick={() => toggleShortlist(player.id)}
                    aria-label={shortlist.includes(player.id) ? `Remove ${player.full_name} from compare shortlist` : `Add ${player.full_name} to compare shortlist`}
                  >{shortlist.includes(player.id) ? "✓" : "+"}</button>
                  <button
                    type="button"
                    className="scout-list-add"
                    onClick={() => addPlayerToScoutingList(player.id)}
                    disabled={!userId || !selectedScoutingListId}
                    aria-label={`Add ${player.full_name} to selected scouting list`}
                  >Add</button>
                </div>
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
                    {(benchmarkScope === "global" ? latestGlobalPeerByPlayer.get(player.id) : latestPeerByPlayer.get(player.id)) && (() => { const peer = (benchmarkScope === "global" ? latestGlobalPeerByPlayer.get(player.id) : latestPeerByPlayer.get(player.id))!; const archetype = getScoutingArchetype(playerRole,{goals:peer.goals_per90_percentile,assists:peer.assists_per90_percentile,xg:peer.xg_per90_percentile,xa:peer.xa_per90_percentile,chancesCreated:peer.chances_created_per90_percentile,keyPasses:peer.key_passes_per90_percentile,tackles:peer.tackles_per90_percentile,interceptions:peer.interceptions_per90_percentile,progressiveCarries:peer.progressive_carries_per90_percentile}); return <small>{archetype.label}</small>; })()}
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
