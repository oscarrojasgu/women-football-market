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

type Contract = {
player_id: string;
annual_salary: number | null;
weekly_salary: number | null;
currency: string | null;
status: string | null;
club: {
name: string;
league: string | null;
logo_url: string | null;
} | null;
};

type PlayerWithContract = Player & {
contract: Contract | null;
};

export default function PlayersPage() {
const [players, setPlayers] = useState<PlayerWithContract[]>([]);
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState("");
const [position, setPosition] = useState("All");
const [nationality, setNationality] = useState("All");

useEffect(() => {
async function loadPlayers() {
const { data: playerData, error: playerError } = await supabase
.from("players")
.select("*")
.order("full_name");

```
  if (playerError) {
    console.error("Error loading players:", playerError);
    setLoading(false);
    return;
  }

  const { data: contractData, error: contractError } = await supabase
    .from("contracts")
    .select(`
      player_id,
      annual_salary,
      weekly_salary,
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

  const combinedPlayers = (playerData || []).map((player) => {
    const contracts =
      (contractData || []).filter(
        (contract) => contract.player_id === player.id
      );

    const activeContract =
      contracts.find(
        (contract) =>
          String(contract.status).toLowerCase() === "active"
      ) || contracts[0] || null;

    return {
      ...player,
      contract: activeContract,
    };
  });

  setPlayers(combinedPlayers);
  setLoading(false);
}

loadPlayers();
```

}, []);

const positions = useMemo(
() => [
"All",
...Array.from(
new Set(
players
.map((player) => player.position)
.filter(Boolean)
)
),
],
[players]
);

const nationalities = useMemo(
() => [
"All",
...Array.from(
new Set(
players
.map((player) => player.nationality)
.filter(Boolean)
)
),
],
[players]
);

const filteredPlayers = players.filter((player) => {
const searchText = search.toLowerCase();

```
const matchesSearch =
  player.full_name.toLowerCase().includes(searchText) ||
  (player.nationality || "")
    .toLowerCase()
    .includes(searchText) ||
  (player.position || "")
    .toLowerCase()
    .includes(searchText) ||
  (player.agency || "")
    .toLowerCase()
    .includes(searchText) ||
  (player.contract?.club?.name || "")
    .toLowerCase()
    .includes(searchText);

const matchesPosition =
  position === "All" || player.position === position;

const matchesNationality =
  nationality === "All" ||
  player.nationality === nationality;

return (
  matchesSearch &&
  matchesPosition &&
  matchesNationality
);
```

});

const formatSalary = (
salary: number | null,
currency: string | null
) => {
if (salary === null || salary === undefined) {
return null;
}

```
return `${currency || "USD"} ${Number(
  salary
).toLocaleString("en-US", {
  maximumFractionDigits: 0,
})}`;
```

};

return ( <main>
{/* HEADER */}

```
  <nav>
    <Link href="/" className="logo">
      WFM<span>•</span>
    </Link>

    <div className="navlinks">
      <Link href="/players">Players</Link>
      <Link href="/contracts">Contracts</Link>
      <Link href="/transfers">Transfers</Link>
      <Link href="/salaries">Salaries</Link>
      <Link href="/clubs">Clubs</Link>
    </div>

    <button className="login">Sign in</button>
  </nav>

  {/* PAGE CONTENT */}

  <section
    style={{
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "40px 20px 60px",
      fontFamily: "Arial, sans-serif",
    }}
  >
    {/* PAGE HEADER */}

    <div
      style={{
        marginBottom: "30px",
      }}
    >
      <div
        style={{
          color: "#777",
          fontSize: "13px",
          fontWeight: "700",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}
      >
        Player Database
      </div>

      <h1
        style={{
          fontSize: "42px",
          margin: "0 0 10px",
          letterSpacing: "-1px",
        }}
      >
        Women Football Market
      </h1>

      <p
        style={{
          color: "#666",
          margin: 0,
          fontSize: "17px",
        }}
      >
        Player profiles, contracts, salaries and market intelligence.
      </p>
    </div>

    {/* SEARCH + FILTERS */}

    <div
      style={{
        padding: "20px",
        border: "1px solid #e5e5e5",
        borderRadius: "14px",
        marginBottom: "30px",
        background: "#fafafa",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(250px, 2fr) minmax(150px, 1fr) minmax(150px, 1fr)",
          gap: "12px",
        }}
      >
        <input
          type="text"
          placeholder="Search players, clubs, agencies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "14px 16px",
            border: "1px solid #d5d5d5",
            borderRadius: "9px",
            fontSize: "15px",
            outline: "none",
            background: "#fff",
          }}
        />

        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          style={{
            padding: "14px 16px",
            border: "1px solid #d5d5d5",
            borderRadius: "9px",
            fontSize: "15px",
            background: "#fff",
          }}
        >
          {positions.map((item) => (
            <option key={item} value={item || ""}>
              {item || "Unknown"}
            </option>
          ))}
        </select>

        <select
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          style={{
            padding: "14px 16px",
            border: "1px solid #d5d5d5",
            borderRadius: "9px",
            fontSize: "15px",
            background: "#fff",
          }}
        >
          {nationalities.map((item) => (
            <option key={item} value={item || ""}>
              {item || "Unknown"}
            </option>
          ))}
        </select>
      </div>
    </div>

    {/* RESULTS HEADER */}

    {!loading && (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            color: "#777",
          }}
        >
          Showing{" "}
          <strong style={{ color: "#222" }}>
            {filteredPlayers.length}
          </strong>{" "}
          player
          {filteredPlayers.length !== 1 ? "s" : ""}
        </div>
      </div>
    )}

    {/* LOADING */}

    {loading ? (
      <div
        style={{
          padding: "60px",
          textAlign: "center",
          color: "#777",
        }}
      >
        Loading players...
      </div>
    ) : filteredPlayers.length === 0 ? (
      <div
        style={{
          padding: "50px",
          border: "1px solid #e5e5e5",
          border
```
