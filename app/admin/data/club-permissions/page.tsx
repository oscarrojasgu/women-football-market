"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../../lib/supabase";

type Row={id:string;club_id:string;outreach_status:string;contact_name:string|null;contact_role:string|null;contact_email:string|null;contact_url:string|null;last_contacted_at:string|null;next_follow_up_at:string|null;permission_status:string;roster_allowed:boolean|null;stats_allowed:boolean|null;contracts_allowed:boolean|null;salaries_allowed:boolean|null;transfers_allowed:boolean|null;photos_allowed:boolean|null;logos_allowed:boolean|null;commercial_use_allowed:boolean|null;attribution_required:boolean|null;agreement_reference:string|null;agreement_document_url:string|null;starts_at:string|null;ends_at:string|null;notes:string|null;clubs:{name:string;country:string|null;league:string|null}|null};
const OUT=["not_contacted","researching_contact","drafted","contacted","follow_up","in_discussion","permission_granted","licensed","restricted","declined","no_response"];
const PERM=["unknown","requested","partial","granted","restricted","declined","expired"];

export default function ClubPermissionPage(){
 const [authorized,setAuthorized]=useState(false),[loading,setLoading]=useState(true),[rows,setRows]=useState<Row[]>([]);
 const [q,setQ]=useState(""),[out,setOut]=useState("all"),[perm,setPerm]=useState("all"),[message,setMessage]=useState(""),[error,setError]=useState("");
 const load=async()=>{
  const {data:u}=await supabase.auth.getUser();if(!u.user){setLoading(false);return}
  const {data:a}=await supabase.from("wfm_admins").select("user_id").eq("user_id",u.user.id).maybeSingle();setAuthorized(!!a);if(!a){setLoading(false);return}
  const {data,e}=await supabase.from("wfm_club_permission_tracker").select("*,clubs(name,country,league)").order("outreach_status").order("updated_at",{ascending:false});
  if(e)setError(e.message);else setRows((data??[]) as Row[]);setLoading(false);
 };
 useEffect(()=>{void load()},[]);
 const filtered=useMemo(()=>rows.filter(r=>{const name=(r.clubs?.name??"").toLowerCase();return(!q||name.includes(q.toLowerCase())||(r.clubs?.country??"").toLowerCase().includes(q.toLowerCase()))&&(out==="all"||r.outreach_status===out)&&(perm==="all"||r.permission_status===perm)}),[rows,q,out,perm]);
 const update=async(id:string,patch:Record<string,unknown>)=>{
  setError("");setMessage("");
  const {error:e}=await supabase.from("wfm_club_permission_tracker").update({...patch,updated_at:new Date().toISOString()}).eq("id",id);
  if(e)setError(e.message);else{setMessage("Permission tracker updated.");await load()}
 };
 const counts=useMemo(()=>({total:rows.length,contacted:rows.filter(r=>!["not_contacted","researching_contact","drafted"].includes(r.outreach_status)).length,granted:rows.filter(r=>["granted"].includes(r.permission_status)||r.outreach_status==="permission_granted"||r.outreach_status==="licensed").length,follow:rows.filter(r=>r.outreach_status==="follow_up").length}),[rows]);
 if(loading)return <main className="account-page"><div className="account-card">Loading club permission tracker…</div></main>;
 if(!authorized)return <main className="account-page"><div className="account-card"><div className="eyebrow">ADMIN</div><h1>Access restricted</h1></div></main>;
 return <main className="account-page"><section className="account-card">
  <div className="account-card-top"><div><div className="eyebrow">WFM ADMIN · M20.3</div><h1>Club Permission & Licensing Tracker</h1><p>Track outreach, permission scope, commercial rights, agreements and follow-ups without treating unverified permission as granted.</p></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Link href="/admin/data" className="outline">Data Admin</Link><Link href="/admin/data/acquisition" className="outline">Acquisition Queue</Link><Link href="/admin/licensing" className="outline">Licensing</Link></div></div>
  {error&&<div className="account-message account-error">{error}</div>}{message&&<div className="account-message account-success">{message}</div>}
  <div className="club-workspace-grid">
   <section className="settings-section"><div className="settings-section-heading"><span>COVERAGE</span><h2>Permission pipeline</h2></div><div className="account-membership-row"><div><strong>{counts.total}</strong><small>Clubs tracked</small></div></div><div className="account-membership-row"><div><strong>{counts.contacted}</strong><small>Outreach started</small></div></div><div className="account-membership-row"><div><strong>{counts.granted}</strong><small>Permission granted / licensed</small></div></div><div className="account-membership-row"><div><strong>{counts.follow}</strong><small>Follow-ups due in workflow</small></div></div></section>
   <section className="settings-section"><div className="settings-section-heading"><span>FILTERS</span><h2>Find a club</h2></div><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search club or country"/><select value={out} onChange={e=>setOut(e.target.value)}><option value="all">All outreach statuses</option>{OUT.map(x=><option key={x}>{x}</option>)}</select><select value={perm} onChange={e=>setPerm(e.target.value)}><option value="all">All permission statuses</option>{PERM.map(x=><option key={x}>{x}</option>)}</select></section>
  </div>
  <section className="settings-section" style={{marginTop:24}}><div className="settings-section-heading"><span>CLUBS</span><h2>{filtered.length} records</h2></div>
   {filtered.map(r=><div key={r.id} className="account-membership-row"><div style={{minWidth:0,flex:1}}><strong>{r.clubs?.name??"Unknown club"}</strong><small>{r.clubs?.country??"—"}{r.clubs?.league?" · "+r.clubs.league:""}</small><small>Contact: {r.contact_name??"Not assigned"}{r.contact_role?" · "+r.contact_role:""}{r.contact_email?" · "+r.contact_email:""}</small><small>Last contact: {r.last_contacted_at?new Date(r.last_contacted_at).toLocaleDateString():"Never"} · Follow-up: {r.next_follow_up_at?new Date(r.next_follow_up_at).toLocaleDateString():"—"}</small></div><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><select value={r.outreach_status} onChange={e=>void update(r.id,{outreach_status:e.target.value})}>{OUT.map(x=><option key={x}>{x}</option>)}</select><select value={r.permission_status} onChange={e=>void update(r.id,{permission_status:e.target.value})}>{PERM.map(x=><option key={x}>{x}</option>)}</select><button className="outline" type="button" onClick={()=>void update(r.id,{last_contacted_at:new Date().toISOString(),outreach_status:"contacted"})}>Log Contact</button></div></div>)}
   {!filtered.length&&<p className="account-muted">No clubs match the current filters.</p>}
  </section>
 </section></main>
}
