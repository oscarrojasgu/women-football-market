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
  { href: '/competitions', label: 'Competitions' },
]

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null)
  const [isClubAccount, setIsClubAccount] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const loadAccount = async (userId: string, email: string | null, metadata: Record<string, unknown>) => {
    setUserEmail(email)
    setUserDisplayName(typeof metadata.display_name === 'string' ? metadata.display_name : null)
    const { data } = await supabase.from('club_account_members').select('club_id').eq('user_id', userId).eq('status', 'active').limit(1)
    setIsClubAccount((data?.length ?? 0) > 0 || ['club','club_admin','club_staff'].includes(String(metadata.role ?? '')))
  }

  useEffect(() => {
    let mounted = true
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!mounted || !data.user) return
      await loadAccount(data.user.id, data.user.email ?? null, data.user.user_metadata ?? {})
    }
    loadUser()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (!session?.user) { setUserEmail(null); setIsClubAccount(false); setMenuOpen(false); return }
      void loadAccount(session.user.id, session.user.email ?? null, session.user.user_metadata ?? {})
    })
    return () => { mounted = false; listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    const pointer = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false) }
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', pointer); document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', pointer); document.removeEventListener('keydown', key) }
  }, [])

  const displayName = userDisplayName?.trim() || (userEmail ? userEmail.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : null)

  const signOut = async () => {
    setSigningOut(true)
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) { setSigningOut(false); return }
    setMenuOpen(false); router.replace('/'); router.refresh()
  }

  return (
    <nav className="site-header">
      <Link href="/" className="logo" aria-label="Women’s Football Market home">WFM<span>•</span></Link>
      <div className="navlinks">{pages.map(page => {
        const active = pathname === page.href || pathname.startsWith(page.href + '/')
        return <Link key={page.href} href={page.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>{page.label}</Link>
      })}</div>
      <div className="header-meta">
        <span className="header-status">LIVE DATABASE</span>
        {userEmail ? (
          <div className="account-menu" ref={menuRef}>
            <button type="button" className="account-trigger" onClick={() => setMenuOpen(v => !v)} aria-expanded={menuOpen} aria-haspopup="menu">
              <span>Welcome {displayName}</span><span className="account-chevron" aria-hidden="true">⌄</span>
            </button>
            {menuOpen && <div className="account-dropdown" role="menu">
              <div className="account-dropdown-header"><strong>{displayName}</strong><span>{isClubAccount ? 'Club account' : 'Scout account'}</span><small>{userEmail}</small></div>
              <div className="account-dropdown-links">
                <Link href="/account/settings" role="menuitem" onClick={() => setMenuOpen(false)}>Edit profile & settings</Link>
                <Link href={isClubAccount ? '/account/club' : '/scouting'} role="menuitem" onClick={() => setMenuOpen(false)}>{isClubAccount ? 'Club workspace' : 'Scouting workspace'}</Link>{isClubAccount && <Link href="/account/club/reports" role="menuitem" onClick={() => setMenuOpen(false)}>Saved reports</Link>}
              </div>
              <button type="button" className="account-signout" role="menuitem" onClick={signOut} disabled={signingOut}>{signingOut ? 'Signing out…' : 'Sign out'}</button>
            </div>}
          </div>
        ) : <Link href="/login" className="login" aria-label="Sign in to Women’s Football Market">Sign in</Link>}
      </div>
    </nav>
  )
}
