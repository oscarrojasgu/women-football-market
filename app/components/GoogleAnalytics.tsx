'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

export default function GoogleAnalytics() {
  useEffect(() => {
    if (!measurementId || typeof window === 'undefined') return

    const syncUserId = async () => {
      const { data } = await supabase.auth.getUser()
      const userId = data.user?.id

      if (typeof window.gtag !== 'function') return

      if (userId) {
        window.gtag('set', 'user_id', userId)
        window.gtag('config', measurementId, {
          user_id: userId,
          user_properties: {
            account_status: 'signed_in'
          },
          send_page_view: false
        })
      } else {
        window.gtag('set', 'user_id', null)
      }
    }

    void syncUserId()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void syncUserId()
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (!measurementId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
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
