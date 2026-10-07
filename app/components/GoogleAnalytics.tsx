'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const CONSENT_KEY = 'wfm-analytics-consent'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

export default function GoogleAnalytics() {
  const [consent, setConsent] = useState<'accepted' | 'declined' | null>(null)

  useEffect(() => {
    const readConsent = () => {
      const value = window.localStorage.getItem(CONSENT_KEY)
      setConsent(value === 'accepted' || value === 'declined' ? value : null)
    }

    readConsent()
    window.addEventListener('wfm-consent-change', readConsent)
    return () => window.removeEventListener('wfm-consent-change', readConsent)
  }, [])

  useEffect(() => {
    if (consent !== 'accepted' || !measurementId) return

    const syncUserId = async () => {
      const { data } = await supabase.auth.getUser()
      const userId = data.user?.id ?? null

      if (typeof window.gtag !== 'function') return

      window.gtag('set', 'user_id', userId)
      window.gtag('set', 'user_properties', {
        account_status: userId ? 'signed_in' : 'anonymous'
      })
    }

    void syncUserId()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void syncUserId()
    })

    return () => listener.subscription.unsubscribe()
  }, [consent])

  if (!measurementId || consent !== 'accepted') return null

  const syncAfterLoad = () => {
    void (async () => {
      const { data } = await supabase.auth.getUser()
      const userId = data.user?.id ?? null
      if (typeof window.gtag !== 'function') return
      window.gtag('set', 'user_id', userId)
      window.gtag('set', 'user_properties', {
        account_status: userId ? 'signed_in' : 'anonymous'
      })
    })()
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        onLoad={syncAfterLoad}
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = function(){window.dataLayer.push(arguments);}
          window.gtag('js', new Date());
          window.gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  )
}
