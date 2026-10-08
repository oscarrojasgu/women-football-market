'use client'

import Link from 'next/link'
import { useWfmT } from '../lib/use-wfm-t'

export default function Footer() {
  const t = useWfmT()
  return (
    <footer style={{ borderTop: '1px solid #ddd', background: '#fafafa', padding: '28px 20px 36px', marginTop: 20 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: '#777' }}>© {new Date().getFullYear()} Women’s Football Market</div>
        <nav aria-label={t('Legal')} style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Link href="/privacy" style={{ color: '#111', fontSize: 12 }}>{t('Privacy Policy')}</Link>
          <Link href="/terms" style={{ color: '#111', fontSize: 12 }}>{t('Terms of Use')}</Link>
          <Link href="/data-corrections" style={{ color: '#111', fontSize: 12 }}>{t('Data Corrections')}</Link>
          <Link href="/pricing" style={{ color: '#111', fontSize: 12 }}>{t('Pricing')}</Link>
          <Link href="/contact" style={{ color: '#111', fontSize: 12 }}>{t('Contact')}</Link>
        </nav>
      </div>
    </footer>
  )
}
