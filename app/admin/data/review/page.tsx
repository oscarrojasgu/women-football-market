"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { useWfmT } from '../../lib/use-wfm-t'

type QueueRow={id:string;entity_type:string;external_id:string;external_name:string|null;country:string|null;status:string;matched_player_id:string|null;matched_club_id:string|null;payload:Record<string,string>|null;error_message:string|null;created_at:string};
type Candidate={id:string;full_name?:string;name?:string;nationality?:string|null;position?:string|null;country?:string|null;league?:string|null};
type NewEntity={name:string;country:string;position:string;date_of_birth:string;preferred_foot:string;league:string};

function score(name:string,c:Candidate){
 const a=name.toLowerCase().trim(),b=(c.full_name||c.name||"").toLowerCase().trim();
 if(!a||!b)return 0;if(a===b)return 100;
 const aw=new Set(a.split(/\s+/)),bw=new Set(b.split(/\s+/));
 const common=[...aw].filter(x=>bw.has(x)).length;
 return Math.round(common/Math.max(aw.size,bw.size)*90);
}

function initialEntity(row:QueueRow):NewEntity{
 const p=row.payload||{};
 return {
  name:row.external_name||"",
  country:row.country||p.country||p.nationality||"",
  position:p.position||"",
  date_of_birth:p.date_of_birth||p.dob||"",
  preferred_foot:p.preferred_foot||p.foot||"",
  league:p.league||p.competition||"",
 };
}

export default function ImportReviewPage(){
 const t=useWfmT()
 const [authorized,setAuthorized]=useState(false),[loading,setLoading]=useState(true),[rows,setRows]=useState<QueueRow[]>([]);
 const [selected,setSelected]=useState<QueueRow|null>(null),[candidates,setCandidates]=useState<Candidate[]>([]);
 const [search,setSearch]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 const [newEntity,setNewEntity]=useState<NewEntity>({name:"",country:"",position:"",date_of_birth:"",preferred_foot:"",league:""});
 const [showCreate,setShowCreate]=useState(false);

 const load=async()=>{
  const {data:u}=await supabase.auth.getUser();
  if(!u.user){setLoading(false);return}
  const {data:a}=await supabase.from("wfm_admins").select("user_id").eq("user_id",u.user.id).maybeSingle();
  setAuthorized(!!a);if(!a){setLoading(false);return}
  const {data}=await supabase.from("entity_import_queue")
   .select("id,entity_type,external_id,external_name,country,status,matched_player_id,matched_club_id,payload,error_message,created_at")
   .in("status",["pending","needs_review","ready","rejected"]).order("created_at",{ascending:true}).limit(200);
  setRows((data||[]) as QueueRow[]);setLoading(false);
 };

 useEffect(()=>{void load()},[]);

 useEffect(()=>{
  setCandidates([]);
  setShowCreate(false);
  if(selected){setSearch(selected.external_name||"");setNewEntity(initialEntity(selected))}
  else{setSearch("");setNewEntity({name:"",country:"",position:"",date_of_birth:"",preferred_foot:"",league:""})}
 },[selected]);

 useEffect(()=>{
  let active=true;
  async function run(){
   if(!selected||search.trim().length<2){setCandidates([]);return}
   const table=selected.entity_type==="player"?"players":"clubs";
   const field=selected.entity_type==="player"?"full_name":"name";
   const {data}=await supabase.from(table).select(selected.entity_type==="player"?"id,full_name,nationality,position":"id,name,country,league").ilike(field,`%${search.trim()}%`).order(field).limit(12);
   if(active)setCandidates((data||[]) as Candidate[]);
  }
  void run();return()=>{active=false}
 },[search,selected]);

 const validate=async()=>{if(!selected)return;setBusy(true);setError("");setMessage("");const {data,error:e}=await supabase.rpc("wfm_validate_player_import",{p_queue_id:selected.id});if(e)setError(e.message);else{setMessage(`Validation score: ${data?.score??0}. Status: ${data?.status||"updated"}.`);setSelected(null);await load()}setBusy(false)};

 const publish=async()=>{
  if(!selected)return;
  setBusy(true);setError("");setMessage("");
  const {data,error:e}=await supabase.rpc("wfm_publish_import_queue_item",{p_queue_id:selected.id});
  if(e)setError(e.message);
  else{setMessage(`Published ${selected.entity_type} successfully (WFM ID ${data?.entity_id||"created"}).`);setSelected(null);await load()}
  setBusy(false);
 };

 const action=async(status:string,matchId?:string)=>{
  if(!selected)return;
  setBusy(true);setError("");setMessage("");
  const patch:Record<string,unknown>={status:status==="matched"?"ready":status};
  if(selected.entity_type==="player"&&matchId)patch.matched_player_id=matchId;
  if(selected.entity_type==="club"&&matchId)patch.matched_club_id=matchId;
  const {error:e}=await supabase.from("entity_import_queue").update(patch).eq("id",selected.id);
  if(e)setError(e.message);
  else{setMessage(status==="matched"?"Entity matched and prepared for publishing.":"Record marked "+status+".");setSelected(null);await load()}
  setBusy(false);
 };

 const validateNew=()=>{
  const name=newEntity.name.trim();
  if(!name)return "Name is required.";
  if(selected?.entity_type==="player"&&newEntity.date_of_birth&&!/^\d{4}-\d{2}-\d{2}$/.test(newEntity.date_of_birth))return "Date of birth must use YYYY-MM-DD.";
  return "";
 };

 const createNew=async()=>{
  if(!selected)return;
  const validation=validateNew();if(validation){setError(validation);return}
  setBusy(true);setError("");setMessage("");
  const table=selected.entity_type==="player"?"players":"clubs";
  const field=selected.entity_type==="player"?"full_name":"name";
  const {data:dupes}=await supabase.from(table).select(selected.entity_type==="player"?"id,full_name":"id,name").ilike(field,`%${newEntity.name.trim()}%`).limit(10);
  if(dupes&&dupes.length){
   setError("A similar WFM entity already exists. Review the matches before creating a new record.");setCandidates((dupes||[]) as Candidate[]);setShowCreate(false);setBusy(false);return;
  }
  const existingPayload=selected.payload||{};
  const merged={...existingPayload,...newEntity,name:newEntity.name.trim()};
  const {error:e}=await supabase.from("entity_import_queue").update({payload:merged,external_name:newEntity.name.trim(),country:newEntity.country.trim()||null,status:"ready",error_message:null}).eq("id",selected.id);
  if(e)setError(e.message);
  else{setMessage("New entity prepared and validated. It is ready for the publish step; no production record was created.");setSelected(null);await load()}
  setBusy(false);
 };

 const sorted=useMemo(()=>[...candidates].sort((a,b)=>score(selected?.external_name||"",b)-score(selected?.external_name||"",a)),[candidates,selected]);

 if(loading)return <main className="account-page"><div className="account-card">{t("Loading import review…")}</div></main>;
 if(!authorized)return <main className="account-page"><div className="account-card"><div className="eyebrow">ADMIN</div><h1>{t("Access restricted")}</h1><p className="account-muted">{t("This workspace is limited to WFM administrators.")}</p></div></main>;

 return <main className="account-page"><section className="account-card">
  <div className="account-card-top"><div><div className="eyebrow">{t("WFM ADMIN · DATA REVIEW")}</div><h1>{t("Entity review")}</h1><p>Match imported records to existing WFM entities or prepare a validated new entity before publishing.</p></div><Link href="/admin/data" className="outline">{t("← Data administration")}</Link></div>
  {error&&<div className="account-message account-error">{error}</div>}{message&&<div className="account-message account-success">{message}</div>}
  <div className="club-workspace-grid">
   <section className="settings-section">
    <div className="settings-section-heading"><span>{t("INCOMING")}</span><h2>{rows.length} records</h2></div>
    {rows.length?rows.map(r=><button key={r.id} type="button" onClick={()=>setSelected(r)} style={{display:"block",width:"100%",textAlign:"left",border:"0",background:"transparent",padding:0,cursor:"pointer"}}><div className="account-membership-row" style={{marginBottom:8}}><div style={{minWidth:0}}><strong>{r.external_name||r.external_id}</strong><small>{r.entity_type} · {r.external_id}{r.country?" · "+r.country:""}</small></div><span className="account-status-pill">{r.status}</span></div></button>):<p className="account-muted">{t("No records are waiting for review.")}</p>}
   </section>
   <section className="settings-section">
    <div className="settings-section-heading"><span>{t("DETAILS")}</span><h2>{selected?selected.external_name||selected.external_id:"Select a record"}</h2></div>
    {selected?<div>
      <p className="account-muted">{selected.entity_type} · provider ID {selected.external_id}{selected.country?" · "+selected.country:""}</p>
      {selected.error_message&&<div className="account-message account-error">{selected.error_message}</div>}
      <label>Search existing WFM {selected.entity_type==="player"?"player":"club"}<input value={search} onChange={e=>setSearch(e.target.value)} placeholder={selected.entity_type==="player"?"Search by player name":"Search by club name"}/></label>
      <div style={{marginTop:14}}>
       {sorted.length?sorted.map(c=><div key={c.id} className="account-membership-row"><div><strong>{c.full_name||c.name}</strong><small>{c.nationality||c.country||"Country unknown"}{c.position?" · "+c.position:""}{c.league?" · "+c.league:""} · match {score(selected.external_name||"",c)}%</small></div><button type="button" className="outline" disabled={busy} onClick={()=>void action("matched",c.id)}>{t("Match")}</button></div>):<p className="account-muted">{t("No candidate matches yet.")}</p>}
      </div>
      <div style={{marginTop:18,paddingTop:18,borderTop:"1px solid var(--border,#ddd)"}}>
       {!showCreate?<button type="button" className="outline" disabled={busy} onClick={()=>{setShowCreate(true);setNewEntity(initialEntity(selected))}}>Create new {selected.entity_type}</button>:
       <div>
        <div className="settings-section-heading"><span>{t("NEW ENTITY")}</span><h2>Create new {selected.entity_type}</h2></div>
        <p className="account-muted">This only prepares the record for validation. It does not create a production player or club yet.</p>
        <label>{t("Name")}<input value={newEntity.name} onChange={e=>setNewEntity({...newEntity,name:e.target.value})} /></label>
        <label>{t("Country / nationality")}<input value={newEntity.country} onChange={e=>setNewEntity({...newEntity,country:e.target.value})} /></label>
        {selected.entity_type==="player"&&<>
         <label>{t("Position")}<input value={newEntity.position} onChange={e=>setNewEntity({...newEntity,position:e.target.value})} /></label>
         <label>{t("Date of birth")}<input type="date" value={newEntity.date_of_birth} onChange={e=>setNewEntity({...newEntity,date_of_birth:e.target.value})} /></label>
         <label>{t("Preferred foot")}<input value={newEntity.preferred_foot} onChange={e=>setNewEntity({...newEntity,preferred_foot:e.target.value})} /></label>
        </>}
        <label>{t("League / competition")}<input value={newEntity.league} onChange={e=>setNewEntity({...newEntity,league:e.target.value})} /></label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}><button type="button" className="settings-primary" disabled={busy} onClick={()=>void createNew()}>{busy?"Validating…":"Validate & prepare"}</button><button type="button" className="outline" disabled={busy} onClick={()=>setShowCreate(false)}>{t("Cancel")}</button></div>
       </div>}
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:18}}>{selected.entity_type==="player"&&(selected.status==="pending"||selected.status==="needs_review")&&<button type="button" className="outline" disabled={busy} onClick={()=>void validate()}>{t("Validate player")}</button>}{selected.status==="ready"&&<button type="button" className="settings-primary" disabled={busy} onClick={()=>void publish()}>{busy?"Publishing…":"Publish to WFM"}</button>}<button type="button" className="outline" disabled={busy} onClick={()=>void action("needs_review")}>{t("Needs review")}</button><button type="button" className="outline" disabled={busy} onClick={()=>void action("rejected")}>Reject</button></div>
    </div>:<p className="account-muted">{t("Select an incoming record to review its candidates.")}</p>}
   </section>
  </div>
 </section></main>;
}
