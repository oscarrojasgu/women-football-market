'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useWfmT } from '../../lib/use-wfm-t'
import { supabase } from '../../lib/supabase'

type Club = { id: string; name: string; country: string | null }
type Membership = { club_id: string; role: string; status: string; club: Club | null }

export default function AccountSettingsPage() {
  const t = useWfmT()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [requestClub, setRequestClub] = useState('')
  const [requestRole, setRequestRole] = useState('recruiter')
  const [requestMessage, setRequestMessage] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [entitlements, setEntitlements] = useState<any[]>([])

  const load = async () => {
    const { data, error: userError } = await supabase.auth.getUser()
    if (userError || !data.user) {
      setError(t('Please sign in to manage your account.'))
      setLoading(false)
      return
    }
    const user = data.user
    setUserId(user.id)
    setUserEmail(user.email ?? '')
    const metadata = user.user_metadata ?? {}
    setDisplayName(
      typeof metadata.display_name === 'string'
        ? metadata.display_name
        : typeof metadata.full_name === 'string'
          ? metadata.full_name
          : user.email?.split('@')[0] ?? ''
    )

    const [{ data: memberRows }, { data: clubRows }, { data: entitlementRows }] = await Promise.all([
      supabase.from('club_account_members').select('club_id,role,status,club:clubs(id,name,country)').eq('user_id', user.id),
      supabase.from('clubs').select('id,name,country').order('name'),
      supabase.from('wfm_account_entitlements').select('id,plan_code,status,starts_at,ends_at,club_id').eq('user_id', user.id).order('starts_at',{ascending:false}),
    ])
    setMemberships((memberRows ?? []).map((row: any) => ({
      club_id: row.club_id,
      role: row.role,
      status: row.status,
      club: Array.isArray(row.club) ? row.club[0] ?? null : row.club ?? null,
    })))
    setClubs((clubRows ?? []) as Club[])
    setEntitlements(entitlementRows ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    const trimmed = displayName.trim()
    if (!trimmed) { setError(t('Display name is required.')); setSaving(false); return }
    const { error: updateError } = await supabase.auth.updateUser({ data: { display_name: trimmed } })
    if (updateError) setError(updateError.message)
    else setMessage(t('Profile updated.'))
    setSaving(false)
  }

  const changePassword = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    if (newPassword.length < 8) { setError(t('Password must be at least 8 characters.')); setSaving(false); return }
    const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword })
    if (passwordError) setError(passwordError.message)
    else { setNewPassword(''); setMessage(t('Password updated.')) }
    setSaving(false)
  }

  const requestClubAccess = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    if (!requestClub) { setError(t('Select a club first.')); setSaving(false); return }
    const { error: requestError } = await supabase.from('club_account_requests').insert({
      user_id: userId,
      club_id: requestClub,
      requested_role: requestRole,
      message: requestMessage.trim() || null,
    })
    if (requestError) setError(requestError.message)
    else { setRequestMessage(''); setMessage(t('Club access request submitted for WFM review.')) }
    setSaving(false)
  }

  if (loading) return <main className="account-page"><div className="account-card">{t('Loading account…')}</div></main>

  return (
    <main className="account-page">
      <section className="account-card">
        <div className="account-card-top">
          <div><div className="eyebrow">{t('ACCOUNT')}</div><h1>{t('Profile & settings')}</h1><p>{t('Manage your WFM identity, security and professional access.')}</p></div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Link href={memberships.length ? '/account/club' : '/scouting'} className="outline">{memberships.length ? t('Club workspace') : t('Scouting workspace')}</Link><Link href="/account/agency" className="outline">{t('Agent / agency workspace')}</Link><Link href="/account/licensing" className="outline">{t('Commercial licensing')}</Link></div>
        </div>

        {error && <div className="account-message account-error">{error}</div>}
        {message && <div className="account-message account-success">{message}</div>}

        <div className="account-settings-grid">
          <form onSubmit={saveProfile} className="settings-section">
            <div className="settings-section-heading"><span>{t('PROFILE')}</span><h2>{t('Personal information')}</h2></div>
            <label>{t('Display name')}<input value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={80} /></label>
            <label>{t('Email')}<input value={userEmail} readOnly /><small>{t('Email is managed by your authentication account.')}</small></label>
            <button type="submit" className="settings-primary" disabled={saving}>{saving ? t('Saving…') : t('Save profile')}</button>
          </form>

          <form onSubmit={changePassword} className="settings-section">
            <div className="settings-section-heading"><span>{t('SECURITY')}</span><h2>{t('Change password')}</h2></div>
            <label>{t('New password')}<input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" autoComplete="new-password" minLength={8} placeholder={t('At least 8 characters')} /></label>
            <button type="submit" className="settings-primary" disabled={saving || newPassword.length < 8}>{saving ? t('Updating…') : t('Update password')}</button>
          </form>
        </div>

        <div className="account-settings-grid">
          <section className="settings-section">
            <div className="settings-section-heading"><span>{t('ACCESS PLAN')}</span><h2>{t('Commercial access')}</h2></div>
            {entitlements.length ? entitlements.map(e => <div key={e.id} className="account-membership-row"><div><strong>{String(e.plan_code).replaceAll('_',' ')}</strong><small>{e.club_id ? t('Club entitlement') : t('Account entitlement')} · {t('active from')} {new Date(e.starts_at).toLocaleDateString()}</small></div><span className="account-status-pill">{e.status}</span></div>) : <p className="account-muted">{t('No paid or commercial entitlement is assigned to this account. Public WFM access remains available.')}</p>}
          </section>
          <section className="settings-section"><div className="settings-section-heading"><span>{t('COMMERCIAL NOTE')}</span><h2>{t('WFM access')}</h2></div><p className="account-muted">{t('Commercial plans and licensing are managed by WFM. Payment and subscription processing are intentionally kept outside the current account settings until the billing integration is enabled.')}</p></section>
        </div>

        <div className="account-settings-grid">
          <section className="settings-section">
            <div className="settings-section-heading"><span>{t('ACCESS')}</span><h2>{t('Club memberships')}</h2></div>
            {memberships.length ? memberships.map(m => (
              <div key={m.club_id} className="account-membership-row">
                <div><strong>{m.club?.name ?? t('Club')}</strong><small>{m.club?.country ?? t('Country unavailable')} · {m.role}</small></div>
                <span className="account-status-pill">{m.status}</span>
              </div>
            )) : <p className="account-muted">{t('No club workspace access is connected to this account.')}</p>}
          </section>

          <form onSubmit={requestClubAccess} className="settings-section">
            <div className="settings-section-heading"><span>{t('CLUB ACCESS')}</span><h2>{t('Request club workspace')}</h2></div>
            <label>{t('Club')}<select value={requestClub} onChange={e => setRequestClub(e.target.value)}><option value="">{t('Select a club')}</option>{clubs.map(club => <option key={club.id} value={club.id}>{club.name}{club.country ? ' · ' + club.country : ''}</option>)}</select></label>
            <label>{t('Requested role')}<select value={requestRole} onChange={e => setRequestRole(e.target.value)}><option value="recruiter">{t('Recruiter')}</option><option value="analyst">{t('Analyst')}</option><option value="admin">{t('Club admin')}</option></select></label>
            <label>{t('Message')}<textarea value={requestMessage} onChange={e => setRequestMessage(e.target.value)} placeholder={t('Tell WFM why you should have access.')} rows={4} maxLength={500} /></label>
            <button type="submit" className="settings-primary" disabled={saving}>{saving ? t('Submitting…') : t('Request access')}</button>
          </form>
        </div>
      </section>
    </main>
  )
}
