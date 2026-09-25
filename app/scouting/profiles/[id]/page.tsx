"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Criteria={positions:string[];roles:string;age_min:number|null;age_max:number|null;nationalities:string;competitions:string[];contract_status:string;salary_min_usd:number|null;salary_max_usd:number|null;market_value_min_usd:number|null;market_value_max_usd:number|null;min_minutes:number|null;goals_per90_min:number|null;assists_per90_min:number|null;xg_per90_min:number|null;xa_per90_min:number|null;chances_created_per90_min:number|null;key_passes_per90_min:number|null;tackles_per90_min:number|null;interceptions_per90_min:number|null;progressive_carries_per90_min:number|null;global_percentile_min:number|null;priorities:string};
type Profile={id:string;name:string;description:string|null;criteria:Criteria};
type Player={id:string;full_name:string;date_of_birth:string|null;nationality:string|null;position:string|null;secondary_position:string|null;photo_url:string|null};
type Intel={player_id:string;season:string;minutes:number|null;goals_per90:number|null;assists_per90:number|null;xg_per90:number|null;xa_per90:number|null;chances_created_per90:number|null;key_passes_per90:number|null;tackles_per90:number|null;interceptions_per90:number|null;progressive_carries_per90:number|null;league:string|null;club_name:string|null};
type Contract={player_id:string;annual_salary_usd:number|null;status:string|null;end_date:string|null;club:any};
type Value={player_id:string;market_value_usd:number|null;valuation_date:string};
type Participation={player_id:string;competition_id:string|null;competition_name:string|null};
type ScoutingList={id:string;name:string;status:string};
type GlobalPeer={player_id:string;season:string;goals_per90_global_percentile:number|null;assists_per90_global_percentile:number|null;xg_per90_global_percentile:number|null;xa_per90_global_percentile:number|null;chances_created_per90_global_percentile:number|null;key_passes_per90_global_percentile:number|null;tackles_per90_global_percentile:number|null;interceptions_per90_global_percentile:number|null;progressive_carries_per90_global_percentile:number|null};

const emptyCriteria:Criteria={positions:[],roles:"",age_min:null,age_max:null,nationalities:"",competitions:[],contract_status:"any",salary_min_usd:null,salary_max_usd:null,market_value_min_usd:null,market_value_max_usd:null,min_minutes:null,goals_per90_min:null,assists_per90_min:null,xg_per90_min:null,xa_per90_min:null,chances_created_per90_min:null,key_passes_per90_min:null,tackles_per90_min:null,interceptions_per90_min:null,progressive_carries_per90_min:null,global_percentile_min:null,priorities:""};

const normalize=(v:any):Criteria=>({...emptyCriteria,...(v&&typeof v==="object"?v:{}),positions:Array.isArray(v?.positions)?v.positions:[],competitions:Array.isArray(v?.competitions)?v.competitions:[]});
const age=(dob:string|null)=>{if(!dob)return null;const d=new Date(dob+"T00:00:00"),t=new Date();let a=t.getFullYear()-d.getFullYear();if(t.getMonth()<d.getMonth()||(t.getMonth()===d.getMonth()&&t.getDate()<d.getDate()))a--;return a};
const startYear=(s:string)=>{const m=s.match(/(19|20)\d{2}/);return m?Number(m[0]):0};
const money=(v:number|null)=>v==null?"—":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0,notation:"compact"}).format(v);

function positionMatch(p:Player, wanted:string[]){if(!wanted.length)return true;const values=[p.position,p.secondary_position].filter(Boolean).map(v=>String(v).trim().toLowerCase());const aliases:Record<string,string[]>={GK:["gk","goalkeeper"],CB:["cb","center back","central defender","left center back","right center back"],FB:["fb","lb","rb","left back","right back","lwb","rwb","left wing back","right wing back"],WB:["wb","lwb","rwb","left wing back","right wing back"],DM:["dm","cdm","defensive midfielder","center defensive midfield","left defensive midfield","right defensive midfield"],CM:["cm","mc","midfielder","central midfielder","left center midfield","right center midfield"],AM:["am","cam","attacking midfielder","center attacking midfield"],WM:["wm","lm","rm","left midfield","right midfield"],W:["w","lw","rw","lm","rm","left wing","right wing"],ST:["st","striker","center forward","left center forward","right center forward","cf"],CF:["cf","center forward","left center forward","right center forward"]};return wanted.some(w=>{const key=w.trim().toUpperCase();const allowed=aliases[key]||[key.toLowerCase()];return values.some(v=>allowed.includes(v))})}

export default function GlobalDiscoveryPage(){
 const params=useParams<{id:string}>();const id=Array.isArray(params?.id)?params.id[0]:params?.id;
 const [profile,setProfile]=useState<Profile|null>(null);const [players,setPlayers]=useState<Player[]>([]);const [intel,setIntel]=useState<Intel[]>([]);const [contracts,setContracts]=useState<Contract[]>([]);const [values,setValues]=useState<Value[]>([]);const [participations,setParticipations]=useState<Participation[]>([]);const [loading,setLoading]=useState(true);const [message,setMessage]=useState("");
 const [userId,setUserId]=useState<string|null>(null);const [globalPeers,setGlobalPeers]=useState<Map<string,GlobalPeer>>(new Map());const [lists,setLists]=useState<ScoutingList[]>([]);const [selectedListId,setSelectedListId]=useState("");const [selected,setSelected]=useState<string[]>([]);const [existing,setExisting]=useState<Set<string>>(new Set());const [listBusy,setListBusy]=useState(false);

 useEffect(()=>{if(!id)return;let mounted=true;(async()=>{const auth=await supabase.auth.getUser();if(!mounted)return;const uid=auth.data.user?.id||null;setUserId(uid);const [pr,pl,pg,si,co,mv,pa,listResult]=await Promise.all([
  supabase.from("scouting_profiles").select("id,name,description,criteria").eq("id",id).single(),
  supabase.from("players").select("id,full_name,date_of_birth,nationality,position,secondary_position,photo_url"),
  supabase.from("player_global_peer_benchmarks").select("player_id,season,goals_per90_global_percentile,assists_per90_global_percentile,xg_per90_global_percentile,xa_per90_global_percentile,chances_created_per90_global_percentile,key_passes_per90_global_percentile,tackles_per90_global_percentile,interceptions_per90_global_percentile,progressive_carries_per90_global_percentile"),
  supabase.from("player_season_intelligence").select("player_id,season,minutes,goals_per90,assists_per90,xg_per90,xa_per90,chances_created_per90,key_passes_per90,tackles_per90,interceptions_per90,progressive_carries_per90,league,club_name"),
  supabase.from("contracts").select("player_id,annual_salary_usd,status,end_date,club:clubs(name)"),
  supabase.from("market_values").select("player_id,market_value_usd,valuation_date").order("valuation_date",{ascending:false}),
  supabase.from("player_competitions").select("player_id,club_competition:club_competitions(competition_season:competition_seasons(competition:competitions(id,canonical_name)))"),
  uid?supabase.from("scouting_lists").select("id,name,status").eq("status","active").order("updated_at",{ascending:false}):Promise.resolve({data:[],error:null} as any)
 ]);if(!mounted)return;if(pr.error){setMessage(pr.error.message);setLoading(false);return}
  setProfile({...pr.data,criteria:normalize(pr.data.criteria)} as Profile);setLists((listResult.data||[]) as {id:string;name:string;status:string}[]);if(listResult.data?.length)setSelectedListId(listResult.data[0].id);setPlayers((pl.data||[]) as Player[]);const peerMap=new Map<string,GlobalPeer>();for(const row of (pg.data||[]) as GlobalPeer[])peerMap.set(`${row.player_id}|${row.season}`,row);setGlobalPeers(peerMap);setIntel((si.data||[]) as Intel[]);setContracts((co.data||[]) as Contract[]);setValues((mv.data||[]) as Value[]);
  const normalized=(pa.data||[]).map((r:any)=>{const cc=Array.isArray(r.club_competition)?r.club_competition[0]:r.club_competition;const cs=Array.isArray(cc?.competition_season)?cc.competition_season[0]:cc?.competition_season;const comp=Array.isArray(cs?.competition)?cs.competition[0]:cs?.competition;return {player_id:r.player_id,competition_id:comp?.id||null,competition_name:comp?.canonical_name||null}});setParticipations(normalized);setLoading(false);
 })();return()=>{mounted=false}},[id]);

 const latestIntel=useMemo(()=>{const m=new Map<string,Intel>();for(const r of intel){const c=m.get(r.player_id);if(!c||startYear(r.season)>startYear(c.season))m.set(r.player_id,r)}return m},[intel]);
 const latestValue=useMemo(()=>{const m=new Map<string,Value>();for(const r of values)if(!m.has(r.player_id))m.set(r.player_id,r);return m},[values]);
 const contractMap=useMemo(()=>{const m=new Map<string,Contract>();for(const r of contracts){const c=m.get(r.player_id);if(!c||(r.status==="active"&&c.status!=="active")||(r.end_date||"")>(c.end_date||""))m.set(r.player_id,r)}return m},[contracts]);
 const participationMap=useMemo(()=>{const m=new Map<string,Participation[]>();for(const r of participations)m.set(r.player_id,[...(m.get(r.player_id)||[]),r]);return m},[participations]);

 const toggleCandidate=(playerId:string)=>setSelected(current=>current.includes(playerId)?current.filter(x=>x!==playerId):[...current,playerId]);
 const loadExisting=async(listId:string)=>{if(!listId){setExisting(new Set());return}const {data,error}=await supabase.from("scouting_list_players").select("player_id").eq("list_id",listId);if(error){setMessage(error.message);return}setExisting(new Set((data||[]).map((x:any)=>x.player_id)))};
 useEffect(()=>{if(selectedListId)loadExisting(selectedListId)},[selectedListId]);
 const createList=async()=>{if(!userId)return;const name=window.prompt("Name this scouting list")?.trim();if(!name)return;setListBusy(true);const {data,error}=await supabase.from("scouting_lists").insert({user_id:userId,name}).select("id,name,status").single();setListBusy(false);if(error){setMessage(error.message);return}setLists(current=>[data,...current]);setSelectedListId(data.id);setMessage("Scouting list created.");};
 const addSelected=async()=>{if(!userId){setMessage("Sign in to save players.");return}if(!selectedListId){setMessage("Create or select a scouting list first.");return}const ids=selected.filter(x=>!existing.has(x));if(!ids.length){setMessage("All selected players are already on this list.");return}setListBusy(true);const {error}=await supabase.from("scouting_list_players").insert(ids.map((player_id:string)=>({list_id:selectedListId,player_id,added_by:userId})));setListBusy(false);if(error){setMessage(error.message);return}setExisting(current=>new Set([...current,...ids]));setSelected([]);setMessage(ids.length+" player"+(ids.length===1?"":"s")+" added to the scouting list.");};
 const candidates=useMemo(()=>{if(!profile)return[];const c=profile.criteria;const now=new Date();const cutoff=new Date(now);cutoff.setDate(cutoff.getDate()+180);
  return players.filter(p=>{const a=age(p.date_of_birth);if(a!==null&&c.age_min!==null&&a<c.age_min)return false;if(a!==null&&c.age_max!==null&&a>c.age_max)return false;if(!positionMatch(p,c.positions))return false;
   if(c.nationalities.trim()){const wanted=c.nationalities.split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);if(!wanted.some(x=>(p.nationality||"").toLowerCase().includes(x)))return false}
   const ci=contractMap.get(p.id);const status=(ci?.status||"").toLowerCase();if(c.contract_status==="active"&&status!=="active")return false;if(c.contract_status==="free_agent"&&ci)return false;if(c.contract_status==="expiring"){if(!ci?.end_date)return false;const d=new Date(ci.end_date+"T23:59:59");if(d<now||d>cutoff)return false}
   const salary=ci?.annual_salary_usd??null;if(c.salary_min_usd!==null&&(salary===null||salary<c.salary_min_usd))return false;if(c.salary_max_usd!==null&&(salary===null||salary>c.salary_max_usd))return false;
   const value=latestValue.get(p.id)?.market_value_usd??null;if(c.market_value_min_usd!==null&&(value===null||value<c.market_value_min_usd))return false;if(c.market_value_max_usd!==null&&(value===null||value>c.market_value_max_usd))return false;
   const parts=participationMap.get(p.id)||[];if(c.competitions.length&&!parts.some(x=>x.competition_id&&c.competitions.includes(x.competition_id)))return false;
   const i=latestIntel.get(p.id);if(c.min_minutes!==null&&(i?.minutes??0)<c.min_minutes)return false;
   const checks:[number|null,number|null][]=[ [i?.goals_per90??null,c.goals_per90_min??null],[i?.assists_per90??null,c.assists_per90_min??null],[i?.xg_per90??null,c.xg_per90_min??null],[i?.xa_per90??null,c.xa_per90_min??null],[i?.chances_created_per90??null,c.chances_created_per90_min??null],[i?.key_passes_per90??null,c.key_passes_per90_min??null],[i?.tackles_per90??null,c.tackles_per90_min??null],[i?.interceptions_per90??null,c.interceptions_per90_min??null],[i?.progressive_carries_per90??null,c.progressive_carries_per90_min??null] ];
   if(checks.some(([v,min])=>min!==null&&(v===null||v<min)))return false;
   if(c.global_percentile_min!==null){const i=latestIntel.get(p.id);const peer=i?globalPeers.get(`${p.id}|${i.season}`):undefined;if(!peer)return false;const percentiles=[peer.goals_per90_global_percentile,peer.assists_per90_global_percentile,peer.xg_per90_global_percentile,peer.xa_per90_global_percentile,peer.chances_created_per90_global_percentile,peer.key_passes_per90_global_percentile,peer.tackles_per90_global_percentile,peer.interceptions_per90_global_percentile,peer.progressive_carries_per90_global_percentile].filter((v):v is number=>v!==null);const minimumPercentile=c.global_percentile_min/100;if(!percentiles.length||Math.max(...percentiles)<minimumPercentile)return false;}
   return true;
  }).map(p=>({p,i:latestIntel.get(p.id)||null,c:contractMap.get(p.id)||null,v:latestValue.get(p.id)||null,parts:participationMap.get(p.id)||[]}))},[profile,players,contractMap,latestValue,participationMap,latestIntel,globalPeers]);

 return <>
  <section className="players-scout-hero">
    <div className="players-scout-shell">
      <div className="players-scout-eyebrow">WOMEN&apos;S FOOTBALL MARKET</div>
      <h1>Global Player Discovery</h1>
      <p>{profile?.name ? profile.name+" · " : ""}Candidates matching the saved recruitment criteria.</p>
    </div>
  </section>

  <main className="players-page players-scout-page">
    {loading ? (
      <div className="scout-empty">Loading global player discovery…</div>
    ) : message && !profile ? (
      <div className="scout-empty"><strong>{message}</strong><Link href="/scouting/profiles">← Scouting Profiles</Link></div>
    ) : profile ? (
      <>
        <div className="scout-control-footer" style={{marginBottom:14}}>
          <Link href="/scouting/profiles" style={{color:"#111",fontWeight:700,textDecoration:"none"}}>← Scouting Profiles</Link>
          <span>{candidates.length} candidate{candidates.length===1?"":"s"} matching saved criteria</span>
        </div>

        <section className="scout-shortlist-bar">
          <div><strong>{selected.length}</strong> selected</div>
          <div className="scout-shortlist-actions">
            <select value={selectedListId} onChange={e=>setSelectedListId(e.target.value)}>
              <option value="">Select scouting list</option>
              {lists.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <button type="button" onClick={createList} disabled={listBusy}>New List</button>
            <button type="button" onClick={addSelected} disabled={listBusy||!selected.length||!selectedListId}>Add Selected</button>
          </div>
        </section>

        {message && <div className="scout-note"><strong>Scouting:</strong> {message}</div>}

        {!candidates.length ? (
          <div className="scout-empty"><strong>No players currently match this profile</strong><span>Try widening the recruitment criteria.</span></div>
        ) : (
          <section className="scout-table-wrap global-discovery-table">
            <div className="scout-table-header">
              <span>PLAYER</span>
              <span>CLUB</span>
              <span>AGE</span>
              <span>MINUTES</span>
              <span>G/90</span>
              <span>A/90</span>
              <span>xG/90</span>
              <span>COMPETITION</span>
            </div>

            {candidates.map(({p,i,c,v,parts})=>(
              <article key={p.id} className={`scout-row ${selected.includes(p.id)?"is-shortlisted":""}`}>
                <span className="scout-player">
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={()=>toggleCandidate(p.id)}
                    aria-label={`Select ${p.full_name}`}
                  />
                  <Link href={{ pathname: "/scouting/player/"+p.id, query: { returnTo: "/scouting/profiles/"+id } }}>
                    <strong>{p.full_name}</strong>
                    <small>{p.position||"Position unavailable"}{p.secondary_position?" / "+p.secondary_position:""} · {p.nationality||"Nationality unavailable"}</small>
                  </Link>
                </span>
                <span>
                  <strong>{c?.club?.name||"No current club"}</strong>
                  <small>{c?.annual_salary_usd!=null?money(c.annual_salary_usd)+" salary":"Salary —"} · {v?.market_value_usd!=null?money(v.market_value_usd)+" value":"Value —"}</small>
                </span>
                <span className="scout-age">{age(p.date_of_birth)??"—"} yrs</span>
                <span>{i?.minutes??"—"}</span>
                <span>{i?.goals_per90?.toFixed(2)??"—"}</span>
                <span>{i?.assists_per90?.toFixed(2)??"—"}</span>
                <span>{i?.xg_per90?.toFixed(2)??"—"}</span>
                <span>{i?.league||parts[0]?.competition_name||"—"}</span>
              </article>
            ))}
          </section>
        )}
      </>
    ) : null}
  </main>
 </>
}
