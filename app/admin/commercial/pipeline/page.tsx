"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { useWfmT } from "../../../lib/use-wfm-t";

type Plan = {
  code: string;
  name: string;
  monthly_price_usd: number | null;
  annual_price_usd: number | null;
  active: boolean;
};

type Activity = {
  user_id: string | null;
  display_name: string | null;
  email: string | null;
  organization_name: string | null;
  account_type: string | null;
  club_name: string | null;
  agency_name: string | null;
  plan_code: string | null;
  event_type: string;
  occurred_at: string;
};

type PipelineStatus = "new" | "contacted" | "qualified" | "proposal" | "customer" | "closed";

type Opportunity = {
  user_id: string;
  pipeline_status: PipelineStatus;
  next_follow_up_at: string | null;
  updated_at: string;
};

const statuses: PipelineStatus[] = ["new", "contacted", "qualified", "proposal", "customer", "closed"];

export default function CommercialPipelinePage() {
  const t = useWfmT();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        setLoading(false);
        return;
      }

      const { data: admin } = await supabase
        .from("wfm_admins")
        .select("user_id")
        .eq("user_id", user.user.id)
        .maybeSingle();

      if (!admin) {
        setLoading(false);
        return;
      }

      setAuthorized(true);

      const [{ data: activityRows, error: activityError }, { data: opportunityRows, error: opportunityError }, { data: planRows, error: planError }] = await Promise.all([
        supabase.rpc("get_wfm_admin_visitor_activity", {
          p_limit: 1000,
          p_since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
        supabase.from("wfm_sales_opportunities").select("user_id,pipeline_status,next_follow_up_at,updated_at"),
        supabase.from("wfm_access_plans").select("code,name,monthly_price_usd,annual_price_usd,active"),
      ]);

      if (activityError || opportunityError || planError) {
        setError(activityError?.message || opportunityError?.message || planError?.message || "Unable to load pipeline data.");
      }

      setActivity((activityRows ?? []) as Activity[]);
      setOpportunities((opportunityRows ?? []) as Opportunity[]);
      setPlans((planRows ?? []) as Plan[]);
      setLoading(false);
    };

    void load();
  }, []);

  const accountRows = useMemo(() => {
    const byUser = new Map<string, Activity>();
    for (const row of activity) {
      if (!row.user_id) continue;
      const existing = byUser.get(row.user_id);
      if (!existing || new Date(row.occurred_at).getTime() > new Date(existing.occurred_at).getTime()) {
        byUser.set(row.user_id, row);
      }
    }
    return [...byUser.entries()];
  }, [activity]);

  const metrics = useMemo(() => {
    const byStatus = Object.fromEntries(statuses.map((status) => [status, 0])) as Record<PipelineStatus, number>;
    for (const opportunity of opportunities) byStatus[opportunity.pipeline_status] += 1;

    const active = opportunities.filter((item) => item.pipeline_status !== "closed");
    const customers = opportunities.filter((item) => item.pipeline_status === "customer");
    const closed = opportunities.filter((item) => item.pipeline_status === "closed");
    const withFollowUp = active.filter((item) => Boolean(item.next_follow_up_at));
    const now = Date.now();
    const overdue = active.filter((item) => item.next_follow_up_at && new Date(item.next_follow_up_at).getTime() < now).length;
    const conversionToCustomer = opportunities.length ? (customers.length / opportunities.length) * 100 : 0;
    const qualificationRate = opportunities.length ? ((byStatus.qualified + byStatus.proposal + byStatus.customer) / opportunities.length) * 100 : 0;

    const planMap = new Map(plans.map((plan) => [plan.code, plan]));
    let monthlyOpportunity = 0;
    let annualOpportunity = 0;
    for (const opportunity of active) {
      const account = activity.find((row) => row.user_id === opportunity.user_id && row.plan_code);
      const plan = account?.plan_code ? planMap.get(account.plan_code) : undefined;
      if (plan?.monthly_price_usd) monthlyOpportunity += Number(plan.monthly_price_usd);
      if (plan?.annual_price_usd) annualOpportunity += Number(plan.annual_price_usd);
    }

    return {
      byStatus,
      active: active.length,
      customers: customers.length,
      closed: closed.length,
      withFollowUp: withFollowUp.length,
      overdue,
      conversionToCustomer,
      qualificationRate,
      monthlyOpportunity,
      annualOpportunity,
    };
  }, [activity, opportunities, plans]);

  const funnel = useMemo(() => {
    const stages = ["new", "contacted", "qualified", "proposal", "customer"] as const;
    return stages.map((status, index) => {
      const count = metrics.byStatus[status];
      const previous = index === 0 ? count : metrics.byStatus[stages[index - 1]];
      return {
        status,
        count,
        rate: index === 0 ? 100 : previous ? (count / previous) * 100 : 0,
      };
    });
  }, [metrics]);

  const planMix = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of accountRows) {
      const opportunity = opportunities.find((item) => item.user_id === row[0]);
      if (!opportunity || opportunity.pipeline_status === "closed") continue;
      const plan = row[1].plan_code || "No active commercial plan";
      counts.set(plan, (counts.get(plan) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [accountRows, opportunities]);

  if (loading) {
    return <main className="account-page"><div className="account-card">{t("Loading commercial dashboard…")}</div></main>;
  }

  if (!authorized) {
    return <main className="account-page"><div className="account-card"><div className="eyebrow">{t("ADMIN")}</div><h1>{t("Access restricted")}</h1><p className="account-muted">{t("This workspace is limited to WFM administrators.")}</p></div></main>;
  }

  return (
    <main className="account-page">
      <section className="account-card">
        <div className="account-card-top">
          <div>
            <div className="eyebrow">{t("WFM ADMIN · COMMERCIAL")}</div>
            <h1>{t("Sales pipeline")}</h1>
            <p>{t("Pipeline performance, conversion, follow-up coverage, and commercial opportunity value for signed-in WFM accounts.")}</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/admin/commercial" className="outline">{t("Commercial dashboard")}</Link>
            <Link href="/admin/visitor-activity" className="outline">{t("Analytics command center")}</Link>
          </div>
        </div>

        {error && <div className="account-message account-error">{error}</div>}

        <section className="settings-section" style={{ marginTop: 24 }}>
          <div className="settings-section-heading"><span>{t("SALES PIPELINE")}</span><h2>{t("Pipeline performance")}</h2></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
            {[
              ["Active opportunities", metrics.active],
              ["Customers", metrics.customers],
              ["Closed", metrics.closed],
              ["Overdue", metrics.overdue],
            ].map(([label, value]) => (
              <div key={String(label)} className="account-membership-row"><small>{t(String(label))}</small><strong style={{ display: "block", fontSize: 26 }}>{value}</strong></div>
            ))}
          </div>
        </section>

        <section className="settings-section" style={{ marginTop: 24 }}>
          <div className="settings-section-heading"><span>{t("CONVERSION")}</span><h2>{t("Funnel conversion")}</h2></div>
          <div style={{ display: "grid", gap: 10 }}>
            {funnel.map((item) => (
              <div key={item.status} style={{ display: "grid", gridTemplateColumns: "120px 1fr 70px", alignItems: "center", gap: 12 }}>
                <strong>{t(item.status === "new" ? "New" : item.status === "contacted" ? "Contacted" : item.status === "qualified" ? "Qualified" : item.status === "proposal" ? "Proposal" : "Customer")}</strong>
                <div style={{ height: 10, borderRadius: 999, background: "#e9e9e9", overflow: "hidden" }}><div style={{ width: `${Math.min(100, Math.max(0, item.rate))}%`, height: "100%", background: "currentColor" }} /></div>
                <span>{item.count} · {item.rate.toFixed(0)}%</span>
              </div>
            ))}
          </div>
          <p className="account-muted" style={{ marginTop: 12 }}>{metrics.conversionToCustomer.toFixed(1)}% {t("of tracked opportunities are currently customers")} · {metrics.qualificationRate.toFixed(1)}% {t("have reached qualification or beyond")}.</p>
        </section>

        <section className="settings-section" style={{ marginTop: 24 }}>
          <div className="settings-section-heading"><span>{t("COMMERCIAL VALUE")}</span><h2>{t("Opportunity value")}</h2></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
            <div className="account-membership-row"><small>{t("Monthly plan value")}</small><strong style={{ display: "block", fontSize: 22 }}>${metrics.monthlyOpportunity.toLocaleString("en-US", { maximumFractionDigits: 0 })}</strong></div>
            <div className="account-membership-row"><small>{t("Annual plan value")}</small><strong style={{ display: "block", fontSize: 22 }}>${metrics.annualOpportunity.toLocaleString("en-US", { maximumFractionDigits: 0 })}</strong></div>
            <div className="account-membership-row"><small>{t("Follow-up coverage")}</small><strong style={{ display: "block", fontSize: 22 }}>{metrics.active ? ((metrics.withFollowUp / metrics.active) * 100).toFixed(0) : 0}%</strong></div>
            <div className="account-membership-row"><small>{t("Customer conversion")}</small><strong style={{ display: "block", fontSize: 22 }}>{metrics.conversionToCustomer.toFixed(0)}%</strong></div>
          </div>
          <p className="account-muted" style={{ marginTop: 12 }}>{t("Opportunity value uses the current WFM access-plan catalog only. It does not represent booked revenue or a sales forecast.")}</p>
        </section>

        <section className="settings-section" style={{ marginTop: 24 }}>
          <div className="settings-section-heading"><span>{t("ACCOUNT MIX")}</span><h2>{t("Active commercial plan mix")}</h2></div>
          {planMix.length === 0 ? <p className="account-muted">{t("No active commercial opportunities yet.")}</p> : <div style={{ display: "grid", gap: 8 }}>{planMix.map(([plan, count]) => <div key={plan} className="account-membership-row" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><span>{plan}</span><strong>{count}</strong></div>)}</div>}
        </section>

        <section className="settings-section" style={{ marginTop: 24 }}>
          <div className="settings-section-heading"><span>{t("PIPELINE HEALTH")}</span><h2>{t("Sales coverage")}</h2></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 8 }}>
            {statuses.map((status) => <div key={status} className="account-membership-row"><small>{t(status === "new" ? "New" : status === "contacted" ? "Contacted" : status === "qualified" ? "Qualified" : status === "proposal" ? "Proposal" : status === "customer" ? "Customer" : "Closed")}</small><strong style={{ display: "block", fontSize: 20 }}>{metrics.byStatus[status]}</strong></div>)}
          </div>
        </section>
      </section>
    </main>
  );
}
