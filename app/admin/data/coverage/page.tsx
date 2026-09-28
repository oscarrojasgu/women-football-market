"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type Coverage={
 id:string; competition_id:string|null; competition_name:string; country:string|null; tier_label:string|null;
 priority:number; target_players:number; target_clubs:number; target_seasons:number;
 current_players:number; current_clubs:number; current_seasons:number; status:string; data_scope:string[]; notes:string|null;
};

export default function CoveragePage(){
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

