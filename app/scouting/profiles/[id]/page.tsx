"use client";

import Link from "next/link";
import { useWfmT } from "../../../lib/use-wfm-t"
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
type ClubContext={id:string;name:string;country:string|null;league:string|null;activePlayers:number;expiringContracts:number;unknownSalary:number;positionMix:[string,number][];expiringPositionMix:[string,number][];incoming:number;outgoing:number};

const emptyCriteria:Criteria={positions:[],roles:"",age_min:null,age_max:null,nationalities:"",competitions:[],contract_status:"any",salary_min_usd:null,salary_max_usd:null,market_value_min_usd:null,market_value_max_usd:null,min_minutes:null,goals_per90_min:null,assists_per90_min:null,xg_per90_min:null,xa_per90_min:null,chances_created_per90_min:null,key_passes_per90_min:null,tackles_per90_min:null,interceptions_per90_min:null,progressive_carries_per90_min:null,global_percentile_min:null,priorities:""};

const normalize=(v:any):Criteria=>({...emptyCriteria,...(v&&typeof v==="object"?v:{}),positions:Array.isArray(v?.positions)?v.positions:[],competitions:Array.isArray(v?.competitions)?v.competitions:[]});
const age=(dob:string|null)=>{if(!dob)return null;const d=new Date(dob+"T00:00:00"),t=new Date();let a=t.getFullYear()-d.getFullYear();if(t.getMonth()<d.getMonth()||(t.getMonth()===d.getMonth()&&t.getDate()<d.getDate()))a--;return a};
const startYear=(s:string)=>{const m=s.match(/(19|20)\d{2}/);return m?Number(m[0]):0};
const money=(v:number|null)=>v==null?"—":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0,notation:"compact"}).format(v);

function positionMatch(p:Player, wanted:string[]){if(!wanted.length)return true;const values=[p.position,p.secondary_position].filter(Boolean).map(v=>String(v).trim().toLowerCase());const aliases:Record<string,string[]>={GK:["gk","goalkeeper"],CB:["cb","center back","central defender","left center back","right center back"],FB:["fb","lb","rb","left back","right back","lwb","rwb","left wing back","right wing back"],WB:["wb","lwb","rwb","left wing back","right wing back"],DM:["dm","cdm","defensive midfielder","center defensive midfield","left defensive midfield","right defensive midfield"],CM:["cm","mc","midfielder","central midfielder","left center midfield","right center midfield"],AM:["am","cam","attacking midfielder","center attacking midfield"],WM:["wm","lm","rm","left midfield","right midfield"],W:["w","lw","rw","lm","rm","left wing","right wing"],ST:["st","striker","center forward","left center forward","right center forward","cf"],CF:["cf","center forward","left center forward","right center forward"]};return wanted.some(w=>{const key=w.trim().toUpperCase();const allowed=aliases[key]||[key.toLowerCase()];return values.some(v=>allowed.includes(v))})}

export default function GlobalDiscoveryPage(){
 const t = useWfmT()
 const params=useParams<{id:string}>();const id=Array.isArray(params?.id)?params.id[0]:params?.id;
 const [profile,setProfile]=useState<Profile|null>(null);const [players,setPlayers]=useState<Player[]>([]);const [intel,setIntel]=useState<Intel[]>([]);const [contracts,setContracts]=useState<Contract[]>([]);const [values,setValues]=useState<Value[]>([]);const [participations,setParticipations]=useState<Participation[]>([]);const [loading,setLoading]=useState(true);const [message,setMessage]=useState("");
 const [userId,setUserId]=useState<string|null>(null);
 const [sortKey,setSortKey]=useState<"player"|"club"|"age"|"minutes"|"goals"|"assists"|"xg"|"competition">("player");
 const [sortDir,setSortDir]=useState<"asc"|"desc">("asc");const [clubContext,setClubContext]=useState<ClubContext|null>(null);const [globalPeers,setGlobalPeers]=useState<Map<string,GlobalPeer>>(new Map());const [lists,setLists]=useState<ScoutingList[]>([]);const [selectedListId,setSelectedListId]=useState("");const [selected,setSelected]=useState<string[]>([]);const [existing,setExisting]=useState<Set<string>>(new Set());const [listBusy,setListBusy]=useState(false);