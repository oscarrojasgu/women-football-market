'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

type CompetitionSource = {
  id: string
  external_league_id: string
  competition_name: string
  country: string | null
  active: boolean
  priority: number
}

export default function MatchCenterAdminPage() {
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sources, setSources] = useState<CompetitionSource[]>([])
  const [leagueId, setLeagueId] = useState('')
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) { setLoading(false); return }
    const { data: admin } = await supabase.from('wfm_admins').select('user_id').eq('user_id', user.user.id).maybeSingle()
    setAuthorized(!!admin)
    if (!admin) { setLoading(false); return }
    const { data } = await supabase.from('wfm_match_competitions').select('id,external_league_id,competition_name,country,active,priority').order('priority', { ascending:false })
    setSources((data || []) as CompetitionSource[])
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const addSource = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true); setError(''); setMessage('')
    if (!leagueId.trim() || !name.trim()) { setError('Sportmonks league ID and competition name are required.'); setBusy(false); return }
    const { error: insertError } = await supabase.from('wfm_match_competitions').upsert({
      provider:'sportmonks',
      external_league_id:leagueId.trim(),
      competition_name:name.trim(),
      country:country.trim() || null,
      active:true,
      priority:50
    }, { onConflict:'provider,external_league_id' })
    if (insertError) setError(insertError.message)
    else { setMessage('Competition source saved.'); setLeagueId(''); setName(''); setCountry(''); await load() }
    setBusy(false)
  }

  const toggle = async (source: CompetitionSource) => {
    setBusy(true); setError('')
    const { error: updateError } = await supabase.from('wfm_match_competitions').update({ active:!source.active }).eq('id', source.id)
    if (updateError) setError(updateError.message); else await load()
    setBusy(false)
  }

  const sync = async () => {
    setBusy(true); setError(''); setMessage('')
    const today = new Date()
    const start = new Date(today.getTime() - 24*60*60*1000).toISOString().slice(0,10)
    const end = new Date(today.getTime() + 3*24*60*60*1000).toISOString().slice(0,10)
    try {
      const response = await fetch('/api/admin/match-center-sync', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({start_date:start,end_date:end}) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Match sync failed.')
      setMessage(`Match sync complete: ${payload.inserted ?? 0} added, ${payload.updated ?? 0} updated.`)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    setBusy(false)
  }

  if (loading) return <main style={{padding:40}}>Loading…</main>
  if (!authorized) return <main style={{padding:40}}>Admin access required.</main>

  return (
    <main style={{minHeight:'100vh',background:'#f5f4ef',color:'#111',padding:'36px 20px 60px'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <Link href="/admin/data" style={{fontSize:12,color:'#666',textDecoration:'none'}}>← Admin Data</Link>
        <h1 style={{fontSize:42,letterSpacing:-1.5,margin:'16px 0 6px'}}>Match Center</h1>
        <p style={{color:'#666',marginTop:0}}>Configure the women's competitions that WFM is allowed to publish in the homepage score ticker.</p>

        <form onSubmit={addSource} style={{background:'#fff',border:'1px solid #e3e3e3',borderRadius:14,padding:20,display:'grid',gridTemplateColumns:'1fr 2fr 1fr auto',gap:10,alignItems:'end'}}>
          <label style={{fontSize:11,fontWeight:800}}>SPORTMONKS LEAGUE ID<input value={leagueId} onChange={e=>setLeagueId(e.target.value)} style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:6,padding:10,border:'1px solid #ddd',borderRadius:7}} /></label>
          <label style={{fontSize:11,fontWeight:800}}>COMPETITION NAME<input value={name} onChange={e=>setName(e.target.value)} placeholder="NWSL" style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:6,padding:10,border:'1px solid #ddd',borderRadius:7}} /></label>
          <label style={{fontSize:11,fontWeight:800}}>COUNTRY<input value={country} onChange={e=>setCountry(e.target.value)} style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:6,padding:10,border:'1px solid #ddd',borderRadius:7}} /></label>
          <button disabled={busy} style={{padding:'10px 14px',border:0,borderRadius:7,background:'#111',color:'#fff',fontWeight:800}}>Save</button>
        </form>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:20}}>
          <h2 style={{fontSize:20}}>Configured competitions</h2>
          <button disabled={busy || !sources.some(s=>s.active)} onClick={sync} style={{padding:'10px 14px',border:0,borderRadius:7,background:'#111',color:'#fff',fontWeight:800}}>Sync next 3 days</button>
        </div>

        {message && <div style={{padding:12,background:'#eaf4e5',borderRadius:8,marginBottom:12}}>{message}</div>}
        {error && <div style={{padding:12,background:'#f8e7e7',borderRadius:8,marginBottom:12}}>{error}</div>}

        <div style={{background:'#fff',border:'1px solid #e3e3e3',borderRadius:14,overflow:'hidden'}}>
          {sources.length === 0 ? <div style={{padding:30,color:'#777'}}>No competitions configured yet.</div> : sources.map(source => (
            <div key={source.id} style={{display:'grid',gridTemplateColumns:'1fr 2fr 1fr auto',gap:16,alignItems:'center',padding:'15px 18px',borderBottom:'1px solid #eee'}}>
              <strong>{source.external_league_id}</strong>
              <span>{source.competition_name}<small style={{display:'block',color:'#888',marginTop:3}}>{source.country || 'Country not set'}</small></span>
              <span style={{fontSize:11,fontWeight:800,color:source.active?'#245b32':'#888'}}>{source.active?'ACTIVE':'PAUSED'}</span>
              <button disabled={busy} onClick={()=>toggle(source)} style={{padding:'7px 10px',border:'1px solid #ccc',borderRadius:6,background:'#fff'}}>{source.active?'Pause':'Activate'}</button>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
