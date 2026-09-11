"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Player = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  position: string | null;
  preferred_foot: string | null;
  agency: string | null;
};

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("All");
  const [nationality, setNationality] = useState("All");

  useEffect(() => {
    async function loadPlayers() {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("full_name");

      if (error) {
        console.error("Error loading players:", error);
      } else {
        setPlayers(data || []);
      }

      setLoading(false);
    }

    loadPlayers();
  }, []);

  const positions = [
    "All",
    ...Array.from(
      new Set(players.map((player) => player.position).filter(Boolean))
    ),
  ];

  const nationalities = [
    "All",
    ...Array.from(
      new Set(players.map((player) => player.nationality).filter(Boolean))
    ),
  ];

  const filteredPlayers = players.filter((player) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      player.full_name.toLowerCase().includes(searchText) ||
      (player.nationality || "").toLowerCase().includes(searchText) ||
      (player.position || "").toLowerCase().includes(searchText) ||
      (player.agency || "").toLowerCase().includes(searchText);

    const matchesPosition =
      position === "All" || player.position === position;

    const matchesNationality =
      nationality === "All" || player.nationality === nationality;

    return matchesSearch && matchesPosition && matchesNationality;
  });

  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "36px", marginBottom: "10px" }}>
        Women Football Market
      </h1>

      <p style={{ color: "#666", marginBottom: "30px" }}>
        Player database and football market intelligence.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gap: "12px",
          marginBottom: "30px",
        }}
      >
        <input
          type="text"
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "12px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontSize: "16px",
          }}
        />

        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          style={{
            padding: "12px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontSize: "16px",
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
            padding: "12px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontSize: "16px",
          }}
        >
          {nationalities.map((item) => (
            <option key={item} value={item || ""}>
              {item || "Unknown"}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading players...</p>
      ) : filteredPlayers.length === 0 ? (
        <div
          style={{
            padding: "40px",
            border: "1px solid #ddd",
            borderRadius: "10px",
            textAlign: "center",
          }}
        >
          <h2>No players found</h2>
          <p style={{ color: "#666" }}>
            Your database is connected, but there are currently no player
            records matching your search.
          </p>
        </div>
      ) : (
        <div
          style={{
            overflowX: "auto",
            border: "1px solid #ddd",
            borderRadius: "10px",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "14px", textAlign: "left" }}>
                  Player
                </th>
                <th style={{ padding: "14px", textAlign: "left" }}>
                  Position
                </th>
                <th style={{ padding: "14px", textAlign: "left" }}>
                  Nationality
                </th>
                <th style={{ padding: "14px", textAlign: "left" }}>
                  Preferred Foot
                </th>
                <th style={{ padding: "14px", textAlign: "left" }}>
                  Agency
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredPlayers.map((player) => (
                <tr key={player.id}>
                  <td
                    style={{
                      padding: "14px",
                      borderTop: "1px solid #eee",
                      fontWeight: "600",
                    }}
                  >
                    {player.full_name}
                  </td>

                  <td
                    style={{
                      padding: "14px",
                      borderTop: "1px solid #eee",
                    }}
                  >
                    {player.position || "—"}
                  </td>

                  <td
                    style={{
                      padding: "14px",
                      borderTop: "1px solid #eee",
                    }}
                  >
                    {player.nationality || "—"}
                  </td>

                  <td
                    style={{
                      padding: "14px",
                      borderTop: "1px solid #eee",
                    }}
                  >
                    {player.preferred_foot || "—"}
                  </td>

                  <td
                    style={{
                      padding: "14px",
                      borderTop: "1px solid #eee",
                    }}
                  >
                    {player.agency || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: "20px", color: "#666" }}>
        {filteredPlayers.length} player
        {filteredPlayers.length !== 1 ? "s" : ""} shown
      </p>
    </main>
  );
}
