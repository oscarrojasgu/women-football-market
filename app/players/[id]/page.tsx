import Link from "next/link";
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
          minHeight: "100vh",
          background: "#f5f4ef",
          color: "#111",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            padding: "18px 32px",
            borderBottom: "1px solid #e5e5e5",
            background: "#fff",
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: "24px",
              fontWeight: 800,
              textDecoration: "none",
              color: "#111",
              marginRight: "40px",
            }}
          >
            WFM<span style={{ color: "#777" }}>•</span>
          </Link>

          <div
            style={{
              display: "flex",
              gap: "28px",
              alignItems: "center",
            }}
          >
            <Link href="/players" style={{ color: "#111", textDecoration: "none", fontWeight: 700 }}>
              Players
            </Link>

            <Link href="/contracts" style={{ color: "#111", textDecoration: "none" }}>
              Contracts
            </Link>

            <Link href="/transfers" style={{ color: "#111", textDecoration: "none" }}>
              Transfers
            </Link>

            <Link href="/salaries" style={{ color: "#111", textDecoration: "none" }}>
              Salaries
            </Link>

            <Link href="/clubs" style={{ color: "#111", textDecoration: "none" }}>
              Clubs
            </Link>
          </div>

          <button
            style={{
              marginLeft: "auto",
              border: "1px solid #ddd",
              background: "#fff",
              borderRadius: "8px",
              padding: "9px 16px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Sign in
          </button>
        </nav>

        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            padding: "40px 20px",
          }}
        >
          <h1>Player not found</h1>
          <p>The player profile could not be found.</p>
        </div>
      </main>
    );
  }

  const { data: contracts } = await supabase
    .from("contracts")
    .select("*")
    .eq("player_id", id)
    .order("start_date", { ascending: false });

  const currentContract = contracts?.find(
    (contract) =>
      String(contract.status).toLowerCase() === "active"
  );

  let club = null;

  if (currentContract?.club_id) {
    const { data: clubData } = await supabase
      .from("clubs")
      .select("name, country, league, logo_url")
      .eq("id", currentContract.club_id)
      .maybeSingle();

    club = clubData;
  }

  const contractHistory =
    contracts?.filter(
      (contract) => contract.id !== currentContract?.id
    ) || [];

  const formatDate = (date: string | null) => {
    if (!date) return "—";

    const parts = date.split("-");

    if (parts.length !== 3) return date;

    return parts[1] + "/" + parts[2] + "/" + parts[0];
  };

  const formatSalary = (
    salary: number | null,
    currency: string | null
  ) => {
    if (salary === null || salary === undefined) return "—";

    return (
      (currency || "USD") +
      " " +
      Number(salary).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
    );
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f4ef",
        color: "#111",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* HEADER */}

      <nav
        style={{
          display: "flex",
          alignItems: "center",
          padding: "18px 32px",
          borderBottom: "1px solid #e5e5e5",
          background: "#fff",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: "24px",
            fontWeight: 800,
            textDecoration: "none",
            color: "#111",
            marginRight: "40px",
          }}
        >
          WFM<span style={{ color: "#777" }}>•</span>
        </Link>

        <div
          style={{
            display: "flex",
            gap: "28px",
            alignItems: "center",
          }}
        >
          <Link
            href="/players"
            style={{
              color: "#111",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Players
          </Link>

          <Link
            href="/contracts"
            style={{
              color: "#111",
              textDecoration: "none",
            }}
          >
            Contracts
          </Link>

          <Link
            href="/transfers"
            style={{
              color: "#111",
              textDecoration: "none",
            }}
          >
            Transfers
          </Link>

          <Link
            href="/salaries"
            style={{
              color: "#111",
              textDecoration: "none",
            }}
          >
            Salaries
          </Link>

          <Link
            href="/clubs"
            style={{
              color: "#111",
              textDecoration: "none",
            }}
          >
            Clubs
          </Link>
        </div>

        <button
          style={{
            marginLeft: "auto",
            border: "1px solid #ddd",
            background: "#fff",
            borderRadius: "8px",
            padding: "9px 16px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Sign in
        </button>
      </nav>

      {/* PLAYER CONTENT */}

      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "40px 20px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <Link
          href="/players"
          style={{
            textDecoration: "none",
            color: "#555",
          }}
        >
          ← Back to Players
        </Link>

        {/* PLAYER HEADER */}

        <div
          style={{
            marginTop: "30px",
            padding: "30px",
            border: "1px solid #ddd",
            borderRadius: "12px",
            display: "flex",
            gap: "30px",
            alignItems: "center",
          }}
        >
          {/* PLAYER PHOTO */}

          <div
            style={{
              width: "180px",
              height: "180px",
              flexShrink: 0,
              borderRadius: "12px",
              overflow: "hidden",
              background: "#f1f1f1",
            }}
          >
            {player.photo_url ? (
              <img
                src={player.photo_url}
                alt={player.full_name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#999",
                  fontSize: "14px",
                }}
              >
                No Photo
              </div>
            )}
          </div>

          {/* PLAYER NAME */}

          <div>
            <h1
              style={{
                fontSize: "40px",
                margin: "0 0 8px 0",
              }}
            >
              {player.full_name}
            </h1>

            <p
              style={{
                color: "#666",
                fontSize: "18px",
                margin: "0 0 15px 0",
              }}
            >
              {player.nationality || "Nationality unknown"} ·{" "}
              {player.position || "Position unknown"}
            </p>

            {club && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                {club.logo_url && (
                  <img
                    src={club.logo_url}
                    alt={club.name}
                    style={{
                      width: "50px",
                      height: "50px",
                      objectFit: "contain",
                    }}
                  />
                )}

                <div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                    }}
                  >
                    {club.name}
                  </div>

                  <div
                    style={{
                      color: "#666",
                      marginTop: "3px",
                    }}
                  >
                    {club.league || "—"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PLAYER INFORMATION */}

        <div
          style={{
            marginTop: "25px",
            padding: "30px",
            border: "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
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
              <strong>Position:</strong>{" "}
              {player.position || "—"}
            </p>

            <p>
              <strong>Preferred Foot:</strong>{" "}
              {player.preferred_foot || "—"}
            </p>

            <p>
              <strong>Agency:</strong>{" "}
              {player.agency || "—"}
            </p>
          </div>
        </div>

        {/* CURRENT CLUB */}

        <div
          style={{
            marginTop: "25px",
            padding: "30px",
            border: "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  marginBottom: "20px",
                }}
              >
                {club.logo_url && (
                  <img
                    src={club.logo_url}
                    alt={club.name}
                    style={{
                      width: "70px",
                      height: "70px",
                      objectFit: "contain",
                    }}
                  />
                )}

                <div>
                  <h3
                    style={{
                      fontSize: "26px",
                      margin: "0 0 5px 0",
                    }}
                  >
                    {club.name}
                  </h3>

                  <div style={{ color: "#666" }}>
                    {club.league || "—"} ·{" "}
                    {club.country || "—"}
                  </div>
                </div>
              </div>

              <p>
                <strong>Contract Status:</strong>{" "}
                {currentContract.status || "—"}
              </p>

              <p>
                <strong>Contract Confidence:</strong>{" "}
                {currentContract.confidence || "—"}
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
        </div>

        {/* CONTRACT HISTORY */}

        <div
          style={{
            marginTop: "25px",
            padding: "30px",
            border: "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
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
                    <strong>Status:</strong>{" "}
                    {contract.status || "—"}
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
                      <strong>Notes:</strong>{" "}
                      {contract.notes}
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
      </div>
    </main>
  );
}
