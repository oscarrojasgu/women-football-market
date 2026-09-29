'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Club={id:string;name:string;country:string|null}
type Membership={club_id:string;role:string;club:Club|null}
type Agency={id:string;name:string;country:string|null}
type Player={id:string;full_name:string;position:string|null}
type Contact={id:string;agency_id:string;player_id:string|null;subject:string;message:string|null;status:string;created_at:string;agency:{id:string;name:string}|null;player:Player|null}

export default function ClubContactsPage(){
 const [loading,setLoading]=useState(true),[membership,setMembership]=useState<Membership|null>(null),[agencies,setAgencies]=useState<Agency[]>([]),[players,setPlayers]=useState<Player[]>([]),[contacts,setContacts]=useState<Contact[]>([])
 const [agencyId,setAgencyId]=useState(''),[playerId,setPlayerId]=useState(''),[subject,setSubject]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')

 const load=async()=>{
  setLoading(true);setError('')
  const {data:user}=await supabase.auth.getUser()
  if(!user.user){setError('Please sign in to use club contacts.');setLoading(false);return}
  const [{data:m},{data:a},{data:p}]=await Promise.all([
   supabase.from('club_account_members').select('club_id,role,club:clubs(id,name,country)').eq('user_id',user.user.id).eq('status','active').limit(1),
   supabase.from('agency_accounts').select('id,name,country').eq('verification_status','verified').order('name'),
   supabase.from('players').select('id,full_name,position').order('full_name')
  ])
  const raw=(m||[])[0] as any
  const member=raw?{...raw,club:Array.isArray(raw.club)?raw.club[0]||null:raw.club||null} as Membership:null
  setMembership(member);setAgencies((a||[]) as Agency[]);setPlayers((p||[]) as Player[])
  if(member){
   const {data:c,error:ce}=await supabase.from('agency_contact_requests').select('id,agency_id,player_id,subject,message,status,created_at,agency:agency_accounts(id,name),player:players(id,full_name,position)').eq('club_id',member.club_id).order('created_at',{ascending:false})
   if(ce)setError(ce.message);setContacts((c||[]) as any)
  }
  setLoading(false)
 }
 useEffect(()=>{void load()},[])
 const submit=async(e:FormEvent)=>{
  e.preventDefault();if(!membership||!agencyId||!subject.trim())return
  setBusy(true);setError('');setNotice('')
  const {data:user}=await supabase.auth.getUser()
  if(!user.user){setError('Your session has expired.');setBusy(false);return}
  const {error:e1}=await supabase.from('agency_contact_requests').insert({club_id:membership.club_id,agency_id:agencyId,player_id:playerId||null,requested_by:user.user.id,subject:subject.trim(),message:message.trim()||null})
  if(e1)setError(e1.message);else{setSubject('');setMessage('');setPlayerId('');setNotice('Contact request sent to the agency.');await load()}
  setBusy(false)
 }
 if(loading)return <main className="account-page"><div className="account-card">Loading club contacts…</div></main>
 if(!membership)return <main className="account-page"><section className="account-card"><div className="eyebrow">CLUB CONTACTS</div><h1>No club access</h1><p className="account-muted">Connect your account to a club before sending agency requests.</p><Link href="/account/settings" className="settings-primary inline-button">Request club access →</Link></section></main>
 return <main className="account-page"><section className="account-card">
  <div className="account-card-top"><div><div className="eyebrow">CLUB CONTACTS · {membership.club?.name?.toUpperCase()}</div><h1>Agency communication</h1><p>Send controlled recruitment or availability requests to verified WFM agency workspaces.</p></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Link href="/account/club" className="outline">Club workspace</Link><Link href="/scouting" className="outline">Scouting</Link></div></div>
  {error&&<div className="account-message account-error">{error}</div>}{notice&&<div className="account-message account-success">{notice}</div>}
  <div className="account-settings-grid"><form onSubmit={submit} className="settings-section"><div className="settings-section-heading"><span>NEW REQUEST</span><h2>Contact an agency</h2></div><label>Agency<select value={agencyId} onChange={e=>setAgencyId(e.target.value)} required><option value="">Select verified agency</option>{agencies.map(a=><option key={a.id} value={a.id}>{a.name}{a.country?' · '+a.country:''}</option>)}</select></label><label>Player (optional)<select value={playerId} onChange={e=>setPlayerId(e.target.value)}><option value="">General agency inquiry</option>{players.map(p=><option key={p.id} value={p.id}>{p.full_name}{p.position?' · '+p.position:''}</option>)}</select></label><label>Subject<input value={subject} onChange={e=>setSubject(e.target.value)} required maxLength={160} placeholder="Recruitment inquiry"/></label><label>Message<textarea value={message} onChange={e=>setMessage(e.target.value)} rows={6} maxLength={1200} placeholder="Describe the information or recruitment discussion you want to open."/></label><button className="settings-primary" disabled={busy||!agencyId||!subject.trim()}>{busy?'Sending…':'Send contact request'}</button></form>
  <section className="settings-section"><div className="settings-section-heading"><span>HISTORY</span><h2>Sent requests</h2></div>{contacts.length?<div className="club-board-list">{contacts.map(c=><div key={c.id} className="club-board-card"><div><strong>{c.subject}</strong><small>{c.agency?.name||'Agency'}{c.player?.full_name?' · '+c.player.full_name:''} · {new Date(c.created_at).toLocaleDateString()}</small></div><span>{c.status}</span></div>)}</div>:<p className="account-muted">No agency contact requests yet.</p>}</section></div>
 </section></main>
}
