"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Batch = {
  id:string; name:string; provider:string; source_type:string; file_name:string|null;
  status:string; total_rows:number; accepted_rows:number; rejected_rows:number;
  needs_review_rows:number; inserted_rows:number; updated_rows:number; error_rows:number;
  created_at:string; completed_at:string|null;
};

type QueueRow = {
  id:string; entity_type:string; external_id:string; external_name:string|null;
  country:string|null; status:string; matched_player_id:string|null; matched_club_id:string|null;
  error_message:string|null; created_at:string;
};

const statuses=["draft","queued","processing","completed","completed_with_errors","failed","cancelled"];

export default function DataAdminPage(){
  const [authorized,setAuthorized]=useState(false);
  const [loading,setLoading]=useState(true);
  const [batches,setBatches]=useState<Batch[]>([]);
  const [queue,setQueue]=useState<QueueRow[]>([]);
  const [name,setName]=useState("");
  const [provider,setProvider]=useState("manual");
  const [sourceType,setSourceType]=useState("csv");
  const [fileName,setFileName]=useState("");
  const [filter,setFilter]=useState("all");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  const load=async()=>{
    const {data:u}=await supabase.auth.getUser();
    if(!u.user){setLoading(false);return}
    const {data:a}=await supabase.from("wfm_admins").select("user_id").eq("user_id",u.user.id).maybeSingle();
    setAuthorized(!!a);
    if(!a){setLoading(false);return}
    const [{data:b},{data:q}]=await Promise.all([
      supabase.from("wfm_import_batches").select("*").order("created_at",{ascending:false}).limit(50),
      supabase.from("entity_import_queue").select("id,entity_type,external_id,external_name,country,status,matched_player_id,matched_club_id,error_message,created_at").order("created_at",{ascending:false}).limit(100)
    ]);
    setBatches((b??[]) as Batch[]);
    setQueue((q??[]) as QueueRow[]);
    setLoading(false);
  };

  useEffect(()=>{void load()},[]);

  const createBatch=async(ev:FormEvent)=>{
    ev.preventDefault();setBusy(true);setError("");setMessage("");
    if(!name.trim()){setError("Enter an import name.");setBusy(false);return}
    const {error:e}=await supabase.from("wfm_import_batches").insert({
      name:name.trim(),provider:provider.trim()||"manual",source_type:sourceType,
      file_name:fileName.trim()||null,status:"draft"
    });
    if(e)setError(e.message);else{setName("");setFileName("");setMessage("Import batch created.");await load()}
    setBusy(false);
  };

  const updateStatus=async(id:string,status:string)=>{
    setError("");setMessage("");
    const patch:Record<string,unknown>={status};
    if(status==="processing")patch.started_at=new Date().toISOString();
    if(["completed","completed_with_errors","failed","cancelled"].includes(status))patch.completed_at=new Date().toISOString();
    const {error:e}=await supabase.from("wfm_import_batches").update(patch).eq("id",id);
    if(e)setError(e.message);else await load();
  };

  const filteredBatches=useMemo(()=>filter==="all"?batches:batches.filter(b=>b.status===filter),[batches,filter]);

  const stats=useMemo(()=>({
    batches:batches.length,
    pending:queue.filter(q=>["pending","needs_review","ready"].includes(q.status)).length,
    review:queue.filter(q=>q.status==="needs_review").length,
    errors:queue.filter(q=>q.error_message||q.status==="rejected").length
  }),[batches,queue]);

  if(loading)return <main className="account-page"><div className="account-card">Loading data administration…</div></main>;
  if(!authorized)return <main className="account-page"><div className="account-card"><div className="eyebrow">ADMIN</div><h1>Access restricted</h1><p className="account-muted">This workspace is limited to WFM administrators.</p></div></main>;

  return <main className="account-page">
    <section className="account-card">
      <div className="account-card-top">
        <div>
          <div className="eyebrow">WFM ADMIN · DATA</div>
          <h1>Data administration</h1>
          <p>Control imports, review incoming entities, and prepare WFM data for scalable publishing.</p>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <Link href="/admin/commercial" className="outline">Commercial</Link>
          <Link href="/admin/club-access" className="outline">Club access</Link>
        </div>
      </div>

      {error&&<div className="account-message account-error">{error}</div>}
      {message&&<div className="account-message account-success">{message}</div>}

      <div className="club-workspace-grid">
        <section className="settings-section">
          <div className="settings-section-heading"><span>IMPORT</span><h2>Create batch</h2></div>
          <form onSubmit={createBatch}>
            <label>Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="NWSL 2026 player import" /></label>
            <label>Provider<input value={provider} onChange={e=>setProvider(e.target.value)} placeholder="manual / provider name" /></label>
            <label>Source type<select value={sourceType} onChange={e=>setSourceType(e.target.value)}><option value="csv">CSV</option><option value="manual">Manual</option><option value="api">API</option><option value="provider">Provider</option><option value="migration">Migration</option></select></label>
            <label>File name<input value={fileName} onChange={e=>setFileName(e.target.value)} placeholder="optional source filename" /></label>
            <button className="settings-primary" disabled={busy} type="submit">{busy?"Creating…":"Create import batch"}</button>
          </form>
        </section>

        <section className="settings-section">
          <div className="settings-section-heading"><span>QUEUE</span><h2>Current status</h2></div>
          <div className="account-membership-row"><div><strong>{stats.batches}</strong><small>Recent import batches</small></div></div>
          <div className="account-membership-row"><div><strong>{stats.pending}</strong><small>Pending / ready review records</small></div></div>
          <div className="account-membership-row"><div><strong>{stats.review}</strong><small>Records needing review</small></div></div>
          <div className="account-membership-row"><div><strong>{stats.errors}</strong><small>Rejected / error records</small></div></div>
        </section>
      </div>

      <section className="settings-section" style={{marginTop:24}}>
        <div className="settings-section-heading"><span>BATCH HISTORY</span><h2>{filteredBatches.length} batches</h2></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
          <button type="button" className="outline" onClick={()=>setFilter("all")}>All</button>
          {statuses.map(s=><button key={s} type="button" className="outline" onClick={()=>setFilter(s)}>{s.replaceAll("_"," ")}</button>)}
        </div>
        {filteredBatches.length?filteredBatches.map(b=><div key={b.id} className="account-membership-row">
          <div style={{minWidth:0}}>
            <strong>{b.name}</strong>
            <small>{b.provider} · {b.source_type}{b.file_name?" · "+b.file_name:""} · {new Date(b.created_at).toLocaleString()}</small>
            <small>{b.total_rows} rows · {b.inserted_rows} inserted · {b.updated_rows} updated · {b.needs_review_rows} review · {b.error_rows} errors</small>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <span className="account-status-pill">{b.status}</span>
            {b.status==="draft"&&<button type="button" className="outline" onClick={()=>void updateStatus(b.id,"queued")}>Queue</button>}
            {b.status==="queued"&&<button type="button" className="outline" onClick={()=>void updateStatus(b.id,"processing")}>Start</button>}
            {b.status==="processing"&&<button type="button" className="outline" onClick={()=>void updateStatus(b.id,"completed")}>Complete</button>}
          </div>
        </div>):<p className="account-muted">No import batches yet.</p>}
      </section>

      <section className="settings-section" style={{marginTop:24}}>
        <div className="settings-section-heading"><span>REVIEW QUEUE</span><h2>{queue.length} recent records</h2></div>
        {queue.length?queue.map(q=><div key={q.id} className="account-membership-row">
          <div style={{minWidth:0}}>
            <strong>{q.external_name||q.external_id}</strong>
            <small>{q.entity_type} · {q.external_id}{q.country?" · "+q.country:""}</small>
            {q.error_message&&<small>{q.error_message}</small>}
          </div>
          <span className="account-status-pill">{q.status}</span>
        </div>):<p className="account-muted">The import review queue is empty.</p>}
      </section>
    </section>
  </main>;
}
