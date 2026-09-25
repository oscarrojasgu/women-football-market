import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Props={searchParams:Promise<{players?:string;returnTo?:string}>};

const money=(v:number|null)=>v==null?"—":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0,notation:"compact"}).format(v);
const pct=(v:number|null)=>v==null?"—":Math.round(v*100)+"%";
const age=(dob:string|null)=>{if(!dob)return null;const d=new Date(dob+"T00:00:00"),t=new Date();let a=t.getFullYear()-d.getFullYear();if(t.getMonth()<d.getMonth()||(t.getMonth()===d.getMonth()&&t.getDate()<d.getDate()))a--;return a};

export default async function ScoutingComparePage({searchParams}:Props){
  const q=await searchParams;
  const ids=Array.from(new Set((q.players||"").split(",").map(v=>v.trim()).filter(Boolean))).slice(0,6);
  const returnTo=q.returnTo&&q.returnTo.startsWith("/scouting/")?q.returnTo:"/scouting";
  if(ids.length<2)return <main className="players-page players-scout-page"><div className="scout-empty"><strong>Select at least two players to compare.</strong><Link href={returnTo}>← Scouting Workspace</Link></div></main>;
  const [{data:players},{data:intelligence},{data:contracts},{data:values},{data:peers}]=await Promise.all([
    supabase.from("players").select("id,full_name,date_of_birth,nationality,position,secondary_position,photo_url").in("id",ids),
    supabase.from("player_season_intelligence").select("player_id,season,club_name,league,minutes,goals_per90,assists_per90,xg_per90,xa_per90,chances_created_per90,key_passes_per90,tackles_per90,interceptions_per90,progressive_carries_per90").in("player_id",ids),
    supabase.from("contracts").select("player_id,annual_salary_usd,status,end_date,club:clubs(name)").in("player_id",ids).order("start_date",{ascending:false}),
    supabase.from("market_values").select("player_id,market_value_usd,valuation_date").in("player_id",ids).order("valuation_date",{ascending:false}),
    supabase.from("player_global_peer_benchmarks").select("player_id,season,goals_per90_global_percentile,assists_per90_global_percentile,xg_per90_global_percentile,xa_per90_global_percentile,chances_created_per90_global_percentile,key_passes_per90_global_percentile,tackles_per90_global_percentile,interceptions_per90_global_percentile,progressive_carries_per90_global_percentile").in("player_id",ids)
  ]);
  const intelMap=new Map<string,any>();
  for(const row of intelligence||[]){const prev=intelMap.get(row.player_id);if(!prev||String(row.season)>String(prev.season))intelMap.set(row.player_id,row)}
  const valueMap=new Map<string,any>(); for(const row of values||[]){if(!valueMap.has(row.player_id))valueMap.set(row.player_id,row)}
  const contractMap=new Map<string,any>(); for(const row of contracts||[]){if(!contractMap.has(row.player_id))contractMap.set(row.player_id,row)}
  const peerMap=new Map<string,any>(); for(const row of peers||[]){const latest=intelMap.get(row.player_id);if(latest?.season===row.season)peerMap.set(row.player_id,row)}
  const rows=(players||[]).sort((a:any,b:any)=>ids.indexOf(a.id)-ids.indexOf(b.id)) as any[];
  const metrics=[["Minutes","minutes"],["G/90","goals_per90"],["A/90","assists_per90"],["xG/90","xg_per90"],["xA/90","xa_per90"],["Chances/90","chances_created_per90"],["Key passes/90","key_passes_per90"],["Tackles/90","tackles_per90"],["Interceptions/90","interceptions_per90"],["Progressive carries/90","progressive_carries_per90"]] as const;
  const percentileMetrics=[["G/90","goals_per90_global_percentile"],["A/90","assists_per90_global_percentile"],["xG/90","xg_per90_global_percentile"],["xA/90","xa_per90_global_percentile"],["Creation","chances_created_per90_global_percentile"],["Key passes","key_passes_per90_global_percentile"],["Tackles","tackles_per90_global_percentile"],["Interceptions","interceptions_per90_global_percentile"],["Progression","progressive_carries_per90_global_percentile"]] as const;
  return <>
    <section className="players-scout-hero"><div className="players-scout-shell"><div className="players-scout-eyebrow">WOMEN'S FOOTBALL MARKET</div><h1>Scouting Comparison</h1><p>Side-by-side descriptive context for the selected recruitment candidates.</p></div></section>
    <main className="players-page players-scout-page">
      <div className="scout-control-footer" style={{marginBottom:14}}><Link href={returnTo} style={{color:"#111",fontWeight:700,textDecoration:"none"}}>← Scouting Workspace</Link><span>{rows.length} players compared</span></div>
      <section className="scout-table-wrap" style={{overflowX:"auto"}}>
        <div style={{minWidth:760,padding:16}}>
          <div style={{display:"grid",gridTemplateColumns:"180px repeat("+rows.length+",minmax(170px,1fr))",gap:8,borderBottom:"1px solid #ddd",paddingBottom:12}}>
            <div><small style={{color:"#888"}}>PLAYER</small></div>
            {rows.map(p=><div key={p.id}><div style={{display:"flex",alignItems:"center",gap:8}}>{p.photo_url?<img src={p.photo_url} alt="" className="scout-player-photo"/>:<span className="scout-player-photo scout-player-photo-empty">{p.full_name?.charAt(0)||"?"}</span>}<strong>{p.full_name}</strong></div><small style={{color:"#777"}}>{p.position||"Position unavailable"} · {p.nationality||"Nationality unavailable"}</small></div>)}
          </div>
          <div style={{marginTop:14}}>
            <div style={{fontSize:10,color:"#888",letterSpacing:".08em",fontWeight:800}}>PLAYER CONTEXT</div>
            {[
              ["Age",p=>age(p.date_of_birth)==null?"—":age(p.date_of_birth)+" yrs"],
              ["Club",p=>contractMap.get(p.id)?.club?.name||"No current club"],
              ["Contract",p=>contractMap.get(p.id)?.status||"—"],
              ["Salary",p=>money(contractMap.get(p.id)?.annual_salary_usd??null)],
              ["Market value",p=>money(valueMap.get(p.id)?.market_value_usd??null)]
            ].map(([label,getter])=><div key={label as string} style={{display:"grid",gridTemplateColumns:"180px repeat("+rows.length+",minmax(170px,1fr))",gap:8,borderBottom:"1px solid #eee",padding:"9px 0"}}><strong style={{fontSize:11}}>{label}</strong>{rows.map(p=><span key={p.id} style={{fontSize:12}}>{(getter as any)(p)}</span>)}</div>)}
          </div>
          <div style={{marginTop:20}}><div style={{fontSize:10,color:"#888",letterSpacing:".08em",fontWeight:800}}>LATEST-SEASON PERFORMANCE</div>
            {metrics.map(([label,key])=><div key={key} style={{display:"grid",gridTemplateColumns:"180px repeat("+rows.length+",minmax(170px,1fr))",gap:8,borderBottom:"1px solid #eee",padding:"9px 0"}}><strong style={{fontSize:11}}>{label}</strong>{rows.map(p=>{const i=intelMap.get(p.id);const v=i?.[key];return <span key={p.id} style={{fontSize:12}}>{v==null?"—":key==="minutes"?v:Number(v).toFixed(2)}</span>})}</div>)}
          </div>
          <div style={{marginTop:20}}><div style={{fontSize:10,color:"#888",letterSpacing:".08em",fontWeight:800}}>GLOBAL PEER CONTEXT</div><p style={{fontSize:11,color:"#777"}}>Percentiles use each player's latest intelligence season and the corresponding global peer population. They are descriptive research context, not a player rating.</p>
            {percentileMetrics.map(([label,key])=><div key={key} style={{display:"grid",gridTemplateColumns:"180px repeat("+rows.length+",minmax(170px,1fr))",gap:8,borderBottom:"1px solid #eee",padding:"9px 0"}}><strong style={{fontSize:11}}>{label}</strong>{rows.map(p=><span key={p.id} style={{fontSize:12}}>{pct(peerMap.get(p.id)?.[key]??null)}</span>)}</div>)}
          </div>
        </div>
      </section>
      <div className="scout-note" style={{marginTop:14}}>Comparison is limited to documented WFM data. Missing values remain unavailable rather than being treated as zero, and the page does not assign an overall winner or player rating.</div>
    </main>
  </>
}