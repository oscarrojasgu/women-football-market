'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Request={id:string;agency_id:string;player_id:string;relationship_type:string;status:string;evidence_url:string|null;notes:string|null;created_at:string;agency:{id:string;name:string}|null;player:{id:string;full_name:string;position:string|null}|null}

export default function AgencyReviewPage(){
 const [loading,setLoading]=useState(true),[allowed,setAllowed]=useState(false),[requests,setRequests]=useState<Request[]>([]),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState<string|null>(null)
 const load=async()=>{
  setLoading(true);setError('')
  const {data:user}=await supabase.auth.getUser()
  if(!user.user){setError('Authentication required.');setLoading(false);return}
  const {data:admin}=await supabase.from('wfm_admins').select('user_id').eq('user_id',user.user.id).maybeSingle()
  if(!admin){setError('WFM owner/admin access required.');setLoading(false);return}
  setAllowed(true)
  const {data,error:e}=await supabase.from('agency_player_requests').select('id,agency_id,player_id,relationship_type,status,evidence_url,notes,created_at,agency:agency_accounts(id,name),player:players(id,full_name,position)').eq('status','pending').order('created_at',{ascending:true})
  if(e)setError(e.message);setRequests((data||[]) as any);setLoading(false)
 }
 useEffect(()=>{void load()},[])
 const review=async(id:string,action:'approved'|'rejected'|'revoked')=>{
  setBusy(id);setError('');setNotice('')
  const {error:e}=await supabase.rpc('review_agency_player_request',{p_request_id:id,p_action:action,p_notes:null})
  if(e)setError(e.message);else{setNotice('Request '+action+'.');await load()}
  setBusy(null)
 }
 if(loading)return <main className="account-page"><div className="account-card">Loading agency review…</div></main>
 if(!allowed)return <main className="account-page"><section className="account-card"><div className="eyebrow">ADMIN</div><h1>Agency review</h1><p className="account-muted">{error||'Admin access required.'}</p></section></main>
 return <main className="account-page"><section className="account-card"><div className="account-card-top"><div><div className="eyebrow">ADMIN · AGENT WORKFLOWS</div><h1>Agency relationship review</h1><p>Review representation and management requests before they become approved WFM relationships.</p></div><a href="/admin/verification" className="outline">Verification queue</a></div>{error&&<div className="account-message account-error">{error}</div>}{notice&&<div className="account-message account-success">{notice}</div>}{requests.length?<div className="club-board-list">{requests.map(r=><div key={r.id} className="club-board-card"><div><strong>{r.player?.full_name||'Player'} · {r.agency?.name||'Agency'}</strong><small>{r.relationship_type} · submitted {new Date(r.created_at).toLocaleDateString()}</small>{r.evidence_url&&<a href={r.evidence_url} target="_blank" rel="noreferrer"><small>Evidence →</small></a>}{r.notes&&<small>{r.notes}</small>}</div><div style={{display:'flex',gap:6}}><button className="outline" disabled={busy===r.id} onClick={()=>void review(r.id,'approved')}>Approve</button><button className="outline" disabled={busy===r.id} onClick={()=>void review(r.id,'rejected')}>Reject</button></div></div>)}</div>:<p className="account-muted">No pending agency relationship requests.</p>}</section></main>
}
