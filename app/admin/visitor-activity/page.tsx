'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { useWfmT } from '../../lib/use-wfm-t'

type Activity = {
  id: string
  session_id: string
  user_id: string | null
  email: string | null
  display_name: string | null
  account_type: string | null
  organization_name: string | null
  job_title: string | null
  event_type: string
  path: string
  page_title: string | null
  referrer: string | null
  locale: string | null
  metadata: Record<string, unknown>
  occurred_at: string
}

export default function VisitorActivityAdminPage() {
  const t = useWfmT()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<Activity[]>([])
  const [hours, setHours] = useState(24)
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      setLoading(false)
      return
    }

    const { data: admin } = await supabase
      .from('wfm_admins')
      .select('user_id')
      .eq('user_id', user.user.id)
      .maybeSingle()

    setAuthorized(!!admin)
    if (!admin) {
      setLoading(false)
      return
    }

    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
    const { data, error: activityError } = await supabase.rpc(
      'get_wfm_admin_visitor_activity',
      { p_limit: 1000, p_since: since }
    )

    if (activityError) setError(activityError.message)
    setActivities((data ?? []) as Activity[])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [hours])

  const summary = useMemo(() => {
    const sessions = new Set(activities.map((a) => a.session_id))
    const users = new Set(activities.filter((a) => a.user_id).map((a) => a.user_id))
    const anonymousSessions = new Set(
      activities.filter((a) => !a.user_id).map((a) => a.session_id)
    )
    const cutoff = Date.now() - 5 * 60 * 1000
    const onlineSessions = new Set(
      activities
        .filter((a) => new Date(a.occurred_at).getTime() >= cutoff)
        .map((a) => a.session_id)
    )

    return {
      sessions: sessions.size,
      users: users.size,
      anonymous: anonymousSessions.size,
      online: onlineSessions.size
    }
  }, [activities])

  if (loading) {
    return <main className="account-page"><div className="account-card">{t('Loading visitor activity…')}</div></main>
  }

  if (!authorized) {
    return (
      <main className="account-page">
        <div className="account-card">
          <div className="eyebrow">{t('ADMIN')}</div>
          <h1>{t('Access restricted')}</h1>
          <p className="account-muted">{t('This workspace is limited to WFM administrators.')}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="account-page">
      <section className="account-card">
        <div className="account-card-top">
          <div>
            <div className="eyebrow">{t('WFM ADMIN · VISITOR ACTIVITY')}</div>
            <h1>{t('Visitor activity')}</h1>
            <p>{t('First-party activity from visitors who accepted analytics tracking. Signed-in WFM accounts are linked to their internal account profile; anonymous visitors remain anonymous.')}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/admin/commercial" className="outline">{t('Commercial dashboard')}</Link>
            <Link href="/" className="outline">{t('Homepage')}</Link>
          </div>
        </div>

        {error && <div className="account-message account-error">{error}</div>}

        <div className="club-workspace-grid">
          <section className="settings-section">
            <div className="settings-section-heading">
              <span>{t('LAST ACTIVITY')}</span>
              <h2>{t('Visitor overview')}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
              {[
                [t('Online now'), summary.online],
                [t('Sessions'), summary.sessions],
                [t('Signed-in users'), summary.users],
                [t('Anonymous sessions'), summary.anonymous]
              ].map(([label, value]) => (
                <div key={String(label)} style={{ border: '1px solid #e3e3e3', borderRadius: 12, padding: 14 }}>
                  <strong style={{ display: 'block', fontSize: 24 }}>{value}</strong>
                  <small>{label}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section-heading">
              <span>{t('WINDOW')}</span>
              <h2>{t('Activity range')}</h2>
            </div>
            <label>
              {t('Show activity from')}
              <select value={hours} onChange={(e) => setHours(Number(e.target.value))}>
                <option value={1}>{t('Last hour')}</option>
                <option value={6}>{t('Last 6 hours')}</option>
                <option value={24}>{t('Last 24 hours')}</option>
                <option value={168}>{t('Last 7 days')}</option>
              </select>
            </label>
          </section>
        </div>

        <section className="settings-section" style={{ marginTop: 24 }}>
          <div className="settings-section-heading">
            <span>{t('RECENT ACTIVITY')}</span>
            <h2>{activities.length} {t('events')}</h2>
          </div>

          {activities.length === 0 ? (
            <p className="account-muted">{t('No visitor activity has been recorded in this period.')}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('Visitor')}</th>
                    <th>{t('Status')}</th>
                    <th>{t('Activity')}</th>
                    <th>{t('Page')}</th>
                    <th>{t('Time')}</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => {
                    const visitor = activity.user_id
                      ? activity.display_name || activity.email || activity.user_id.slice(0, 8)
                      : t('Anonymous visitor')
                    const details = activity.organization_name || activity.job_title || activity.account_type || ''
                    const status = activity.user_id ? t('Signed in') : t('Anonymous')
                    return (
                      <tr key={activity.id}>
                        <td>
                          <strong>{visitor}</strong>
                          <small style={{ display: 'block' }}>{details}</small>
                        </td>
                        <td>{status}</td>
                        <td>{t(activity.event_type === 'page_view' ? 'Page view' : activity.event_type === 'heartbeat' ? 'Heartbeat' : 'Interaction')}</td>
                        <td>{activity.path}</td>
                        <td>{new Date(activity.occurred_at).toLocaleString()}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}
