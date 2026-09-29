"use client"

import Link from "next/link"
import { useEffect,useMemo,useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "../../lib/supabase"

type Comp={id:string;canonical_name:string;country:string|null;competition_type:string|null;level_label:string|null}
type Season={id:string;season_id:string;active:boolean|null;season:{season_key:string;label:string}|null}
type Club={id:string;name:string;country:string|null;logo_url:string|null}
type News={id:string;title:string;url:string;publisher:string;published_at:string}
type Match={id:string;home_team_name:string;away_team_name:string;home_score:number|null;away_score:number|null;status:string;kickoff_at:string}

export default function CompetitionPage(){
 const {id}=useParams<{id:string}>();const [comp,setComp]=useState<Comp|null>(null),[seasons,setSeasons]=useState<Season[]>([]),[clubs,setClubs]=useState<Record<string,Club[]>>({}),[news,setNews]=useState<News[]>([]),[matches,setMatches]=useState<Match[]>([]),[loading,setLoading]=useState(true)
 useEffect(()=>{(async()=>{const {data:c}=await supabase.from("competitions").select("id,canonical_name,country,competition_type,level_label").eq("id",id).maybeSingle();if(!c){setLoading(false);return}
  const {data:cs}=await supabase.from("competition_seasons").select("id,season_id,active,season:seasons(season_key,label)").eq("competition_id",id).order("created_at",{ascending:false});
  const ss=(cs||[]) as any[];const cc:Record<string,Club[]>={};
  for(const s of ss){const {data:links}=await supabase.from("club_competitions").select("club_id").eq("competition_season_id",s.id);const ids=[...new Set((links||[]).map((x:any)=>x.club_id))];if(ids.length){const {data:cl}=await supabase.from("clubs").select("id,name,country,logo_url").in("id",ids).order("name");cc[s.id]=(cl||[]) as Club[]}}
  const normalizedSeasons=ss.map(s=>({...s,season:Array.isArray(s.season)?s.season[0]:s.season}))
  const {data:n}=await supabase.from("wfm_news_items").select("id,title,url,publisher,published_at").eq("active",true).eq("competition_name",c.canonical_name).order("published_at",{ascending:false}).limit(5)
  const {data:m}=await supabase.from("wfm_match_fixtures").select("id,home_team_name,away_team_name,home_score,away_score,status,kickoff_at").eq("competition_id",id).order("kickoff_at",{ascending:false}).limit(6)
  setComp(c as Comp);setSeasons(normalizedSeasons);setClubs(cc);setNews((n||[]) as News[]);setMatches((m||[]) as Match[]);setLoading(false)
 })()},[id])
 const totalClubs=useMemo(()=>new Set(Object.values(clubs).flat().map(c=>c.id)).size,[clubs])
 if(loading)return <main style={{minHeight:"100vh",background:"#f5f4ef",padding:60}}>Loading competition…</main>
 if(!comp)return <main style={{minHeight:"100vh",background:"#f5f4ef",padding:60}}>Competition not found.</main>
 return <main style={{minHeight:"100vh",background:"#f5f4ef",color:"#111"}}>
  <section style={{background:"#111",color:"#fff",padding:"52px 6vw 46px"}}><div style={{maxWidth:1200,margin:"0 auto"}}><div style={{fontSize:12,color:"#aaa",fontWeight:800,letterSpacing:1.6}}>COMPETITION PROFILE</div><h1 style={{margin:"14px 0 0",fontSize:"clamp(38px,5vw,62px)",lineHeight:1}}>{comp.canonical_name}</h1><p style={{color:"#bbb",fontSize:16,margin:"16px 0 0"}}>{[comp.country,comp.level_label,comp.competition_type].filter(Boolean).join(" · ")}</p></div></section>
  <section style={{maxWidth:1200,margin:"0 auto",padding:"28px 24px 60px"}}>
  {(news.length>0||matches.length>0)&&<section style={{display:"grid",gridTemplateColumns:"1.15fr 1fr",gap:14,marginBottom:24}}>
    <div style={{background:"#fff",border:"1px solid #e1e1e1",borderRadius:14,padding:20}}>
      <div style={{fontSize:11,color:"#777",fontWeight:800,letterSpacing:1}}>COMPETITION STORIES</div>
      <h2 style={{margin:"8px 0 14px",fontSize:22}}>Latest from {comp.canonical_name}</h2>
      <div style={{display:"grid",gap:12}}>
        {news.map(item=><a key={item.id} href={item.url} target="_blank" rel="noreferrer" style={{color:"#111",textDecoration:"none"}}><strong style={{display:"block",fontSize:13,lineHeight:1.35}}>{item.title}</strong><small style={{display:"block",marginTop:4,color:"#888"}}>{item.publisher} · {new Date(item.published_at).toLocaleDateString()}</small></a>)}
        {!news.length&&<p style={{margin:0,color:"#777",fontSize:13}}>No source-linked stories are currently associated with this competition.</p>}
      </div>
    </div>
    <div style={{background:"#111",color:"#fff",borderRadius:14,padding:20}}>
      <div style={{fontSize:11,color:"#aaa",fontWeight:800,letterSpacing:1}}>MATCH ACTIVITY</div>
      <h2 style={{margin:"8px 0 14px",fontSize:22}}>Recent fixtures</h2>
      <div style={{display:"grid",gap:11}}>
        {matches.map(match=><Link key={match.id} href={`/matches/${match.id}`} style={{color:"#fff",textDecoration:"none",fontSize:13,display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"center"}}><span style={{textAlign:"right"}}>{match.home_team_name}</span><strong>{match.home_score??"—"}–{match.away_score??"—"}</strong><span>{match.away_team_name}</span></Link>)}
        {!matches.length&&<p style={{margin:0,color:"#aaa",fontSize:13}}>Match activity will appear when verified fixtures are synced.</p>}
      </div>
    </div>
  </section>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:24}}>{[["Seasons",seasons.length],["Clubs represented",totalClubs],["Active seasons",seasons.filter(s=>s.active).length]].map(([l,v])=><div key={l} style={{background:"#fff",border:"1px solid #e1e1e1",borderRadius:12,padding:18}}><div style={{fontSize:11,color:"#777",fontWeight:800}}>{l}</div><strong style={{display:"block",fontSize:27,marginTop:7}}>{v}</strong></div>)}</div>
  <div style={{display:"grid",gap:14}}>{seasons.map(s=><section key={s.id} style={{background:"#fff",border:"1px solid #e1e1e1",borderRadius:14,padding:20}}><div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><h2 style={{margin:0,fontSize:21}}>{s.season?.label||s.season?.season_key||"Season"}</h2><p style={{margin:"5px 0 0",color:"#777",fontSize:12}}>{clubs[s.id]?.length||0} clubs{ s.active?" · Active":""}</p></div><Link href={"/players?league="+encodeURIComponent(comp.canonical_name)+"&season="+encodeURIComponent(s.season?.season_key||"")} style={{fontSize:12,fontWeight:700,textDecoration:"none",color:"#111"}}>View players →</Link></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:8,marginTop:15}}>{(clubs[s.id]||[]).map(c=><Link key={c.id} href={"/clubs/"+c.id} style={{display:"flex",alignItems:"center",gap:9,padding:"10px",border:"1px solid #eee",borderRadius:8,textDecoration:"none",color:"#111"}}>{c.logo_url?<img src={c.logo_url} alt="" style={{width:28,height:28,objectFit:"contain"}}/>:<span style={{width:28,height:28,borderRadius:6,background:"#f0f0ed",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800}}>{c.name.slice(0,1)}</span>}<span style={{fontSize:13,fontWeight:650}}>{c.name}</span></Link>)}</div></section>)}</div></section></main>
}