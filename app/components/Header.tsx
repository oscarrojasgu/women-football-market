'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
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
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!mounted) return
      setUserEmail(data.user?.email ?? null)
      setUserRole((data.user?.app_metadata?.role as string | undefined) ?? null)
    }

    loadUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setUserEmail(session?.user?.email ?? null)
      setUserRole((session?.user?.app_metadata?.role as string | undefined) ?? null)
      if (!session) setMenuOpen(false)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const displayName = userEmail
    ? userEmail.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : null

  const isClubAccount = userRole === 'club' || userRole === 'club_admin' || userRole === 'club_staff'

  const signOut = async () => {
    setSigningOut(true)
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) {
      setSigningOut(false)
      return
    }
    setMenuOpen(false)
    router.replace('/')
    router.refresh()
  }

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
          <div className="account-menu" ref={menuRef}>
            <button
              type="button"
              className="account-trigger"
              onClick={() => setMenuOpen(open => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span>Welcome {displayName}</span>
              <span className="account-chevron" aria-hidden="true">⌄</span>
            </button>

            {menuOpen && (
              <div className="account-dropdown" role="menu">
                <div className="account-dropdown-header">
                  <strong>{displayName}</strong>
                  <span>{isClubAccount ? 'Club account' : 'Scout account'}</span>
                  <small>{userEmail}</small>
                </div>

                <div className="account-dropdown-links">
                  <Link href="/account/settings" role="menuitem" onClick={() => setMenuOpen(false)}>
                    Edit profile & settings
                  </Link>

                  {isClubAccount ? (
                    <Link href="/clubs" role="menuitem" onClick={() => setMenuOpen(false)}>
                      Club workspace
                    </Link>
                  ) : (
                    <Link href="/scouting" role="menuitem" onClick={() => setMenuOpen(false)}>
                      Scouting workspace
                    </Link>
                  )}
                </div>

                <button
                  type="button"
                  className="account-signout"
                  role="menuitem"
                  onClick={signOut}
                  disabled={signingOut}
                >
                  {signingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="login" aria-label="Sign in to Women’s Football Market">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}
