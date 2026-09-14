import { supabase } from "../../lib/supabase";

type PlayerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { id } = await params;

  const { data: player, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !player) {
    return (
      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
        <h1>Player not found</h1>
        <p>The player profile could not be found.</p>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <a href="/players" style={{ textDecoration: "none" }}>
        ← Back to Players
      </a>

      <div
        style={{
          marginTop: "30px",
          padding: "30px",
          border: "1px solid #ddd",
          borderRadius: "12px",
        }}
      >
        <h1 style={{ fontSize: "40px", marginBottom: "10px" }}>
          {player.full_name}
        </h1>

        <p style={{ color: "#666", fontSize: "18px" }}>
          {player.nationality || "Nationality unknown"}
        </p>

        <hr style={{ margin: "25px 0" }} />

        <h2>Player Information</h2>

        <p>
          <strong>Position:</strong> {player.position || "—"}
        </p>

        <p>
          <strong>Date of Birth:</strong>{" "}
          {player.date_of_birth || "—"}
        </p>

        <p>
          <strong>Preferred Foot:</strong>{" "}
          {player.preferred_foot || "—"}
        </p>

        <p>
          <strong>Agency:</strong> {player.agency || "—"}
        </p>
      </div>
    </main>
  );
}
