"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useWfmT } from "../../lib/use-wfm-t";

type Run={id:string;provider:string;run_type:string;status:string;started_at:string;finished_at:string|null;records_received:number;records_inserted:number;records_updated:number;records_rejected:number;error_message:string|null};
type Coverage={competition_name:string;country:string|null;priority:number;status:string;current_players:number;current_clubs:number;current_seasons:number;target_players:number;target_clubs:number;target_seasons:number};

async function count(table:string){
 const {count}=await supabase.from(table).select("*",{count:"exact",head:true});
 return count||0;
}

export default function OperationsPage(){
 const t=useWfmT();
 const [authorized,setAuthorized]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [metrics,setMetrics]=useState<Record<string,number>>({}),[issues,setIssues]=useState<{severity:string}[]>([]);
 const [runs,setRuns]=useState<Run[]>([]),[coverage,setCoverage]=useState<Coverage[]>([]);
 const load=async()=>{
  const {data:u}=await supabase.auth.getUser();if(!u.user){setLoading(false);return}
  const {data:a}=await supabase.from("wfm_admins").select("user_id").eq("user_id",u.user.id).maybeSingle();
  setAuthorized(!!a);if(!a){setLoading(false);return}
  try{
   const names=["players","clubs","sources","contracts","transfers","salary_records","market_values","player_stats","wfm_source_pipeline","wfm_import_batches","entity_import_queue","account_profiles","contributor_profiles","club_account_requests","representation_requests","agency_accounts","agency_contact_requests","wfm_license_requests","wfm_license_agreements","wfm_license_access_log"];
   const pairs=await Promise.all(names.map(async n=>[n,await count(n)] as const));
   setMetrics(Object.fromEntries(pairs));
   const [{data:aud},{data:r},{data:c}]=await Promise.all([
    supabase.rpc("wfm_run_integrity_audit"),
    supabase.from("data_update_runs").select("id,provider,run_type,status,started_at,finished_at,records_received,records_inserted,records_updated,records_rejected,error_message").order("started_at",{ascending:false}).limit(8),
    supabase.from("wfm_competition_coverage").select("competition_name,country,priority,status,current_players,current_clubs,current_seasons,target_players,target_clubs,target_seasons").order("priority",{ascending:true}).limit(20)
   ]);
   if(aud)setIssues((aud||[]) as {severity:string}[]);if(r)setRuns((r||[]) as Run[]);if(c)setCoverage((c||[]) as Coverage[]);
  }catch(e){setError(e instanceof Error?e.message:"Could not load operations metrics.")}finally{setLoading(false)}
 };
 useEffect(()=>{void load()},[]);
 const issueCounts=useMemo(()=>({critical:issues.filter(i=>i.severity==="critical").length,error:issues.filter(i=>i.severity==="error").length,warning:issues.filter(i=>i.severity==="warning").length}),[issues]);
 const readyCoverage=coverage.filter(c=>c.status==="SCOUTING_READY").length;
 const pendingQueue=(metrics.entity_import_queue||0);
 const onboarding=(metrics.club_account_requests||0)+(metrics.contributor_profiles||0)+(metrics.agency_accounts||0);
 const commercial=(metrics.wfm_license_requests||0)+(metrics.wfm_license_agreements||0);
 if(loading)return <main className="account-page"><div className="account-card">{t("Loading launch operations…")}</div></main>;
 if(!authorized)return <main className="account-page"><div className="account-card"><div className="eyebrow">{t("ADMIN")}</div><h1>{t("Access restricted")}</h1><p className="account-muted">{t("This workspace is limited to WFM administrators.")}</p></div></main>;
 return <main className="account-page"><section className="account-card">
  <div className="account-card-top"><div><div className="eyebrow">{t("M15 · LAUNCH OPERATIONS")}</div><h1>{t("Operations & growth")}</h1><p>{t("One internal view for data growth, source acquisition, quality monitoring, onboarding and controlled commercial activity.")}</p></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Link href="/admin/data" className="outline">{t("Data administration")}</Link><Link href="/admin/data/sources" className="outline">{t("Source pipeline")}</Link><Link href="/admin/licensing" className="outline">{t("Licensing")}</Link></div></div>
  {error&&<div className="account-message account-error">{error}</div>}
  <div className="coverage-summary">
   <div><strong>{metrics.players||0}</strong><span>{t("Players")}</span></div><div><strong>{metrics.clubs||0}</strong><span>{t("Clubs")}</span></div><div><strong>{metrics.sources||0}</strong><span>{t("Production sources")}</span></div><div><strong>{metrics.player_stats||0}</strong><span>{t("Player stats")}</span></div><div><strong>{metrics.wfm_source_pipeline||0}</strong><span>{t("Source candidates")}</span></div><div><strong>{metrics.wfm_import_batches||0}</strong><span>{t("Import batches")}</span></div>
  </div>
  <div className="club-workspace-grid" style={{marginTop:24}}>
   <section className="settings-section"><div className="settings-section-heading"><span>{t("QUALITY")}</span><h2>{t("Data health")}</h2></div>
    <div className="account-membership-row"><div><strong>{issueCounts.critical}</strong><small>{t("Critical integrity issues")}</small></div></div>
    <div className="account-membership-row"><div><strong>{issueCounts.error}</strong><small>{t("Error-level integrity issues")}</small></div></div>
    <div className="account-membership-row"><div><strong>{issueCounts.warning}</strong><small>{t("Warning-level integrity issues")}</small></div></div>
    <div className="account-membership-row"><div><strong>{readyCoverage}</strong><small>{t("Scouting-ready competitions in tracked coverage")}</small></div></div>
    <div className="account-membership-row"><div><strong>{pendingQueue}</strong><small>{t("Import/review queue records")}</small></div></div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}><Link href="/admin/data/review" className="outline">{t("Review queue")}</Link><Link href="/admin/data/provenance" className="outline">{t("Provenance")}</Link><Link href="/admin/data/coverage" className="outline">{t("Coverage")}</Link></div>
   </section>
   <section className="settings-section"><div className="settings-section-heading"><span>{t("GROWTH")}</span><h2>{t("Onboarding & commercial")}</h2></div>
    <div className="account-membership-row"><div><strong>{onboarding}</strong><small>{t("Contributor / club / agency records")}</small></div></div>
    <div className="account-membership-row"><div><strong>{metrics.club_account_requests||0}</strong><small>{t("Club account requests")}</small></div></div>
    <div className="account-membership-row"><div><strong>{metrics.agency_contact_requests||0}</strong><small>{t("Agency contact requests")}</small></div></div>
    <div className="account-membership-row"><div><strong>{commercial}</strong><small>{t("Commercial licensing requests + agreements")}</small></div></div>
    <div className="account-membership-row"><div><strong>{metrics.wfm_license_access_log||0}</strong><small>{t("Commercial access events")}</small></div></div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}><Link href="/admin/club-access" className="outline">{t("Club onboarding")}</Link><Link href="/admin/agency" className="outline">{t("Agency onboarding")}</Link><Link href="/admin/licensing" className="outline">{t("Commercial licensing")}</Link></div>
   </section>
  </div>
  <section className="settings-section" style={{marginTop:24}}><div className="settings-section-heading"><span>{t("UPDATE MONITORING")}</span><h2>{t("Recent data runs")}</h2></div>
   {runs.length?runs.map(r=><div key={r.id} className="account-membership-row"><div><strong>{r.provider} · {r.run_type}</strong><small>{new Date(r.started_at).toLocaleString()} · received {r.records_received} · inserted {r.records_inserted} · updated {r.records_updated} · rejected {r.records_rejected}</small>{r.error_message&&<small>{r.error_message}</small>}</div><span className="account-status-pill">{r.status}</span></div>):<p className="account-muted">{t("No data update runs have been recorded.")}</p>}
  </section>
  <section className="settings-section" style={{marginTop:24}}><div className="settings-section-heading"><span>{t("COVERAGE")}</span><h2>{t("Priority competition targets")}</h2></div>
   {coverage.length?coverage.slice(0,10).map(c=><div key={c.competition_name} className="account-membership-row"><div><strong>{c.competition_name}</strong><small>{c.country||"Country unknown"} · priority {c.priority} · {c.current_players}/{c.target_players} players · {c.current_clubs}/{c.target_clubs} clubs · {c.current_seasons}/{c.target_seasons} seasons</small></div><span className="account-status-pill">{c.status}</span></div>):<p className="account-muted">{t("No coverage targets are configured.")}</p>}
  </section>
  <p className="account-muted" style={{marginTop:20}}>{t("M15 uses existing WFM records and review controls as the operational source of truth. It does not add a recommendation engine, performance prediction, payment processor or public analytics layer.")}</p>
 </section></main>;
}