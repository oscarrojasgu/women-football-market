'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Agency={id:string;name:string;website:string|null;country:string|null;verification_status:string}
type Player={id:string;full_name:string;position:string|null;agency:string|null}
type Relationship={id:string;player_id:string;relationship_type:string;status:string;notes:string|null;created_at:string;player:Player|null}
type Contact={id:string;club_id:string;player_id:string|null;subject:string;message:string|null;status:string;created_at:string;club:{id:string;name:string}|null;player:Player|null}

export default function AgencyWorkspacePage(){
 const [loading,setLoading]=useState(true),[userId,setUserId]=useState(''),[agencies,setAgencies]=useState<Agency[]>([]),[agency,setAgency]=useState<Agency|null>(null),[players,setPlayers]=useState<Player[]>([]),[relationships,setRelationships]=useState<Relationship[]>([]),[contacts,setContacts]=useState<Contact[]>([])
 const [name,setName]=useState(''),[website,setWebsite]=useState(''),[country,setCountry]=useState(''),[playerId,setPlayerId]=useState(''),[relationshipType,setRelationshipType]=useState('representation'),[evidence,setEvidence]=useState(''),[notes,setNotes]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false)

 const load=async()=>{
  setLoading(true);setError('')
  const {data:user}=await supabase.auth.getUser()
  if(!user.user){setError('Please sign in to use the agency workspace.');setLoading(false);return}
  setUserId(user.user.id)
  const [{data:a,error:ae},{data:p,error:pe}]=await Promise.all([
   supabase.from('agency_account_members').select('agency:agency_accounts(id,name,website,country,verification_status)').eq('user_id',user.user.id).eq('status','active'),
   supabase.from('players').select('id,full_name,position,agency').order('full_name')
  ])
  if(ae||pe){setError((ae||pe)?.message||'Unable to load workspace.');setLoading(false);return}
  const list=((a||[]).map((x:any)=>Array.isArray(x.agency)?x.agency[0]:x.agency).filter(Boolean)) as Agency[]
  setAgencies(list);setPlayers((p||[]) as Player[])
  const current=agency&&list.some(x=>x.id===agency.id)?list.find(x=>x.id===agency.id)!:list[0]||null
  setAgency(current)
  if(current){
   const [{data:r},{data:c}]=await Promise.all([
    supabase.from('agency_player_requests').select('id,player_id,relationship_type,status,notes,created_at,player:players(id,full_name,position,agency)').eq('agency_id',current.id).order('created_at',{ascending:false}),
    supabase.from('agency_contact_requests').select('id,club_id,player_id,subject,message,status,created_at,club:clubs(id,name),player:players(id,full_name,position,agency)').eq('agency_id',current.id).order('created_at',{ascending:false})
   ])
   setRelationships((r||[]) as any);setContacts((c||[]) as any)
  }else{setRelationships([]);setContacts([])}
  setLoading(false)
 }
 useEffect(()=>{void load()},[])

 const createAgency=async(e:FormEvent)=>{
  e.preventDefault();setBusy(true);setError('');setMessage('')
  const {data,error:e1}=await supabase.rpc('create_agency_workspace',{p_name:name,p_website:website||null,p_country:country||null})
  if(e1)setError(e1.message);else{setName('');setWebsite('');setCountry('');setMessage('Agency workspace created and connected to your account.');await load()}
  setBusy(false)
 }
 const submitRelationship=async(e:FormEvent)=>{
  e.preventDefault();if(!agency||!playerId)return
  setBusy(true);setError('');setMessage('')
  const {error:e1}=await supabase.from('agency_player_requests').insert({agency_id:agency.id,player_id:playerId,submitted_by:userId,relationship_type:relationshipType,evidence_url:evidence||null,notes:notes||null})
  if(e1)setError(e1.message);else{setPlayerId('');setEvidence('');setNotes('');setMessage('Representation request submitted for WFM review.');await load()}
  setBusy(false)
 }
 const updateContact=async(id:string,status:string)=>{
  setBusy(true);setError('');setMessage('')
  const {error:e1}=await supabase.rpc('respond_agency_contact_request',{p_request_id:id,p_action:status})
  if(e1)setError(e1.message);else{setMessage('Contact request updated.');await load()}
  setBusy(false)
 }

 if(loading)return <main className="account-page"><div className="account-card">Loading agency workspace…</div></main>
 if(!agencies.length)return <main className="account-page"><section className="account-card"><div className="eyebrow">AGENT & AGENCY WORKSPACE</div><h1>Create your agency workspace</h1><p className="account-muted">Create an organization workspace for representation records and controlled club-to-agency communication. Verification remains a separate WFM review step.</p>{error&&<div className="account-message account-error">{error}</div>}<form onSubmit={createAgency} className="settings-section" style={{marginTop:20}}><label>Agency name<input value={name} onChange={e=>setName(e.target.value)} required maxLength={120}/></label><label>Website<input value={website} onChange={e=>setWebsite(e.target.value)} placeholder="https://…" maxLength={250}/></label><label>Country<input value={country} onChange={e=>setCountry(e.target.value)} maxLength={80}/></label><button className="settings-primary" disabled={busy}>{busy?'Creating…':'Create agency workspace'}</button></form><p style={{marginTop:18}}><Link href="/account/settings">← Account settings</Link></p></section></main>

 return <main className="account-page"><section className="account-card">
  <div className="account-card-top"><div><div className="eyebrow">AGENT & AGENCY WORKSPACE</div><h1>{agency?.name}</h1><p>{agency?.country||'International'} · verification status: <strong>{agency?.verification_status}</strong></p></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Link href="/account/settings" className="outline">Account settings</Link><Link href="/players" className="outline">Player directory</Link></div></div>
  {error&&<div className="account-message account-error">{error}</div>}{message&&<div className="account-message account-success">{message}</div>}
  <div className="account-settings-grid">
   <form onSubmit={submitRelationship} className="settings-section"><div className="settings-section-heading"><span>REPRESENTATION</span><h2>Submit player relationship</h2></div><label>Player<select value={playerId} onChange={e=>setPlayerId(e.target.value)} required><option value="">Select a player</option>{players.map(p=><option key={p.id} value={p.id}>{p.full_name}{p.position?' · '+p.position:''}</option>)}</select></label><label>Relationship<select value={relationshipType} onChange={e=>setRelationshipType(e.target.value)}><option value="representation">Representation</option><option value="management">Management</option><option value="advisory">Advisory</option></select></label><label>Evidence URL<input value={evidence} onChange={e=>setEvidence(e.target.value)} placeholder="Supporting source or document URL"/></label><label>Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={4} maxLength={600}/></label><button className="settings-primary" disabled={busy||!playerId}>{busy?'Submitting…':'Submit for WFM review'}</button></form>
   <section className="settings-section"><div className="settings-section-heading"><span>RELATIONSHIPS</span><h2>Player representation</h2></div>{relationships.length?<div className="club-board-list">{relationships.map(r=><div key={r.id} className="club-board-card"><div><strong>{r.player?.full_name||'Player'}</strong><small>{r.relationship_type} · submitted {new Date(r.created_at).toLocaleDateString()}</small></div><span>{r.status}</span></div>)}</div>:<p className="account-muted">No representation requests yet.</p>}</section>
  </div>
  <section className="settings-section" style={{marginTop:16}}><div className="settings-section-heading"><span>CLUB CONTACT</span><h2>Incoming requests</h2></div>{contacts.length?<div className="club-board-list">{contacts.map(c=><div key={c.id} className="club-board-card"><div><strong>{c.subject}</strong><small>{c.club?.name||'Club'}{c.player?.full_name?' · '+c.player.full_name:''} · {new Date(c.created_at).toLocaleDateString()}</small>{c.message&&<small>{c.message}</small>}</div><div style={{display:'flex',gap:6,alignItems:'center'}}><span>{c.status}</span>{c.status==='pending'&&<><button className="outline" disabled={busy} onClick={()=>void updateContact(c.id,'accepted')}>Accept</button><button className="outline" disabled={busy} onClick={()=>void updateContact(c.id,'declined')}>Decline</button></>}</div></div>)}</div>:<p className="account-muted">No club contact requests.</p>}</section>
 </section></main>
}
