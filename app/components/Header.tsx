'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getLocaleFromPathname, LANGUAGE_LABELS, localizedPath, WFM_LOCALES, translate, type WfmLocale } from '../lib/i18n'

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
  const locale = getLocaleFromPathname(pathname)
  const routePath = pathname.replace(/^\/(?:en|es|pt|fr|de)(?=\/|$)/, '') || '/'
  
  const [languageOpen, setLanguageOpen] = useState(false)

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

  const changeLanguage = (nextLocale: WfmLocale) => {
    setLanguageOpen(false)
    document.cookie = `wfm-locale=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    window.location.assign(localizedPath(nextLocale, pathname))
  }

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
        const active = routePath === page.href || routePath.startsWith(page.href + '/')
        return <Link key={page.href} href={localizedPath(locale, page.href)} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>{translate(locale, page.label)}</Link>
      })}</div>
      <div className="header-meta">
        <div className="language-menu">
          <button type="button" className="language-trigger" onClick={() => setLanguageOpen(v => !v)} aria-expanded={languageOpen} aria-haspopup="menu">
            <span>{locale.toUpperCase()}</span><span className="account-chevron" aria-hidden="true">⌄</span>
          </button>
          {languageOpen && <div className="language-dropdown" role="menu" aria-label={translate(locale, 'Language')}>
            {WFM_LOCALES.map(code => <button key={code} type="button" role="menuitem" className={code === locale ? 'active' : ''} onClick={() => changeLanguage(code)}>{LANGUAGE_LABELS[code]}</button>)}
          </div>}
        </div>
        <span className="header-status">{translate(locale, 'LIVE DATABASE')}</span>
        {userEmail ? (
          <div className="account-menu" ref={menuRef}>
            <button type="button" className="account-trigger" onClick={() => setMenuOpen(v => !v)} aria-expanded={menuOpen} aria-haspopup="menu">
              <span>Welcome {displayName}</span><span className="account-chevron" aria-hidden="true">⌄</span>
            </button>
            {menuOpen && <div className="account-dropdown" role="menu">
              <div className="account-dropdown-header"><strong>{displayName}</strong><span>{isClubAccount ? 'Club account' : 'Scout account'}</span><small>{userEmail}</small></div>
              <div className="account-dropdown-links">
                <Link href={localizedPath(locale, '/account/settings')} role="menuitem" onClick={() => setMenuOpen(false)}>Edit profile & settings</Link>
                <Link href={localizedPath(locale, isClubAccount ? '/account/club' : '/scouting')} role="menuitem" onClick={() => setMenuOpen(false)}>{isClubAccount ? 'Club workspace' : 'Scouting workspace'}</Link>{isClubAccount && <Link href={localizedPath(locale, '/account/club/reports')} role="menuitem" onClick={() => setMenuOpen(false)}>Saved reports</Link>}
              </div>
              <button type="button" className="account-signout" role="menuitem" onClick={signOut} disabled={signingOut}>{signingOut ? 'Signing out…' : 'Sign out'}</button>
            </div>}
          </div>
        ) : <Link href={localizedPath(locale, '/login')} className="login" aria-label="Sign in to Women’s Football Market">{translate(locale, 'Sign in')}</Link>}
      </div>
    </nav>
  )
}
