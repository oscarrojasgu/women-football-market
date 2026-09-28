"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../../lib/supabase";

type Coverage={
 id:string; competition_id:string|null; competition_name:string; country:string|null; tier_label:string|null;
 priority:number; target_players:number; target_clubs:number; target_seasons:number;
 current_players:number; current_clubs:number; current_seasons:number; status:string; data_scope:string[]; notes:string|null;
};

export default function CoveragePage(){
 const [authorized,setAuthorized]=useState(false),[loading,setLoading]=useState(true),[rows,setRows]=useState<Coverage[]>([]);
 const [status,setStatus]=useState("all"),[busy,setBusy]=useState<string|null>(null),[error,setError]=useState(""),[message,setMessage]=useState("");
 const load=async()=>{
  const {data:u}=await supabase.auth.getUser(); if(!u.user){setLoading(false);return}
  const {data:a}=await supabase.from("wfm_admins").select("user_id").eq("user_id",u.user.id).maybeSingle();
  setAuthorized(!!a); if(!a){setLoading(false);return}
  const {data,e}=await supabase.from("wfm_competition_coverage").select("*").order("priority",{ascending:true}).order("country",{ascending:true}).order("competition_name",{ascending:true});
  if(e)setError(e.message); setRows((data??[]) as Coverage[]); setLoading(false);
 };
 useEffect(()=>{void load()},[]);
 const filtered=useMemo(()=>status==="all"?rows:rows.filter(r=>r.status===status),[rows,status]);
 const totals=useMemo(()=>rows.reduce((a,r)=>({players:a.players+r.current_players,clubs:a.clubs+r.current_clubs,targetPlayers:a.targetPlayers+r.target_players,targetClubs:a.targetClubs+r.target_clubs}),{players:0,clubs:0,targetPlayers:0,targetClubs:0}),[rows]);
 const setCoverageStatus=async(id:string,next:string)=>{
  setBusy(id);setError("");setMessage("");
  const {error:e}=await supabase.from("wfm_competition_coverage").update({status:next}).eq("id",id);
  if(e)setError(e.message);else{setMessage("Coverage status updated.");await load()} setBusy(null);
 };
 if(loading)return <main className="account-page"><div className="account-card">Loading competition coverage…</div></main>;
 if(!authorized)return <main className="account-page"><div className="account-card"><div className="eyebrow">ADMIN</div><h1>Access restricted</h1><p className="account-muted">This workspace is limited to WFM administrators.</p></div></main>;
 return <main className="account-page"><section className="account-card">
  <div className="account-card-top"><div><div className="eyebrow">WFM ADMIN · PHASE 9 · M3</div><h1>Core league expansion</h1><p>Track league coverage targets before importing players, clubs, contracts and performance data.</p></div><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><Link href="/admin/data" className="outline">Data administration</Link><Link href="/admin/data/review" className="outline">Review queue</Link></div></div>
  {error&&<div className="account-message account-error">{error}</div>}{message&&<div className="account-message account-success">{message}</div>}
  <section className="settings-section"><div className="settings-section-heading"><span>PROGRAM TARGETS</span><h2>Coverage plan</h2></div>
   <div className="club-workspace-grid"><div className="account-membership-row"><div><strong>{rows.length}</strong><small>Tracked competitions</small></div></div><div className="account-membership-row"><div><strong>{totals.players}/{totals.targetPlayers}</strong><small>Players covered / target</small></div></div><div className="account-membership-row"><div><strong>{totals.clubs}/{totals.targetClubs}</strong><small>Clubs covered / target</small></div></div></div>
  </section>
  <section className="settings-section" style={{marginTop:24}}><div className="settings-section-heading"><span>LEAGUES</span><h2>{filtered.length} competitions</h2></div>
   <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>{["all","planned","in_progress","active","paused","complete"].map(s=><button key={s} type="button" className="outline" onClick={()=>setStatus(s)}>{s.replaceAll("_"," ")}</button>)}</div>
   {filtered.length?filtered.map(r=><div key={r.id} className="account-membership-row"><div style={{minWidth:0}}><strong>{r.competition_name}</strong><small>{r.country||"—"} · {r.tier_label||"Unclassified"} · Priority {r.priority}</small><small>Players {r.current_players}/{r.target_players} · Clubs {r.current_clubs}/{r.target_clubs} · Seasons {r.current_seasons}/{r.target_seasons}</small><small>Scope: {r.data_scope.join(", ")}</small></div><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><span className="account-status-pill">{r.status}</span>{r.status==="planned"&&<button className="outline" disabled={busy===r.id} onClick={()=>void setCoverageStatus(r.id,"in_progress")}>Start</button>}{r.status==="in_progress"&&<button className="outline" disabled={busy===r.id} onClick={()=>void setCoverageStatus(r.id,"active")}>Activate</button>}{r.status==="active"&&<button className="outline" disabled={busy===r.id} onClick={()=>void setCoverageStatus(r.id,"complete")}>Complete</button>}</div></div>):<p className="account-muted">No competitions match this status.</p>}
  </section>
 </section></main>;
}
