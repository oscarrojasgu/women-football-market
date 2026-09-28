"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type Row={
 competition_season_id:string; competition_id:string; competition_name:string;
 season_id:string; season_key:string; roster_players:number; players_with_stats:number;
 players_with_contracts:number; players_with_salary:number; players_with_market_value:number;
 players_with_transfers:number; fully_historic:number;
};

type Snapshot={id:string;player_id:string;competition_season_id:string|null;snapshot_type:string;status:string;observed_at:string;season_label:string|null;confidence:string;created_at:string};

export default function HistoricalDataPage(){
 const [authorized,setAuthorized]=useState(false),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false);
 const [rows,setRows]=useState<Row[]>([]),[snapshots,setSnapshots]=useState<Snapshot[]>([]);
 const [competition,setCompetition]=useState("all"),[season,setSeason]=useState("all"),[gap,setGap]=useState("gaps");
 const [error,setError]=useState(""),[message,setMessage]=useState("");

 const load=async()=>{
  const {data:u}=await supabase.auth.getUser();
  if(!u.user){setLoading(false);return}
  const {data:a}=await supabase.from("wfm_admins").select("user_id").eq("user_id",u.user.id).maybeSingle();
  setAuthorized(!!a);if(!a){setLoading(false);return}
  const [{data:r,error:re},{data:s,error:se}]=await Promise.all([
   supabase.rpc("wfm_reconcile_historical_player_coverage"),
   supabase.from("wfm_player_history_snapshots").select("id,player_id,competition_season_id,snapshot_type,status,observed_at,season_label,confidence,created_at").order("created_at",{ascending:false}).limit(500)
  ]);
  if(re)setError(re.message);else setRows((r||[]) as Row[]);
  if(se)setError(se.message);else setSnapshots((s||[]) as Snapshot[]);
  setLoading(false);
 };

 useEffect(()=>{void load()},[]);

 const refresh=async()=>{
  setRefreshing(true);setError("");setMessage("");
  await load();setMessage("Historical coverage reconciled from current WFM records.");setRefreshing(false);
 };

 const competitions=useMemo(()=>[...new Set(rows.map(r=>r.competition_name))].sort(),[rows]);
 const seasons=useMemo(()=>[...new Set(rows.map(r=>r.season_key))].sort().reverse(),[rows]);
 const filtered=useMemo(()=>rows.filter(r=>
  (competition==="all"||r.competition_name===competition)&&
  (season==="all"||r.season_key===season)&&
  (gap==="all"||r.roster_players===0||r.players_with_stats<r.roster_players||r.players_with_contracts<r.roster_players||r.players_with_salary<r.roster_players||r.players_with_market_value<r.roster_players||r.players_with_transfers<r.roster_players||r.fully_historic<r.roster_players)
 ),[rows,competition,season,gap]);

 const totals=useMemo(()=>rows.reduce((a,r)=>({
  roster:a.roster+r.roster_players,stats:a.stats+r.players_with_stats,contracts:a.contracts+r.players_with_contracts,
  salary:a.salary+r.players_with_salary,value:a.value+r.players_with_market_value,transfers:a.transfers+r.players_with_transfers,
  historic:a.historic+r.fully_historic
 }),{roster:0,stats:0,contracts:0,salary:0,value:0,transfers:0,historic:0}),[rows]);

 const pct=(n:number,d:number)=>d?Math.min(100,Math.round(n/d*100)):0;
 const gapCount=(r:Row)=>[
  r.roster_players===0?"roster":null,r.players_with_stats<r.roster_players?"stats":null,
  r.players_with_contracts<r.roster_players?"contracts":null,r.players_with_salary<r.roster_players?"salary":null,
  r.players_with_market_value<r.roster_players?"value":null,r.players_with_transfers<r.roster_players?"transfers":null
 ].filter(Boolean) as string[];

 if(loading)return <main className="players-scout-page"><div className="panel"><p>Loading historical data…</p></div></main>;
 if(!authorized)return <main className="players-scout-page"><div className="panel"><p>Admin access required.</p></div></main>;

 return <main className="players-scout-page"><div className="panel">
  <div className="panel-header"><div><div className="eyebrow">PHASE 9 · M5 HISTORICAL DATA</div><h1>Historical Data</h1><p>Reconcile season-by-season history and identify missing intelligence before publishing historical records.</p></div>
   <div className="actions"><Link href="/admin/data" className="outline">Data administration</Link><Link href="/admin/data/coverage" className="outline">League coverage</Link><Link href="/admin/data/players" className="outline">Player coverage</Link><button type="button" className="outline" disabled={refreshing} onClick={()=>void refresh()}>{refreshing?"Refreshing…":"Reconcile history"}</button></div>
  </div>
  {error&&<div className="alert error">{error}</div>}{message&&<div className="alert success">{message}</div>}
  <div className="coverage-summary">
   <div><strong>{rows.length}</strong><span>Competition-seasons</span></div>
   <div><strong>{totals.roster}</strong><span>Roster records</span></div>
   <div><strong>{totals.historic}</strong><span>Fully historic</span></div>
   <div><strong>{snapshots.length}</strong><span>History snapshots</span></div>
  </div>
  <div className="filter-row">
   <label>Competition<select value={competition} onChange={e=>setCompetition(e.target.value)}><option value="all">All competitions</option>{competitions.map(x=><option key={x}>{x}</option>)}</select></label>
   <label>Season<select value={season} onChange={e=>setSeason(e.target.value)}><option value="all">All seasons</option>{seasons.map(x=><option key={x}>{x}</option>)}</select></label>
   <label>View<select value={gap} onChange={e=>setGap(e.target.value)}><option value="gaps">Only gaps</option><option value="all">All records</option></select></label>
  </div>
  <div className="table">
   <div className="thead"><span>Competition</span><span>Season</span><span>Roster</span><span>Stats</span><span>Contracts</span><span>Salary</span><span>Value</span><span>Transfers</span><span>Historic</span><span>Gaps</span></div>
   {filtered.map(r=><div className="row" key={r.competition_season_id}>
    <span><strong>{r.competition_name}</strong></span><span>{r.season_key}</span><span>{r.roster_players}</span>
    <span>{r.players_with_stats}<small>{pct(r.players_with_stats,r.roster_players)}%</small></span>
    <span>{r.players_with_contracts}<small>{pct(r.players_with_contracts,r.roster_players)}%</small></span>
    <span>{r.players_with_salary}<small>{pct(r.players_with_salary,r.roster_players)}%</small></span>
    <span>{r.players_with_market_value}<small>{pct(r.players_with_market_value,r.roster_players)}%</small></span>
    <span>{r.players_with_transfers}<small>{pct(r.players_with_transfers,r.roster_players)}%</small></span>
    <span><strong>{r.fully_historic}</strong><small>{pct(r.fully_historic,r.roster_players)}%</small></span>
    <span>{gapCount(r).join(", ")||"Complete"}</span>
   </div>)}
  </div>
  <div style={{marginTop:18}} className="account-muted">
   <strong>Current reconciliation:</strong> {totals.stats} stats · {totals.contracts} contracts · {totals.salary} salaries · {totals.value} market values · {totals.transfers} transfers across {rows.length} competition-seasons.
   <br/>Historical completeness is measured against players linked to each WFM club competition and season. Existing records are never overwritten by this dashboard.
  </div>
 </div></main>;
}
