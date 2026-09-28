'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const pages = [
  { href: '/players', label: 'Players' },
  { href: '/scouting', label: 'Scouting' },
  { href: '/contracts', label: 'Contracts' },
  { href: '/transfers', label: 'Transfers' },
  { href: '/salaries', label: 'Salaries' },
  { href: '/clubs', label: 'Clubs' },
]

export default function Header() {
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (mounted) setUserEmail(data.user?.email ?? null)
    }

    loadUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUserEmail(session?.user?.email ?? null)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const displayName = userEmail
    ? userEmail.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : null

  return (
    <nav className="site-header">
      <Link href="/" className="logo" aria-label="Women’s Football Market home">
        WFM<span>•</span>
      </Link>

      <div className="navlinks">
        {pages.map((page) => {
          const active = pathname === page.href || pathname.startsWith(page.href + '/')
          return (
            <Link key={page.href} href={page.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
              {page.label}
            </Link>
          )
        })}
      </div>

      <div className="header-meta">
        <span className="header-status">LIVE DATABASE</span>
        {userEmail ? (
          <Link href="/scouting" className="login" aria-label="Open your WFM account">
            Welcome {displayName}
          </Link>
        ) : (
          <Link href="/login" className="login" aria-label="Sign in to Women’s Football Market">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}
