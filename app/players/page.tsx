"use client";

import { useMemo, useState } from "react";

type Player = {
  name: string;
  position: string;
  age: number;
  club: string;
  league: string;
  contract: string;
  salary: string;
  nationality: string;
  marketStatus: string;
};

const players: Player[] = [
  {
    name: "Sophia Wilson",
    position: "Forward",
    age: 24,
    club: "Arsenal",
    league: "WSL",
    contract: "2027",
    salary: "$250k",
    nationality: "England",
    marketStatus: "Under Contract",
  },
  {
    name: "Emma Garcia",
    position: "Midfielder",
    age: 26,
    club: "Barcelona",
    league: "Liga F",
    contract: "2026",
    salary: "$300k",
    nationality: "Spain",
    marketStatus: "Contract Expiring",
  },
  {
    name: "Olivia Martin",
    position: "Defender",
    age: 23,
    club: "Lyon",
    league: "D1 Arkema",
    contract: "2027",
    salary: "$180k",
    nationality: "France",
    marketStatus: "Under Contract",
  },
  {
    name: "Camila Torres",
    position: "Midfielder",
    age: 28,
    club: "Portland Thorns",
    league: "NWSL",
    contract: "2026",
    salary: "$220k",
    nationality: "Colombia",
    marketStatus: "Contract Expiring",
  },
  {
    name: "Isabella Rossi",
    position: "Forward",
    age: 25,
    club: "Juventus",
    league: "Serie A Femminile",
    contract: "2028",
    salary: "$200k",
    nationality: "Italy",
    marketStatus: "Under Contract",
  },
  {
    name: "Valentina Cruz",
    position: "Forward",
    age: 22,
    club: "Free Agent",
    league: "NWSL",
    contract: "Free Agent",
    salary: "$150k",
    nationality: "Mexico",
    marketStatus: "Free Agent",
  },
];

export default function PlayersPage() {
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("All");
  const [league, setLeague] = useState("All");
  const [status, setStatus] = useState("All");

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const searchMatch = `${player.name} ${player.club} ${player.league} ${player.nationality}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const positionMatch =
        position === "All" || player.position === position;

      const leagueMatch = league === "All" || player.league === league;

      const statusMatch =
        status === "All" || player.marketStatus === status;

      return searchMatch && positionMatch && leagueMatch && statusMatch;
    });
  }, [search, position, league, status]);

  const clearFilters = () => {
    setSearch("");
    setPosition("All");
    setLeague("All");
    setStatus("All");
  };

  return (
    <main
      style={{
        background: "#f7f6f2",
        minHeight: "100vh",
        color: "#111",
      }}
    >
      {/* HEADER */}
      <section
        style={{
          background: "#111",
          color: "white",
          padding: "70px 7%",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            letterSpacing: "2px",
            color: "#b8ff00",
            fontWeight: 600,
          }}
        >
          WOMEN FOOTBALL MARKET
        </p>

        <h1
          style={{
            fontSize: "56px",
            margin: "15px 0",
            fontWeight: 700,
          }}
        >
          Know the players.
        </h1>

        <p
          style={{
            color: "#ccc",
            fontSize: "18px",
            maxWidth: "650px",
            lineHeight: 1.6,
          }}
        >
          Search, filter and analyze players across the women&apos;s football
          market.
        </p>
      </section>

      {/* FILTER AREA */}
      <section style={{ padding: "45px 7%" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "25px",
          }}
        >
          <input
            type="text"
            placeholder="Search player, club, league or nationality..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: "1 1 350px",
              padding: "16px 18px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "15px",
              background: "white",
            }}
          />

          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            style={{
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "15px",
              background: "white",
            }}
          >
            <option value="All">All Positions</option>
            <option value="Goalkeeper">Goalkeeper</option>
            <option value="Defender">Defender</option>
            <option value="Midfielder">Midfielder</option>
            <option value="Forward">Forward</option>
          </select>

          <select
            value={league}
            onChange={(e) => setLeague(e.target.value)}
            style={{
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "15px",
              background: "white",
            }}
          >
            <option value="All">All Leagues</option>
            <option value="WSL">WSL</option>
            <option value="Liga F">Liga F</option>
            <option value="D1 Arkema">D1 Arkema</option>
            <option value="NWSL">NWSL</option>
            <option value="Serie A Femminile">Serie A Femminile</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "15px",
              background: "white",
            }}
          >
            <option value="All">All Market Status</option>
            <option value="Free Agent">Free Agent</option>
            <option value="Contract Expiring">Contract Expiring</option>
            <option value="Under Contract">Under Contract</option>
          </select>

          <button
            onClick={clearFilters}
            style={{
              padding: "16px 20px",
              borderRadius: "8px",
              border: "1px solid #111",
              background: "#111",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Clear
          </button>
        </div>

        {/* RESULTS SUMMARY */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <p style={{ fontSize: "14px", color: "#666" }}>
            Showing <strong>{filteredPlayers.length}</strong> of{" "}
            <strong>{players.length}</strong> players
          </p>

          <p
            style={{
              fontSize: "12px",
              letterSpacing: "1px",
              fontWeight: 700,
              color: "#777",
            }}
          >
            PLAYER MARKET
          </p>
        </div>

        {/* PLAYER TABLE */}
        <div
          style={{
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "2fr 1.1fr .6fr 1.4fr 1.2fr 1fr 1.1fr 1.4fr",
              padding: "18px 22px",
              background: "#eee",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "1px",
            }}
          >
            <div>PLAYER</div>
            <div>POSITION</div>
            <div>AGE</div>
            <div>CLUB</div>
            <div>LEAGUE</div>
            <div>CONTRACT</div>
            <div>NATIONALITY</div>
            <div>MARKET STATUS</div>
          </div>

          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((player) => (
              <div
                key={player.name}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "2fr 1.1fr .6fr 1.4fr 1.2fr 1fr 1.1fr 1.4fr",
                  padding: "22px",
                  borderTop: "1px solid #eee",
                  alignItems: "center",
                  fontSize: "14px",
                }}
              >
                <strong>{player.name}</strong>
                <span>{player.position}</span>
                <span>{player.age}</span>
                <span>{player.club}</span>
                <span>{player.league}</span>
                <span>{player.contract}</span>
                <span>{player.nationality}</span>

                <span
                  style={{
                    display: "inline-block",
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "7px 10px",
                    borderRadius: "20px",
                    width: "fit-content",
                    background:
                      player.marketStatus === "Free Agent"
                        ? "#b8ff00"
                        : player.marketStatus === "Contract Expiring"
                        ? "#fff0b3"
                        : "#eee",
                  }}
                >
                  {player.marketStatus}
                </span>
              </div>
            ))
          ) : (
            <div
              style={{
                padding: "50px 20px",
                textAlign: "center",
                color: "#777",
              }}
            >
              No players match your search or filters.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
