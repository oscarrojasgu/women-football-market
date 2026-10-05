"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { useWfmT } from "../../lib/use-wfm-t"

type Row={id:string;name:string;url:string|null;publisher:string|null;source_kind:string;geography:string|null;priority:number;status:string;access_method:string|null;notes:string|null;last_checked_at:string|null;created_at:string;updated_at:string};
const statuses=["candidate","researching","approved","active","paused","retired"];
const kinds=["official_club","official_league","federation","agency","media","database","other"];

export default function SourcePipelinePage(){
 const t=useWfmT()
 const [authorized,setAuthorized]=useState(false),[loading,setLoading]=useState(true),[rows,setRows]=useState<Row[]>([]);
 const [filter,setFilter]=useState("all"),[busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const [name,setName]=useState(""),[url,setUrl]=useState(""),[publisher,setPublisher]=useState(""),[kind,setKind]=useState("official_league"),[geography,setGeography]=useState(""),[priority,setPriority]=useState("50"),[accessMethod,setAccessMethod]=useState(""),[notes,setNotes]=useState("");
 const load=async()=>{
  const {data:u}=await supabase.auth.getUser();if(!u.user){setLoading(false);return}
  const {data:a}=await supabase.from("wfm_admins").select("user_id").eq("user_id",u.user.id).maybeSingle();
  setAuthorized(!!a);if(!a){setLoading(false);return}
  const {data,error:e}=await supabase.from("wfm_source_pipeline").select("*").order("priority",{ascending:true}).order("updated_at",{ascending:false});
  if(e)setError(e.message);setRows((data||[]) as Row[]);setLoading(false);
 };
 useEffect(()=>{void load()},[]);
 const add=async(e:FormEvent)=>{
  e.preventDefault();setBusy(true);setError("");setMessage("");
  if(!name.trim()){setError("Source name is required.");setBusy(false);return}
  const p=Math.max(1,Math.min(100,Number(priority)||50));
  const {error:e2}=await supabase.from("wfm_source_pipeline").insert({name:name.trim(),url:url.trim()||null,publisher:publisher.trim()||null,source_kind:kind,geography:geography.trim()||null,priority:p,status:"candidate",access_method:accessMethod.trim()||null,notes:notes.trim()||null,created_by:(await supabase.auth.getUser()).data.user?.id});
  if(e2)setError(e2.message);else{setName("");setUrl("");setPublisher("");setGeography("");setPriority("50");setAccessMethod("");setNotes("");setMessage("Source candidate added to the acquisition pipeline.");await load()}setBusy(false);
 };
 const update=async(id:string,patch:Record<string,unknown>)=>{
  setError("");const {error:e}=await supabase.from("wfm_source_pipeline").update(patch).eq("id",id);if(e)setError(e.message);else await load();
 };
 const filtered=useMemo(()=>filter==="all"?rows:rows.filter(r=>r.status===filter),[rows,filter]);
 const counts=useMemo(()=>statuses.reduce((a,s)=>({...a,[s]:rows.filter(r=>r.status===s).length}),{} as Record<string,number>),[rows]);
 if(loading)return <main className="account-page"><div className="account-card">{t('Loading source pipeline…')}</div></main>;
 if(!authorized)return <main className="account-page"><div className="account-card"><div className="eyebrow">ADMIN</div><h1>{t('Access restricted')}</h1><p className="account-muted">{t('This workspace is limited to WFM administrators.')}</p></div></main>;
 return <main className="account-page"><section className="account-card">
  <div className="account-card-top"><div><div className="eyebrow">{t('M15 · SOURCE ACQUISITION')}</div><h1>{t('Source')} pipeline</h1><p>Qualify potential data sources before they become production provenance records. This is an internal research queue, not a public source directory.</p></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Link href="/admin/operations" className="outline">{t('Operations')}</Link><Link href="/admin/data" className="outline">{t('Data administration')}</Link></div></div>
  {error&&<div className="account-message account-error">{error}</div>}{message&&<div className="account-message account-success">{message}</div>}
  <div className="coverage-summary">{statuses.map(s=><div key={s}><strong>{counts[s]||0}</strong><span>{s.replaceAll("_"," ")}</span></div>)}</div>
  <div className="club-workspace-grid" style={{marginTop:24}}>
   <section className="settings-section"><div className="settings-section-heading"><span>{t('ADD CANDIDATE')}</span><h2>{t('Research a new source')}</h2></div>
    <form onSubmit={add}>
     <label>{t('Name')}<input value={name} onChange={e=>setName(e.target.value)} placeholder="League official site"/></label>
     <label>{t('URL')}<input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://…"/></label>
     <label>{t('Publisher')}<input value={publisher} onChange={e=>setPublisher(e.target.value)} placeholder="Organization"/></label>
     <label>{t('Source')} kind<select value={kind} onChange={e=>setKind(e.target.value)}>{kinds.map(k=><option key={k} value={k}>{k.replaceAll("_"," ")}</option>)}</select></label>
     <label>{t('Geography')}<input value={geography} onChange={e=>setGeography(e.target.value)} placeholder="Country / region / global"/></label>
     <label>{t('Priority')} (1–100)<input type="number" min="1" max="100" value={priority} onChange={e=>setPriority(e.target.value)}/></label>
     <label>{t('Access method')}<input value={accessMethod} onChange={e=>setAccessMethod(e.target.value)} placeholder="Public web / subscription / direct contact"/></label>
     <label>{t('Notes')}<textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={4}/></label>
     <button className="settings-primary" disabled={busy} type="submit">{busy?"Saving…":"Add source candidate"}</button>
    </form>
   </section>
   <section className="settings-section"><div className="settings-section-heading"><span>{t('PIPELINE')}</span><h2>{filtered.length} sources</h2></div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}><button type="button" className="outline" onClick={()=>setFilter("all")}>{t('All')}</button>{statuses.map(s=><button key={s} type="button" className="outline" onClick={()=>setFilter(s)}>{s.replaceAll("_"," ")}</button>)}</div>
    {filtered.length?filtered.map(r=><div key={r.id} className="account-membership-row"><div style={{minWidth:0}}><strong>{r.name}</strong><small>{r.publisher||"Publisher unknown"}{r.geography?" · "+r.geography:""} · priority {r.priority}</small>{r.url&&<small><a href={r.url} target="_blank" rel="noreferrer">{r.url}</a></small>}{r.notes&&<small>{r.notes}</small>}</div><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><select value={r.status} onChange={e=>void update(r.id,{status:e.target.value,last_checked_at:new Date().toISOString()})}>{statuses.map(s=><option key={s} value={s}>{s.replaceAll("_"," ")}</option>)}</select><button type="button" className="outline" onClick={()=>void update(r.id,{last_checked_at:new Date().toISOString()})}>{t('Check')}</button></div></div>):<p className="account-muted">{t('No sources match this status.')}</p>}
   </section>
  </div>
 </section></main>;
}