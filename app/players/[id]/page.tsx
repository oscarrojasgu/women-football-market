import { supabase } from "../../lib/supabase";

type PlayerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { id } = await params;

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .single();

  if (playerError || !player) {
    return (
      <main
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "40px 20px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h1>Player not found</h1>
        <p>The player profile could not be found.</p>
      </main>
    );
  }

  const { data: contracts } = await supabase
  .from("contracts")
  .select("*")
  .eq("player_id", id)
  .order("start_date", { ascending: false });

  const currentContract = contracts?.find(
    (contract) => contract.status === "active"
  );

 const club = currentContract?.clubs?.[0];

  return (
    <main
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <a
        href="/players"
        style={{
          textDecoration: "none",
          color: "#555",
        }}
      >
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
        <h1
          style={{
            fontSize: "40px",
            marginBottom: "8px",
          }}
        >
          {player.full_name}
        </h1>

        <p
          style={{
            color: "#666",
            fontSize: "18px",
            marginTop: "0",
          }}
        >
          {player.nationality || "Nationality unknown"} ·{" "}
          {player.position || "Position unknown"}
        </p>

        <hr style={{ margin: "30px 0" }} />

        <h2>Player Information</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
            marginTop: "20px",
          }}
        >
          <p>
            <strong>Date of Birth:</strong>{" "}
            {player.date_of_birth || "—"}
          </p>

          <p>
            <strong>Position:</strong> {player.position || "—"}
          </p>

          <p>
            <strong>Preferred Foot:</strong>{" "}
            {player.preferred_foot || "—"}
          </p>

          <p>
            <strong>Agency:</strong> {player.agency || "—"}
          </p>
        </div>

        <hr style={{ margin: "30px 0" }} />

        <h2>Current Club</h2>

        {currentContract && club ? (
          <div
            style={{
              marginTop: "20px",
              padding: "20px",
              background: "#f7f7f7",
              borderRadius: "10px",
            }}
          >
            <h3
              style={{
                fontSize: "24px",
                marginTop: "0",
              }}
            >
              {club.name}
            </h3>

            <p>
              <strong>League:</strong> {club.league || "—"}
            </p>

            <p>
              <strong>Country:</strong> {club.country || "—"}
            </p>

            <p>
              <strong>Contract Status:</strong>{" "}
              {currentContract.status}
            </p>

            <p>
              <strong>Contract Confidence:</strong>{" "}
              {currentContract.confidence}
            </p>

            <p>
              <strong>Contract Start:</strong>{" "}
              {currentContract.start_date || "—"}
            </p>

            <p>
              <strong>Contract End:</strong>{" "}
              {currentContract.end_date || "—"}
            </p>

            <p>
              <strong>Annual Salary:</strong>{" "}
              {currentContract.annual_salary
                ? `${currentContract.currency} ${currentContract.annual_salary.toLocaleString()}`
                : "—"}
            </p>

            <p>
              <strong>Weekly Salary:</strong>{" "}
              {currentContract.weekly_salary
                ? `${currentContract.currency} ${currentContract.weekly_salary.toLocaleString()}`
                : "—"}
            </p>
          </div>
        ) : (
          <p style={{ color: "#666" }}>
            No current contract information available.
          </p>
        )}
      </div>
    </main>
  );
}
