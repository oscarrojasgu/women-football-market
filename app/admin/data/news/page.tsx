"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type Source={id:string;publisher:string;feed_url:string;active:boolean;last_checked_at:string|null;last_success_at:string|null;last_error:string|null};

export default function NewsAdminPage(){
 const [authorized,setAuthorized]=useState(false),[loading,setLoading]=useState(true),[sources,setSources]=useState<Source[]>([]);
 const [publisher,setPublisher]=useState(""),[feedUrl,setFeedUrl]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 const load=async()=>{
  const {data:u}=await supabase.auth.getUser();if(!u.user){setLoading(false);return}
  const {data:a}=await supabase.from("wfm_admins").select("user_id").eq("user_id",u.user.id).maybeSingle();setAuthorized(!!a);
  if(!a){setLoading(false);return}
  const {data,error:e}=await supabase.from("wfm_news_sources").select("*").order("publisher");
  if(e)setError(e.message);setSources((data||[]) as Source[]);setLoading(false);
 };
 useEffect(()=>{void load()},[]);
 const add=async(e:React.FormEvent)=>{
  e.preventDefault();setBusy(true);setError("");setMessage("");
  if(!publisher.trim()||!feedUrl.trim()){setError("Publisher and RSS/Atom feed URL are required.");setBusy(false);return}
  const {error:e2}=await supabase.from("wfm_news_sources").insert({publisher:publisher.trim(),feed_url:feedUrl.trim(),active:true});
  if(e2)setError(e2.message);else{setPublisher("");setFeedUrl("");setMessage("Approved news source added.");await load()}setBusy(false);
 };
 const run=async()=>{
  setBusy(true);setError("");setMessage("");
  const {data,error:e}=await supabase.functions.invoke("ingest-news-rss",{body:{}});if(e)setError(e.message);else if(!data?.ok)setError(data?.error||"News ingestion failed.");else setMessage(`News ingestion complete: ${data.inserted||0} added, ${data.updated||0} updated, ${data.errors?.length||0} errors.`);
  await load();setBusy(false);
 };
 const toggle=async(s:Source)=>{
  const {error:e}=await supabase.from("wfm_news_sources").update({active:!s.active}).eq("id",s.id);if(e)setError(e.message);else await load();
 };
 if(loading)return <main className="account-page"><div className="account-card">Loading news administration…</div></main>;
 if(!authorized)return <main className="account-page"><div className="account-card"><div className="eyebrow">ADMIN</div><h1>Access restricted</h1><p className="account-muted">This workspace is limited to WFM administrators.</p></div></main>;
 return <main className="account-page"><section className="account-card">
  <div className="account-card-top"><div><div className="eyebrow">M17 · NEWS INGESTION</div><h1>News sources</h1><p>Approve RSS/Atom feeds, ingest source-linked stories, and monitor freshness. WFM stores the original source URL rather than copying publisher content.</p></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Link href="/admin/data" className="outline">Data administration</Link><Link href="/" className="outline">Homepage</Link></div></div>
  {error&&<div className="account-message account-error">{error}</div>}{message&&<div className="account-message account-success">{message}</div>}
  <section className="settings-section"><div className="settings-section-heading"><span>APPROVED SOURCES</span><h2>Add RSS / Atom feed</h2></div>
   <form onSubmit={add}><label>Publisher<input value={publisher} onChange={e=>setPublisher(e.target.value)} placeholder="Official league / publication"/></label><label>Feed URL<input value={feedUrl} onChange={e=>setFeedUrl(e.target.value)} placeholder="https://example.com/feed.xml"/></label><button className="settings-primary" disabled={busy} type="submit">Add approved source</button></form>
  </section>
  <section className="settings-section" style={{marginTop:24}}><div className="settings-section-heading"><span>AUTOMATION</span><h2>Ingest approved feeds</h2></div><p className="account-muted">Fetches active feeds, normalizes recent stories, and updates the WFM news table. No article text is republished.</p><button className="settings-primary" disabled={busy||!sources.some(s=>s.active)} onClick={()=>void run()}>Run news ingestion now</button></section>
  <section className="settings-section" style={{marginTop:24}}><div className="settings-section-heading"><span>FRESHNESS</span><h2>{sources.length} configured sources</h2></div>
   {sources.length?sources.map(s=><div key={s.id} className="account-membership-row"><div style={{minWidth:0}}><strong>{s.publisher}</strong><small>{s.feed_url}</small><small>{s.last_success_at?`Last success: ${new Date(s.last_success_at).toLocaleString()}`:"Not successfully ingested yet."}</small>{s.last_error&&<small>Last error: {s.last_error}</small>}</div><div style={{display:"flex",gap:8,alignItems:"center"}}><span className="account-status-pill">{s.active?"active":"paused"}</span><button className="outline" type="button" onClick={()=>void toggle(s)}>{s.active?"Pause":"Activate"}</button></div></div>):<p className="account-muted">No approved feeds yet.</p>}
  </section>
 </section></main>;
}
