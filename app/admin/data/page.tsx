"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Batch={id:string;name:string;provider:string;source_type:string;file_name:string|null;status:string;total_rows:number;accepted_rows:number;rejected_rows:number;needs_review_rows:number;inserted_rows:number;updated_rows:number;error_rows:number;created_at:string;completed_at:string|null};
type QueueRow={id:string;entity_type:string;external_id:string;external_name:string|null;country:string|null;status:string;matched_player_id:string|null;matched_club_id:string|null;error_message:string|null;created_at:string};
type CsvRow={entity_type:string;external_id:string;external_name:string;country:string;competition:string;season:string;raw:Record<string,string>;valid:boolean;error:string};
const statuses=["draft","queued","processing","completed","completed_with_errors","failed","cancelled"];

function parseCsv(text:string):Record<string,string>[]{
 const rows:string[][]=[];let row:string[]=[];let cell="";let quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];const n=text[i+1];
  if(c==='"'&&quoted&&n==='"'){cell+='"';i++;continue}
  if(c==='"'){quoted=!quoted;continue}
  if(c===","&&!quoted){row.push(cell);cell="";continue}
  if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&n==="\n")i++;row.push(cell);cell="";if(row.some(v=>v.trim()!==''))rows.push(row);row=[];continue}
  cell+=c;
 }
 if(cell||row.length){row.push(cell);if(row.some(v=>v.trim()!==''))rows.push(row)}
 if(!rows.length)return[];
 const headers=rows[0].map(h=>h.trim().toLowerCase().replace(/\s+/g,"_"));
 return rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]??"").trim()])));
}

function normalize(row:Record<string,string>):CsvRow{
 const entity=(row.entity_type||row.type||"").toLowerCase();
 const id=row.external_id||row.provider_id||row.id||"";
 const name=row.external_name||row.name||row.player_name||row.club_name||"";
 const error=!["player","club"].includes(entity)?"entity_type must be player or club":!id?"external_id is required":"";
 return {entity_type:entity,external_id:id,external_name:name,country:row.country||row.nationality||"",competition:row.competition||row.league||"",season:row.season||"",raw:row,valid:!error,error};
}

export default function DataAdminPage(){
 const [authorized,setAuthorized]=useState(false);const [loading,setLoading]=useState(true);const [batches,setBatches]=useState<Batch[]>([]);const [queue,setQueue]=useState<QueueRow[]>([]);
 const [name,setName]=useState("");const [provider,setProvider]=useState("manual");const [sourceType,setSourceType]=useState("csv");const [fileName,setFileName]=useState("");
 const [filter,setFilter]=useState("all");const [preview,setPreview]=useState<CsvRow[]>([]);const [csvRows,setCsvRows]=useState<CsvRow[]>([]);const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const [error,setError]=useState("");

 const load=async()=>{
  const {data:u}=await supabase.auth.getUser();if(!u.user){setLoading(false);return}
  const {data:a}=await supabase.from("wfm_admins").select("user_id").eq("user_id",u.user.id).maybeSingle();setAuthorized(!!a);if(!a){setLoading(false);return}
  const [{data:b},{data:q}]=await Promise.all([
   supabase.from("wfm_import_batches").select("*").order("created_at",{ascending:false}).limit(50),
   supabase.from("entity_import_queue").select("id,entity_type,external_id,external_name,country,status,matched_player_id,matched_club_id,error_message,created_at").order("created_at",{ascending:false}).limit(100)
  ]);
  setBatches((b??[]) as Batch[]);setQueue((q??[]) as QueueRow[]);setLoading(false);
 };
 useEffect(()=>{void load()},[]);

 const onFile=async(ev:ChangeEvent<HTMLInputElement>)=>{
  const file=ev.target.files?.[0];if(!file)return;setError("");setMessage("");
  if(!file.name.toLowerCase().endsWith(".csv")){setError("Please select a CSV file.");return}
  const parsed=parseCsv(await file.text()).map(normalize);setFileName(file.name);setCsvRows(parsed);setPreview(parsed.slice(0,25));
  if(!parsed.length)setError("The CSV contains no data rows.");else setMessage("CSV loaded. Review the preview before importing.");
 };
 const createBatch=async(ev:FormEvent)=>{
  ev.preventDefault();setBusy(true);setError("");setMessage("");
  if(!name.trim()){setError("Enter an import name.");setBusy(false);return}
  if(!csvRows.length){setError("Choose a CSV file first.");setBusy(false);return}
  const valid=csvRows.filter(r=>r.valid),invalid=csvRows.length-valid.length;
  const {data:b,error:e}=await supabase.from("wfm_import_batches").insert({
   name:name.trim(),provider:provider.trim()||"manual",source_type:sourceType,file_name:fileName||null,status:"processing",
   total_rows:csvRows.length,accepted_rows:valid.length,rejected_rows:invalid,needs_review_rows:valid.length
  }).select("id").single();
  if(e||!b){setError(e?.message||"Could not create import batch.");setBusy(false);return}
  const rows=csvRows.map(r=>({provider:provider.trim()||"manual",entity_type:r.entity_type,external_id:r.external_id,external_name:r.external_name||null,country:r.country||null,payload:r.raw,status:r.valid?"pending":"rejected",import_batch_id:b.id,error_message:r.valid?null:r.error}));
  let insertError="";
  for(let i=0;i<rows.length;i+=500){const {error:ie}=await supabase.from("entity_import_queue").insert(rows.slice(i,i+500));if(ie){insertError=ie.message;break}}
  if(insertError){await supabase.from("wfm_import_batches").update({status:"failed",error_rows:csvRows.length,completed_at:new Date().toISOString()}).eq("id",b.id);setError(insertError)}
  else{await supabase.from("wfm_import_batches").update({status:"queued"}).eq("id",b.id);setName("");setFileName("");setCsvRows([]);setPreview([]);setMessage("CSV imported into the review queue. No production player or club records were published.");await load()}
  setBusy(false);
 };
 const updateStatus=async(id:string,status:string)=>{
  setError("");const patch:Record<string,unknown>={status};if(status==="processing")patch.started_at=new Date().toISOString();if(["completed","completed_with_errors","failed","cancelled"].includes(status))patch.completed_at=new Date().toISOString();
  const {error:e}=await supabase.from("wfm_import_batches").update(patch).eq("id",id);if(e)setError(e.message);else await load();
 };
 const filteredBatches=useMemo(()=>filter==="all"?batches:batches.filter(b=>b.status===filter),[batches,filter]);
 const stats=useMemo(()=>({batches:batches.length,pending:queue.filter(q=>["pending","needs_review","ready"].includes(q.status)).length,review:queue.filter(q=>q.status==="needs_review").length,errors:queue.filter(q=>q.error_message||q.status==="rejected").length}),[batches,queue]);

 if(loading)return <main className="account-page"><div className="account-card">Loading data administration…</div></main>;
 if(!authorized)return <main className="account-page"><div className="account-card"><div className="eyebrow">ADMIN</div><h1>Access restricted</h1><p className="account-muted">This workspace is limited to WFM administrators.</p></div></main>;
 return <main className="account-page"><section className="account-card">
  <div className="account-card-top"><div><div className="eyebrow">WFM ADMIN · DATA</div><h1>Data administration</h1><p>Import source data into a controlled review queue before anything is published to WFM.</p></div><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><Link href="/admin/data/review" className="outline">Review queue</Link><Link href="/admin/data/players" className="outline">Player coverage</Link><Link href="/admin/data/coverage" className="outline">League coverage</Link><Link href="/admin/commercial" className="outline">Commercial</Link><Link href="/admin/club-access" className="outline">Club access</Link></div></div>
  {error&&<div className="account-message account-error">{error}</div>}{message&&<div className="account-message account-success">{message}</div>}
  <div className="club-workspace-grid">
   <section className="settings-section"><div className="settings-section-heading"><span>CSV IMPORT</span><h2>Upload source file</h2></div>
    <form onSubmit={createBatch}><label>Batch name<input value={name} onChange={e=>setName(e.target.value)} placeholder="NWSL 2026 player import"/></label><label>Provider<input value={provider} onChange={e=>setProvider(e.target.value)} placeholder="manual / provider name"/></label><label>Source type<select value={sourceType} onChange={e=>setSourceType(e.target.value)}><option value="csv">CSV</option><option value="manual">Manual</option><option value="api">API</option><option value="provider">Provider</option><option value="migration">Migration</option></select></label><label>CSV file<input type="file" accept=".csv,text/csv" onChange={onFile}/></label>
     {fileName&&<p className="account-muted">{fileName} · {csvRows.length} rows · {csvRows.filter(r=>r.valid).length} valid · {csvRows.filter(r=>!r.valid).length} rejected</p>}
     <button className="settings-primary" disabled={busy||!csvRows.length} type="submit">{busy?"Importing…":"Import to review queue"}</button><p className="account-muted" style={{marginTop:8}}>After import, use the review queue to validate, match, and publish player records.</p></form>
   </section>
   <section className="settings-section"><div className="settings-section-heading"><span>QUEUE</span><h2>Current status</h2></div><div className="account-membership-row"><div><strong>{stats.batches}</strong><small>Recent import batches</small></div></div><div className="account-membership-row"><div><strong>{stats.pending}</strong><small>Pending / ready records</small></div></div><div className="account-membership-row"><div><strong>{stats.review}</strong><small>Records needing review</small></div></div><div className="account-membership-row"><div><strong>{stats.errors}</strong><small>Rejected / error records</small></div></div></section>
  </div>
  {preview.length>0&&<section className="settings-section" style={{marginTop:24}}><div className="settings-section-heading"><span>PREVIEW</span><h2>First {preview.length} rows</h2></div><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={{textAlign:"left",padding:8}}>Type</th><th style={{textAlign:"left",padding:8}}>External ID</th><th style={{textAlign:"left",padding:8}}>Name</th><th style={{textAlign:"left",padding:8}}>Country</th><th style={{textAlign:"left",padding:8}}>Validation</th></tr></thead><tbody>{preview.map((r,i)=><tr key={i}><td style={{padding:8}}>{r.entity_type||"—"}</td><td style={{padding:8}}>{r.external_id||"—"}</td><td style={{padding:8}}>{r.external_name||"—"}</td><td style={{padding:8}}>{r.country||"—"}</td><td style={{padding:8}}>{r.valid?"Ready":"Rejected: "+r.error}</td></tr>)}</tbody></table></div></section>}
  <section className="settings-section" style={{marginTop:24}}><div className="settings-section-heading"><span>BATCH HISTORY</span><h2>{filteredBatches.length} batches</h2></div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}><button type="button" className="outline" onClick={()=>setFilter("all")}>All</button>{statuses.map(s=><button key={s} type="button" className="outline" onClick={()=>setFilter(s)}>{s.replaceAll("_"," ")}</button>)}</div>{filteredBatches.length?filteredBatches.map(b=><div key={b.id} className="account-membership-row"><div style={{minWidth:0}}><Link href={`/admin/data/batches/${b.id}`} style={{fontWeight:700,textDecoration:"none"}}>{b.name}</Link><small>{b.provider} · {b.source_type}{b.file_name?" · "+b.file_name:""} · {new Date(b.created_at).toLocaleString()}</small><small>{b.total_rows} rows · {b.inserted_rows} inserted · {b.updated_rows} updated · {b.needs_review_rows} review · {b.error_rows} errors</small></div><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><span className="account-status-pill">{b.status}</span>{b.status==="draft"&&<button type="button" className="outline" onClick={()=>void updateStatus(b.id,"queued")}>Queue</button>}{b.status==="queued"&&<button type="button" className="outline" onClick={()=>void updateStatus(b.id,"processing")}>Start</button>}{b.status==="processing"&&<button type="button" className="outline" onClick={()=>void updateStatus(b.id,"completed")}>Complete</button>}</div></div>):<p className="account-muted">No import batches yet.</p>}</section>
  <section className="settings-section" style={{marginTop:24}}><div className="settings-section-heading"><span>REVIEW QUEUE</span><h2>{queue.length} recent records</h2></div>{queue.length?queue.map(q=><div key={q.id} className="account-membership-row"><div style={{minWidth:0}}><strong>{q.external_name||q.external_id}</strong><small>{q.entity_type} · {q.external_id}{q.country?" · "+q.country:""}</small>{q.error_message&&<small>{q.error_message}</small>}</div><span className="account-status-pill">{q.status}</span></div>):<p className="account-muted">The import review queue is empty.</p>}</section>
 </section></main>;
}
