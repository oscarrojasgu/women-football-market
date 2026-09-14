```tsx
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

  let club = null;

  if (currentContract?.club_id) {
    const { data: clubData } = await supabase
      .from("clubs")
      .select("name, country, league")
      .eq("id", currentContract.club_id)
      .single();

    club = clubData;
  }

  const contractHistory =
    contracts?.filter((contract) => contract.id !== currentContract?.id) || [];

 const formatDate = (date: string | null) => {
  if (!date) return "—";

  const parts = date.split("-");

  if (parts.length !== 3) return date;

  return `${parts[1]}/${parts[2]}/${parts[0]}`;
};

  const formatSalary = (
    salary: number | null,
    currency: string | null
  ) => {
    if (salary === null || salary === undefined) return "—";

    return `${currency || "USD"} ${Number(salary).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

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
              {formatDate(currentContract.start_date)}
            </p>

            <p>
              <strong>Contract End:</strong>{" "}
              {currentContract.end_date
                ? formatDate(currentContract.end_date)
                : "Present"}
            </p>

            <p>
              <strong>Annual Salary:</strong>{" "}
              {formatSalary(
                currentContract.annual_salary,
                currentContract.currency
              )}
            </p>

            <p>
              <strong>Weekly Salary:</strong>{" "}
              {formatSalary(
                currentContract.weekly_salary,
                currentContract.currency
              )}
            </p>
          </div>
        ) : (
          <p style={{ color: "#666" }}>
            No current contract information available.
          </p>
        )}

        <hr style={{ margin: "30px 0" }} />

        <h2>Contract History</h2>

        {contractHistory.length > 0 ? (
          <div style={{ marginTop: "20px" }}>
            {contractHistory.map((contract) => (
              <div
                key={contract.id}
                style={{
                  marginBottom: "15px",
                  padding: "20px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                }}
              >
                <p>
                  <strong>Status:</strong> {contract.status || "—"}
                </p>

                <p>
                  <strong>Start:</strong>{" "}
                  {formatDate(contract.start_date)}
                </p>

                <p>
                  <strong>End:</strong>{" "}
                  {formatDate(contract.end_date)}
                </p>

                <p>
                  <strong>Annual Salary:</strong>{" "}
                  {formatSalary(
                    contract.annual_salary,
                    contract.currency
                  )}
                </p>

                <p>
                  <strong>Weekly Salary:</strong>{" "}
                  {formatSalary(
                    contract.weekly_salary,
                    contract.currency
                  )}
                </p>

                <p>
                  <strong>Confidence:</strong>{" "}
                  {contract.confidence || "—"}
                </p>

                {contract.notes && (
                  <p>
                    <strong>Notes:</strong> {contract.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#666" }}>
            No previous contract information available.
          </p>
        )}
      </div>
    </main>
  );
}
```
