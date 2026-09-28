"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

type Batch = {
  id: string;
  name: string;
  provider: string;
  source_type: string;
  file_name: string | null;
  status: string;
  total_rows: number;
  accepted_rows: number;
  rejected_rows: number;
  needs_review_rows: number;
  inserted_rows: number;
  updated_rows: number;
  error_rows: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
};

type QueueRow = {
  id: string;
  entity_type: string;
  external_id: string;
  external_name: string | null;
  country: string | null;
  status: string;
  matched_player_id: string | null;
  matched_club_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

const statuses = ["all", "pending", "matched", "ready", "imported", "needs_review", "rejected"];

export default function ImportBatchDetailPage() {
  const params = useParams<{ id: string }>();
  const batchId = params?.id;

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    if (!batchId) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setLoading(false);
      return;
    }

    const { data: a } = await supabase
      .from("wfm_admins")
      .select("user_id")
      .eq("user_id", u.user.id)
      .maybeSingle();

    setAuthorized(!!a);
    if (!a) {
      setLoading(false);
      return;
    }

    const [{ data: b, error: be }, { data: q, error: qe }] = await Promise.all([
      supabase.from("wfm_import_batches").select("*").eq("id", batchId).maybeSingle(),
      supabase
        .from("entity_import_queue")
        .select("id,entity_type,external_id,external_name,country,status,matched_player_id,matched_club_id,error_message,created_at,updated_at")
        .eq("import_batch_id", batchId)
        .order("created_at", { ascending: true }),
    ]);

    if (be) setError(be.message);
    if (qe) setError(qe.message);
    setBatch((b ?? null) as Batch | null);
    setRows((q ?? []) as QueueRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [batchId]);

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    rows.forEach((r) => {
      result[r.status] = (result[r.status] || 0) + 1;
    });
    return result;
  }, [rows]);

  const filteredRows = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter],
  );

  const setBatchStatus = async (status: string) => {
    if (!batch) return;
    setBusy(true);
    setError("");
    setMessage("");

    const patch: Record<string, unknown> = { status };
    if (status === "processing") patch.started_at = new Date().toISOString();
    if (["completed", "completed_with_errors", "failed", "cancelled"].includes(status)) {
      patch.completed_at = new Date().toISOString();
    }

    const { error: e } = await supabase
      .from("wfm_import_batches")
      .update(patch)
      .eq("id", batch.id);

    if (e) setError(e.message);
    else {
      setMessage("Batch status updated.");
      await load();
    }
    setBusy(false);
  };

  const retryRejected = async () => {
    if (!batch) return;
    const retryable = rows.filter((r) => r.status === "rejected" || !!r.error_message);
    if (!retryable.length) {
      setMessage("There are no rejected or errored records to retry.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    const ids = retryable.map((r) => r.id);
    const { error: e } = await supabase
      .from("entity_import_queue")
      .update({ status: "pending", error_message: null })
      .in("id", ids);

    if (e) setError(e.message);
    else {
      await supabase
        .from("wfm_import_batches")
        .update({
          status: "queued",
          completed_at: null,
          error_rows: 0,
        })
        .eq("id", batch.id);

      setMessage(`${retryable.length} record(s) returned to the review queue.`);
      await load();
    }
    setBusy(false);
  };

  const markCompleteFromResults = async () => {
    if (!batch) return;
    const unresolved = rows.filter((r) => ["pending", "needs_review", "ready"].includes(r.status)).length;
    const errors = rows.filter((r) => r.status === "rejected" || !!r.error_message).length;

    setBusy(true);
    setError("");
    const status = unresolved || errors ? "completed_with_errors" : "completed";
    const { error: e } = await supabase
      .from("wfm_import_batches")
      .update({
        status,
        total_rows: rows.length,
        accepted_rows: rows.filter((r) => r.status !== "rejected").length,
        rejected_rows: counts.rejected || 0,
        needs_review_rows: (counts.needs_review || 0) + (counts.ready || 0),
        inserted_rows: counts.imported || 0,
        updated_rows: counts.matched || 0,
        error_rows: errors,
        completed_at: new Date().toISOString(),
      })
      .eq("id", batch.id);

    if (e) setError(e.message);
    else {
      setMessage(`Batch reconciled as ${status.replaceAll("_", " ")}.`);
      await load();
    }
    setBusy(false);
  };

  if (loading) {
    return <main className="account-page"><div className="account-card">Loading batch…</div></main>;
  }

  if (!authorized) {
    return (
      <main className="account-page">
        <div className="account-card">
          <div className="eyebrow">ADMIN</div>
          <h1>Access restricted</h1>
          <p className="account-muted">This workspace is limited to WFM administrators.</p>
        </div>
      </main>
    );
  }

  if (!batch) {
    return (
      <main className="account-page">
        <div className="account-card">
          <div className="eyebrow">DATA IMPORT</div>
          <h1>Batch not found</h1>
          <Link href="/admin/data" className="outline">← Data administration</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="account-page">
      <section className="account-card">
        <div className="account-card-top">
          <div>
            <div className="eyebrow">WFM ADMIN · IMPORT BATCH</div>
            <h1>{batch.name}</h1>
            <p>{batch.provider} · {batch.source_type}{batch.file_name ? ` · ${batch.file_name}` : ""}</p>
          </div>
          <Link href="/admin/data" className="outline">← Data administration</Link>
        </div>

        {error && <div className="account-message account-error">{error}</div>}
        {message && <div className="account-message account-success">{message}</div>}

        <section className="settings-section">
          <div className="settings-section-heading">
            <span>BATCH STATUS</span>
            <h2>{batch.status}</h2>
          </div>

          <div className="club-workspace-grid">
            {[
              ["Total", rows.length],
              ["Pending", counts.pending || 0],
              ["Matched", counts.matched || 0],
              ["Ready", counts.ready || 0],
              ["Imported", counts.imported || 0],
              ["Review", counts.needs_review || 0],
              ["Rejected", counts.rejected || 0],
            ].map(([label, value]) => (
              <div key={String(label)} className="account-membership-row">
                <div><strong>{value}</strong><small>{label}</small></div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18 }}>
            {batch.status === "draft" && <button className="outline" disabled={busy} onClick={() => void setBatchStatus("queued")}>Queue</button>}
            {batch.status === "queued" && <button className="outline" disabled={busy} onClick={() => void setBatchStatus("processing")}>Start processing</button>}
            {batch.status === "processing" && <button className="outline" disabled={busy} onClick={() => void markCompleteFromResults()}>Reconcile batch</button>}
            {(counts.rejected || 0) > 0 && <button className="outline" disabled={busy} onClick={() => void retryRejected()}>Retry rejected / errors</button>}
            {batch.status !== "cancelled" && !["completed", "completed_with_errors", "failed"].includes(batch.status) && (
              <button className="outline" disabled={busy} onClick={() => void setBatchStatus("cancelled")}>Cancel batch</button>
            )}
          </div>
        </section>

        <section className="settings-section" style={{ marginTop: 24 }}>
          <div className="settings-section-heading">
            <span>RECORD HISTORY</span>
            <h2>{filteredRows.length} records</h2>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {statuses.map((s) => (
              <button key={s} type="button" className="outline" onClick={() => setFilter(s)}>
                {s.replaceAll("_", " ")} {s === "all" ? rows.length : counts[s] || 0}
              </button>
            ))}
          </div>

          {filteredRows.length ? filteredRows.map((r) => (
            <div key={r.id} className="account-membership-row">
              <div style={{ minWidth: 0 }}>
                <strong>{r.external_name || r.external_id}</strong>
                <small>{r.entity_type} · {r.external_id}{r.country ? ` · ${r.country}` : ""}</small>
                <small>{r.status}{r.matched_player_id || r.matched_club_id ? " · WFM entity matched" : ""}</small>
                {r.error_message && <small>{r.error_message}</small>}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span className="account-status-pill">{r.status}</span>
                {(r.status === "pending" || r.status === "needs_review" || r.status === "ready") && (
                  <Link href="/admin/data/review" className="outline">Review</Link>
                )}
              </div>
            </div>
          )) : <p className="account-muted">No records match this filter.</p>}
        </section>

        <section className="settings-section" style={{ marginTop: 24 }}>
          <div className="settings-section-heading">
            <span>PUBLISH HISTORY</span>
            <h2>{counts.imported || 0} published records</h2>
          </div>
          {(counts.imported || 0) > 0
            ? rows.filter((r) => r.status === "imported").map((r) => (
              <div key={r.id} className="account-membership-row">
                <div style={{ minWidth: 0 }}>
                  <strong>{r.external_name || r.external_id}</strong>
                  <small>{r.entity_type} · {r.external_id}</small>
                  <small>{r.matched_player_id || r.matched_club_id ? `WFM ID · ${r.matched_player_id || r.matched_club_id}` : "Published"}</small>
                </div>
                <span className="account-status-pill">imported</span>
              </div>
            ))
            : <p className="account-muted">Nothing from this batch has been published yet.</p>}
        </section>
      </section>
    </main>
  );
}
