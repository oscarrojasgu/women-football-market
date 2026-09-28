'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Request = {
  id: string
  user_id: string
  club_id: string
  requested_role: string
  message: string | null
  status: string
  created_at: string
  club: { id: string; name: string; country: string | null } | null
}

export default function ClubAccessAdminPage() {
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<Request[]>([])
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    setLoading(true)
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) { setLoading(false); return }
    const { data: admin } = await supabase.from('wfm_admins').select('user_id').eq('user_id', user.user.id).maybeSingle()
    setAuthorized(!!admin)
    if (!admin) { setLoading(false); return }

    const { data, error } = await supabase
      .from('club_account_requests')
      .select('id,user_id,club_id,requested_role,message,status,created_at,club:clubs(id,name,country)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) setMessage(error.message)
    else setRequests((data ?? []).map((row: any) => ({ ...row, club: Array.isArray(row.club) ? row.club[0] ?? null : row.club ?? null })))
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const review = async (request: Request, action: 'approved' | 'rejected') => {
    setBusy(request.id); setMessage('')
    if (action === 'approved') {
      const { error: memberError } = await supabase.from('club_account_members').upsert({
        user_id: request.user_id,
        club_id: request.club_id,
        role: request.requested_role,
        status: 'active',
      }, { onConflict: 'user_id,club_id' })
      if (memberError) { setMessage(memberError.message); setBusy(''); return }
    }

    const { data: user } = await supabase.auth.getUser()
    const { error: requestError } = await supabase.from('club_account_requests').update({
      status: action,
      reviewed_by: user.user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', request.id)

    if (requestError) setMessage(requestError.message)
    else setMessage(action === 'approved' ? 'Club access approved.' : 'Club access request rejected.')
    setBusy('')
    await load()
  }

  if (loading) return <main className="account-page"><div className="account-card">Loading admin workspace…</div></main>
  if (!authorized) return <main className="account-page"><div className="account-card"><div className="eyebrow">ADMIN</div><h1>Access restricted</h1><p className="account-muted">This workspace is limited to WFM administrators.</p></div></main>

  return (
    <main className="account-page">
      <section className="account-card">
        <div className="account-card-top">
          <div><div className="eyebrow">WFM ADMIN · CLUB ACCESS</div><h1>Club access requests</h1><p>Review requests before users receive private club workspace access.</p></div>
          <Link href="/admin/verification" className="outline">Verification queue</Link>
        </div>
        {message && <div className="account-message account-success">{message}</div>}
        <div className="admin-request-list">
          {requests.length ? requests.map(request => (
            <article className="admin-request-card" key={request.id}>
              <div>
                <strong>{request.club?.name ?? 'Club'}</strong>
                <span>{request.club?.country ?? 'Country unavailable'} · requested role: {request.requested_role}</span>
                <small>User ID: {request.user_id}</small>
                {request.message && <p>{request.message}</p>}
              </div>
              <div className="admin-request-actions">
                <button type="button" className="settings-primary" disabled={busy === request.id} onClick={() => void review(request, 'approved')}>{busy === request.id ? 'Working…' : 'Approve'}</button>
                <button type="button" className="admin-reject-button" disabled={busy === request.id} onClick={() => void review(request, 'rejected')}>Reject</button>
              </div>
            </article>
          )) : <div className="club-board-empty">No pending club access requests.</div>}
        </div>
      </section>
    </main>
  )
}
