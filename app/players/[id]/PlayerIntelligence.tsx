"use client";

type Stat={season:string;minutes:number|null;goals:number|null;assists:number|null;xg:number|null;xa:number|null;chances_created:number|null;key_passes:number|null;tackles:number|null;interceptions:number|null;progressive_carries:number|null};
type Value={valuation_date:string|null;market_value_usd:number|null;confidence:string|null};
const n=(v:number|null)=>v||0;
const p90=(v:number,m:number)=>m?v*90/m:null;
const money=(v:number|null)=>v==null?"—":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(v);
const fmt=(v:number|null)=>v==null?"—":v.toLocaleString("en-US",{maximumFractionDigits:2});
const agg=(r:Stat[])=>r.reduce((a,s)=>({minutes:a.minutes+n(s.minutes),goals:a.goals+n(s.goals),assists:a.assists+n(s.assists),xg:a.xg+n(s.xg),xa:a.xa+n(s.xa),chances:a.chances+n(s.chances),key:a.key+n(s.key_passes),tackles:a.tackles+n(s.tackles),interceptions:a.interceptions+n(s.interceptions),carries:a.carries+n(s.progressive_carries)}),{minutes:0,goals:0,assists:0,xg:0,xa:0,chances:0,key:0,tackles:0,interceptions:0,carries:0});
export default function PlayerIntelligence({stats,marketValues,position}:{stats:Stat[];marketValues:Value[];position:string|null}){
 const seasons=Array.from(new Set(stats.map(s=>s.season))).sort((a,b)=>b.localeCompare(a,undefined,{numeric:true}));
 const current=agg(stats.filter(s=>s.season===seasons[0])), previous=agg(stats.filter(s=>s.season===seasons[1]));
 const change=(a:number,b:number)=>b?((a-b)/b)*100:null;
 const latest=marketValues[0]?.market_value_usd??null, prior=marketValues[1]?.market_value_usd??null;
 const rows=seasons.slice(0,6).reverse().map(season=>({season,...agg(stats.filter(s=>s.season===season))}));
 const max=Math.max(1,...rows.map(r=>r.goals+r.assists));
 const metrics=[["Minutes",current.minutes,change(current.minutes,previous.minutes)],["Goals",current.goals,change(current.goals,previous.goals)],["Assists",current.assists,change(current.assists,previous.assists)],["xG",current.xg,change(current.xg,previous.xg)],["xA",current.xa,change(current.xa,previous.xa)],["Chances",current.chances,change(current.chances,previous.chances)]];
 const role=[["Goals / 90",p90(current.goals,current.minutes)],["Assists / 90",p90(current.assists,current.minutes)],["Key Passes / 90",p90(current.key,current.minutes)],["Tackles / 90",p90(current.tackles,current.minutes)],["Interceptions / 90",p90(current.interceptions,current.minutes)],["Progressive Carries / 90",p90(current.carries,current.minutes)]];
 return <section className="player-intelligence"><div className="intelligence-header"><div><h2>Performance Intelligence</h2><p>Season trends, per-90 output and recorded market-value movement.</p></div><a href="/compare">Compare players →</a></div>
 {!stats.length?<div className="intelligence-empty">Performance intelligence will appear as statistics are added.</div>:<><div className="intelligence-stat-grid">{metrics.map(([label,value,delta])=><div className="intelligence-stat" key={String(label)}><span>{label}</span><strong>{fmt(value as number)}</strong>{delta!=null&&<small className={Number(delta)>=0?"trend-up":"trend-down"}>{Number(delta)>=0?"↑":"↓"} {Math.abs(Number(delta)).toFixed(0)}% vs {seasons[1]}</small>}</div>)}</div>
 <div className="intelligence-panels"><div className="intelligence-panel"><b>Season Output</b><small>Goals + assists</small>{rows.map(r=><div className="intelligence-bar" key={r.season}><span>{r.season}</span><i><em style={{width:Math.max(4,((r.goals+r.assists)/max)*100)+"%"}}/></i><strong>{r.goals+r.assists}</strong></div>)}</div>
 <div className="intelligence-panel"><b>Role Metrics · per 90</b><small>Normalized by recorded minutes</small><div className="role-grid">{role.map(([label,value])=><div key={String(label)}><span>{label}</span><strong>{fmt(value as number|null)}</strong></div>)}</div><p>Per-90 figures are descriptive production measures, not player ratings.</p></div>
 <div className="intelligence-panel"><b>Market Value</b><small>Recorded valuations, not a forecast</small><strong className="value-big">{money(latest)}</strong>{prior!=null&&latest!=null&&<div className={latest>=prior?"trend-up":"trend-down"}>{latest>=prior?"↑":"↓"} {Math.abs(((latest-prior)/prior)*100).toFixed(1)}% since prior valuation</div>}<small>{marketValues[0]?.confidence||"Confidence unknown"}</small></div></div></>}
 </section>;
}