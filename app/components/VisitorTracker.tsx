'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { getLocaleFromPathname } from '../lib/i18n'

const CONSENT_KEY = 'wfm-analytics-consent'
const SESSION_KEY = 'wfm-visitor-session'

type InteractionDetail = {
  action: string
  entity_type?: string
  entity_id?: string
  label?: string
  metadata?: Record<string, unknown>
}

declare global {
  interface Window {
    wfmTrackInteraction?: (detail: InteractionDetail) => void
  }
}

function getSessionId() {
  if (typeof window === 'undefined') return null
  const existing = window.sessionStorage.getItem(SESSION_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  window.sessionStorage.setItem(SESSION_KEY, id)
  return id
}

function classifyPath(path: string) {
  const player = path.match(/^\/(?:[a-z]{2}\/)?players\/([0-9a-f-]{36})$/i)
  if (player) return { action: 'player_view', entity_type: 'player', entity_id: player[1] }
  const club = path.match(/^\/(?:[a-z]{2}\/)?clubs\/([0-9a-f-]{36})$/i)
  if (club) return { action: 'club_view', entity_type: 'club', entity_id: club[1] }
  if (/\/contracts(?:\/|$)/.test(path)) return { action: 'contracts_view' }
  if (/\/transfers(?:\/|$)/.test(path)) return { action: 'transfers_view' }
  if (/\/salaries(?:\/|$)/.test(path)) return { action: 'salaries_view' }
  if (/\/scouting(?:\/|$)/.test(path)) return { action: 'scouting_view' }
  if (/\/competitions(?:\/|$)/.test(path)) return { action: 'competitions_view' }
  return null
}

export default function VisitorTracker() {
  const pathname = usePathname()
  const userIdRef = useRef<string | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const pathnameRef = useRef(pathname)

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

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

    const record = async (
      eventType: 'page_view' | 'heartbeat' | 'interaction',
      metadata: Record<string, unknown> = {}
    ) => {
      if (!hasConsent() || !sessionIdRef.current || !pathnameRef.current) return

      await supabase.from('wfm_visitor_activity').insert({
        session_id: sessionIdRef.current,
        user_id: userIdRef.current,
        event_type: eventType,
        path: pathnameRef.current,
        page_title: document.title || null,
        referrer: document.referrer || null,
        locale: getLocaleFromPathname(pathnameRef.current),
        metadata: {
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
          ...metadata
        }
      })
    }

    window.wfmTrackInteraction = (detail) => {
      void record('interaction', {
        action: detail.action,
        entity_type: detail.entity_type ?? null,
        entity_id: detail.entity_id ?? null,
        label: detail.label?.slice(0, 120) || null,
        ...(detail.metadata ?? {})
      })
    }

    const handleConsent = () => {
      if (hasConsent()) void record('page_view')
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const anchor = target?.closest('a') as HTMLAnchorElement | null
      if (!anchor) return

      const href = anchor.getAttribute('href') || ''
      const url = new URL(href, window.location.origin)
      if (url.origin !== window.location.origin) return

      const classification = classifyPath(url.pathname)
      if (classification && url.pathname !== pathnameRef.current) {
        window.wfmTrackInteraction?.({
          ...classification,
          label: anchor.textContent?.trim() || undefined
        })
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || pathnameRef.current !== '/players') return
      const target = event.target as HTMLInputElement | null
      if (!target || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA')) return
      const query = target.value.trim()
      if (!query) return
      window.wfmTrackInteraction?.({ action: 'search', label: 'Player search' })
    }

    window.addEventListener('wfm-consent-change', handleConsent)
    document.addEventListener('click', handleClick)
    document.addEventListener('keydown', handleKeyDown)

    if (hasConsent()) void record('page_view')

    const heartbeat = window.setInterval(() => {
      if (hasConsent()) void record('heartbeat')
    }, 60000)

    return () => {
      window.clearInterval(heartbeat)
      window.removeEventListener('wfm-consent-change', handleConsent)
      document.removeEventListener('click', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
      if (window.wfmTrackInteraction) delete window.wfmTrackInteraction
      listener.subscription.unsubscribe()
    }
  }, [pathname])

  return null
}
