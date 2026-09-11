"use client";

import { useState } from "react";

const players = [
  {
    name: "Sophia Wilson",
    position: "Forward",
    age: 24,
    club: "Arsenal",
    league: "WSL",
    contract: "2027",
    salary: "$250k",
  },
  {
    name: "Emma Garcia",
    position: "Midfielder",
    age: 26,
    club: "Barcelona",
    league: "Liga F",
    contract: "2026",
    salary: "$300k",
  },
  {
    name: "Olivia Martin",
    position: "Defender",
    age: 23,
    club: "Lyon",
    league: "D1 Arkema",
    contract: "2027",
    salary: "$180k",
  },
  {
    name: "Camila Torres",
    position: "Midfielder",
    age: 28,
    club: "Portland Thorns",
    league: "NWSL",
    contract: "2026",
    salary: "$220k",
  },
  {
    name: "Isabella Rossi",
    position: "Forward",
    age: 25,
    club: "Juventus",
    league: "Serie A Femminile",
    contract: "2028",
    salary: "$200k",
  },
];

export default function PlayersPage() {
  const [search, setSearch] = useState("");

  const filteredPlayers = players.filter((player) =>
    `${player.name} ${player.club} ${player.league}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main style={{ background: "#f7f6f2", minHeight: "100vh" }}>
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
          PLAYER DATABASE
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

        <p style={{ color: "#ccc", fontSize: "18px", maxWidth: "650px" }}>
          Search and analyze players across the women&apos;s football market.
        </p>
      </section>

      <section style={{ padding: "45px 7%" }}>
        <input
          type="text"
          placeholder="Search player, club or league..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "700px",
            padding: "18px 20px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "16px",
            marginBottom: "35px",
          }}
        />

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
              gridTemplateColumns: "2fr 1.2fr .6fr 1.5fr 1.3fr 1fr 1fr",
              padding: "18px 22px",
              background: "#eee",
              fontSize: "12px",
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
            <div>SALARY</div>
          </div>

          {filteredPlayers.map((player) => (
            <div
              key={player.name}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "2fr 1.2fr .6fr 1.5fr 1.3fr 1fr 1fr",
                padding: "22px",
                borderTop: "1px solid #eee",
                alignItems: "center",
              }}
            >
              <strong>{player.name}</strong>
              <span>{player.position}</span>
              <span>{player.age}</span>
              <span>{player.club}</span>
              <span>{player.league}</span>
              <span>{player.contract}</span>
              <span>{player.salary}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
