"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { useWfmT } from '../../lib/use-wfm-t'

type Coverage={
 id:string; competition_id:string|null; competition_name:string; country:string|null; tier_label:string|null;
 priority:number; target_players:number; target_clubs:number; target_seasons:number;
 current_players:number; current_clubs:number; current_seasons:number; status:string; data_scope:string[]; notes:string|null;
};

export default function CoveragePage(){
 const t=useWfmT()
 const [authorized,setAuthorized]=useState(false),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[rows,setRows]=useState<Coverage[]>([]);
 const [status,setStatus]=useState("all"),[busy,setBusy]=useState<string|null>(null),[error,setError]=useState(""),[message,setMessage]=useState("");
 const load=async()=>{
  const {data:u}=await supabase.auth.getUser(); if(!u.user){setLoading(false);return}
  const {data:a}=await supabase.from("wfm_admins").select("user_id").eq("user_id",u.user.id).maybeSingle();
  setAuthorized(!!a); if(!a){setLoading(false);return}
  const {data,error:e}=await supabase.from("wfm_competition_coverage").select("*").order("priority",{ascending:true}).order("country",{ascending:true}).order("competition_name",{ascending:true});
  if(e){setError(e.message);setRows([]);setLoading(false);return}
  const coverage=(data??[]) as Coverage[];
  const competitionIds=coverage.map(r=>r.competition_id).filter((id):id is string=>!!id);
  if(competitionIds.length){
   const {data:clubs}=await supabase.from("clubs").select("id,competition_id").in("competition_id",competitionIds);
   const clubIds=(clubs??[]).map((club:{id:string})=>club.id);
   const [{data:seasons},{data:clubCompetitions}]=await Promise.all([
    supabase.from("competition_seasons").select("id,competition_id").in("competition_id",competitionIds),
    clubIds.length?supabase.from("club_competitions").select("id,club_id,competition_season_id").in("club_id",clubIds):Promise.resolve({data:[]})
   ]);
   const clubCounts=new Map<string,number>();
   (clubs??[]).forEach((club:{competition_id:string|null})=>{if(club.competition_id)clubCounts.set(club.competition_id,(clubCounts.get(club.competition_id)??0)+1)});
   const seasonCounts=new Map<string,number>();
   const seasonToCompetition=new Map<string,string>();
   (seasons??[]).forEach((season:{id:string;competition_id:string})=>{seasonCounts.set(season.competition_id,(seasonCounts.get(season.competition_id)??0)+1);seasonToCompetition.set(season.id,season.competition_id)});
   const clubCompetitionToCompetition=new Map<string,string>();
   (clubCompetitions??[]).forEach((cc:{id:string;competition_season_id:string})=>{const competitionId=seasonToCompetition.get(cc.competition_season_id);if(competitionId)clubCompetitionToCompetition.set(cc.id,competitionId)});
   const playerCounts=new Map<string,Set<string>>();
   const ccIds=[...clubCompetitionToCompetition.keys()];
   if(ccIds.length){
    const {data:playerLinks}=await supabase.from("player_competitions").select("player_id,club_competition_id").in("club_competition_id",ccIds);
    (playerLinks??[]).forEach((p:{player_id:string;club_competition_id:string})=>{const competitionId=clubCompetitionToCompetition.get(p.club_competition_id);if(competitionId){if(!playerCounts.has(competitionId))playerCounts.set(competitionId,new Set());playerCounts.get(competitionId)!.add(p.player_id)}});
   }
   setRows(coverage.map(r=>r.competition_id?{...r,current_clubs:clubCounts.get(r.competition_id)??0,current_seasons:seasonCounts.get(r.competition_id)??0,current_players:playerCounts.get(r.competition_id)?.size??0}:r));
  }else setRows(coverage);

  setLoading(false);
 };
 const refreshCoverage=async()=>{setRefreshing(true);setError("");setMessage("");await load();setMessage("Coverage counts refreshed from current WFM records.");setRefreshing(false)};
 const setCoverageStatus=async(id:string,next:string)=>{
  setBusy(id);setError("");setMessage("");
  const {error:e}=await supabase.from("wfm_competition_coverage").update({status:next}).eq("id",id);
  if(e)setError(e.message);else{setMessage("Coverage status updated.");await load()}
  setBusy(null);
 };
 useEffect(()=>{void load()},[]);
 const filtered=useMemo(()=>status==="all"?rows:rows.filter(r=>r.status===status),[rows,status]);
 const completion=(r:Coverage)=>({clubs:r.target_clubs>0?Math.min(100,Math.round(r.current_clubs/r.target_clubs*100)):0,players:r.target_players>0?Math.min(100,Math.round(r.current_players/r.target_players*100)):0,seasons:r.target_seasons>0?Math.min(100,Math.round(r.current_seasons/r.target_seasons*100)):0});
 const readyToComplete=(r:Coverage)=>r.current_clubs>=r.target_clubs&&r.current_players>=r.target_players&&r.current_seasons>=r.target_seasons;
 if(loading)return <main className="players-scout-page"><div className="panel"><p>{t("Loading coverage…")}</p></div></main>;
 if(!authorized)return <main className="players-scout-page"><div className="panel"><p>{t("Admin access required.")}</p></div></main>;
 return <main className="players-scout-page">
  <div className="panel">
   <div className="panel-header"><div><div className="eyebrow">{t("PHASE 9 · DATA SCALE")}</div><h1>{t("Competition Coverage")}</h1><p>{t("Track league-by-league coverage targets and current WFM inventory.")}</p></div><div className="actions"><Link href="/admin/data" className="outline">{t("Data administration")}</Link><Link href="/admin/data/review" className="outline">{t("Review queue")}</Link><Link href="/admin/data/players" className="outline">{t("Player coverage")}</Link><button type="button" className="outline" disabled={refreshing} onClick={()=>void refreshCoverage()}>{refreshing?"Refreshing…":"Refresh counts"}</button></div></div>
   {error&&<div className="alert error">{error}</div>}{message&&<div className="alert success">{message}</div>}
   <div className="coverage-summary"><div><strong>{rows.length}</strong><span>{t("Tracked leagues")}</span></div><div><strong>{rows.reduce((n,r)=>n+r.current_players,0)}</strong><span>{t("Players")}</span></div><div><strong>{rows.reduce((n,r)=>n+r.current_clubs,0)}</strong><span>{t("Clubs")}</span></div><div><strong>{rows.reduce((n,r)=>n+r.current_seasons,0)}</strong><span>{t("Seasons")}</span></div></div>
   <div className="filter-row"><label>{t("Status")}<select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">{t("All")}</option><option value="planned">{t("Planned")}</option><option value="in_progress">{t("In progress")}</option><option value="active">{t("Active")}</option><option value="complete">{t("Complete")}</option><option value="paused">{t("Paused")}</option></select></label></div>
   <div className="table"><div className="thead"><span>{t("Priority")}</span><span>{t("Competition")}</span><span>{t("Country")}</span><span>{t("Targets")}</span><span>{t("Current")}</span><span>{t("Status")}</span><span>{t("Action")}</span></div>
    {filtered.map(r=><div className="row" key={r.id}><span>P{r.priority}</span><span><strong>{r.competition_name}</strong><small>{r.tier_label||"—"}</small></span><span>{r.country||"—"}</span><span>{r.target_players} players · {r.target_clubs} clubs · {r.target_seasons} seasons</span><span>{r.current_players} players · {r.current_clubs} clubs · {r.current_seasons} seasons · {Math.min(completion(r).clubs,completion(r).players,completion(r).seasons)}%</span><span>{r.status}</span><span><Link href={`/admin/data/coverage/${r.competition_id}`} className="outline">{t("Inventory")}</Link>{r.status==="planned"&&<button disabled={busy===r.id} onClick={()=>void setCoverageStatus(r.id,"in_progress")}>{t("Start")}</button>}{r.status==="in_progress"&&<button disabled={busy===r.id} onClick={()=>void setCoverageStatus(r.id,"active")}>{t("Activate")}</button>}{r.status==="active"&&<button disabled={busy===r.id||!readyToComplete(r)} title={readyToComplete(r)?"Mark complete":"Targets not yet met"} onClick={()=>void setCoverageStatus(r.id,"complete")}>{t("Complete")}</button>}</span></div>)}
   </div>
  </div>
 </main>;
}
