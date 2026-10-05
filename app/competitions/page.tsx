"use client"

import Link from "next/link"
import { useWfmT } from "../lib/use-wfm-t"
import { useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase"

type Competition={id:string;canonical_name:string;country:string|null;competition_type:string|null;level_label:string|null;active:boolean|null;logo_url:string|null}
type SeasonRow={competition_id:string;competition_season_id:string;season_key:string;season_label:string;active:boolean|null;clubs:number;players:number}

export default function CompetitionsPage(){
 const t = useWfmT()
 const [competitions,setCompetitions]=useState<Competition[]>([]),[seasons,setSeasons]=useState<SeasonRow[]>([]),[q,setQ]=useState(""),[country,setCountry]=useState("all"),[loading,setLoading]=useState(true)
 useEffect(()=>{(async()=>{const [c,s]=await Promise.all([
  supabase.from("competitions").select("id,canonical_name,country,competition_type,level_label,active,logo_url").order("canonical_name"),
  supabase.from("competition_seasons").select("id,competition_id,active,season:seasons(season_key,label),club_competitions(club_id),player_competitions(player_id,club_competition_id)").order("created_at",{ascending:false})
 ]);
  let competitionData=c.data;
  if(c.error){const fallback=await supabase.from("competitions").select("id,canonical_name,country,competition_type,level_label,active").order("canonical_name");competitionData=(fallback.data||[]).map((row:any)=>({...row,logo_url:null}));}
  setCompetitions((competitionData||[]) as Competition[]);
  const rows:any[]=s.data||[];setSeasons(rows.map(r=>{const x=Array.isArray(r.season)?r.season[0]:r.season;const clubs=new Set((r.club_competitions||[]).map((x:any)=>x.club_id)).size;const players=new Set((r.player_competitions||[]).map((x:any)=>x.player_id)).size;return {competition_id:r.competition_id,competition_season_id:r.id,season_key:x?.season_key||"—",season_label:x?.label||x?.season_key||"—",active:r.active,clubs,players}}));setLoading(false)})()},[])
 const countries=useMemo(()=>[...new Set(competitions.map(c=>c.country).filter(Boolean) as string[])].sort(),[competitions])
 const current=useMemo(()=>{const map=new Map<string,SeasonRow[]>();for(const r of seasons){const a=map.get(r.competition_id)||[];a.push(r);map.set(r.competition_id,a)}return map},[seasons])
 const filtered=competitions.filter(c=>(!q.trim()||[c.canonical_name,c.country,c.competition_type,c.level_label].filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase()))&&(country==="all"||c.country===country))
 return <main style={{minHeight:"100vh",background:"#f5f4ef",color:"#111"}}>
  <section style={{background:"#111",color:"#fff",padding:"52px 6vw 46px"}}><div style={{maxWidth:1200,margin:"0 auto"}}><div style={{fontSize:12,color:"#aaa",fontWeight:800,letterSpacing:1.6}}>WOMEN’S FOOTBALL MARKET</div><h1 style={{margin:"14px 0 0",fontSize:"clamp(42px,6vw,68px)",lineHeight:.98}}>{t("Competitions")}</h1><p style={{margin:"18px 0 0",maxWidth:720,fontSize:17,lineHeight:1.55,color:"#c7c7c7"}}>Explore women’s football competitions, seasons, clubs and player coverage across the WFM database.</p></div></section>
  <section style={{maxWidth:1200,margin:"0 auto",padding:"28px 24px 60px"}}><div style={{background:"#fff",border:"1px solid #e1e1e1",borderRadius:14,overflow:"hidden"}}>
   <div style={{padding:20,borderBottom:"1px solid #e8e8e8",display:"flex",gap:12,flexWrap:"wrap"}}><input type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search competition, country…" style={{flex:"1 1 280px",border:"1px solid #d8d8d8",borderRadius:9,padding:"11px 13px"}}/><select value={country} onChange={e=>setCountry(e.target.value)} style={{border:"1px solid #d8d8d8",borderRadius:9,padding:"11px",background:"#fff"}}><option value="all">{t("All countries")}</option>{countries.map(c=><option key={c}>{c}</option>)}</select></div>
   <div style={{padding:20}}>{loading?<p>{t("Loading competitions…")}</p>:filtered.map(c=>{const rs=current.get(c.id)||[];const latest=[...rs].sort((a,b)=>b.season_key.localeCompare(a.season_key))[0];return <Link key={c.id} href={"/competitions/"+c.id} style={{display:"block",padding:"18px 4px",borderBottom:"1px solid #eee",textDecoration:"none",color:"#111"}}><div style={{display:"flex",justifyContent:"space-between",gap:18,flexWrap:"wrap"}}><div style={{display:"flex",alignItems:"center",gap:14,minWidth:0}}><div style={{width:52,height:52,border:"1px solid #e5e5e5",borderRadius:10,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>{c.logo_url?<img src={c.logo_url} alt="" style={{width:"80%",height:"80%",objectFit:"contain"}}/>:<span style={{fontSize:11,fontWeight:800,color:"#aaa"}}>WFM</span>}</div><div><strong style={{fontSize:18}}>{c.canonical_name}</strong><div style={{marginTop:5,color:"#777",fontSize:13}}>{[c.country,c.level_label,c.competition_type].filter(Boolean).join(" · ")}</div></div></div><div style={{textAlign:"right",fontSize:12,color:"#666"}}><strong style={{color:"#111"}}>{rs.length}</strong> seasons{latest&&<> · <strong style={{color:"#111"}}>{latest.clubs}</strong> clubs · <strong style={{color:"#111"}}>{latest.players}</strong> players</>}</div></div></Link>})}{!loading&&!filtered.length&&<p style={{padding:30,color:"#777",textAlign:"center"}}>{t("No competitions found.")}</p>}</div>
  </div></section></main>
}