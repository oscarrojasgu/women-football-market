'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function SaveComparisonReport({ playerIds }: { playerIds: string[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const save = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { setError('Report name is required.'); return }
    setSaving(true); setError(''); setMessage('')
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) { router.push('/login?returnTo=' + encodeURIComponent(window.location.pathname + window.location.search)); return }
    const { data: membership } = await supabase.from('club_account_members').select('club_id').eq('user_id', auth.user.id).eq('status','active').limit(1).maybeSingle()
    if (!membership?.club_id) { setError('Saved scouting reports are available inside an active club workspace.'); setSaving(false); return }
    const { data, error: saveError } = await supabase.from('club_saved_reports').insert({
      club_id: membership.club_id,
      created_by: auth.user.id,
      name: trimmed,
      description: description.trim() || null,
      player_ids: playerIds,
      report_type: 'scouting_comparison',
    }).select('id').single()
    if (saveError) setError(saveError.message)
    else { setMessage('Report saved to the club library.'); setName(''); setDescription(''); setOpen(false); if (data?.id) router.push('/account/club/reports/' + data.id) }
    setSaving(false)
  }

  if (!open) return <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><button type="button" className="settings-primary" onClick={() => setOpen(true)}>Save report</button>{message && <span style={{fontSize:12,color:'#17643a'}}>{message}</span>}</div>

  return <div style={{border:'1px solid #ddd',borderRadius:10,padding:14,marginTop:12,maxWidth:520}}>
    <div className="settings-section-heading"><span>CLUB LIBRARY</span><h2>Save comparison</h2></div>
    <p style={{fontSize:12,color:'#666'}}>This report is private to active members of your club.</p>
    <form onSubmit={save}>
      <label>Report name<input value={name} onChange={e=>setName(e.target.value)} placeholder="2027 CM shortlist comparison" maxLength={120}/></label>
      <label>Description<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Recruitment context or internal purpose." rows={3} maxLength={600}/></label>
      {error && <div className="account-message account-error">{error}</div>}
      <div style={{display:'flex',gap:8,marginTop:8}}><button type="submit" className="settings-primary" disabled={saving}>{saving?'Saving…':'Save report'}</button><button type="button" className="outline" onClick={()=>{setOpen(false);setError('')}}>Cancel</button></div>
    </form>
  </div>
}
