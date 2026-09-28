"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

type Coverage={id:string;competition_id:string|null;competition_name:string;country:string|null;tier_label:string|null;priority:number;target_players:number;target_clubs:number;target_seasons:number;current_players:number;current_clubs:number;current_seasons:number;status:string;data_scope:string[];notes:string|null};
type Club={id:string;name:string;country:string|null;competition_id:string|null;logo_url:string|null;organization_type:string|null};

export default function CompetitionCoverageDetailPage(){
 const params=useParams<{competitionId:string}>(),competitionId=params.competitionId;
 const [authorized,setAuthorized]=useState(false),[loading,setLoading]=useState(true),[coverage,setCoverage]=useState<Coverage|null>(null),[clubs,setClubs]=useState<Club[]>([]),[playerCounts,setPlayerCounts]=useState<Record<string,number>>({}),[mappingCounts,setMappingCounts]=useState<Record<string,number>>({}),[seasonCount,setSeasonCount]=useState(0),[error,setError]=useState("");
 const load=async()=>{
  setLoading(true);setError("");
  const {data:u}=await supabase.auth.getUser();if(!u.user){setLoading(false);return}
  const {data:a}=await supabase.from("wfm_admins").select("user_id").eq("user_id",u.user.id).maybeSingle();setAuthorized(!!a);if(!a){setLoading(false);return}
  const {data:c,error:e}=await supabase.from("wfm_competition_coverage").select("*").eq("competition_id",competitionId).maybeSingle();
  if(e||!c){setError(e?.message||"Coverage record not found.");setLoading(false);return}
  setCoverage(c as Coverage);
  const [{data:clubRows},{data:seasonRows}]=await Promise.all([
   supabase.from("clubs").select("id,name,country,competition_id,logo_url,organization_type").eq("competition_id",competitionId).order("name",{ascending:true}),
   supabase.from("competition_seasons").select("id,season_id,active").eq("competition_id",competitionId)
  ]);
  const nextClubs=(clubRows??[]) as Club[],seasons=(seasonRows??[]) as {id:string;season_id:string;active:boolean}[];
  setClubs(nextClubs);setSeasonCount(seasons.length);
  const nextPlayers:Record<string,number>={},clubIds=nextClubs.map(c=>c.id),seasonIds=seasons.map(s=>s.id);
  if(clubIds.length&&seasonIds.length){
   const {data:cc}=await supabase.from("club_competitions").select("id,club_id,competition_season_id").in("club_id",clubIds).in("competition_season_id",seasonIds);
   const rows=(cc??[]) as {id:string;club_id:string;competition_season_id:string}[],ccIds=rows.map(x=>x.id);
   if(ccIds.length){
    const {data:pl}=await supabase.from("player_competitions").select("player_id,club_competition_id").in("club_competition_id",ccIds);
    const sets=new Map<string,Set<string>>();(pl??[] as {player_id:string;club_competition_id:string}[]).forEach(p=>{const ccRow=rows.find(x=>x.id===p.club_competition_id);if(ccRow){if(!sets.has(ccRow.club_id))sets.set(ccRow.club_id,new Set());sets.get(ccRow.club_id)!.add(p.player_id)}});
    sets.forEach((s,id)=>{nextPlayers[id]=s.size});
   }
  }
  setPlayerCounts(nextPlayers);
  const nextMappings:Record<string,number>={};
  if(clubIds.length){const {data:m}=await supabase.from("provider_club_mappings").select("id,club_id").in("club_id",clubIds);(m??[] as {id:string;club_id:string}[]).forEach(x=>{nextMappings[x.club_id]=(nextMappings[x.club_id]??0)+1})}
  setMappingCounts(nextMappings);setLoading(false);
 };
 useEffect(()=>{if(competitionId)void load()},[competitionId]);
 const stats=useMemo(()=>{const withPlayers=clubs.filter(c=>(playerCounts[c.id]??0)>0).length,withMapping=clubs.filter(c=>(mappingCounts[c.id]??0)>0).length;return{withPlayers,withoutPlayers:clubs.length-withPlayers,withMapping,withoutMapping:clubs.length-withMapping}},[clubs,playerCounts,mappingCounts]);
 if(loading)return <main className="players-scout-page"><div className="panel"><p>Loading competition inventory…</p></div></main>;
 if(!authorized)return <main className="players-scout-page"><div className="panel"><p>Admin access required.</p></div></main>;
 if(!coverage)return <main className="players-scout-page"><div className="panel"><p>{error||"Competition not found."}</p></div></main>;
 return <main className="players-scout-page"><div className="panel">
  <div className="panel-header"><div><div className="eyebrow">PHASE 9 · DATA SCALE · CLUB INVENTORY</div><h1>{coverage.competition_name}</h1><p>{coverage.country||"—"} · {coverage.tier_label||"Tier not set"} · Priority P{coverage.priority}</p></div><div className="actions"><Link href="/admin/data/coverage" className="outline">← Coverage</Link><Link href="/admin/data/review" className="outline">Review queue</Link><Link href="/admin/data" className="outline">Data administration</Link></div></div>
  {error&&<div className="alert error">{error}</div>}
  <div className="coverage-summary"><div><strong>{clubs.length}</strong><span>Clubs in WFM</span></div><div><strong>{coverage.target_clubs}</strong><span>Club target</span></div><div><strong>{seasonCount}</strong><span>Seasons tracked</span></div><div><strong>{stats.withPlayers}</strong><span>Clubs with players</span></div></div>
  <div className="panel" style={{marginTop:20}}><div className="panel-header"><div><h2>Club inventory</h2><p>Current WFM clubs linked directly to this competition.</p></div></div>
   <div className="table"><div className="thead"><span>Club</span><span>Country</span><span>Players</span><span>Provider mapping</span><span>Data status</span></div>
    {clubs.map(club=>{const players=playerCounts[club.id]??0,mappings=mappingCounts[club.id]??0;return <div className="row" key={club.id}><span><strong>{club.name}</strong><small>{club.organization_type||"Club"}</small></span><span>{club.country||"—"}</span><span>{players}</span><span>{mappings>0?mappings+" mapping"+(mappings===1?"":"s"):"Missing"}</span><span>{players>0&&mappings>0?"Covered":players>0?"Needs mapping":mappings>0?"Needs players":"Needs data"}</span></div>})}
    {!clubs.length&&<div className="row"><span>No clubs are currently linked to this competition.</span><span>—</span><span>0</span><span>Missing</span><span>Needs data</span></div>}
   </div>
  </div>
  <div className="coverage-summary" style={{marginTop:20}}><div><strong>{stats.withMapping}</strong><span>Clubs with provider mapping</span></div><div><strong>{stats.withoutMapping}</strong><span>Clubs missing mapping</span></div><div><strong>{stats.withPlayers}</strong><span>Clubs with player links</span></div><div><strong>{stats.withoutPlayers}</strong><span>Clubs missing player links</span></div></div>
  <div className="panel" style={{marginTop:20}}><h2>Coverage scope</h2><p>{coverage.data_scope?.length?coverage.data_scope.join(" · "):"No scope defined."}</p>{coverage.notes&&<p>{coverage.notes}</p>}<p>Use Data Administration and the Review Queue to import and validate missing club or player records. This page does not publish records directly.</p></div>
 </div></main>;
}