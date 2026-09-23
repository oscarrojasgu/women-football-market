"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Criteria={positions:string[];roles:string;age_min:number|null;age_max:number|null;nationalities:string;competitions:string[];contract_status:string;salary_min_usd:number|null;salary_max_usd:number|null;market_value_min_usd:number|null;market_value_max_usd:number|null;min_minutes:number|null;goals_per90_min:number|null;assists_per90_min:number|null;xg_per90_min:number|null;xa_per90_min:number|null;chances_created_per90_min:number|null;key_passes_per90_min:number|null;tackles_per90_min:number|null;interceptions_per90_min:number|null;progressive_carries_per90_min:number|null;global_percentile_min:number|null;priorities:string};
type Profile={id:string;name:string;description:string|null;criteria:Criteria};
type Player={id:string;full_name:string;date_of_birth:string|null;nationality:string|null;position:string|null;secondary_position:string|null};
type Intel={player_id:string;season:string;minutes:number|null;goals_per90:number|null;assists_per90:number|null;xg_per90:number|null;xa_per90:number|null;chances_created_per90:number|null;key_passes_per90:number|null;tackles_per90:number|null;interceptions_per90:number|null;progressive_carries_per90:number|null;league:string|null;club_name:string|null};
type Contract={player_id:string;annual_salary_usd:number|null;status:string|null;end_date:string|null;club:any};
type Value={player_id:string;market_value_usd:number|null;valuation_date:string};
type Participation={player_id:string;competition_id:string|null;competition_name:string|null};

const emptyCriteria:Criteria={positions:[],roles:"",age_min:null,age_max:null,nationalities:"",competitions:[],contract_status:"any",salary_min_usd:null,salary_max_usd:null,market_value_min_usd:null,market_value_max_usd:null,min_minutes:null,goals_per90_min:null,assists_per90_min:null,xg_per90_min:null,xa_per90_min:null,chances_created_per90_min:null,key_passes_per90_min:null,tackles_per90_min:null,interceptions_per90_min:null,progressive_carries_per90_min:null,global_percentile_min:null,priorities:""};

const normalize=(v:any):Criteria=>({...emptyCriteria,...(v&&typeof v==="object"?v:{}),positions:Array.isArray(v?.positions)?v.positions:[],competitions:Array.isArray(v?.competitions)?v.competitions:[]});
const age=(dob:string|null)=>{if(!dob)return null;const d=new Date(dob+"T00:00:00"),t=new Date();let a=t.getFullYear()-d.getFullYear();if(t.getMonth()<d.getMonth()||(t.getMonth()===d.getMonth()&&t.getDate()<d.getDate()))a--;return a};
const startYear=(s:string)=>{const m=s.match(/(19|20)\d{2}/);return m?Number(m[0]):0};
const money=(v:number|null)=>v==null?"—":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0,notation:"compact"}).format(v);

function positionMatch(p:Player, wanted:string[]){if(!wanted.length)return true;const values=[p.position,p.secondary_position].filter(Boolean).map(String);return wanted.some(w=>{if(values.includes(w))return true;if(w==="FB"&&values.some(x=>["LB","RB","LWB","RWB"].includes(x)))return true;if(w==="WB"&&values.some(x=>["LWB","RWB"].includes(x)))return true;if(w==="W"&&values.some(x=>["LW","RW","LM","RM"].includes(x)))return true;if(w==="WM"&&values.some(x=>["LM","RM"].includes(x)))return true;if(w==="DM"&&values.some(x=>["CDM","DM"].includes(x)))return true;if(w==="CM"&&values.some(x=>["CM","MC"].includes(x)))return true;if(w==="AM"&&values.some(x=>["CAM","AM"].includes(x)))return true;if(w==="ST"&&values.some(x=>["ST","CF"].includes(x)))return true;return false})}

export default function GlobalDiscoveryPage(){
 const params=useParams<{id:string}>();const id=Array.isArray(params?.id)?params.id[0]:params?.id;
 const [profile,setProfile]=useState<Profile|null>(null);const [players,setPlayers]=useState<Player[]>([]);const [intel,setIntel]=useState<Intel[]>([]);const [contracts,setContracts]=useState<Contract[]>([]);const [values,setValues]=useState<Value[]>([]);const [participations,setParticipations]=useState<Participation[]>([]);const [loading,setLoading]=useState(true);const [message,setMessage]=useState("");

 useEffect(()=>{if(!id)return;let mounted=true;(async()=>{const [pr,pl,si,co,mv,pa]=await Promise.all([
  supabase.from("scouting_profiles").select("id,name,description,criteria").eq("id",id).single(),
  supabase.from("players").select("id,full_name,date_of_birth,nationality,position,secondary_position").order("full_name"),
  supabase.from("player_season_intelligence").select("player_id,season,minutes,goals_per90,assists_per90,xg_per90,xa_per90,chances_created_per90,key_passes_per90,tackles_per90,interceptions_per90,progressive_carries_per90,league,club_name"),
  supabase.from("contracts").select("player_id,annual_salary_usd,status,end_date,club:clubs(name)"),
  supabase.from("market_values").select("player_id,market_value_usd,valuation_date").order("valuation_date",{ascending:false}),
  supabase.from("player_competitions").select("player_id,club_competition:club_competitions(competition_season:competition_seasons(competition:competitions(id,canonical_name)))")
 ]);if(!mounted)return;if(pr.error){setMessage(pr.error.message);setLoading(false);return}
  setProfile({...pr.data,criteria:normalize(pr.data.criteria)} as Profile);setPlayers((pl.data||[]) as Player[]);setIntel((si.data||[]) as Intel[]);setContracts((co.data||[]) as Contract[]);setValues((mv.data||[]) as Value[]);
  const normalized=(pa.data||[]).map((r:any)=>{const cc=Array.isArray(r.club_competition)?r.club_competition[0]:r.club_competition;const cs=Array.isArray(cc?.competition_season)?cc.competition_season[0]:cc?.competition_season;const comp=Array.isArray(cs?.competition)?cs.competition[0]:cs?.competition;return {player_id:r.player_id,competition_id:comp?.id||null,competition_name:comp?.canonical_name||null}});setParticipations(normalized);setLoading(false);
 })();return()=>{mounted=false}},[id]);

 const latestIntel=useMemo(()=>{const m=new Map<string,Intel>();for(const r of intel){const c=m.get(r.player_id);if(!c||startYear(r.season)>startYear(c.season))m.set(r.player_id,r)}return m},[intel]);
 const latestValue=useMemo(()=>{const m=new Map<string,Value>();for(const r of values)if(!m.has(r.player_id))m.set(r.player_id,r);return m},[values]);
 const contractMap=useMemo(()=>{const m=new Map<string,Contract>();for(const r of contracts){const c=m.get(r.player_id);if(!c||(r.status==="active"&&c.status!=="active")||(r.end_date||"")>(c.end_date||""))m.set(r.player_id,r)}return m},[contracts]);
 const participationMap=useMemo(()=>{const m=new Map<string,Participation[]>();for(const r of participations)m.set(r.player_id,[...(m.get(r.player_id)||[]),r]);return m},[participations]);

 const candidates=useMemo(()=>{if(!profile)return[];const c=profile.criteria;const now=new Date();const cutoff=new Date(now);cutoff.setDate(cutoff.getDate()+180);
  return players.filter(p=>{const a=age(p.date_of_birth);if(a!==null&&c.age_min!==null&&a<c.age_min)return false;if(a!==null&&c.age_max!==null&&a>c.age_max)return false;if(!positionMatch(p,c.positions))return false;
   if(c.nationalities.trim()){const wanted=c.nationalities.split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);if(!wanted.some(x=>(p.nationality||"").toLowerCase().includes(x)))return false}
   const ci=contractMap.get(p.id);const status=(ci?.status||"").toLowerCase();if(c.contract_status==="active"&&status!=="active")return false;if(c.contract_status==="free_agent"&&ci)return false;if(c.contract_status==="expiring"){if(!ci?.end_date)return false;const d=new Date(ci.end_date+"T23:59:59");if(d<now||d>cutoff)return false}
   const salary=ci?.annual_salary_usd??null;if(c.salary_min_usd!==null&&(salary===null||salary<c.salary_min_usd))return false;if(c.salary_max_usd!==null&&(salary===null||salary>c.salary_max_usd))return false;
   const value=latestValue.get(p.id)?.market_value_usd??null;if(c.market_value_min_usd!==null&&(value===null||value<c.market_value_min_usd))return false;if(c.market_value_max_usd!==null&&(value===null||value>c.market_value_max_usd))return false;
   const parts=participationMap.get(p.id)||[];if(c.competitions.length&&!parts.some(x=>x.competition_id&&c.competitions.includes(x.competition_id)))return false;
   const i=latestIntel.get(p.id);if(c.min_minutes!==null&&(i?.minutes??0)<c.min_minutes)return false;
   const checks:[number|null,number|null][]=[ [i?.goals_per90,c.goals_per90_min],[i?.assists_per90,c.assists_per90_min],[i?.xg_per90,c.xg_per90_min],[i?.xa_per90,c.xa_per90_min],[i?.chances_created_per90,c.chances_created_per90_min],[i?.key_passes_per90,c.key_passes_per90_min],[i?.tackles_per90,c.tackles_per90_min],[i?.interceptions_per90,c.interceptions_per90_min],[i?.progressive_carries_per90,c.progressive_carries_per90_min] ];
   if(checks.some(([v,min])=>min!==null&&(v===null||v<min)))return false;
   return true;
  }).map(p=>({p,i:latestIntel.get(p.id)||null,c:contractMap.get(p.id)||null,v:latestValue.get(p.id)||null,parts:participationMap.get(p.id)||[]}))},[profile,players,contractMap,latestValue,participationMap,latestIntel]);

 return <main style={{maxWidth:1120,margin:"0 auto",padding:"28px 20px"}}>{loading?<p>Loading global player discovery…</p>:message?<div><p style={{color:"#b00"}}>{message}</p><Link href="/scouting/profiles">← Scouting Profiles</Link></div>:profile?<><div style={{display:"flex",justifyContent:"space-between",gap:16,flexWrap:"wrap",marginBottom:20}}><div><h1 style={{margin:"0 0 6px",fontSize:28}}>Global Player Discovery</h1><p style={{margin:0,color:"#777"}}>{profile.name} · candidates matching the saved recruitment criteria</p></div><Link href="/scouting/profiles" style={{fontSize:12}}>← Scouting Profiles</Link></div>
  <section className="intelligence-panel" style={{padding:18,marginBottom:16}}><strong>{candidates.length}</strong> candidate{candidates.length===1?"":"s"} match{candidates.length===1?"es":""} · criteria are applied as filters, not player ratings.</section>
  {!candidates.length?<div className="intelligence-empty">No players currently match this profile. Try widening the criteria.</div>:<div style={{display:"grid",gap:10}}>{candidates.map(({p,i,c,v,parts})=><article key={p.id} className="intelligence-panel" style={{padding:16}}><div style={{display:"flex",justifyContent:"space-between",gap:14,flexWrap:"wrap"}}><div><Link href={"/players/"+p.id} style={{fontSize:16,fontWeight:700}}>{p.full_name}</Link><div style={{fontSize:11,color:"#777",marginTop:5}}>{p.position||"—"}{p.secondary_position?" / "+p.secondary_position:""} · {p.nationality||"—"} · {age(p.date_of_birth)??"—"} yrs</div></div><div style={{textAlign:"right",fontSize:11}}><div>{c?.club?.name||"No current club"}</div><div style={{color:"#777",marginTop:4}}>{c?.annual_salary_usd!=null?money(c.annual_salary_usd)+" salary":"Salary —"} · {v?.market_value_usd!=null?money(v.market_value_usd)+" value":"Value —"}</div></div></div><div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginTop:12,fontSize:11}}><div><strong>Minutes</strong><br/>{i?.minutes??"—"}</div><div><strong>G/90</strong><br/>{i?.goals_per90?.toFixed(2)??"—"}</div><div><strong>A/90</strong><br/>{i?.assists_per90?.toFixed(2)??"—"}</div><div><strong>xG/90</strong><br/>{i?.xg_per90?.toFixed(2)??"—"}</div><div><strong>Competition</strong><br/>{i?.league||parts[0]?.competition_name||"—"}</div></div></article>)}</div>}</>:null}</main>;
}
