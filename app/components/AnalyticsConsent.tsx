'use client'

import { useEffect, useState } from 'react'
import { useWfmT } from '../lib/use-wfm-t'

const CONSENT_KEY = 'wfm-analytics-consent'

export default function AnalyticsConsent() {
  const t = useWfmT()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(window.localStorage.getItem(CONSENT_KEY) === null)
  }, [])

  const choose = (value: 'accepted' | 'declined') => {
    window.localStorage.setItem(CONSENT_KEY, value)
    window.dispatchEvent(new Event('wfm-consent-change'))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <aside
      role="dialog"
      aria-label={t('Analytics preferences')}
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 'max(16px, env(safe-area-inset-bottom))',
        zIndex: 1000,
        maxWidth: 720,
        margin: '0 auto',
        padding: 18,
        border: '1px solid #d9d9d9',
        borderRadius: 16,
        background: '#fff',
        boxShadow: '0 12px 40px rgba(0,0,0,.14)'
      }}
    >
      <strong style={{ display: 'block', marginBottom: 8 }}>{t('Analytics preferences')}</strong>
      <p style={{ margin: '0 0 10px', lineHeight: 1.5 }}>
        {t('WFM uses analytics to understand website traffic and improve the site. You can accept or decline analytics tracking.')}
      </p>
      <p style={{ margin: '0 0 14px', lineHeight: 1.5, fontSize: 12 }}>
        <a href="/privacy" style={{ color: '#111', fontWeight: 700 }}>{t('Privacy Policy')}</a>
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="settings-primary" type="button" onClick={() => choose('accepted')}>
          {t('Accept analytics')}
        </button>
        <button className="outline" type="button" onClick={() => choose('declined')}>
          {t('Decline')}
        </button>
      </div>
    </aside>
  )
}
