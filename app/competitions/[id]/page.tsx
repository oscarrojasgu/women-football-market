"use client"

import Link from "next/link"
import { useEffect,useMemo,useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "../../lib/supabase"

type Comp={id:string;canonical_name:string;country:string|null;competition_type:string|null;level_label:string|null}
type Season={id:string;season_id:string;active:boolean|null;season:{season_key:string;label:string}|null}
type Club={id:string;name:string;country:string|null;logo_url:string|null}

export default function CompetitionPage(){
 const {id}=useParams<{id:string}>();const [comp,setComp]=useState<Comp|null>(null),[seasons,setSeasons]=useState<Season[]>([]),[clubs,setClubs]=useState<Record<string,Club[]>>({}),[loading,setLoading]=useState(true)
 useEffect(()=>{(async()=>{const {data:c}=await supabase.from("competitions").select("id,canonical_name,country,competition_type,level_label").eq("id",id).maybeSingle();if(!c){setLoading(false);return}
  const {data:cs}=await supabase.from("competition_seasons").select("id,season_id,active,season:seasons(season_key,label)").eq("competition_id",id).order("created_at",{ascending:false});
  const ss=(cs||[]) as any[];const cc:Record<string,Club[]>={};
  for(const s of ss){const {data:links}=await supabase.from("club_competitions").select("club_id").eq("competition_season_id",s.id);const ids=[...new Set((links||[]).map((x:any)=>x.club_id))];if(ids.length){const {data:cl}=await supabase.from("clubs").select("id,name,country,logo_url").in("id",ids).order("name");cc[s.id]=(cl||[]) as Club[]}}
  setComp(c as Comp);setSeasons(ss.map(s=>({...s,season:Array.isArray(s.season)?s.season[0]:s.season})));setClubs(cc);setLoading(false)
 })()},[id])
 const totalClubs=useMemo(()=>new Set(Object.values(clubs).flat().map(c=>c.id)).size,[clubs])
 if(loading)return <main style={{minHeight:"100vh",background:"#f5f4ef",padding:60}}>Loading competition…</main>
 if(!comp)return <main style={{minHeight:"100vh",background:"#f5f4ef",padding:60}}>Competition not found.</main>
 return <main style={{minHeight:"100vh",background:"#f5f4ef",color:"#111"}}>
  <section style={{background:"#111",color:"#fff",padding:"52px 6vw 46px"}}><div style={{maxWidth:1200,margin:"0 auto"}}><div style={{fontSize:12,color:"#aaa",fontWeight:800,letterSpacing:1.6}}>COMPETITION PROFILE</div><h1 style={{margin:"14px 0 0",fontSize:"clamp(38px,5vw,62px)",lineHeight:1}}>{comp.canonical_name}</h1><p style={{color:"#bbb",fontSize:16,margin:"16px 0 0"}}>{[comp.country,comp.level_label,comp.competition_type].filter(Boolean).join(" · ")}</p></div></section>
  <section style={{maxWidth:1200,margin:"0 auto",padding:"28px 24px 60px"}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:24}}>{[["Seasons",seasons.length],["Clubs represented",totalClubs],["Active seasons",seasons.filter(s=>s.active).length]].map(([l,v])=><div key={l} style={{background:"#fff",border:"1px solid #e1e1e1",borderRadius:12,padding:18}}><div style={{fontSize:11,color:"#777",fontWeight:800}}>{l}</div><strong style={{display:"block",fontSize:27,marginTop:7}}>{v}</strong></div>)}</div>
  <div style={{display:"grid",gap:14}}>{seasons.map(s=><section key={s.id} style={{background:"#fff",border:"1px solid #e1e1e1",borderRadius:14,padding:20}}><div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><h2 style={{margin:0,fontSize:21}}>{s.season?.label||s.season?.season_key||"Season"}</h2><p style={{margin:"5px 0 0",color:"#777",fontSize:12}}>{clubs[s.id]?.length||0} clubs{ s.active?" · Active":""}</p></div><Link href={"/players?league="+encodeURIComponent(comp.canonical_name)+"&season="+encodeURIComponent(s.season?.season_key||"")} style={{fontSize:12,fontWeight:700,textDecoration:"none",color:"#111"}}>View players →</Link></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:8,marginTop:15}}>{(clubs[s.id]||[]).map(c=><Link key={c.id} href={"/clubs/"+c.id} style={{display:"flex",alignItems:"center",gap:9,padding:"10px",border:"1px solid #eee",borderRadius:8,textDecoration:"none",color:"#111"}}>{c.logo_url?<img src={c.logo_url} alt="" style={{width:28,height:28,objectFit:"contain"}}/>:<span style={{width:28,height:28,borderRadius:6,background:"#f0f0ed",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800}}>{c.name.slice(0,1)}</span>}<span style={{fontSize:13,fontWeight:650}}>{c.name}</span></Link>)}</div></section>)}</div></section></main>
}