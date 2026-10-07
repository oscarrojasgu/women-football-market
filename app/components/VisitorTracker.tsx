'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { getLocaleFromPathname } from '../lib/i18n'

const CONSENT_KEY = 'wfm-analytics-consent'
const SESSION_KEY = 'wfm-visitor-session'

function getSessionId() {
  if (typeof window === 'undefined') return null
  const existing = window.sessionStorage.getItem(SESSION_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  window.sessionStorage.setItem(SESSION_KEY, id)
  return id
}

export default function VisitorTracker() {
  const pathname = usePathname()
  const userIdRef = useRef<string | null>(null)
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const hasConsent = () => window.localStorage.getItem(CONSENT_KEY) === 'accepted'
    const sessionId = getSessionId()
    sessionIdRef.current = sessionId

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      userIdRef.current = data.user?.id ?? null
    }

    void loadUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      userIdRef.current = session?.user?.id ?? null
    })

    const record = async (eventType: 'page_view' | 'heartbeat' | 'interaction') => {
      if (!hasConsent() || !sessionIdRef.current || !pathname) return

      const payload = {
        session_id: sessionIdRef.current,
        user_id: userIdRef.current,
        event_type: eventType,
        path: pathname,
        page_title: document.title || null,
        referrer: document.referrer || null,
        locale: getLocaleFromPathname(pathname),
        metadata: {
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight
        }
      }

      await supabase.from('wfm_visitor_activity').insert(payload)
    }

    const handleConsent = () => {
      if (hasConsent()) void record('page_view')
    }

    window.addEventListener('wfm-consent-change', handleConsent)

    if (hasConsent()) void record('page_view')

    const heartbeat = window.setInterval(() => {
      if (hasConsent()) void record('heartbeat')
    }, 60000)

    return () => {
      window.clearInterval(heartbeat)
      window.removeEventListener('wfm-consent-change', handleConsent)
      listener.subscription.unsubscribe()
    }
  }, [pathname])

  return null
}
