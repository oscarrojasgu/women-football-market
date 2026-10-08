"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useWfmT } from "../../lib/use-wfm-t";

type RecordRow = { player_id:string; confidence:string|null; source_id:string|null };
type Player = { id:string; full_name:string };

const DATASETS = [
  { key:"contracts", label:"Contracts", total:169 },
  { key:"transfers", label:"Transfers", total:90 },
  { key:"market_values", label:"Market values", total:145 },
  { key:"player_stats", label:"Player statistics", total:483 },
] as const;

export default function DataQualityAdminPage() {
  const t=useWfmT();
  const [authorized,setAuthorized]=useState(false);
  const [loading,setLoading]=useState(true);
  const [records,setRecords]=useState<RecordRow[]>([]);
  const [players,setPlayers]=useState<Player[]>([]);
  const [error,setError]=useState("");

  useEffect(()=>{ void (async()=>{
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){setLoading(false);return}
    const {data:admin}=await supabase.from("wfm_admins").select("user_id").eq("user_id",user.id).maybeSingle();
    if(!admin){setLoading(false);return}
    setAuthorized(true);
    const [c,tr,mv,st,p]=await Promise.all([
      supabase.from("contracts").select("player_id,confidence,source_id"),
      supabase.from("transfers").select("player_id,confidence,source_id"),
      supabase.from("market_values").select("player_id,confidence,source_id"),
      supabase.from("player_stats").select("player_id,confidence,source_id"),
      supabase.from("players").select("id,full_name"),
    ]);
    const firstError=c.error||tr.error||mv.error||st.error||p.error;
    if(firstError)setError(firstError.message);
    setRecords([...(c.data||[]),...(tr.data||[]),...(mv.data||[]),...(st.data||[])] as RecordRow[]);
    setPlayers((p.data||[]) as Player[]);
    setLoading(false);
  })()},[]);

  const summary=useMemo(()=>{
    const out={total:records.length,verified:0,reported:0,estimated:0,missingSource:0};
    for(const r of records){
      if(r.confidence==="verified")out.verified++;
      else if(r.confidence==="reported")out.reported++;
      else if(r.confidence==="estimated")out.estimated++;
      if(!r.source_id)out.missingSource++;
    }
    return out;
  },[records]);

  const byDataset=useMemo(()=>{
    let offset=0;
    return DATASETS.map(d=>{
      const rows=records.slice(offset,offset+d.total);
      offset+=rows.length;
      return {...d,total:rows.length,verified:rows.filter(r=>r.confidence==="verified").length,reported:rows.filter(r=>r.confidence==="reported").length,estimated:rows.filter(r=>r.confidence==="estimated").length,missingSource:rows.filter(r=>!r.source_id).length};
    });
  },[records]);

  const priority=useMemo(()=>{
    const names=new Map(players.map(p=>[p.id,p.full_name]));
    const map=new Map<string,{player:string;estimated:number;reported:number;verified:number;missing:number}>();
    for(const r of records){
      if(!map.has(r.player_id))map.set(r.player_id,{player:names.get(r.player_id)||"Unknown player",estimated:0,reported:0,verified:0,missing:0});
      const x=map.get(r.player_id)!;
      if(r.confidence==="estimated")x.estimated++;
      if(r.confidence==="reported")x.reported++;
      if(r.confidence==="verified")x.verified++;
      if(!r.source_id)x.missing++;
    }
    return [...map.values()].filter(x=>x.estimated||x.missing).sort((a,b)=>b.estimated-a.estimated||b.missing-a.missing||b.reported-a.reported).slice(0,25);
  },[records,players]);

  if(loading)return <main className="account-page"><div className="account-card">{t("Loading data verification…")}</div></main>;
  if(!authorized)return <main className="account-page"><div className="account-card"><div className="eyebrow">{t("ADMIN")}</div><h1>{t("Access restricted")}</h1><p className="account-muted">{t("This workspace is limited to WFM administrators.")}</p></div></main>;

  const pct=(n:number,d:number)=>d?Math.round(n/d*100):0;
  return <main className="account-page"><section className="account-card">
    <div className="account-card-top"><div><div className="eyebrow">{t("WFM ADMIN · DATA TRUST")}</div><h1>{t("Data verification audit")}</h1><p>{t("Internal launch-readiness review of confidence, source coverage, and records that need stronger evidence before public launch.")}</p></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Link href="/admin/commercial" className="outline">{t("Commercial dashboard")}</Link><Link href="/admin/visitor-activity" className="outline">{t("Analytics command center")}</Link></div></div>
    {error&&<div className="account-message account-error">{error}</div>}
    <div className="club-workspace-grid">
      {[["Total records",summary.total],["Verified",summary.verified+" ("+pct(summary.verified,summary.total)+"%)"],["Reported",summary.reported+" ("+pct(summary.reported,summary.total)+"%)"],["Estimated",summary.estimated+" ("+pct(summary.estimated,summary.total)+"%)"],["Missing source",summary.missingSource]].map(([label,value])=><div className="settings-section" key={String(label)}><div className="settings-section-heading"><span>{t("COVERAGE")}</span><h2>{t(String(label))}</h2></div><div style={{fontSize:30,fontWeight:800}}>{value}</div></div>)}
    </div>
    <section className="settings-section" style={{marginTop:16}}><div className="settings-section-heading"><span>{t("DATASETS")}</span><h2>{t("Evidence coverage by dataset")}</h2></div>
      {byDataset.map(row=><div key={row.key} className="account-membership-row"><div><strong>{t(row.label)}</strong><small>{row.total+" records · "+row.missingSource+" "+t("missing source")}</small></div><div style={{display:"flex",gap:12,fontSize:12,flexWrap:"wrap"}}><span>{t("Verified")} {row.verified}</span><span>{t("Reported")} {row.reported}</span><span>{t("Estimated")} {row.estimated}</span></div></div>)}
    </section>
    <section className="settings-section" style={{marginTop:16}}><div className="settings-section-heading"><span>{t("PRIORITY QUEUE")}</span><h2>{t("Records needing stronger evidence")}</h2></div><p className="account-muted">{t("Prioritize estimated records and records without a linked source. No values are changed automatically by this audit.")}</p>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:620}}><thead><tr>{["Player","Estimated","Reported","Verified","Missing source"].map(h=><th key={h} style={{textAlign:"left",padding:"9px",borderBottom:"1px solid #ddd",fontSize:11}}>{t(h)}</th>)}</tr></thead><tbody>{priority.map(row=><tr key={row.player}><td style={{padding:"10px 9px",borderBottom:"1px solid #eee",fontWeight:650}}>{row.player}</td><td style={{padding:"10px 9px",borderBottom:"1px solid #eee"}}>{row.estimated}</td><td style={{padding:"10px 9px",borderBottom:"1px solid #eee"}}>{row.reported}</td><td style={{padding:"10px 9px",borderBottom:"1px solid #eee"}}>{row.verified}</td><td style={{padding:"10px 9px",borderBottom:"1px solid #eee"}}>{row.missing}</td></tr>)}</tbody></table></div>
    </section>
    <div style={{marginTop:16,padding:14,border:"1px solid #ddd",borderRadius:10,background:"#fafafa",fontSize:12,lineHeight:1.6}}>{t("Launch rule: verified, reported, and estimated records remain visibly distinct. WFM should never convert an estimate into a verified fact without evidence.")}</div>
  </section></main>
}
