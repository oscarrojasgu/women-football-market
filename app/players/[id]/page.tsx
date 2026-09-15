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
            width: "100%",
            display: "flex",
            alignItems: "center",
            padding: "14px 32px",
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
              style={{ color: "#111", textDecoration: "none" }}
            >
              Contracts
            </Link>
            <Link
              href="/transfers"
              style={{ color: "#111", textDecoration: "none" }}
            >
              Transfers
            </Link>
            <Link
              href="/salaries"
              style={{ color: "#111", textDecoration: "none" }}
            >
              Salaries
            </Link>
            <Link
              href="/clubs"
              style={{ color: "#111", textDecoration: "none" }}
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
              padding: "8px 14px",
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
            padding: "30px 20px",
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
    (contract) => String(contract.status).toLowerCase() === "active"
  );

  const contractClubIds = [
    ...new Set(
      (contracts || [])
        .map((contract) => contract.club_id)
        .filter(Boolean)
    ),
  ];

  const { data: contractClubs } =
    contractClubIds.length > 0
      ? await supabase
          .from("clubs")
          .select("id, name, country, league, logo_url")
          .in("id", contractClubIds)
      : { data: [] };

  const contractClubMap = new Map(
    (contractClubs || []).map((club) => [club.id, club])
  );

  const currentClub = currentContract?.club_id
    ? contractClubMap.get(currentContract.club_id) || null
    : null;

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
    if (transferType === "free") return "Free";

    if (fee === null || fee === undefined) return "No fee reported";

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

  const labelStyle = {
    fontSize: "10px",
    color: "#888",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  };

  const valueStyle = {
    fontWeight: 600,
    marginTop: "3px",
    fontSize: "14px",
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
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          width: "100%",
          display: "flex",
          alignItems: "center",
          padding: "14px 32px",
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
            style={{ color: "#111", textDecoration: "none" }}
          >
            Contracts
          </Link>

          <Link
            href="/transfers"
            style={{ color: "#111", textDecoration: "none" }}
          >
            Transfers
          </Link>

          <Link
            href="/salaries"
            style={{ color: "#111", textDecoration: "none" }}
          >
            Salaries
          </Link>

          <Link
            href="/clubs"
            style={{ color: "#111", textDecoration: "none" }}
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
            padding: "8px 14px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Sign in
        </button>
      </nav>

      <section
        style={{
          background: "#111",
          color: "#fff",
          padding: "32px 6vw 34px",
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
              fontSize: "13px",
              display: "inline-block",
              marginBottom: "18px",
            }}
          >
            ← Back to Players
          </Link>

          <div
            style={{
              display: "flex",
              gap: "22px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "115px",
                height: "115px",
                flexShrink: 0,
                borderRadius: "10px",
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
  width: "260px",
  height: "260px",
  borderRadius: "50%",
  objectFit: "cover",
  objectPosition: "center center",
  flexShrink: 0,
  display: "block",
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
                    fontSize: "13px",
                  }}
                >
                  No Photo
                </div>
              )}
            </div>

            <div>
              <div
                style={{
                  fontSize: "11px",
                  letterSpacing: "2px",
                  fontWeight: 700,
                  color: "#aaa",
                  marginBottom: "6px",
                }}
              >
                WOMEN&apos;S FOOTBALL MARKET
              </div>

              <h1
                style={{
                  fontSize: "42px",
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
                  fontSize: "16px",
                  margin: "7px 0 12px",
                }}
              >
                {player.nationality || "Nationality unknown"} ·{" "}
                {player.position || "Position unknown"}
              </p>

              {currentClub && (
                <Link
                  href={`/clubs/${currentClub.id}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "9px",
                    textDecoration: "none",
                    color: "#fff",
                  }}
                >
                  {currentClub.logo_url && (
                    <img
                      src={currentClub.logo_url}
                      alt={currentClub.name}
                      style={{
                        width: "38px",
                        height: "38px",
                        objectFit: "contain",
                      }}
                    />
                  )}

                  <div>
                    <div style={{ fontSize: "17px", fontWeight: 700 }}>
                      {currentClub.name}
                    </div>

                    <div
                      style={{
                        color: "#aaa",
                        marginTop: "2px",
                        fontSize: "12px",
                      }}
                    >
                      {currentClub.league || "—"}
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "25px 20px 50px",
        }}
      >
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "10px",
            background: "#fff",
          }}
        >
          <h2 style={{ margin: "0 0 14px", fontSize: "20px" }}>
            Player Information
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
            }}
          >
            <div>
              <div style={labelStyle}>Date of Birth</div>
              <div style={valueStyle}>{player.date_of_birth || "—"}</div>
            </div>

            <div>
              <div style={labelStyle}>Position</div>
              <div style={valueStyle}>{player.position || "—"}</div>
            </div>

            <div>
              <div style={labelStyle}>Preferred Foot</div>
              <div style={valueStyle}>{player.preferred_foot || "—"}</div>
            </div>

            <div>
              <div style={labelStyle}>Agency</div>
              <div style={valueStyle}>{player.agency || "—"}</div>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "16px",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "10px",
            background: "#fff",
          }}
        >
          <h2 style={{ margin: "0 0 14px", fontSize: "20px" }}>
            Current Club
          </h2>

          {currentContract && currentClub ? (
            <Link
              href={`/clubs/${currentClub.id}`}
              style={{
                display: "block",
                padding: "15px",
                background: "#f7f7f7",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#111",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "14px",
                }}
              >
                {currentClub.logo_url && (
                  <img
                    src={currentClub.logo_url}
                    alt={currentClub.name}
                    style={{
                      width: "52px",
                      height: "52px",
                      objectFit: "contain",
                    }}
                  />
                )}

                <div>
                  <h3
                    style={{
                      fontSize: "21px",
                      margin: 0,
                    }}
                  >
                    {currentClub.name}
                  </h3>

                  <div
                    style={{
                      color: "#666",
                      fontSize: "13px",
                      marginTop: "3px",
                    }}
                  >
                    {currentClub.league || "—"} ·{" "}
                    {currentClub.country || "—"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={labelStyle}>Status</div>
                  <div style={valueStyle}>
                    {currentContract.status || "—"}
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>Confidence</div>
                  <div style={valueStyle}>
                    {formatConfidence(currentContract.confidence)}
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>Contract Start</div>
                  <div style={valueStyle}>
                    {formatDate(currentContract.start_date)}
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>Contract End</div>
                  <div style={valueStyle}>
                    {currentContract.end_date
                      ? formatDate(currentContract.end_date)
                      : "Present"}
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>Annual Salary</div>
                  <div style={valueStyle}>
                    {formatSalary(
                      currentContract.annual_salary,
                      currentContract.currency
                    )}
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>Weekly Salary</div>
                  <div style={valueStyle}>
                    {formatSalary(
                      currentContract.weekly_salary,
                      currentContract.currency
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <p style={{ color: "#666", margin: 0 }}>
              No current contract information available.
            </p>
          )}
        </div>

        <div
          style={{
            marginTop: "16px",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "10px",
            background: "#fff",
          }}
        >
          <h2 style={{ margin: "0 0 14px", fontSize: "20px" }}>
            Transfer History
          </h2>

          {transfers.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {transfers.map((transfer: any) => (
                <div
                  key={transfer.id}
                  style={{
                    padding: "14px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 30px 1fr",
                      gap: "12px",
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
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      {transfer.from_club?.logo_url && (
                        <img
                          src={transfer.from_club.logo_url}
                          alt={transfer.from_club.name}
                          style={{
                            width: "42px",
                            height: "42px",
                            objectFit: "contain",
                            flexShrink: 0,
                          }}
                        />
                      )}

                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "14px",
                          }}
                        >
                          {transfer.from_club?.name || "—"}
                        </div>

                        <div
                          style={{
                            color: "#777",
                            fontSize: "11px",
                            marginTop: "2px",
                          }}
                        >
                          {transfer.from_club?.league || "—"}
                        </div>
                      </div>
                    </Link>

                    <div
                      style={{
                        textAlign: "center",
                        fontSize: "18px",
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
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      {transfer.to_club?.logo_url && (
                        <img
                          src={transfer.to_club.logo_url}
                          alt={transfer.to_club.name}
                          style={{
                            width: "42px",
                            height: "42px",
                            objectFit: "contain",
                            flexShrink: 0,
                          }}
                        />
                      )}

                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "14px",
                          }}
                        >
                          {transfer.to_club?.name || "—"}
                        </div>

                        <div
                          style={{
                            color: "#777",
                            fontSize: "11px",
                            marginTop: "2px",
                          }}
                        >
                          {transfer.to_club?.league || "—"}
                        </div>
                      </div>
                    </Link>
                  </div>

                  <div
                    style={{
                      marginTop: "12px",
                      paddingTop: "10px",
                      borderTop: "1px solid #eee",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 1fr",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <div style={labelStyle}>Date</div>
                      <div style={valueStyle}>
                        {formatDate(transfer.transfer_date)}
                      </div>
                    </div>

                    <div>
                      <div style={labelStyle}>Type</div>
                      <div style={valueStyle}>
                        {formatTransferType(transfer.transfer_type)}
                      </div>
                    </div>

                    <div>
                      <div style={labelStyle}>Fee</div>
                      <div style={valueStyle}>
                        {formatTransferFee(
                          transfer.fee,
                          transfer.currency,
                          transfer.transfer_type
                        )}
                      </div>
                    </div>

                    <div>
                      <div style={labelStyle}>Confidence</div>
                      <div style={valueStyle}>
                        {formatConfidence(transfer.confidence)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#666", margin: 0 }}>
              No transfer history available.
            </p>
          )}
        </div>

        <div
          style={{
            marginTop: "16px",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "10px",
            background: "#fff",
          }}
        >
          <h2 style={{ margin: "0 0 14px", fontSize: "20px" }}>
            Contract History
          </h2>

          {contractHistory.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {contractHistory.map((contract) => {
                const contractClub = contract.club_id
                  ? contractClubMap.get(contract.club_id) || null
                  : null;

                return (
                  <div
                    key={contract.id}
                    style={{
                      padding: "14px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "12px",
                      }}
                    >
                      {contractClub?.logo_url && (
                        <img
                          src={contractClub.logo_url}
                          alt={contractClub.name}
                          style={{
                            width: "45px",
                            height: "45px",
                            objectFit: "contain",
                          }}
                        />
                      )}

                      <div>
                        {contractClub ? (
                          <Link
                            href={`/clubs/${contractClub.id}`}
                            style={{
                              color: "#111",
                              textDecoration: "none",
                              fontSize: "17px",
                              fontWeight: 700,
                            }}
                          >
                            {contractClub.name}
                          </Link>
                        ) : (
                          <div
                            style={{
                              fontSize: "17px",
                              fontWeight: 700,
                            }}
                          >
                            Previous Club
                          </div>
                        )}

                        {contractClub && (
                          <div
                            style={{
                              color: "#777",
                              fontSize: "11px",
                              marginTop: "2px",
                            }}
                          >
                            {contractClub.league || "—"} ·{" "}
                            {contractClub.country || "—"}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "10px",
                      }}
                    >
                      <div>
                        <div style={labelStyle}>Status</div>
                        <div style={valueStyle}>
                          {contract.status || "—"}
                        </div>
                      </div>

                      <div>
                        <div style={labelStyle}>Confidence</div>
                        <div style={valueStyle}>
                          {formatConfidence(contract.confidence)}
                        </div>
                      </div>

                      <div>
                        <div style={labelStyle}>Contract Start</div>
                        <div style={valueStyle}>
                          {formatDate(contract.start_date)}
                        </div>
                      </div>

                      <div>
                        <div style={labelStyle}>Contract End</div>
                        <div style={valueStyle}>
                          {formatDate(contract.end_date)}
                        </div>
                      </div>

                      <div>
                        <div style={labelStyle}>Annual Salary</div>
                        <div style={valueStyle}>
                          {formatSalary(
                            contract.annual_salary,
                            contract.currency
                          )}
                        </div>
                      </div>

                      <div>
                        <div style={labelStyle}>Weekly Salary</div>
                        <div style={valueStyle}>
                          {formatSalary(
                            contract.weekly_salary,
                            contract.currency
                          )}
                        </div>
                      </div>
                    </div>

                    {contract.notes && (
                      <div
                        style={{
                          marginTop: "12px",
                          paddingTop: "10px",
                          borderTop: "1px solid #eee",
                          color: "#555",
                          fontSize: "12px",
                          lineHeight: 1.4,
                        }}
                      >
                        <strong>Notes:</strong> {contract.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "#666", margin: 0 }}>
              No previous contract information available.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
