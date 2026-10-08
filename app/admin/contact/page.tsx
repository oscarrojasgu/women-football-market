'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { useWfmT } from '../../lib/use-wfm-t'

type RequestRow = {
  id: string
  request_type: string
  name: string
  email: string
  organization: string | null
  subject: string
  message: string
  record_url: string | null
  status: string
  created_at: string
}

const STATUS_OPTIONS = ['new', 'in_progress', 'resolved', 'closed']

export default function ContactRequestsAdminPage() {
  const t = useWfmT()
  const [authorized, setAuthorized] = useState(false)
  const [rows, setRows] = useState<RequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setAuthorized(false)
      setLoading(false)
      return
    }
    const { data: admin } = await supabase.from('wfm_admins').select('user_id').eq('user_id', user.id).maybeSingle()
    setAuthorized(!!admin)
    if (!admin) {
      setLoading(false)
      return
    }
    const { data, error: requestError } = await supabase
      .from('wfm_contact_requests')
      .select('id,request_type,name,email,organization,subject,message,record_url,status,created_at')
      .order('created_at', { ascending: false })
      .limit(250)
    if (requestError) setError(requestError.message)
    setRows((data ?? []) as RequestRow[])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function updateStatus(id: string, status: string) {
    const { error: updateError } = await supabase.from('wfm_contact_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    if (updateError) setError(updateError.message)
    else setRows((current) => current.map((row) => row.id === id ? { ...row, status } : row))
  }

  if (loading) return <main className="account-page"><section className="account-card"><p>{t('Loading…')}</p></section></main>
  if (!authorized) return <main className="account-page"><section className="account-card"><h1>{t('Access restricted')}</h1><p>{t('You must be signed in as a WFM administrator.')}</p></section></main>

  return (
    <main className="account-page">
      <section className="account-card" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="eyebrow">WFM ADMIN · CONTACT</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <h1>{t('Contact requests')}</h1>
            <p className="account-muted">{t('Privacy, correction, verification, licensing, commercial, and support requests submitted through WFM.')}</p>
          </div>
          <Link href="/admin/visitor-activity" className="outline">{t('Analytics command center')}</Link>
        </div>

        {error && <p role="alert">{error}</p>}

        <div style={{ display: 'grid', gap: 14, marginTop: 24 }}>
          {rows.length === 0 && <p className="account-muted">{t('No contact requests yet.')}</p>}
          {rows.map((row) => (
            <article key={row.id} style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <strong>{row.subject}</strong>
                  <div className="account-muted">{row.name} · {row.email}{row.organization ? ' · ' + row.organization : ''}</div>
                </div>
                <select value={row.status} onChange={(e) => void updateStatus(row.id, e.target.value)} aria-label={t('Status')}>
                  {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>{t(row.request_type === 'data_correction' ? 'Data correction' : row.request_type === 'privacy' ? 'Privacy & data rights' : row.request_type === 'verification' ? 'Club / agency verification' : row.request_type === 'licensing' ? 'Licensing / copyright' : row.request_type === 'commercial' ? 'Commercial access' : 'General support')}</div>
              <p style={{ whiteSpace: 'pre-wrap' }}>{row.message}</p>
              {row.record_url && <a href={row.record_url} target="_blank" rel="noreferrer" className="outline">{t('Open referenced page')}</a>}
              <div className="account-muted" style={{ marginTop: 10 }}>{new Date(row.created_at).toLocaleString()}</div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
