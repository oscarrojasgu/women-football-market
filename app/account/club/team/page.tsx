'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useWfmT } from '../../../lib/use-wfm-t'
import { supabase } from '../../../lib/supabase'

type Member = { user_id: string; role: string; status: string; created_at: string; display_name?: string | null }
type Invite = { id: string; email: string; role: string; status: string; created_at: string }

export default function ClubTeamPage() {
  const t = useWfmT()
  const [clubId, setClubId] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('recruiter')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [memberName, setMemberName] = useState<Record<string,string>>({})

  const load = async () => {
    setLoading(true)
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) { setError(t('Please sign in.')); setLoading(false); return }
    const { data: membership } = await supabase.from('club_account_members').select('club_id,role').eq('user_id', user.user.id).eq('status','active').limit(1).maybeSingle()
    if (!membership || membership.role !== 'admin') { setError(t('Club admin access is required.')); setLoading(false); return }
    setClubId(membership.club_id)
    const [{ data: memberRows }, { data: inviteRows }] = await Promise.all([
      supabase.from('club_account_members').select('user_id,role,status,created_at').eq('club_id', membership.club_id).order('created_at'),
      supabase.from('club_account_invitations').select('id,email,role,status,created_at').eq('club_id', membership.club_id).order('created_at',{ascending:false}),
    ])
    const loadedMembers = (memberRows ?? []) as Member[]
    setMembers(loadedMembers)
    if (loadedMembers.length) {
      const names: Record<string,string> = {}
      for (const member of loadedMembers) {
        const { data: profile } = await supabase.from('account_profiles').select('display_name').eq('user_id', member.user_id).maybeSingle()
        if (profile?.display_name) names[member.user_id] = profile.display_name
      }
      setMemberName(names)
    }
    setInvites((inviteRows ?? []) as Invite[])
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const invite = async (event: FormEvent) => {
    event.preventDefault()
    const value = email.trim().toLowerCase()
    if (!value || !value.includes('@')) { setError(t('Enter a valid email address.')); return }
    setBusy(true); setError(''); setMessage('')
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) { setError(t('Your session has expired.')); setBusy(false); return }
    const { error: inviteError } = await supabase.from('club_account_invitations').insert({ club_id: clubId, email: value, role, invited_by: user.user.id })
    if (inviteError) setError(inviteError.message)
    else { setEmail(''); setMessage(t('Invitation recorded. The invitation delivery step can be connected to email when the commercial account system is enabled.')); await load() }
    setBusy(false)
  }

  const revoke = async (id: string) => {
    setBusy(true); setError('')
    const { error: revokeError } = await supabase.from('club_account_invitations').update({ status: 'revoked' }).eq('id', id)
    if (revokeError) setError(revokeError.message)
    else await load()
    setBusy(false)
  }

  if (loading) return <main className="account-page"><div className="account-card">{t('Loading club team…')}</div></main>

  return <main className="account-page"><section className="account-card">
    <div className="account-card-top">
      <div><div className="eyebrow">{t('CLUB ADMIN · TEAM')}</div><h1>{t('Club team')}</h1><p>{t("Manage the people who can access this club's private WFM workspace.")}</p></div>
      <Link href="/account/club" className="outline">{t('← Club workspace')}</Link>
    </div>
    {error && <div className="account-message account-error">{error}</div>}
    {message && <div className="account-message account-success">{message}</div>}

    {!error && <div className="club-workspace-grid">
      <section className="settings-section">
        <div className="settings-section-heading"><span>{t('INVITE')}</span><h2>{t('Add team member')}</h2></div>
        <form onSubmit={invite}>
          <label>{t('Email')}<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="recruiter@club.com" /></label>
          <label>{t('Role')}<select value={role} onChange={e => setRole(e.target.value)}><option value="recruiter">{t('Recruiter')}</option><option value="analyst">{t('Analyst')}</option><option value="admin">{t('Club admin')}</option></select></label>
          <button type="submit" className="settings-primary" disabled={busy}>{busy ? t('Saving…') : t('Create invitation')}</button>
        </form>
        <p className="account-muted">{t('This records the invitation and requested role. Email delivery and acceptance will be connected to the authenticated account flow.')}</p>
      </section>

      <section className="settings-section">
        <div className="settings-section-heading"><span>{t('MEMBERS')}</span><h2>{t('Current team')}</h2></div>
        {members.length ? members.map(member => <div className="account-membership-row" key={member.user_id}><div><strong>{memberName[member.user_id] || t('WFM member')}</strong><small>{member.role} · {member.status}</small></div></div>) : <p className="account-muted">{t('No active members.')}</p>}
      </section>
    </div>}

    <section className="settings-section" style={{marginTop:24}}>
      <div className="settings-section-heading"><span>{t('INVITATIONS')}</span><h2>{t('Invitation history')}</h2></div>
      {invites.length ? invites.map(invite => <div className="account-membership-row" key={invite.id}><div><strong>{invite.email}</strong><small>{invite.role} · {invite.status}</small></div>{invite.status === 'pending' && <button type="button" className="admin-reject-button" disabled={busy} onClick={() => void revoke(invite.id)}>{t('Revoke')}</button>}</div>) : <p className="account-muted">{t('No invitations yet.')}</p>}
    </section>
  </section></main>
}
