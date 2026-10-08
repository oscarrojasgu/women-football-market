'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { useWfmT } from '../lib/use-wfm-t'

const TYPES = [
  ['privacy', 'Privacy & data rights'],
  ['data_correction', 'Data correction'],
  ['verification', 'Club / agency verification'],
  ['licensing', 'Licensing / copyright'],
  ['commercial', 'Commercial access'],
  ['support', 'General support']
] as const

export default function ContactPage() {
  const t = useWfmT()
  const [type, setType] = useState('privacy')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [organization, setOrganization] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [recordUrl, setRecordUrl] = useState('')
  const [website, setWebsite] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (website.trim()) return
    setSending(true)
    setResult('')
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('wfm_contact_requests').insert({
      user_id: user?.id ?? null,
      request_type: type,
      name: name.trim(),
      email: email.trim(),
      organization: organization.trim() || null,
      subject: subject.trim(),
      message: message.trim(),
      record_url: recordUrl.trim() || null
    })

    if (error) {
      setResult(error.message)
    } else {
      setName('')
      setEmail('')
      setOrganization('')
      setSubject('')
      setMessage('')
      setRecordUrl('')
      setResult(t('Your request has been submitted. WFM will review it through the contact workflow.'))
    }
    setSending(false)
  }

  return (
    <main className="account-page">
      <section className="account-card" style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="eyebrow">WFM CONTACT</div>
        <h1>{t('Contact WFM')}</h1>
        <p className="account-muted">{t('Use this contact pathway for privacy requests, data corrections, verification, licensing, commercial access, and general support.')}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, margin: '22px 0 28px' }}>
          {TYPES.map(([value, label]) => (
            <button key={value} type="button" onClick={() => setType(value)} className={type === value ? 'outline' : ''} style={{ textAlign: 'left', padding: 14, border: '1px solid #ddd', borderRadius: 10, background: type === value ? '#f5f5f5' : '#fff', cursor: 'pointer' }}>
              <strong>{t(label)}</strong>
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} placeholder={t('Name')} aria-label={t('Name')} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={320} type="email" placeholder={t('Email')} aria-label={t('Email')} />
          <input value={organization} onChange={(e) => setOrganization(e.target.value)} maxLength={200} placeholder={t('Organization (optional)')} aria-label={t('Organization (optional)')} />
          <input value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={200} placeholder={t('Subject')} aria-label={t('Subject')} />
          <input value={recordUrl} onChange={(e) => setRecordUrl(e.target.value)} maxLength={1000} placeholder={t('WFM record or page URL (optional)')} aria-label={t('WFM record or page URL (optional)')} />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={5000} rows={8} placeholder={t('Explain your request and include supporting details or evidence links when appropriate.')} aria-label={t('Message')} />
          <input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: 'none' }} />
          <button type="submit" disabled={sending} className="primary">{sending ? t('Submitting…') : t('Submit request')}</button>
        </form>

        {result && <p style={{ marginTop: 16 }} role="status">{result}</p>}

        <p className="account-muted" style={{ marginTop: 24 }}>
          {t('For privacy requests, WFM may need enough information to identify the relevant account or record. Please do not submit passwords, payment-card numbers, or other sensitive secrets.')}
        </p>

        <p style={{ marginTop: 24 }}>
          <Link href="/privacy" className="outline">{t('Privacy Policy')}</Link>{' '}
          <Link href="/data-corrections" className="outline">{t('Data Corrections')}</Link>
        </p>
      </section>
    </main>
  )
}
