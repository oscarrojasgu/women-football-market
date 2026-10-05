"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { useWfmT } from '../../../lib/use-wfm-t'

type Source = {
  id: string;
  publisher: string | null;
  url: string | null;
  published_at: string | null;
  reliability: string | null;
  accessed_at: string | null;
};

type SourceRow = Source & { usage: number };

export default function ProvenancePage() {
 const t=useWfmT()
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<SourceRow[]>([]);
  const [publisher, setPublisher] = useState("all");
  const [reliability, setReliability] = useState("all");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [counts, setCounts] = useState({ sources: 0, linkedRecords: 0, missingAccess: 0, missingPublished: 0, missingRecordSources: 0, coveragePercent: 0 });

  const load = async () => {
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

    const { data, error: sourceError } = await supabase
      .from("sources")
      .select("id,publisher,url,published_at,reliability,accessed_at")
      .order("accessed_at", { ascending: false });

    if (sourceError) {
      setError(sourceError.message);
      setLoading(false);
      return;
    }

    const sourceRows = (data || []) as Source[];
    const { data: coverage } = await supabase.rpc("wfm_provenance_coverage");
    const audit = coverage?.[0] || coverage || {};
    const sourceIds = sourceRows.map((s) => s.id);

    const usageTables = ["contracts", "transfers", "player_stats", "market_values"];
    const usageResults = await Promise.all(
      usageTables.map((table) =>
        supabase.from(table).select("source_id", { count: "exact", head: true }).not("source_id", "is", null)
      )
    );

    const linkedRecords = usageResults.reduce((sum, result) => sum + (result.count || 0), 0);
    const missingAccess = sourceRows.filter((s) => !s.accessed_at).length;
    const missingPublished = sourceRows.filter((s) => !s.published_at).length;

    const usageBySource = new Map<string, number>();
    if (sourceIds.length) {
      for (const table of usageTables) {
        const { data: links } = await supabase.from(table).select("source_id").in("source_id", sourceIds);
        for (const link of links || []) {
          if (link.source_id) usageBySource.set(link.source_id, (usageBySource.get(link.source_id) || 0) + 1);
        }
      }
    }

    setRows(sourceRows.map((source) => ({ ...source, usage: usageBySource.get(source.id) || 0 })));
    setCounts({ sources: sourceRows.length, linkedRecords, missingAccess, missingPublished, missingRecordSources: Number(audit.records_missing_source || 0), coveragePercent: Number(audit.coverage_percent || 0) });
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    setError("");
    setMessage("");
    await load();
    setMessage("Provenance inventory refreshed from current WFM records.");
    setRefreshing(false);
  };

  const publishers = useMemo(
    () => Array.from(new Set(rows.map((r) => r.publisher).filter(Boolean))).sort() as string[],
    [rows]
  );
  const reliabilities = useMemo(
    () => Array.from(new Set(rows.map((r) => r.reliability).filter(Boolean))).sort() as string[],
    [rows]
  );
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (publisher === "all" || r.publisher === publisher) &&
          (reliability === "all" || r.reliability === reliability)
      ),
    [rows, publisher, reliability]
  );

  if (loading)
    return (
      <main className="players-scout-page">
        <div className="panel"><p>{t("Loading provenance inventory…")}</p></div>
      </main>
    );

  if (!authorized)
    return (
      <main className="players-scout-page">
        <div className="panel"><p>{t("Admin access required.")}</p></div>
      </main>
    );

  return (
    <main className="players-scout-page">
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">{t("PHASE 9 · M7 DATA PROVENANCE")}</div>
            <h1>{t("Provenance & Trust")}</h1>
            <p>Monitor source coverage, source quality metadata, and how published intelligence records trace back to evidence.</p>
          </div>
          <div className="actions">
            <Link href="/admin/data" className="outline">{t("Data administration")}</Link>
            <Link href="/admin/data/players" className="outline">{t("Player coverage")}</Link><Link href="/admin/data/history" className="outline">{t("Historical data")}</Link>
            <button type="button" className="outline" disabled={refreshing} onClick={() => void refresh()}>
              {refreshing ? "Refreshing…" : "Refresh inventory"}
            </button>
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        <div className="coverage-summary">
          <div><strong>{counts.sources}</strong><span>{t("Sources")}</span></div>
          <div><strong>{counts.linkedRecords}</strong><span>{t("Linked records")}</span></div>
          <div><strong>{counts.missingPublished}</strong><span>{t("Missing publication date")}</span></div>
          <div><strong>{counts.missingAccess}</strong><span>{t("Missing access date")}</span></div>
          <div><strong>{counts.missingRecordSources}</strong><span>{t("Records missing source")}</span></div>
          <div><strong>{counts.coveragePercent}%</strong><span>{t("Traceable records")}</span></div>
        </div>

        <div className="filter-row">
          <label>Publisher
            <select value={publisher} onChange={(e) => setPublisher(e.target.value)}>
              <option value="all">{t("All publishers")}</option>
              {publishers.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label>Reliability
            <select value={reliability} onChange={(e) => setReliability(e.target.value)}>
              <option value="all">{t("All levels")}</option>
              {reliabilities.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </div>

        <div className="table">
          <div className="thead">
            <span>{t("Publisher")}</span><span>{t("Reliability")}</span><span>{t("Published")}</span><span>{t("Accessed")}</span><span>{t("Usage")}</span><span>{t("Source")}</span>
          </div>
          {filtered.map((source) => (
            <div className="row" key={source.id}>
              <span><strong>{source.publisher || "Unknown publisher"}</strong></span>
              <span>{source.reliability || "Unknown"}</span>
              <span>{source.published_at || "—"}</span>
              <span>{source.accessed_at ? new Date(source.accessed_at).toLocaleDateString() : "—"}</span>
              <span>{source.usage}</span>
              <span>
                {source.url ? <a href={source.url} target="_blank" rel="noreferrer">{t("Open source")}</a> : "No URL"}
              </span>
            </div>
          ))}
          {!filtered.length && <div className="row"><span>{t("No sources match the selected filters.")}</span></div>}
        </div>

        <div style={{ marginTop: 18 }}>
          <p className="account-muted">
            Provenance is evidence metadata, not a guarantee that a source is correct. Public player and club profiles show linked source details when available, while unknown values remain unknown rather than being filled with assumptions.
          </p>
        </div>
      </div>
    </main>
  );
}
