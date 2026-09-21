"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Submission = {
  id: string;
  player_id: string;
  submitted_by: string;
  submission_type: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  evidence_url: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

type Claim = {
  id: string;
  player_id: string;
  user_id: string;
  verification_method: string;
  status: string;
  created_at: string;
};

type Player = {
  id: string;
  full_name: string;
};

export default function VerificationDashboard() {
  const [user, setUser] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [players, setPlayers] = useState<Record<string, Player>>({});

  useEffect(() => {
    checkSession();
    const { data } = supabase.auth.onAuthStateChange(() => {
      checkSession();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function checkSession() {
    setLoading(true);
    const { data } = await supabase.auth.getUser();
    const currentUser = data.user || null;
    setUser(currentUser);

    if (!currentUser) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    let { data: admin } = await supabase
      .from("wfm_admins")
      .select("user_id, email, role")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    // First-time owner bootstrap. The database function only succeeds for
    // the WFM owner email configured in Supabase.
    if (!admin) {
      await supabase.rpc("bootstrap_wfm_owner");

      const result = await supabase
        .from("wfm_admins")
        .select("user_id, email, role")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      admin = result.data;
    }

    setAuthorized(!!admin);
    setLoading(false);

    if (admin) {
      loadQueue();
    }
  }

  async function signIn() {
    setBusy(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    await checkSession();
  }

  async function createOwnerAccount() {
    setBusy(true);
    setMessage("");

    if (email.toLowerCase() !== "oscarrojasgu@hotmail.com") {
      setBusy(false);
      setMessage("Owner account creation is restricted to the WFM owner email.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    await checkSession();
  }

  async function loadQueue() {
    setLoading(true);

    const [{ data: submissionData, error: submissionError }, { data: claimData, error: claimError }] =
      await Promise.all([
        supabase
          .from("verification_submissions")
          .select(
            "id, player_id, submitted_by, submission_type, field_name, old_value, new_value, evidence_url, notes, status, created_at"
          )
          .eq("status", "pending")
          .order("created_at", { ascending: true }),
        supabase
          .from("player_claims")
          .select(
            "id, player_id, user_id, verification_method, status, created_at"
          )
          .eq("status", "pending")
          .order("created_at", { ascending: true }),
      ]);

    if (submissionError || claimError) {
      setMessage(submissionError?.message || claimError?.message || "Could not load the review queue.");
      setLoading(false);
      return;
    }

    const nextSubmissions = submissionData || [];
    const nextClaims = claimData || [];
    setSubmissions(nextSubmissions);
    setClaims(nextClaims);

    const ids = Array.from(
      new Set([
        ...nextSubmissions.map((item) => item.player_id),
        ...nextClaims.map((item) => item.player_id),
      ])
    );

    if (ids.length) {
      const { data: playerData } = await supabase
        .from("players")
        .select("id, full_name")
        .in("id", ids);

      const map: Record<string, Player> = {};
      (playerData || []).forEach((player) => {
        map[player.id] = player;
      });
      setPlayers(map);
    } else {
      setPlayers({});
    }

    setLoading(false);
  }

  async function reviewSubmission(id: string, action: "approved" | "rejected" | "needs_evidence") {
    setBusy(true);
    setMessage("");

    const { error } = await supabase.rpc("review_verification_submission", {
      p_submission_id: id,
      p_action: action,
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      action === "approved"
        ? "Approved and applied to the player profile."
        : action === "rejected"
          ? "Submission rejected."
          : "Submission marked as needing more evidence."
    );
    await loadQueue();
  }

  async function approveClaim(id: string) {
    setBusy(true);
    setMessage("");

    const { error } = await supabase.rpc("review_player_claim", {
      p_claim_id: id,
      p_action: "verified",
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Claim verified and representation access granted.");
    await loadQueue();
  }

  async function rejectClaim(id: string) {
    setBusy(true);
    setMessage("");

    const { error } = await supabase.rpc("review_player_claim", {
      p_claim_id: id,
      p_action: "rejected",
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Claim rejected.");
    await loadQueue();
  }

  async function signOut()(id: string) {
    setBusy(true);
    setMessage("");

    const { error } = await supabase
      .from("player_claims")
      .update({
        status: "rejected",
      })
      .eq("id", id);

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadQueue();
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setAuthorized(false);
    setSubmissions([]);
    setClaims([]);
  }

  if (loading && !user) {
    return <main style={styles.page}><p>Loading WFM owner access...</p></main>;
  }

  if (!user) {
    return (
      <main style={styles.page}>
        <div style={styles.authCard}>
          <div style={styles.eyebrow}>WOMEN’S FOOTBALL MARKET</div>
          <h1 style={styles.title}>Owner verification</h1>
          <p style={styles.muted}>
            Sign in with the owner email. This area is separate from the public
            player verification flow.
          </p>

          <label style={styles.label}>Owner email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            style={styles.input}
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            style={styles.input}
          />

          <button
            onClick={signIn}
            disabled={busy || !email || !password}
            style={styles.primaryButton}
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>

          <button
            onClick={createOwnerAccount}
            disabled={busy || !email || !password}
            style={{ ...styles.secondaryButton, width: "100%", marginTop: 8 }}
          >
            {busy ? "Creating..." : "Create owner account"}
          </button>

          {message && <div style={styles.message}>{message}</div>}
        </div>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main style={styles.page}>
        <div style={styles.authCard}>
          <div style={styles.eyebrow}>ACCESS DENIED</div>
          <h1 style={styles.title}>This account is not an owner.</h1>
          <p style={styles.muted}>
            Signed in as <strong>{user.email || "this account"}</strong>.
            The account must be added to the WFM owner list before it can
            review submissions.
          </p>
          <button onClick={signOut} style={styles.secondaryButton}>
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>WOMEN’S FOOTBALL MARKET</div>
          <h1 style={styles.title}>Verification dashboard</h1>
          <p style={styles.muted}>
            Review player claims and submitted corrections before they become
            part of the public database.
          </p>
        </div>

        <button onClick={signOut} style={styles.secondaryButton}>
          Sign out
        </button>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      <section style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{submissions.length}</div>
          <div style={styles.statLabel}>Pending updates</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{claims.length}</div>
          <div style={styles.statLabel}>Pending claims</div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Profile updates</h2>
          <button onClick={loadQueue} style={styles.refreshButton}>
            Refresh
          </button>
        </div>

        {submissions.length === 0 ? (
          <div style={styles.empty}>No pending profile updates.</div>
        ) : (
          <div style={styles.list}>
            {submissions.map((item) => (
              <article key={item.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div>
                    <div style={styles.playerName}>
                      {players[item.player_id]?.full_name || "Unknown player"}
                    </div>
                    <div style={styles.field}>
                      {item.field_name || item.submission_type}
                    </div>
                  </div>
                  <div style={styles.pending}>PENDING</div>
                </div>

                <div style={styles.compare}>
                  <div>
                    <div style={styles.smallLabel}>CURRENT</div>
                    <div style={styles.value}>{item.old_value || "—"}</div>
                  </div>
                  <div style={styles.arrow}>→</div>
                  <div>
                    <div style={styles.smallLabel}>SUBMITTED</div>
                    <div style={styles.value}>{item.new_value || "—"}</div>
                  </div>
                </div>

                {item.evidence_url && (
                  <a
                    href={item.evidence_url}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.evidence}
                  >
                    Open evidence ↗
                  </a>
                )}

                {item.notes && (
                  <div style={styles.notes}>
                    <strong>Notes:</strong> {item.notes}
                  </div>
                )}

                <div style={styles.actions}>
                  <button
                    onClick={() => reviewSubmission(item.id, "approved")}
                    disabled={busy}
                    style={styles.approveButton}
                  >
                    Approve & apply
                  </button>
                  <button
                    onClick={() => reviewSubmission(item.id, "rejected")}
                    disabled={busy}
                    style={styles.rejectButton}
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Profile claims</h2>
        </div>

        {claims.length === 0 ? (
          <div style={styles.empty}>No pending profile claims.</div>
        ) : (
          <div style={styles.list}>
            {claims.map((claim) => (
              <article key={claim.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div>
                    <div style={styles.playerName}>
                      {players[claim.player_id]?.full_name || "Unknown player"}
                    </div>
                    <div style={styles.field}>
                      User ID: {claim.user_id}
                    </div>
                  </div>
                  <div style={styles.pending}>PENDING</div>
                </div>

                <div style={styles.notes}>
                  Verification method: {claim.verification_method}
                </div>

                <div style={styles.actions}>
                  <button
                    onClick={() => approveClaim(claim.id)}
                    disabled={busy}
                    style={styles.approveButton}
                  >
                    Verify claim
                  </button>
                  <button
                    onClick={() => rejectClaim(claim.id)}
                    disabled={busy}
                    style={styles.rejectButton}
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f5f2",
    padding: "40px 20px 80px",
    color: "#111",
  },
  authCard: {
    width: "100%",
    maxWidth: 520,
    margin: "80px auto",
    background: "#fff",
    border: "1px solid #e4e4e0",
    borderRadius: 16,
    padding: 28,
    boxShadow: "0 10px 35px rgba(0,0,0,.07)",
  },
  header: {
    maxWidth: 1100,
    margin: "0 auto 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: ".12em",
    color: "#777",
    marginBottom: 8,
  },
  title: {
    margin: 0,
    fontSize: 32,
    lineHeight: 1.1,
  },
  muted: {
    color: "#6b6b68",
    fontSize: 14,
    lineHeight: 1.55,
    margin: "10px 0 0",
    maxWidth: 700,
  },
  label: {
    display: "block",
    marginTop: 20,
    marginBottom: 6,
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase" as const,
    color: "#777",
  },
  input: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: 12,
    border: "1px solid #ccc",
    borderRadius: 9,
    fontSize: 14,
  },
  primaryButton: {
    width: "100%",
    marginTop: 12,
    padding: 12,
    border: 0,
    borderRadius: 9,
    background: "#111",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "10px 14px",
    border: "1px solid #ccc",
    borderRadius: 9,
    background: "#fff",
    color: "#111",
    fontWeight: 700,
    cursor: "pointer",
  },
  message: {
    maxWidth: 1100,
    margin: "0 auto 18px",
    padding: 12,
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 9,
    fontSize: 13,
  },
  statsRow: {
    maxWidth: 1100,
    margin: "0 auto 24px",
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },
  statCard: {
    background: "#fff",
    border: "1px solid #e4e4e0",
    borderRadius: 14,
    padding: 18,
  },
  statNumber: {
    fontSize: 30,
    fontWeight: 800,
  },
  statLabel: {
    marginTop: 3,
    fontSize: 12,
    color: "#777",
  },
  section: {
    maxWidth: 1100,
    margin: "0 auto 30px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 20,
  },
  refreshButton: {
    border: "1px solid #ccc",
    background: "#fff",
    borderRadius: 8,
    padding: "8px 11px",
    fontWeight: 700,
    cursor: "pointer",
  },
  empty: {
    background: "#fff",
    border: "1px solid #e4e4e0",
    borderRadius: 14,
    padding: 22,
    color: "#777",
    fontSize: 14,
  },
  list: {
    display: "grid",
    gap: 12,
  },
  card: {
    background: "#fff",
    border: "1px solid #e2e2de",
    borderRadius: 14,
    padding: 18,
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  playerName: {
    fontSize: 18,
    fontWeight: 800,
  },
  field: {
    marginTop: 4,
    fontSize: 12,
    color: "#777",
  },
  pending: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: ".08em",
    padding: "5px 7px",
    borderRadius: 6,
    background: "#fff3cd",
    color: "#725900",
  },
  compare: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    gap: 14,
    alignItems: "center",
    marginTop: 16,
    padding: 14,
    background: "#f7f7f4",
    borderRadius: 10,
  },
  smallLabel: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: ".08em",
    color: "#888",
  },
  value: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 1.4,
    overflowWrap: "anywhere" as const,
  },
  arrow: {
    color: "#999",
    fontSize: 20,
  },
  evidence: {
    display: "inline-block",
    marginTop: 12,
    color: "#111",
    fontSize: 13,
    fontWeight: 700,
  },
  notes: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 1.5,
    color: "#555",
  },
  actions: {
    display: "flex",
    gap: 8,
    marginTop: 16,
    flexWrap: "wrap" as const,
  },
  approveButton: {
    border: 0,
    background: "#111",
    color: "#fff",
    borderRadius: 8,
    padding: "10px 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  rejectButton: {
    border: "1px solid #ccc",
    background: "#fff",
    color: "#222",
    borderRadius: 8,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
};