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
    position: "sticky",
    top: 0,
    zIndex: 1000,
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

        <div
          style={{
            maxWidth: "1200px",
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
      .select("id, name, country, league, logo_url")
      .eq("id", currentContract.club_id)
      .maybeSingle();

    club = clubData;
  }

  const { data: transferData } = await supabase
    .from("transfers")
    .select(`
      id,
      transfer_date,
      transfer_type,
      fee,
      currency,
      confidence,
      from_club:clubs!transfers_from_club_id_fkey (
        id,
        name,
        league,
        country,
        logo_url
      ),
      to_club:clubs!transfers_to_club_id_fkey (
        id,
        name,
        league,
        country,
        logo_url
      )
    `)
    .eq("player_id", id)
    .order("transfer_date", { ascending: false });

  const transfers = (transferData || []).map((transfer: any) => ({
    id: transfer.id,
    transfer_date: transfer.transfer_date,
    transfer_type: transfer.transfer_type,
    fee: transfer.fee,
    currency: transfer.currency,
    confidence: transfer.confidence,
    from_club: Array.isArray(transfer.from_club)
      ? transfer.from_club[0] || null
      : transfer.from_club || null,
    to_club: Array.isArray(transfer.to_club)
      ? transfer.to_club[0] || null
      : transfer.to_club || null,
  }));

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

  const formatTransferFee = (
    fee: number | null,
    currency: string | null,
    transferType: string | null
  ) => {
    if (transferType === "free") {
      return "Free";
    }

    if (fee === null || fee === undefined) {
      return "Undisclosed";
    }

    return (
      (currency || "USD") +
      " " +
      Number(fee).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
    );
  };

  const formatTransferType = (type: string | null) => {
    if (!type) return "—";

    return type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatConfidence = (confidence: string | null) => {
    if (!confidence) return "—";

    return confidence
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
    position: "sticky",
    top: 0,
    zIndex: 1000,
    width: "100%",
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

      {/* PLAYER HERO */}

      <section
        style={{
          background: "#111",
          color: "#fff",
          padding: "45px 6vw 50px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <Link
            href="/players"
            style={{
              color: "#aaa",
              textDecoration: "none",
              fontSize: "14px",
              display: "inline-block",
              marginBottom: "30px",
            }}
          >
            ← Back to Players
          </Link>

          <div
            style={{
              display: "flex",
              gap: "30px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "150px",
                height: "150px",
                flexShrink: 0,
                borderRadius: "12px",
                overflow: "hidden",
                background: "#222",
                border: "1px solid #333",
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
                    color: "#777",
                    fontSize: "14px",
                  }}
                >
                  No Photo
                </div>
              )}
            </div>

            <div>
              <div
                style={{
                  fontSize: "12px",
                  letterSpacing: "2px",
                  fontWeight: 700,
                  color: "#aaa",
                  marginBottom: "10px",
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
                {player.full_name}
              </h1>

              <p
                style={{
                  color: "#ccc",
                  fontSize: "18px",
                  margin: "12px 0 18px 0",
                }}
              >
                {player.nationality || "Nationality unknown"} ·{" "}
                {player.position || "Position unknown"}
              </p>

              {club && (
                <Link
                  href={`/clubs/${club.id}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "12px",
                    textDecoration: "none",
                    color: "#fff",
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
                        fontWeight: 700,
                      }}
                    >
                      {club.name}
                    </div>

                    <div
                      style={{
                        color: "#aaa",
                        marginTop: "3px",
                      }}
                    >
                      {club.league || "—"}
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PLAYER CONTENT */}

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 20px 70px",
        }}
      >
        {/* PLAYER INFORMATION */}

        <div
          style={{
            padding: "30px",
            border: "1px solid #ddd",
            borderRadius: "12px",
            background: "#fff",
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
            background: "#fff",
          }}
        >
          <h2>Current Club</h2>

          {currentContract && club ? (
            <Link
              href={`/clubs/${club.id}`}
              style={{
                display: "block",
                marginTop: "20px",
                padding: "20px",
                background: "#f7f7f7",
                borderRadius: "10px",
                textDecoration: "none",
                color: "#111",
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
            </Link>
          ) : (
            <p style={{ color: "#666" }}>
              No current contract information available.
            </p>
          )}
        </div>

        {/* TRANSFER HISTORY */}

        <div
          style={{
            marginTop: "25px",
            padding: "30px",
            border: "1px solid #ddd",
            borderRadius: "12px",
            background: "#fff",
          }}
        >
          <h2>Transfer History</h2>

          {transfers.length > 0 ? (
            <div
              style={{
                marginTop: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              {transfers.map((transfer: any) => (
                <div
                  key={transfer.id}
                  style={{
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 40px 1fr",
                      gap: "15px",
                      alignItems: "center",
                    }}
                  >
                    <Link
                      href={
                        transfer.from_club?.id
                          ? `/clubs/${transfer.from_club.id}`
                          : "#"
                      }
                      style={{
                        textDecoration: "none",
                        color: "#111",
                      }}
                    >
                      {transfer.from_club?.logo_url && (
                        <img
                          src={transfer.from_club.logo_url}
                          alt={transfer.from_club.name}
                          style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "contain",
                            marginBottom: "8px",
                          }}
                        />
                      )}

                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "16px",
                        }}
                      >
                        {transfer.from_club?.name || "—"}
                      </div>

                      <div
                        style={{
                          color: "#777",
                          fontSize: "12px",
                          marginTop: "3px",
                        }}
                      >
                        {transfer.from_club?.league || "—"}
                      </div>
                    </Link>

                    <div
                      style={{
                        textAlign: "center",
                        fontSize: "22px",
                        color: "#999",
                      }}
                    >
                      →
                    </div>

                    <Link
                      href={
                        transfer.to_club?.id
                          ? `/clubs/${transfer.to_club.id}`
                          : "#"
                      }
                      style={{
                        textDecoration: "none",
                        color: "#111",
                      }}
                    >
                      {transfer.to_club?.logo_url && (
                        <img
                          src={transfer.to_club.logo_url}
                          alt={transfer.to_club.name}
                          style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "contain",
                            marginBottom: "8px",
                          }}
                        />
                      )}

                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "16px",
                        }}
                      >
                        {transfer.to_club?.name || "—"}
                      </div>

                      <div
                        style={{
                          color: "#777",
                          fontSize: "12px",
                          marginTop: "3px",
                        }}
                      >
                        {transfer.to_club?.league || "—"}
                      </div>
                    </Link>
                  </div>

                  <div
                    style={{
                      marginTop: "20px",
                      paddingTop: "15px",
                      borderTop: "1px solid #eee",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "15px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#888",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Date
                      </div>

                      <div
                        style={{
                          fontWeight: 600,
                          marginTop: "4px",
                        }}
                      >
                        {formatDate(transfer.transfer_date)}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#888",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Type
                      </div>

                      <div
                        style={{
                          fontWeight: 600,
                          marginTop: "4px",
                        }}
                      >
                        {formatTransferType(transfer.transfer_type)}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#888",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Fee
                      </div>

                      <div
                        style={{
                          fontWeight: 600,
                          marginTop: "4px",
                        }}
                      >
                        {formatTransferFee(
                          transfer.fee,
                          transfer.currency,
                          transfer.transfer_type
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "12px",
                      fontSize: "12px",
                      color: "#777",
                    }}
                  >
                    Confidence:{" "}
                    {formatConfidence(transfer.confidence)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#666" }}>
              No transfer history available.
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
            background: "#fff",
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
                    background: "#fff",
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
