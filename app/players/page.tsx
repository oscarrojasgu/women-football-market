"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Player = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  position: string | null;
  preferred_foot: string | null;
  agency: string | null;
  photo_url: string | null;
};

type ContractInfo = {
  player_id: string;
  annual_salary: number | null;
  weekly_salary: number | null;
  annual_salary_usd: number | null;
  weekly_salary_usd: number | null;
  currency: string | null;
  status: string | null;
  club: {
    name: string;
    league: string | null;
    logo_url: string | null;
  } | null;
};

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [contracts, setContracts] = useState<ContractInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("All");
  const [nationality, setNationality] = useState("All");

  useEffect(() => {
    async function loadPlayers() {
      setLoading(true);

      const { data: playerData, error: playerError } =
        await supabase
          .from("players")
          .select(`
            id,
            full_name,
            date_of_birth,
            nationality,
            position,
            preferred_foot,
            agency,
            photo_url
          `)
          .order("full_name", { ascending: true });

      if (playerError) {
        console.error("Error loading players:", playerError);
        setPlayers([]);
        setLoading(false);
        return;
      }

      const { data: contractData, error: contractError } =
        await supabase
          .from("contracts")
          .select(`
            player_id,
            annual_salary,
            weekly_salary,
            annual_salary_usd,
            weekly_salary_usd,
            currency,
            status,
            club:clubs (
              name,
              league,
              logo_url
            )
          `);

      if (contractError) {
        console.error("Error loading contracts:", contractError);
      }

      const normalizedContracts: ContractInfo[] = (
        contractData || []
      ).map((contract: any) => ({
        player_id: contract.player_id,
        annual_salary: contract.annual_salary,
        weekly_salary: contract.weekly_salary,
        annual_salary_usd: contract.annual_salary_usd,
        weekly_salary_usd: contract.weekly_salary_usd,
        currency: contract.currency,
        status: contract.status,
        club: Array.isArray(contract.club)
          ? contract.club[0] || null
          : contract.club || null,
      }));

      setPlayers(playerData || []);
      setContracts(normalizedContracts);
      setLoading(false);
    }

    loadPlayers();
  }, []);

  const positions = useMemo(() => {
    const values = players
      .map((player) => player.position)
      .filter(Boolean) as string[];

    return ["All", ...Array.from(new Set(values))];
  }, [players]);

  const nationalities = useMemo(() => {
    const values = players
      .map((player) => player.nationality)
      .filter(Boolean) as string[];

    return ["All", ...Array.from(new Set(values)).sort()];
  }, [players]);

  const getContract = (playerId: string) => {
    const playerContracts = contracts.filter(
      (contract) => contract.player_id === playerId
    );

    const activeContract = playerContracts.find(
      (contract) =>
        contract.status?.toLowerCase() === "active"
    );

    return activeContract || playerContracts[0] || null;
  };

  const filteredPlayers = useMemo(() => {
    const query = search.toLowerCase().trim();

    return players.filter((player) => {
      const playerName =
        player.full_name?.toLowerCase() || "";
      const playerNationality =
        player.nationality?.toLowerCase() || "";
      const playerPosition =
        player.position?.toLowerCase() || "";
      const playerAgency =
        player.agency?.toLowerCase() || "";

      const contract = contracts.find(
        (item) => item.player_id === player.id
      );

      const clubName =
        contract?.club?.name?.toLowerCase() || "";
      const league =
        contract?.club?.league?.toLowerCase() || "";

      const matchesSearch =
        !query ||
        [
          playerName,
          playerNationality,
          playerPosition,
          playerAgency,
          clubName,
          league,
        ].some((value) => value.includes(query));

      const matchesPosition =
        position === "All" || player.position === position;
      const matchesNationality =
        nationality === "All" || player.nationality === nationality;

      return (
        matchesSearch &&
        matchesPosition &&
        matchesNationality
      );
    });
  }, [players, contracts, search, position, nationality]);

  function calculateAge(dateOfBirth: string | null) {
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
  }

  function formatSalary(salary: number | null) {
    if (salary === null || salary === undefined) {
      return "Not available";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(salary);
  }

  const filtersActive =
    search.trim() !== "" ||
    position !== "All" ||
    nationality !== "All";

  function clearFilters() {
    setSearch("");
    setPosition("All");
    setNationality("All");
  }

  return (
    <>
      <section
        style={{
          background: "#111",
          color: "#fff",
          padding: "55px 6vw 50px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div
            style={{
              fontSize: "12px",
              letterSpacing: "2px",
              fontWeight: 700,
              marginBottom: "14px",
              color: "#aaa",
            }}
          >
            WOMEN&apos;S FOOTBALL MARKET
          </div>

          <h1
            style={{
              fontSize: "48px",
              lineHeight: 1.05,
              margin: 0,
              fontWeight: 800,
            }}
          >
            Players
          </h1>

          <p
            style={{
              maxWidth: "700px",
              color: "#ccc",
              fontSize: "17px",
              lineHeight: 1.6,
              marginTop: "18px",
              marginBottom: 0,
            }}
          >
            Explore the player database by position, nationality, club,
            league and compensation.
          </p>
        </div>
      </section>

      <main
        className="players-page"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 20px 60px",
          fontFamily: "Arial, sans-serif",
          background: "#f5f4ef",
        }}
      >
        <div
          className="players-filters"
          style={{
            padding: "20px",
            border: "1px solid #e5e5e5",
            borderRadius: "14px",
            marginBottom: "22px",
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr auto",
              gap: "12px",
            }}
          >
            <input
              type="text"
              placeholder="Search player, club, league or agency..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "14px 16px",
                border: "1px solid #ddd",
                borderRadius: "9px",
                fontSize: "15px",
                background: "#fff",
                minWidth: 0,
              }}
            />

            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              style={{
                padding: "14px 16px",
                border: "1px solid #ddd",
                borderRadius: "9px",
                fontSize: "15px",
                background: "#fff",
              }}
            >
              {positions.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Positions" : item}
                </option>
              ))}
            </select>

            <select
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              style={{
                padding: "14px 16px",
                border: "1px solid #ddd",
                borderRadius: "9px",
                fontSize: "15px",
                background: "#fff",
              }}
            >
              {nationalities.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Nationalities" : item}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!filtersActive}
              style={{
                padding: "0 15px",
                border: "1px solid #ddd",
                borderRadius: "9px",
                background: filtersActive ? "#111" : "#f5f5f5",
                color: filtersActive ? "#fff" : "#aaa",
                fontSize: "13px",
                fontWeight: 700,
                cursor: filtersActive ? "pointer" : "default",
                whiteSpace: "nowrap",
              }}
            >
              Clear filters
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <div style={{ fontSize: "14px", color: "#666" }}>
            {loading
              ? "Loading players..."
              : `${filteredPlayers.length} player${
                  filteredPlayers.length === 1 ? "" : "s"
                } found`}
          </div>

          {filtersActive && !loading && (
            <div style={{ fontSize: "12px", color: "#888" }}>
              Filters applied
            </div>
          )}
        </div>

        <div
          className="players-table"
          style={{
            border: "1px solid #e3e3e3",
            borderRadius: "14px",
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1.5fr 1fr 1.2fr 1.3fr",
              gap: "12px",
              padding: "15px 20px",
              background: "#fafafa",
              borderBottom: "1px solid #e3e3e3",
              fontSize: "11px",
              fontWeight: 700,
              color: "#777",
              letterSpacing: "0.8px",
            }}
          >
            <span>PLAYER</span>
            <span>CLUB</span>
            <span>POSITION</span>
            <span>LEAGUE</span>
            <span>ANNUAL SALARY</span>
          </div>

          {filteredPlayers.map((player) => {
            const age = calculateAge(player.date_of_birth);
            const contract = getContract(player.id);

            return (
              <Link
                href={`/players/${player.id}`}
                className="player-row"
                key={player.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.5fr 1fr 1.2fr 1.3fr",
                  gap: "12px",
                  padding: "16px 20px",
                  borderBottom: "1px solid #eee",
                  alignItems: "center",
                  color: "#111",
                  textDecoration: "none",
                  fontSize: "14px",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                  <img
                    src={player.photo_url ? `/api/player-image?url=${encodeURIComponent(player.photo_url)}` : "/wfm-player-placeholder.svg"}
                    alt={player.full_name}
                    width={52}
                    height={64}
                    loading="lazy"
                    style={{
                      width: "52px",
                      height: "64px",
                      borderRadius: "8px",
                      objectFit: "cover",
                      objectPosition: "50% 0%",
                      background: "#eee",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ minWidth: 0 }}>
                    <b>{player.full_name}</b>
                  <small
                    style={{
                      display: "block",
                      marginTop: "4px",
                      color: "#888",
                      fontSize: "12px",
                    }}
                  >
                    {player.nationality || "Nationality unavailable"}
                    {age ? ` · ${age}` : ""}
                  </small>
                  </span>
                </span>

                <span>{contract?.club?.name || "—"}</span>
                <span>{player.position || "—"}</span>
                <span style={{ color: "#666" }}>
                  {contract?.club?.league || "—"}
                </span>
                <span style={{ fontWeight: 700 }}>
                  {formatSalary(contract?.annual_salary_usd ?? null)}
                </span>
              </Link>
            );
          })}

          {!loading && filteredPlayers.length === 0 && (
            <div
              style={{
                padding: "55px 20px",
                textAlign: "center",
                color: "#777",
              }}
            >
              <strong
                style={{
                  display: "block",
                  color: "#222",
                  fontSize: "16px",
                  marginBottom: "7px",
                }}
              >
                No players found
              </strong>
              <span style={{ fontSize: "13px" }}>
                Try changing your search or filters.
              </span>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
