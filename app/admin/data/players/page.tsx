"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type Row={competition_id:string;competition_name:string;country:string;priority:number;target_players:number;current_players:number;identity_complete:number;provider_mapped:number;contract_complete:number;salary_complete:number;market_value_complete:number;stats_complete:number;fully_profiled:number};

export default function PlayerCoveragePage(){
 const [authorized,setAuthorized]=useState(false),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[rows,setRows]=useState<Row[]>([]);
 const [priority,setPriority]=useState("all"),[error,setError]=useState(""),[message,setMessage]=useState("");
 const load=async()=>{
  const {data:u}=await supabase.auth.getUser();if(!u.user){setLoading(false);return}
  const {data:a}=await supabase.from("wfm_admins").select("user_id").eq("user_id",u.user.id).maybeSingle();setAuthorized(!!a);if(!a){setLoading(false);return}
  const {data,error:e}=await supabase.rpc("wfm_reconcile_player_coverage");
  if(e)setError(e.message);else setRows((data||[]) as Row[]);
  setLoading(false);
 };
 useEffect(()=>{void load()},[]);
 const refresh=async()=>{setRefreshing(true);setError("");setMessage("");await load();setMessage("Player coverage reconciled from current WFM records.");setRefreshing(false)};
 const filtered=useMemo(()=>priority==="all"?rows:rows.filter(r=>String(r.priority)===priority),[rows,priority]);
 const totals=useMemo(()=>rows.reduce((a,r)=>({target:a.target+r.target_players,current:a.current+r.current_players,identity:a.identity+r.identity_complete,mapped:a.mapped+r.provider_mapped,contract:a.contract+r.contract_complete,salary:a.salary+r.salary_complete,mv:a.mv+r.market_value_complete,stats:a.stats+r.stats_complete,profiled:a.profiled+r.fully_profiled}),{target:0,current:0,identity:0,mapped:0,contract:0,salary:0,mv:0,stats:0,profiled:0}),[rows]);
 const pct=(n:number,d:number)=>d?Math.min(100,Math.round(n/d*100)):0;
 if(loading)return <main className="players-scout-page"><div className="panel"><p>Loading player coverage…</p></div></main>;
 if(!authorized)return <main className="players-scout-page"><div className="panel"><p>Admin access required.</p></div></main>;
 return <main className="players-scout-page"><div className="panel">
  <div className="panel-header"><div><div className="eyebrow">PHASE 9 · M4 PLAYER COVERAGE</div><h1>Player Coverage</h1><p>Track roster population and profile completeness by priority league before declaring coverage complete.</p></div><div className="actions"><Link href="/admin/data/coverage" className="outline">League coverage</Link><Link href="/admin/data" className="outline">Data administration</Link><button type="button" className="outline" disabled={refreshing} onClick={()=>void refresh()}>{refreshing?"Refreshing…":"Refresh coverage"}</button></div></div>
  {error&&<div className="alert error">{error}</div>}{message&&<div className="alert success">{message}</div>}
  <div className="coverage-summary"><div><strong>{totals.current}</strong><span>Players linked</span></div><div><strong>{pct(totals.current,totals.target)}%</strong><span>Target coverage</span></div><div><strong>{totals.identity}</strong><span>Identity complete</span></div><div><strong>{totals.profiled}</strong><span>Fully profiled</span></div></div>
  <div className="filter-row"><label>Priority<select value={priority} onChange={e=>setPriority(e.target.value)}><option value="all">All</option><option value="1">Priority 1</option><option value="2">Priority 2</option><option value="3">Priority 3</option></select></label></div>
  <div className="table"><div className="thead"><span>Priority</span><span>Competition</span><span>Roster</span><span>Identity</span><span>Mapped</span><span>Contract</span><span>Salary</span><span>Value</span><span>Stats</span><span>Profile</span></div>
   {filtered.map(r=><div className="row" key={r.competition_id}><span>P{r.priority}</span><span><strong>{r.competition_name}</strong><small>{r.country}</small></span><span>{r.current_players}/{r.target_players}<small>{pct(r.current_players,r.target_players)}%</small></span><span>{r.identity_complete}<small>{pct(r.identity_complete,r.current_players)}%</small></span><span>{r.provider_mapped}<small>{pct(r.provider_mapped,r.current_players)}%</small></span><span>{r.contract_complete}<small>{pct(r.contract_complete,r.current_players)}%</small></span><span>{r.salary_complete}<small>{pct(r.salary_complete,r.current_players)}%</small></span><span>{r.market_value_complete}<small>{pct(r.market_value_complete,r.current_players)}%</small></span><span>{r.stats_complete}<small>{pct(r.stats_complete,r.current_players)}%</small></span><span><strong>{r.fully_profiled}</strong><small>{pct(r.fully_profiled,r.current_players)}%</small></span></div>)}
  </div>
  <div style={{marginTop:18}}><p className="account-muted">A player is counted only when linked through a WFM club competition and season. “Fully profiled” requires core identity plus a provider mapping and at least one downstream intelligence record (contract, salary, market value, or stats).</p></div>
 </div></main>;
}
