"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import PositionMap from "../../components/PositionMap";

type Player = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  position: string | null;
  secondary_position: string | null;
  preferred_foot: string | null;
  agency: string | null;
  photo_url: string | null;
  height_cm: number | null;
  birthplace: string | null;
  current_club_since: string | null;
  youth_clubs: string | null;
};

type Club = {
  id: string;
  name: string;
  country: string | null;
  league: string | null;
  logo_url: string | null;
};

type Contract = {
  id: string;
  player_id: string;
  club_id: string;
  start_date: string | null;
  end_date: string | null;
  annual_salary: number | null;
  weekly_salary: number | null;
  currency: string | null;
  status: string | null;
  confidence: string | null;
  notes: string | null;
  clubs: Club | null;
};

type Transfer = {
  id: string;
  player_id: string;
  from_club_id: string | null;
  to_club_id: string | null;
  transfer_date: string | null;
  transfer_type: string | null;
  fee: number | null;
  currency: string | null;
  confidence: string | null;
  notes: string | null;
  from_club: Club | null;
  to_club: Club | null;
};

type MarketValue = {
  id: string;
  player_id: string;
  valuation_date: string;
  market_value: number;
  currency: string;
  confidence: string | null;
  notes: string | null;
};

function calculateAge(dateOfBirth: string | null) {
  if (!dateOfBirth) return null;

  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDifference =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

function formatDate(date: string | null) {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function formatSalary(
  salary: number | null,
  currency: string | null
) {
  if (salary === null || salary === undefined) {
    return "Not available";
  }

  return `${currency || "USD"} ${Number(
    salary
  ).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
}

function formatMarketValue(
  value: number | null,
  currency: string | null
) {
  if (value === null || value === undefined) {
    return "Not available";
  }

  return `${currency || "EUR"} ${Number(
    value
  ).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
}

function formatTransferType(type: string | null) {
  if (!type) return "Transfer";

  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatTransferFee(
  fee: number | null,
  currency: string | null,
  type: string | null
) {
  if (type?.toLowerCase() === "loan") {
    return "Loan";
  }

  if (fee === null || fee === undefined) {
    return "Free";
  }

  return `${currency || "EUR"} ${Number(
    fee
  ).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
}

function getFlagUrl(nationality: string | null) {
  const flags: Record<string, string> = {
    USA: "us",
    "United States": "us",
    Canada: "ca",
    Mexico: "mx",
    Brazil: "br",
    Colombia: "co",
    Argentina: "ar",
    Chile: "cl",
    France: "fr",
    Germany: "de",
    England: "gb-eng",
    "United Kingdom": "gb",
    Spain: "es",
    Netherlands: "nl",
    Denmark: "dk",
    Sweden: "se",
    Norway: "no",
    Italy: "it",
    Japan: "jp",
    Australia: "au",
  };

  const code = nationality
    ? flags[nationality]
    : null;

  if (!code) return null;

  return `https://flagcdn.com/w40/${code}.png`;
}

function normalizeClub(value: any): Club | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value;
}

export default function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [player, setPlayer] = useState<Player | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [marketValues, setMarketValues] = useState<MarketValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPlayer() {
      if (!id) {
        setError("Player not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const { data: playerData, error: playerError } =
        await supabase
          .from("players")
          .select(`
            id,
            full_name,
            date_of_birth,
            nationality,
            position,
            secondary_position,
            preferred_foot,
            agency,
            photo_url,
            height_cm,
            birthplace,
            current_club_since,
            youth_clubs
          `)
          .eq("id", id)
          .single();

      if (playerError || !playerData) {
        console.error("Error loading player:", playerError);
        setPlayer(null);
        setError("Player not found.");
        setLoading(false);
        return;
      }

      const { data: contractData, error: contractError } =
        await supabase
          .from("contracts")
          .select(`
            id,
            player_id,
            club_id,
            start_date,
            end_date,
            annual_salary,
            weekly_salary,
            currency,
            status,
            confidence,
            notes,
            clubs (
              id,
              name,
              country,
              league,
              logo_url
            )
          `)
          .eq("player_id", id)
          .order("start_date", {
            ascending: false,
          });

      if (contractError) {
        console.error(
          "Error loading contracts:",
          contractError
        );
      }

      const normalizedContracts: Contract[] = (
        contractData || []
      ).map((contract: any) => ({
        id: contract.id,
        player_id: contract.player_id,
        club_id: contract.club_id,
        start_date: contract.start_date,
        end_date: contract.end_date,
        annual_salary: contract.annual_salary,
        weekly_salary: contract.weekly_salary,
        currency: contract.currency,
        status: contract.status,
        confidence: contract.confidence,
        notes: contract.notes,
        clubs: normalizeClub(contract.clubs),
      }));

      const { data: transferData, error: transferError } =
        await supabase
          .from("transfers")
          .select(`
            id,
            player_id,
            from_club_id,
            to_club_id,
            transfer_date,
            transfer_type,
            fee,
            currency,
            confidence,
            notes,
            from_club:clubs!transfers_from_club_id_fkey (
              id,
              name,
              country,
              league,
              logo_url
            ),
            to_club:clubs!transfers_to_club_id_fkey (
              id,
              name,
              country,
              league,
              logo_url
            )
          `)
          .eq("player_id", id)
          .order("transfer_date", {
            ascending: false,
          });

      if (transferError) {
        console.error(
          "Error loading transfers:",
          transferError
        );
      }

      const normalizedTransfers: Transfer[] = (
        transferData || []
      ).map((transfer: any) => ({
        id: transfer.id,
        player_id: transfer.player_id,
        from_club_id: transfer.from_club_id,
        to_club_id: transfer.to_club_id,
        transfer_date: transfer.transfer_date,
        transfer_type: transfer.transfer_type,
        fee: transfer.fee,
        currency: transfer.currency,
        confidence: transfer.confidence,
        notes: transfer.notes,
        from_club: normalizeClub(transfer.from_club),
        to_club: normalizeClub(transfer.to_club),
      }));

      const { data: marketValueData, error: marketValueError } =
        await supabase
          .from("market_values")
          .select(`
            id,
            player_id,
            valuation_date,
            market_value,
            currency,
            confidence,
            notes
          `)
          .eq("player_id", id)
          .order("valuation_date", {
            ascending: false,
          });

      if (marketValueError) {
        console.error(
          "Error loading market values:",
          marketValueError
        );
      }

      setPlayer(playerData);
      setContracts(normalizedContracts);
      setTransfers(normalizedTransfers);
      setMarketValues(marketValueData || []);
      setLoading(false);
    }

    loadPlayer();
  }, [id]);

  if (loading) {
    return (
      <>
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

        <main
          style={{
            background: "#f5f4ef",
            minHeight: "100vh",
            padding: "60px 20px",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              textAlign: "center",
              color: "#777",
            }}
          >
            Loading player...
          </div>
        </main>
      </>
    );
  }

  if (error || !player) {
    return (
      <>
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
        </nav>

        <main
          style={{
            background: "#f5f4ef",
            minHeight: "100vh",
            padding: "60px 20px",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              background: "#fff",
              border: "1px solid #e3e3e3",
              borderRadius: "14px",
              padding: "40px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "10px",
              }}
            >
              Player not found.
            </div>

            <Link
              href="/players"
              style={{
                color: "#111",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "underline",
              }}
            >
              Back to Players
            </Link>
          </div>
        </main>
      </>
    );
  }

  const age = calculateAge(player.date_of_birth);

  const activeContract =
    contracts.find(
      (contract) =>
        contract.status?.toLowerCase() === "active"
    ) || contracts[0] || null;

  const currentClub = activeContract?.clubs || null;

  const currentMarketValue =
    marketValues.length > 0
      ? marketValues[0]
      : null;

  const flagUrl = getFlagUrl(player.nationality);

  return (
    <>
      {/* HEADER */}

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
          fontFamily: "Arial, sans-serif",
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
          padding: "45px 20px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "28px",
          }}
        >
          {player.photo_url ? (
            <img
              src={player.photo_url}
              alt={player.full_name}
              style={{
                width: "150px",
                height: "150px",
                borderRadius: "12px",
                objectFit: "cover",
                objectPosition: "center top",
                flexShrink: 0,
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                width: "150px",
                height: "150px",
                borderRadius: "12px",
                background: "#292929",
                flexShrink: 0,
              }}
            />
          )}

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "12px",
                letterSpacing: "2px",
                fontWeight: 700,
                marginBottom: "12px",
                color: "#aaa",
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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
                marginTop: "14px",
                color: "#ccc",
                fontSize: "15px",
              }}
            >
              {flagUrl && (
                <img
                  src={flagUrl}
                  alt={player.nationality || ""}
                  style={{
                    width: "26px",
                    height: "18px",
                    objectFit: "cover",
                    borderRadius: "2px",
                    display: "block",
                  }}
                />
              )}

              <span>
                {player.nationality || "Nationality unavailable"}
              </span>

              <span>•</span>

              <span>
                {player.position || "Position unavailable"}
              </span>

              {player.secondary_position && (
                <>
                  <span>•</span>
                  <span>
                    {player.secondary_position}
                  </span>
                </>
              )}
            </div>

            {currentClub && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "18px",
                }}
              >
                {currentClub.logo_url && (
                  <img
                    src={currentClub.logo_url}
                    alt={currentClub.name}
                    style={{
                      width: "34px",
                      height: "34px",
                      objectFit: "contain",
                    }}
                  />
                )}

                <div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                    }}
                  >
                    {currentClub.name}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#aaa",
                      marginTop: "2px",
                    }}
                  >
                    {currentClub.league || ""}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MAIN */}

      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 20px 60px",
          fontFamily: "Arial, sans-serif",
          background: "#f5f4ef",
        }}
      >
        {/* PLAYER INFORMATION */}

        <section
          style={{
            background: "#fff",
            border: "1px solid #e3e3e3",
            borderRadius: "14px",
            overflow: "hidden",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              padding: "15px 20px",
              background: "#fafafa",
              borderBottom: "1px solid #e3e3e3",
              fontSize: "11px",
              fontWeight: 700,
              color: "#777",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Player Information
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4, 1fr)",
              gap: "0",
            }}
          >
            <div style={{ padding: "18px 20px" }}>
              <div
                style={{
                  fontSize: "11px",
                  color: "#888",
                  marginBottom: "5px",
                  textTransform: "uppercase",
                }}
              >
                Date of Birth
              </div>

              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {formatDate(player.date_of_birth)}
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: "#888",
                  marginTop: "3px",
                }}
              >
                {age !== null
                  ? `${age} years old`
                  : "Age unavailable"}
              </div>
            </div>

            <div style={{ padding: "18px 20px" }}>
              <div
                style={{
                  fontSize: "11px",
                  color: "#888",
                  marginBottom: "5px",
                  textTransform: "uppercase",
                }}
              >
                Height
              </div>

              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {player.height_cm
                  ? `${player.height_cm} cm`
                  : "Not available"}
              </div>
            </div>

            <div style={{ padding: "18px 20px" }}>
              <div
                style={{
                  fontSize: "11px",
                  color: "#888",
                  marginBottom: "5px",
                  textTransform: "uppercase",
                }}
              >
                Preferred Foot
              </div>

              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {player.preferred_foot || "Not available"}
              </div>
            </div>

            <div style={{ padding: "18px 20px" }}>
              <div
                style={{
                  fontSize: "11px",
                  color: "#888",
                  marginBottom: "5px",
                  textTransform: "uppercase",
                }}
              >
                Birthplace
              </div>

              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {player.birthplace || "Not available"}
              </div>
            </div>
          </div>

          {(player.agency || player.youth_clubs) && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                borderTop: "1px solid #eee",
              }}
            >
              <div style={{ padding: "18px 20px" }}>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#888",
                    marginBottom: "5px",
                    textTransform: "uppercase",
                  }}
                >
                  Agency
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {player.agency || "Not available"}
                </div>
              </div>

              <div style={{ padding: "18px 20px" }}>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#888",
                    marginBottom: "5px",
                    textTransform: "uppercase",
                  }}
                >
                  Youth Club
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {player.youth_clubs || "Not available"}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* POSITION MAP */}

        <section
          style={{
            background: "#fff",
            border: "1px solid #e3e3e3",
            borderRadius: "14px",
            overflow: "hidden",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              padding: "15px 20px",
              background: "#fafafa",
              borderBottom: "1px solid #e3e3e3",
              fontSize: "11px",
              fontWeight: 700,
              color: "#777",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Position
          </div>

          <div
            style={{
              padding: "20px",
            }}
          >
            <PositionMap
              primaryPosition={player.position}
              secondaryPosition={
                player.secondary_position
              }
            />
          </div>
        </section>

        {/* TWO COLUMN DATA */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1.5fr 1fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <div>
            {/* CURRENT CLUB */}

            <section
              style={{
                background: "#fff",
                border: "1px solid #e3e3e3",
                borderRadius: "14px",
                overflow: "hidden",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  padding: "15px 20px",
                  background: "#fafafa",
                  borderBottom: "1px solid #e3e3e3",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#777",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Current Club
              </div>

              {currentClub ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "52px 1fr auto",
                    gap: "14px",
                    alignItems: "center",
                    padding: "18px 20px",
                  }}
                >
                  {currentClub.logo_url ? (
                    <img
                      src={currentClub.logo_url}
                      alt={currentClub.name}
                      style={{
                        width: "52px",
                        height: "52px",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "8px",
                        background: "#eee",
                      }}
                    />
                  )}

                  <div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                      }}
                    >
                      {currentClub.name}
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "#888",
                        marginTop: "3px",
                      }}
                    >
                      {currentClub.league || "League unavailable"}
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#888",
                        textTransform: "uppercase",
                      }}
                    >
                      Since
                    </div>

                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        marginTop: "3px",
                      }}
                    >
                      {formatDate(
                        player.current_club_since
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "20px",
                    color: "#777",
                    fontSize: "14px",
                  }}
                >
                  No current club information available.
                </div>
              )}
            </section>

            {/* TRANSFER HISTORY */}

            <section
              style={{
                background: "#fff",
                border: "1px solid #e3e3e3",
                borderRadius: "14px",
                overflow: "hidden",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  padding: "15px 20px",
                  background: "#fafafa",
                  borderBottom: "1px solid #e3e3e3",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#777",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Transfer History
              </div>

              {transfers.length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    color: "#777",
                    fontSize: "14px",
                  }}
                >
                  No transfer history available.
                </div>
              ) : (
                transfers.map((transfer) => (
                  <div
                    key={transfer.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr 30px 1fr",
                      gap: "12px",
                      alignItems: "center",
                      padding: "15px 20px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "9px",
                        minWidth: 0,
                      }}
                    >
                      {transfer.from_club?.logo_url ? (
                        <img
                          src={
                            transfer.from_club.logo_url
                          }
                          alt={
                            transfer.from_club.name
                          }
                          style={{
                            width: "42px",
                            height: "42px",
                            objectFit: "contain",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "7px",
                            background: "#eee",
                            flexShrink: 0,
                          }}
                        />
                      )}

                      <div
                        style={{
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {transfer.from_club?.name ||
                            "Previous club"}
                        </div>

                        <div
                          style={{
                            fontSize: "11px",
                            color: "#888",
                            marginTop: "2px",
                          }}
                        >
                          {transfer.from_club?.league ||
                            ""}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: "center",
                        color: "#999",
                        fontSize: "16px",
                      }}
                    >
                      →
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "9px",
                        minWidth: 0,
                      }}
                    >
                      {transfer.to_club?.logo_url ? (
                        <img
                          src={
                            transfer.to_club.logo_url
                          }
                          alt={
                            transfer.to_club.name
                          }
                          style={{
                            width: "42px",
                            height: "42px",
                            objectFit: "contain",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "7px",
                            background: "#eee",
                            flexShrink: 0,
                          }}
                        />
                      )}

                      <div
                        style={{
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {transfer.to_club?.name ||
                            "New club"}
                        </div>

                        <div
                          style={{
                            fontSize: "11px",
                            color: "#888",
                            marginTop: "2px",
                          }}
                        >
                          {transfer.to_club?.league ||
                            ""}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        gridColumn:
                          "1 / -1",
                        display: "grid",
                        gridTemplateColumns:
                          "1fr 1fr 1fr 1fr",
                        gap: "10px",
                        paddingTop: "3px",
                        borderTop:
                          "1px solid #f0f0f0",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#999",
                            textTransform:
                              "uppercase",
                          }}
                        >
                          Date
                        </div>

                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            marginTop: "2px",
                          }}
                        >
                          {formatDate(
                            transfer.transfer_date
                          )}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#999",
                            textTransform:
                              "uppercase",
                          }}
                        >
                          Type
                        </div>

                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            marginTop: "2px",
                          }}
                        >
                          {formatTransferType(
                            transfer.transfer_type
                          )}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#999",
                            textTransform:
                              "uppercase",
                          }}
                        >
                          Fee
                        </div>

                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            marginTop: "2px",
                          }}
                        >
                          {formatTransferFee(
                            transfer.fee,
                            transfer.currency,
                            transfer.transfer_type
                          )}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#999",
                            textTransform:
                              "uppercase",
                          }}
                        >
                          Confidence
                        </div>

                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            marginTop: "2px",
                          }}
                        >
                          {transfer.confidence ||
                            "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>

            {/* CONTRACT HISTORY */}

            <section
              style={{
                background: "#fff",
                border: "1px solid #e3e3e3",
                borderRadius: "14px",
                overflow: "hidden",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  padding: "15px 20px",
                  background: "#fafafa",
                  borderBottom: "1px solid #e3e3e3",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#777",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Contract History
              </div>

              {contracts.length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    color: "#777",
                    fontSize: "14px",
                  }}
                >
                  No contract information available.
                </div>
              ) : (
                contracts.map((contract) => (
                  <div
                    key={contract.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "45px 1fr auto",
                      gap: "12px",
                      alignItems: "center",
                      padding: "15px 20px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {contract.clubs?.logo_url ? (
                      <img
                        src={
                          contract.clubs.logo_url
                        }
                        alt={
                          contract.clubs.name
                        }
                        style={{
                          width: "45px",
                          height: "45px",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "45px",
                          height: "45px",
                          borderRadius: "7px",
                          background: "#eee",
                        }}
                      />
                    )}

                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                        }}
                      >
                        {contract.clubs?.name ||
                          "Club unavailable"}
                      </div>

                      <div
                        style={{
                          fontSize: "11px",
                          color: "#888",
                          marginTop: "3px",
                        }}
                      >
                        {contract.clubs?.league ||
                          ""}
                      </div>

                      <div
                        style={{
                          fontSize: "11px",
                          color: "#888",
                          marginTop: "3px",
                        }}
                      >
                        {formatDate(
                          contract.start_date
                        )}{" "}
                        —{" "}
                        {formatDate(
                          contract.end_date
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                        }}
                      >
                        {formatSalary(
                          contract.annual_salary,
                          contract.currency
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: "11px",
                          color: "#888",
                          marginTop: "3px",
                        }}
                      >
                        {contract.weekly_salary
                          ? `${contract.currency || "USD"} ${Number(
                              contract.weekly_salary
                            ).toLocaleString(
                              "en-US",
                              {
                                maximumFractionDigits:
                                  0,
                              }
                            )} / wk`
                          : "Weekly unavailable"}
                      </div>

                      <div
                        style={{
                          fontSize: "11px",
                          color: "#666",
                          marginTop: "5px",
                        }}
                      >
                        {contract.status ||
                          "Status unavailable"}{" "}
                        •{" "}
                        {contract.confidence ||
                          "—"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>

          <div>
            {/* MARKET VALUE */}

            <section
              style={{
                background: "#fff",
                border: "1px solid #e3e3e3",
                borderRadius: "14px",
                overflow: "hidden",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  padding: "15px 20px",
                  background: "#fafafa",
                  borderBottom: "1px solid #e3e3e3",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#777",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Market Value
              </div>

              <div
                style={{
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#111",
                  }}
                >
                  {formatMarketValue(
                    currentMarketValue?.market_value ??
                      null,
                    currentMarketValue?.currency ??
                      null
                  )}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#888",
                    marginTop: "5px",
                  }}
                >
                  {currentMarketValue
                    ? `Valuation: ${formatDate(
                        currentMarketValue.valuation_date
                      )}`
                    : "No valuation available"}
                </div>

                {currentMarketValue?.confidence && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#666",
                      marginTop: "8px",
                    }}
                  >
                    Confidence:{" "}
                    {currentMarketValue.confidence}
                  </div>
                )}
              </div>
            </section>

            {/* PREVIOUS VALUATIONS */}

            <section
              style={{
                background: "#fff",
                border: "1px solid #e3e3e3",
                borderRadius: "14px",
                overflow: "hidden",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  padding: "15px 20px",
                  background: "#fafafa",
                  borderBottom: "1px solid #e3e3e3",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#777",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Previous Valuations
              </div>

              {marketValues.length <= 1 ? (
                <div
                  style={{
                    padding: "20px",
                    color: "#777",
                    fontSize: "14px",
                  }}
                >
                  No previous valuations available.
                </div>
              ) : (
                marketValues
                  .slice(1)
                  .map((value) => (
                    <div
                      key={value.id}
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        padding: "14px 20px",
                        borderBottom:
                          "1px solid #eee",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                          }}
                        >
                          {formatDate(
                            value.valuation_date
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: "11px",
                            color: "#888",
                            marginTop: "3px",
                          }}
                        >
                          {value.confidence ||
                            "Confidence unavailable"}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                        }}
                      >
                        {formatMarketValue(
                          value.market_value,
                          value.currency
                        )}
                      </div>
                    </div>
                  ))
              )}
            </section>

            {/* CURRENT CONTRACT */}

            <section
              style={{
                background: "#fff",
                border: "1px solid #e3e3e3",
                borderRadius: "14px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "15px 20px",
                  background: "#fafafa",
                  borderBottom: "1px solid #e3e3e3",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#777",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Current Contract
              </div>

              {activeContract ? (
                <div
                  style={{
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                    }}
                  >
                    {activeContract.clubs?.name ||
                      "Club unavailable"}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#888",
                      marginTop: "3px",
                    }}
                  >
                    {activeContract.clubs?.league ||
                      ""}
                  </div>

                  <div
                    style={{
                      borderTop:
                        "1px solid #eee",
                      marginTop: "16px",
                      paddingTop: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        marginBottom: "9px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#888",
                        }}
                      >
                        Annual salary
                      </span>

                      <strong
                        style={{
                          fontSize: "13px",
                        }}
                      >
                        {formatSalary(
                          activeContract.annual_salary,
                          activeContract.currency
                        )}
                      </strong>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        marginBottom: "9px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#888",
                        }}
                      >
                        Weekly salary
                      </span>

                      <strong
                        style={{
                          fontSize: "13px",
                        }}
                      >
                        {activeContract.weekly_salary
                          ? formatSalary(
                              activeContract.weekly_salary,
                              activeContract.currency
                            )
                          : "Not available"}
                      </strong>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        marginBottom: "9px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#888",
                        }}
                      >
                        Contract dates
                      </span>

                      <strong
                        style={{
                          fontSize: "12px",
                          textAlign: "right",
                        }}
                      >
                        {formatDate(
                          activeContract.start_date
                        )}{" "}
                        —{" "}
                        {formatDate(
                          activeContract.end_date
                        )}
                      </strong>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#888",
                        }}
                      >
                        Status
                      </span>

                      <strong
                        style={{
                          fontSize: "12px",
                        }}
                      >
                        {activeContract.status ||
                          "Not available"}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "20px",
                    color: "#777",
                    fontSize: "14px",
                  }}
                >
                  No current contract available.
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
