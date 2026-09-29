'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Agency={id:string;name:string;website:string|null;country:string|null;verification_status:string;created_at:string}

export default function AgencyAccountsReview(){
 const [loading,setLoading]=useState(true),[allowed,setAllowed]=useState(false),[agencies,setAgencies]=useState<Agency[]>([]),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const load=async()=>{
  setLoading(true);setError('')
  const {data:user}=await supabase.auth.getUser()
  if(!user.user){setError('Authentication required.');setLoading(false);return}
  const {data:admin}=await supabase.from('wfm_admins').select('user_id').eq('user_id',user.user.id).maybeSingle()
  if(!admin){setError('WFM owner/admin access required.');setLoading(false);return}
  setAllowed(true)
  const {data,error:e}=await supabase.from('agency_accounts').select('id,name,website,country,verification_status,created_at').eq('verification_status','pending').order('created_at',{ascending:true})
  if(e)setError(e.message);setAgencies((data||[]) as Agency[]);setLoading(false)
 }
 useEffect(()=>{void load()},[])
 const review=async(id:string,status:'verified'|'rejected')=>{
  setError('');setNotice('')
  const {error:e}=await supabase.from('agency_accounts').update({verification_status:status,updated_at:new Date().toISOString()}).eq('id',id)
  if(e)setError(e.message);else{setNotice('Agency '+status+'.');await load()}
 }
 if(loading)return <main className="account-page"><div className="account-card">Loading agency accounts…</div></main>
 if(!allowed)return <main className="account-page"><section className="account-card"><div className="eyebrow">ADMIN</div><h1>Agency accounts</h1><p className="account-muted">{error||'Admin access required.'}</p></section></main>
 return <main className="account-page"><section className="account-card"><div className="account-card-top"><div><div className="eyebrow">ADMIN · AGENCY ACCOUNTS</div><h1>Agency verification</h1><p>Approve agency organizations before clubs can initiate controlled contact requests.</p></div><a href="/admin/agency" className="outline">Relationship queue</a></div>{error&&<div className="account-message account-error">{error}</div>}{notice&&<div className="account-message account-success">{notice}</div>}{agencies.length?<div className="club-board-list">{agencies.map(a=><div key={a.id} className="club-board-card"><div><strong>{a.name}</strong><small>{a.country||'Country not supplied'} · created {new Date(a.created_at).toLocaleDateString()}</small>{a.website&&<a href={a.website} target="_blank" rel="noreferrer"><small>{a.website}</small></a>}</div><div style={{display:'flex',gap:6}}><button className="outline" onClick={()=>void review(a.id,'verified')}>Verify</button><button className="outline" onClick={()=>void review(a.id,'rejected')}>Reject</button></div></div>)}</div>:<p className="account-muted">No pending agency accounts.</p>}</section></main>
}
