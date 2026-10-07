'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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

function formatAge(value: string, ago: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ${ago}`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${ago}`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${ago}`
  return `${Math.floor(hours / 24)}d ${ago}`
}

export default function VisitorActivityAdminPage() {
  const t = useWfmT()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<Activity[]>([])
  const [hours, setHours] = useState(24)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({})
  const [clubNames, setClubNames] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setError('')
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      setAuthorized(false)
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

    if (activityError) {
      setError(activityError.message)
      setActivities([])
    } else {
      setActivities((data ?? []) as Activity[])
    }
    setLoading(false)
  }, [hours])

  useEffect(() => {
    void load()
    const refresh = window.setInterval(() => void load(), 30000)
    const clock = window.setInterval(() => setNow(Date.now()), 30000)
    return () => {
      window.clearInterval(refresh)
      window.clearInterval(clock)
    }
  }, [load])

  useEffect(() => {
    const playerIds = [...new Set(activities.filter((a) => a.event_type === 'interaction' && a.metadata?.action === 'player_view' && typeof a.metadata?.entity_id === 'string').map((a) => String(a.metadata.entity_id)))]
    const clubIds = [...new Set(activities.filter((a) => a.event_type === 'interaction' && a.metadata?.action === 'club_view' && typeof a.metadata?.entity_id === 'string').map((a) => String(a.metadata.entity_id)))]

    const loadNames = async () => {
      const [playersResult, clubsResult] = await Promise.all([
        playerIds.length ? supabase.from('players').select('id,full_name').in('id', playerIds) : Promise.resolve({ data: [], error: null }),
        clubIds.length ? supabase.from('clubs').select('id,name').in('id', clubIds) : Promise.resolve({ data: [], error: null })
      ])
      setPlayerNames(Object.fromEntries((playersResult.data ?? []).map((row: { id: string; full_name: string }) => [row.id, row.full_name])))
      setClubNames(Object.fromEntries((clubsResult.data ?? []).map((row: { id: string; name: string }) => [row.id, row.name])))
    }

    void loadNames()
  }, [activities])

  const summary = useMemo(() => {
    const sessions = new Set(activities.map((a) => a.session_id))
    const users = new Set(activities.filter((a) => a.user_id).map((a) => a.user_id))
    const anonymousSessions = new Set(activities.filter((a) => !a.user_id).map((a) => a.session_id))
    const cutoff = now - 5 * 60 * 1000
    const onlineSessions = new Set(
      activities.filter((a) => new Date(a.occurred_at).getTime() >= cutoff).map((a) => a.session_id)
    )
    return { sessions: sessions.size, users: users.size, anonymous: anonymousSessions.size, online: onlineSessions.size }
  }, [activities, now])

  const sessionRows = useMemo(() => {
    const map = new Map<string, Activity[]>()
    for (const activity of activities) {
      const rows = map.get(activity.session_id) ?? []
      rows.push(activity)
      map.set(activity.session_id, rows)
    }
    return [...map.entries()]
      .map(([sessionId, rows]) => {
        const sorted = [...rows].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
        const latest = sorted[0]
        const first = sorted[sorted.length - 1]
        const pages = [...new Set(rows.filter((a) => a.event_type === 'page_view').map((a) => a.path))]
        const online = new Date(latest.occurred_at).getTime() >= now - 5 * 60 * 1000
        return { sessionId, rows: sorted, latest, first, pages, online }
      })
      .sort((a, b) => new Date(b.latest.occurred_at).getTime() - new Date(a.latest.occurred_at).getTime())
  }, [activities, now])

  const topPages = useMemo(() => {
    const counts = new Map<string, number>()
    activities.filter((a) => a.event_type === 'page_view').forEach((a) => counts.set(a.path, (counts.get(a.path) ?? 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [activities])

  const productActivity = useMemo(() => {
    const count = (action: string) => activities.filter((a) => a.event_type === 'interaction' && a.metadata?.action === action).length
    const topEntities = (action: string) => {
      const map = new Map<string, number>()
      for (const activity of activities) {
        if (activity.event_type !== 'interaction' || activity.metadata?.action !== action) continue
        const id = typeof activity.metadata?.entity_id === 'string' ? activity.metadata.entity_id : ''
        if (id) map.set(id, (map.get(id) ?? 0) + 1)
      }
      return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
    }
    const searches = activities
      .filter((a) => a.event_type === 'interaction' && a.metadata?.action === 'search')
      .map((a) => typeof a.metadata?.query === 'string' ? a.metadata.query : '')
      .filter(Boolean)
      .slice(0, 8)

    return {
      playerViews: count('player_view'),
      clubViews: count('club_view'),
      searches: count('search'),
      contracts: count('contracts_view'),
      transfers: count('transfers_view'),
      salaries: count('salaries_view'),
      scouting: count('scouting_view'),
      topPlayers: topEntities('player_view'),
      topClubs: topEntities('club_view'),
      recentSearches: searches
    }
  }, [activities])

  const signedInUsers = useMemo(() => {
    const map = new Map<string, { activity: Activity; events: number; pages: Set<string> }>()
    for (const activity of activities) {
      if (!activity.user_id) continue
      const existing = map.get(activity.user_id)
      if (existing) {
        existing.events += 1
        if (activity.event_type === 'page_view') existing.pages.add(activity.path)
      } else {
        map.set(activity.user_id, {
          activity,
          events: 1,
          pages: new Set(activity.event_type === 'page_view' ? [activity.path] : [])
        })
      }
    }
    return [...map.values()].sort((a, b) => new Date(b.activity.occurred_at).getTime() - new Date(a.activity.occurred_at).getTime())
  }, [activities])

  const selected = selectedSession ? sessionRows.find((row) => row.sessionId === selectedSession) : null

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
            <div className="eyebrow">{t('WFM ADMIN · ANALYTICS COMMAND CENTER')}</div>
            <h1>{t('Visitor activity')}</h1>
            <p>{t('First-party activity from visitors who accepted analytics tracking. Signed-in WFM accounts are linked to their internal account profile; anonymous visitors remain anonymous.')}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="outline" onClick={() => void load()}>{t('Refresh')}</button>
            <Link href="/admin/commercial" className="outline">{t('Commercial dashboard')}</Link>
            <Link href="/" className="outline">{t('Homepage')}</Link>
          </div>
        </div>

        {error && <div className="account-message account-error">{error}</div>}

        <div className="club-workspace-grid">
          <section className="settings-section">
            <div className="settings-section-heading">
              <span>{t('LIVE NOW')}</span>
              <h2>{t('Visitor overview')}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
              {[
                [t('Online now'), summary.online],
                [t('Sessions'), summary.sessions],
                [t('Signed-in users'), summary.users],
                [t('Anonymous sessions'), summary.anonymous],
                [t('Events'), activities.length]
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
              <select value={hours} onChange={(e) => { setHours(Number(e.target.value)); setSelectedSession(null) }}>
                <option value={1}>{t('Last hour')}</option>
                <option value={6}>{t('Last 6 hours')}</option>
                <option value={24}>{t('Last 24 hours')}</option>
                <option value={168}>{t('Last 7 days')}</option>
              </select>
            </label>
          </section>
        </div>

        <div className="club-workspace-grid" style={{ marginTop: 24 }}>
          <section className="settings-section">
            <div className="settings-section-heading">
              <span>{t('PRODUCT ACTIVITY')}</span>
              <h2>{t('WFM feature usage')}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10 }}>
              {[
                [t('Player views'), productActivity.playerViews],
                [t('Club views'), productActivity.clubViews],
                [t('Searches'), productActivity.searches],
                [t('Contract views'), productActivity.contracts],
                [t('Transfer views'), productActivity.transfers],
                [t('Salary views'), productActivity.salaries],
                [t('Scouting views'), productActivity.scouting]
              ].map(([label, value]) => (
                <div key={String(label)} style={{ border: '1px solid #e3e3e3', borderRadius: 12, padding: 12 }}>
                  <strong style={{ display: 'block', fontSize: 20 }}>{value}</strong>
                  <small>{label}</small>
                </div>
              ))}
            </div>
          </section>
          <section className="settings-section">
            <div className="settings-section-heading">
              <span>{t('MOST VIEWED')}</span>
              <h2>{t('Players and clubs')}</h2>
            </div>
            {productActivity.topPlayers.length === 0 && productActivity.topClubs.length === 0 ? (
              <p className="account-muted">{t('No semantic product activity yet.')}</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {productActivity.topPlayers.map(([id, count]) => (
                  <div key={id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span>{playerNames[id] || id.slice(0, 8)}</span><strong>{count}</strong>
                  </div>
                ))}
                {productActivity.topClubs.map(([id, count]) => (
                  <div key={id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span>{clubNames[id] || id.slice(0, 8)}</span><strong>{count}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="club-workspace-grid" style={{ marginTop: 24 }}>
          <section className="settings-section">
            <div className="settings-section-heading">
              <span>{t('TOP ACTIVITY')}</span>
              <h2>{t('Most viewed pages')}</h2>
            </div>
            {topPages.length === 0 ? (
              <p className="account-muted">{t('No page views in this period.')}</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {topPages.map(([path, count]) => (
                  <div key={path} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    <span style={{ overflowWrap: 'anywhere' }}>{path}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="settings-section">
            <div className="settings-section-heading">
              <span>{t('IDENTIFIED USERS')}</span>
              <h2>{t('Signed-in activity')}</h2>
            </div>
            {signedInUsers.length === 0 ? (
              <p className="account-muted">{t('No signed-in activity in this period.')}</p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {signedInUsers.slice(0, 8).map(({ activity, events, pages }) => (
                  <button
                    key={activity.user_id}
                    type="button"
                    onClick={() => setSelectedSession(activity.session_id)}
                    style={{ textAlign: 'left', border: '1px solid #e3e3e3', borderRadius: 10, padding: 10, background: 'transparent', cursor: 'pointer' }}
                  >
                    <strong>{activity.display_name || activity.email || activity.user_id?.slice(0, 8)}</strong>
                    <small style={{ display: 'block' }}>{activity.organization_name || activity.job_title || activity.account_type || t('WFM account')}</small>
                    <small>{events} {t('events')} · {pages.size} {t('pages')}</small>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="settings-section" style={{ marginTop: 24 }}>
          <div className="settings-section-heading">
            <span>{t('VISITORS')}</span>
            <h2>{sessionRows.length} {t('sessions')}</h2>
          </div>
          {sessionRows.length === 0 ? (
            <p className="account-muted">{t('No visitor activity has been recorded in this period.')}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('Visitor')}</th>
                    <th>{t('Status')}</th>
                    <th>{t('Pages')}</th>
                    <th>{t('Last page')}</th>
                    <th>{t('Last active')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionRows.map((session) => {
                    const activity = session.latest
                    const visitor = activity.user_id
                      ? activity.display_name || activity.email || activity.user_id.slice(0, 8)
                      : `Anonymous #${session.sessionId.replace(/-/g, '').slice(0, 4).toUpperCase()}`
                    return (
                      <tr key={session.sessionId} onClick={() => setSelectedSession(session.sessionId)} style={{ cursor: 'pointer' }}>
                        <td>
                          <strong>{visitor}</strong>
                          <small style={{ display: 'block' }}>{activity.organization_name || activity.job_title || activity.account_type || (activity.user_id ? t('WFM account') : t('Anonymous visitor'))}</small>
                        </td>
                        <td>{session.online ? t('Online') : activity.user_id ? t('Signed in') : t('Anonymous')}</td>
                        <td>{session.pages.length}</td>
                        <td>{activity.path}</td>
                        <td>{formatAge(activity.occurred_at, t('ago'))}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selected && (
          <section className="settings-section" style={{ marginTop: 24 }}>
            <div className="settings-section-heading">
              <span>{t('SESSION DETAIL')}</span>
              <h2>{selected.latest.user_id ? (selected.latest.display_name || selected.latest.email || t('Signed-in visitor')) : `Anonymous #${selected.sessionId.replace(/-/g, '').slice(0, 4).toUpperCase()}`}</h2>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <small>{t('First seen')}: {new Date(selected.first.occurred_at).toLocaleString()}</small>
              <small>{t('Last active')}: {new Date(selected.latest.occurred_at).toLocaleString()}</small>
              <small>{selected.pages.length} {t('unique pages')} · {selected.rows.length} {t('events')}</small>
              <button type="button" className="outline" onClick={() => setSelectedSession(null)}>{t('Close')}</button>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {selected.rows.map((activity) => (
                <div key={activity.id} style={{ display: 'grid', gridTemplateColumns: '130px minmax(90px,160px) 1fr', gap: 10, alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #eee' }}>
                  <small>{new Date(activity.occurred_at).toLocaleTimeString()}</small>
                  <strong>{t(activity.event_type === 'page_view' ? 'Page view' : activity.event_type === 'heartbeat' ? 'Heartbeat' : 'Interaction')}</strong>
                  <span style={{ overflowWrap: 'anywhere' }}>{activity.path}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  )
}
