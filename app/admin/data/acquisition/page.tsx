"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type Row={id:string;competition_id:string|null;season_id:string|null;club_id:string|null;task_type:string;priority:number;status:string;attempts:number;last_attempted_at:string|null;last_success_at:string|null;next_attempt_at:string|null;error_code:string|null;error_message:string|null;evidence_count:number;notes:string|null;};
const TASKS=["all","competition_structure","club_rosters","player_profiles","player_stats","transfers"];
const STATUSES=["all","queued","in_progress","blocked","review","completed","failed","paused"];

export default function AcquisitionQueuePage(){
 const [authorized,setAuthorized]=useState(false),[loading,setLoading]=useState(true),[rows,setRows]=useState<Row[]>([]);
 const [task,setTask]=useState("all"),[status,setStatus]=useState("all"),[message,setMessage]=useState(""),[error,setError]=useState("");
 const load=async()=>{
  const {data:u}=await supabase.auth.getUser();if(!u.user){setLoading(false);return}
  const {data:a}=await supabase.from("wfm_admins").select("user_id").eq("user_id",u.user.id).maybeSingle();setAuthorized(!!a);
  if(!a){setLoading(false);return}
  const {data,e}=await supabase.from("wfm_acquisition_queue").select("*").order("priority",{ascending:true}).order("updated_at",{ascending:true}).limit(500);
  if(e)setError(e.message);else setRows((data??[]) as Row[]);setLoading(false);
 };
 useEffect(()=>{void load()},[]);
 const filtered=useMemo(()=>rows.filter(r=>(task==="all"||r.task_type===task)&&(status==="all"||r.status===status)),[rows,task,status]);
 const update=async(id:string,next:string)=>{
  setError("");setMessage("");
  const current=rows.find(r=>r.id===id);
  const patch:any={status:next,updated_at:new Date().toISOString()};
  if(next==="in_progress"){patch.attempts=(current?.attempts??0)+1;patch.last_attempted_at=new Date().toISOString()}
  if(next==="completed")patch.last_success_at=new Date().toISOString();
  const {error:e}=await supabase.from("wfm_acquisition_queue").update(patch).eq("id",id);
  if(e)setError(e.message);else{setMessage("Queue updated.");await load()}
 };
 if(loading)return <main className="account-page"><div className="account-card">Loading acquisition queue…</div></main>;
 if(!authorized)return <main className="account-page"><div className="account-card"><div className="eyebrow">ADMIN</div><h1>Access restricted</h1></div></main>;
 return <main className="account-page"><section className="account-card">
  <div className="account-card-top"><div><div className="eyebrow">WFM ADMIN · M20</div><h1>Global acquisition queue</h1><p>Control competition-level acquisition work before data reaches the production intelligence layer.</p></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Link href="/admin/data" className="outline">Data Admin</Link><Link href="/admin/data/coverage" className="outline">League Coverage</Link><Link href="/admin/data/sources" className="outline">Sources</Link></div></div>
  {error&&<div className="account-message account-error">{error}</div>}{message&&<div className="account-message account-success">{message}</div>}
  <section className="settings-section"><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}><select value={task} onChange={e=>setTask(e.target.value)}>{TASKS.map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)}>{STATUSES.map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}</select><span className="account-muted">{filtered.length} tasks</span></div>
  {filtered.map(r=><div key={r.id} className="account-membership-row"><div style={{minWidth:0}}><strong>{r.task_type.replaceAll("_"," ")}</strong><small>Priority {r.priority} · attempts {r.attempts} · evidence {r.evidence_count}</small>{r.error_message&&<small>{r.error_code?String(r.error_code)+": ":""}{r.error_message}</small>}</div><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><span className="account-status-pill">{r.status}</span>{r.status==="queued"&&<button className="outline" type="button" onClick={()=>void update(r.id,"in_progress")}>Start</button>}{r.status==="in_progress"&&<><button className="outline" type="button" onClick={()=>void update(r.id,"review")}>Review</button><button className="outline" type="button" onClick={()=>void update(r.id,"completed")}>Complete</button></>}{["failed","blocked","review"].includes(r.status)&&<button className="outline" type="button" onClick={()=>void update(r.id,"queued")}>Requeue</button>}</div></div>)}
  {!filtered.length&&<p className="account-muted">No acquisition tasks match the current filters.</p>}</section>
 </section></main>
}
