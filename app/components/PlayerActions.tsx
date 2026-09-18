"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function PlayerActions() {
  const pathname = usePathname();
  const playerId = useMemo(() => {
    const match = pathname?.match(/^\/players\/([^/]+)$/);
    return match?.[1] || null;
  }, [pathname]);

  const [open, setOpen] = useState<"claim" | "update" | null>(null);
  const [email, setEmail] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) return;
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, [playerId]);

  if (!playerId) return null;

  const sendSignIn = async () => {
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.href,
      },
    });
    setBusy(false);
    setMessage(
      error
        ? error.message
        : "Check your email for the secure WFM sign-in link."
    );
  };

  const claimProfile = async () => {
    if (!userId) {
      setMessage("Please sign in first.");
      return;
    }

    setBusy(true);
    setMessage("");

    const { error } = await supabase.from("player_claims").insert({
      player_id: playerId,
      user_id: userId,
      verification_method: "account",
      status: "pending",
    });

    setBusy(false);
    setMessage(
      error
        ? error.code === "23505"
          ? "You already submitted a claim for this profile."
          : error.message
        : "Claim submitted. WFM will review your verification."
    );
  };

  const submitUpdate = async () => {
    if (!userId) {
      setMessage("Please sign in first.");
      return;
    }

    if (!fieldName || !newValue) {
      setMessage("Choose a field and enter the corrected information.");
      return;
    }

    setBusy(true);
    setMessage("");

    const { error } = await supabase
      .from("verification_submissions")
      .insert({
        player_id: playerId,
        submitted_by: userId,
        submission_type: "player_update",
        field_name: fieldName,
        new_value: newValue,
        evidence_url: evidenceUrl || null,
        notes: notes || null,
        status: "pending",
      });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Update submitted for WFM review.");
    setFieldName("");
    setNewValue("");
    setEvidenceUrl("");
    setNotes("");
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 50,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={() => {
            setOpen("claim");
            setMessage("");
          }}
          style={{
            border: "1px solid #111",
            background: "#111",
            color: "#fff",
            borderRadius: 9,
            padding: "11px 15px",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 6px 20px rgba(0,0,0,.16)",
          }}
        >
          Claim this profile
        </button>

        <button
          onClick={() => {
            setOpen("update");
            setMessage("");
          }}
          style={{
            border: "1px solid #ccc",
            background: "#fff",
            color: "#111",
            borderRadius: 9,
            padding: "11px 15px",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 6px 20px rgba(0,0,0,.12)",
          }}
        >
          Suggest an update
        </button>
      </div>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(0,0,0,.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setOpen(null)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 500,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 20,
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 21 }}>
                  {open === "claim"
                    ? "Claim this player profile"
                    : "Suggest a profile update"}
                </h2>
                <p
                  style={{
                    margin: "7px 0 0",
                    color: "#777",
                    fontSize: 13,
                    lineHeight: 1.45,
                  }}
                >
                  {open === "claim"
                    ? "Players, agents and authorized representatives can request profile verification."
                    : "Submit a correction with evidence. WFM reviews changes before publishing them."}
                </p>
              </div>

              <button
                onClick={() => setOpen(null)}
                style={{
                  border: 0,
                  background: "#f3f3f3",
                  borderRadius: 8,
                  width: 34,
                  height: 34,
                  fontSize: 18,
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {!userId ? (
              <div style={{ marginTop: 22 }}>
                <div
                  style={{
                    padding: 14,
                    background: "#f7f7f4",
                    borderRadius: 9,
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  Sign in with your email to submit information. WFM uses a
                  secure passwordless sign-in link.
                </div>

                <label
                  style={{
                    display: "block",
                    marginTop: 18,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#777",
                  }}
                >
                  Email
                </label>

                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: 11,
                    border: "1px solid #ccc",
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                />

                <button
                  onClick={sendSignIn}
                  disabled={busy || !email}
                  style={{
                    width: "100%",
                    marginTop: 12,
                    padding: 12,
                    border: 0,
                    borderRadius: 8,
                    background: "#111",
                    color: "#fff",
                    fontWeight: 700,
                    opacity: busy || !email ? 0.55 : 1,
                  }}
                >
                  {busy ? "Sending..." : "Send sign-in link"}
                </button>
              </div>
            ) : open === "claim" ? (
              <div style={{ marginTop: 22 }}>
                <div
                  style={{
                    padding: 14,
                    border: "1px solid #e3e3e3",
                    borderRadius: 9,
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  Submit your claim and WFM will review your relationship to
                  this player profile before marking it verified.
                </div>

                <button
                  onClick={claimProfile}
                  disabled={busy}
                  style={{
                    width: "100%",
                    marginTop: 14,
                    padding: 12,
                    border: 0,
                    borderRadius: 8,
                    background: "#111",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  {busy ? "Submitting..." : "Submit profile claim"}
                </button>
              </div>
            ) : (
              <div style={{ marginTop: 22 }}>
                <label style={label}>Information to update</label>
                <select
                  value={fieldName}
                  onChange={(event) => setFieldName(event.target.value)}
                  style={input}
                >
                  <option value="">Select a field</option>
                  <option value="full_name">Full name</option>
                  <option value="date_of_birth">Date of birth</option>
                  <option value="nationality">Nationality</option>
                  <option value="position">Position</option>
                  <option value="secondary_position">Secondary position</option>
                  <option value="preferred_foot">Preferred foot</option>
                  <option value="height_cm">Height</option>
                  <option value="birthplace">Birthplace</option>
                  <option value="agency">Agency</option>
                  <option value="youth_clubs">Youth clubs</option>
                  <option value="current_club_since">Current club since</option>
                  <option value="contract">Contract information</option>
                  <option value="other">Other</option>
                </select>

                <label style={label}>Correct information</label>
                <textarea
                  value={newValue}
                  onChange={(event) => setNewValue(event.target.value)}
                  rows={3}
                  placeholder="Enter the correct information..."
                  style={input}
                />

                <label style={label}>Evidence URL</label>
                <input
                  value={evidenceUrl}
                  onChange={(event) => setEvidenceUrl(event.target.value)}
                  type="url"
                  placeholder="https://..."
                  style={input}
                />

                <label style={label}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Tell us why this should be changed."
                  style={input}
                />

                <button
                  onClick={submitUpdate}
                  disabled={busy}
                  style={{
                    width: "100%",
                    marginTop: 14,
                    padding: 12,
                    border: 0,
                    borderRadius: 8,
                    background: "#111",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  {busy ? "Submitting..." : "Submit for review"}
                </button>
              </div>
            )}

            {message && (
              <div
                style={{
                  marginTop: 14,
                  padding: 12,
                  borderRadius: 8,
                  background: "#f3f3f0",
                  fontSize: 12,
                  lineHeight: 1.45,
                }}
              >
                {message}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const label = {
  display: "block",
  marginTop: 14,
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase" as const,
  color: "#777",
};

const input = {
  width: "100%",
  marginTop: 6,
  padding: 11,
  border: "1px solid #ccc",
  borderRadius: 8,
  fontSize: 14,
};
