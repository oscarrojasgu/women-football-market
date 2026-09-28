'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../../lib/supabase'

type Report={id:string;club_id:string;created_by:string;name:string;description:string|null;player_ids:string[];report_type:string;created_at:string;updated_at:string}
type Player={id:string;full_name:string;position:string|null;nationality:string|null;photo_url:string|null}

export default function ClubSavedReportPage(){
 const params=useParams();const router=useRouter();const id=params.id as string
 const [report,setReport]=useState<Report|null>(null);const [players,setPlayers]=useState<Player[]>([]);const [name,setName]=useState('');const [description,setDescription]=useState('');const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [deleting,setDeleting]=useState(false);const [error,setError]=useState('');const [message,setMessage]=useState('')
 useEffect(()=>{void (async()=>{setLoading(true);const {data,error:e}=await supabase.from('club_saved_reports').select('*').eq('id',id).single();if(e||!data){setError('Report not found or you do not have access.');setLoading(false);return}const r=data as Report;setReport(r);setName(r.name);setDescription(r.description??'');if(r.player_ids?.length){const {data:p}=await supabase.from('players').select('id,full_name,position,nationality,photo_url').in('id',r.player_ids);setPlayers(((p??[]) as Player[]).sort((a,b)=>r.player_ids.indexOf(a.id)-r.player_ids.indexOf(b.id)))}setLoading(false)})()},[id])
 const returnTo=useMemo(()=>'/scouting/compare?players='+encodeURIComponent(report?.player_ids?.join(',')??'')+'&returnTo='+encodeURIComponent('/account/club/reports/'+id),[report,id])
 const update=async()=>{if(!report)return;setSaving(true);setError('');const {error:e}=await supabase.from('club_saved_reports').update({name:name.trim(),description:description.trim()||null,updated_at:new Date().toISOString()}).eq('id',report.id);if(e)setError(e.message);else{setReport({...report,name:name.trim(),description:description.trim()||null});setMessage('Report updated.')}setSaving(false)}
 const remove=async()=>{if(!report)return;if(!confirm('Delete this saved report?'))return;setDeleting(true);const {error:e}=await supabase.from('club_saved_reports').delete().eq('id',report.id);if(e){setError(e.message);setDeleting(false)}else router.push('/account/club/reports')}
 if(loading)return <main className="account-page"><div className="account-card">Loading saved report…</div></main>
 if(!report)return <main className="account-page"><div className="account-card"><div className="account-message account-error">{error}</div><Link href="/account/club/reports" className="outline">Back to reports</Link></div></main>
 return <main className="account-page"><section className="account-card">
  <div className="account-card-top"><div><div className="eyebrow">PRIVATE CLUB REPORT · {report.report_type.replaceAll('_',' ')}</div><h1>{report.name}</h1><p>Shared internally with active members of the club workspace.</p></div><Link href="/account/club/reports" className="outline">← Report library</Link></div>
  {error&&<div className="account-message account-error">{error}</div>}{message&&<div className="account-message account-success">{message}</div>}
  <section className="settings-section"><div className="settings-section-heading"><span>REPORT DETAILS</span><h2>Edit report</h2></div><label>Report name<input value={name} onChange={e=>setName(e.target.value)} maxLength={120}/></label><label>Description<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4} maxLength={600}/></label><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button type="button" className="settings-primary" disabled={saving||!name.trim()} onClick={()=>void update()}>{saving?'Saving…':'Save changes'}</button><Link href={returnTo} className="outline">Open comparison</Link><button type="button" className="club-remove-button" disabled={deleting} onClick={()=>void remove()}>{deleting?'Deleting…':'Delete report'}</button></div></section>
  <section className="settings-section"><div className="settings-section-heading"><span>CANDIDATES</span><h2>{players.length} players</h2></div>{players.length?<div className="club-board-list">{players.map(p=><Link key={p.id} href={'/players/'+p.id} className="club-board-card"><div style={{display:'flex',alignItems:'center',gap:10}}>{p.photo_url?<img src={p.photo_url} alt="" className="scout-player-photo"/>:<span className="scout-player-photo scout-player-photo-empty">{p.full_name.charAt(0)}</span>}<div><strong>{p.full_name}</strong><small>{[p.position,p.nationality].filter(Boolean).join(' · ')}</small></div></div><span>Profile →</span></Link>)}</div>:<div className="club-board-empty">No player records are currently available for this report.</div>}</section>
 </section></main>
}
