'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { getLocaleFromPathname, LANGUAGE_LABELS, localizedPath, translate, WFM_LOCALES, type WfmLocale } from '../lib/i18n'

const pages = [
  { href: '/', label: 'Home' },
  { href: '/players', label: 'Players' },
  { href: '/scouting', label: 'Scouting' },
  { href: '/contracts', label: 'Contracts' },
  { href: '/transfers', label: 'Transfers' },
  { href: '/salaries', label: 'Salaries' },
  { href: '/clubs', label: 'Clubs' },
  { href: '/competitions', label: 'Competitions' },
]

export default function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const locale = getLocaleFromPathname(pathname)
  const routePath = pathname.replace(/^\/(?:en|es|pt|fr|de)(?=\/|$)/, '') || '/'

  const currentPageKey = pages.find((page) => {
    if (page.href === '/') return routePath === '/'
    return routePath === page.href || routePath.startsWith(`${page.href}/`)
  })?.label || 'Women’s Football Market'
  const currentPage = translate(locale, currentPageKey)

  const changeLanguage = (nextLocale: WfmLocale) => {
    document.cookie = `wfm-locale=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    setOpen(false)
    window.location.assign(localizedPath(nextLocale, pathname))
  }

  return (
    <>
      <div className="mobile-nav">
        <Link href={localizedPath(locale, '/')} className="mobile-nav-brand" onClick={() => setOpen(false)}>
          WFM<span>•</span>
        </Link>

        <div className="mobile-nav-title">{currentPage}</div>

        <button
          type="button"
          className={`mobile-nav-menu ${open ? 'is-open' : ''}`}
          onClick={() => setOpen((value) => !value)}
          aria-label={translate(locale, open ? 'Close navigation menu' : 'Open navigation menu')}
          aria-expanded={open}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className={`mobile-nav-drawer ${open ? 'is-open' : ''}`}>
        {pages.map((page) => (
          <Link
            key={page.href}
            href={localizedPath(locale, page.href)}
            className={
              routePath === page.href ||
              (page.href !== '/' && routePath.startsWith(`${page.href}/`))
                ? 'active'
                : ''
            }
            onClick={() => setOpen(false)}
          >
            {translate(locale, page.label)}
          </Link>
        ))}

        <div className="mobile-nav-language">
          <label htmlFor="mobile-language">{translate(locale, 'Language')}</label>
          <select
            id="mobile-language"
            value={locale}
            onChange={(event) => changeLanguage(event.target.value as WfmLocale)}
            aria-label={translate(locale, 'Language')}
          >
            {WFM_LOCALES.map((code) => (
              <option key={code} value={code}>{LANGUAGE_LABELS[code]}</option>
            ))}
          </select>
        </div>
      </div>

      <style jsx global>{`
        .mobile-nav,
        .mobile-nav-drawer {
          display: none;
        }

        @media (max-width: 650px) {
          body {
            padding-top: calc(64px + env(safe-area-inset-top));
          }

          body > nav,
          main > nav,
          nav {
            display: none !important;
          }

          .mobile-nav {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            height: 64px;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0 max(16px, env(safe-area-inset-right)) 0 max(16px, env(safe-area-inset-left));
            padding-top: env(safe-area-inset-top);
            height: calc(64px + env(safe-area-inset-top));
            box-sizing: border-box;
            background: #faf9f5;
            border-bottom: 1px solid #d9d7d0;
          }

          .mobile-nav-brand {
            flex: 0 0 auto;
            color: #111;
            text-decoration: none;
            font-size: 21px;
            line-height: 1;
            font-weight: 800;
            letter-spacing: -0.8px;
          }

          .mobile-nav-brand span {
            color: #777;
            font-size: 23px;
          }

          .mobile-nav-title {
            min-width: 0;
            flex: 1;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            text-align: center;
            font-size: 14px;
            font-weight: 700;
            color: #111;
          }

          .mobile-nav-menu {
            flex: 0 0 42px;
            width: 42px;
            height: 42px;
            margin: 0;
            padding: 9px;
            border: 1px solid #aaa;
            border-radius: 9px;
            background: transparent;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            touch-action: manipulation;
          }

          .mobile-nav-menu:focus-visible,
          .mobile-nav-drawer a:focus-visible,
          .mobile-nav-brand:focus-visible {
            outline: 3px solid #111;
            outline-offset: 2px;
          }

          .mobile-nav-menu span {
            display: block;
            width: 20px;
            height: 2px;
            background: #111;
            transition: transform 0.2s ease, opacity 0.2s ease;
          }

          .mobile-nav-menu.is-open span:nth-child(1) {
            transform: translateY(6px) rotate(45deg);
          }

          .mobile-nav-menu.is-open span:nth-child(2) {
            opacity: 0;
          }

          .mobile-nav-menu.is-open span:nth-child(3) {
            transform: translateY(-6px) rotate(-45deg);
          }

          .mobile-nav-drawer {
            position: fixed;
            top: calc(64px + env(safe-area-inset-top));
            left: 0;
            right: 0;
            z-index: 999;
            display: flex;
            flex-direction: column;
            background: #faf9f5;
            border-bottom: 1px solid #d9d7d0;
            box-shadow: 0 12px 25px rgba(0, 0, 0, 0.08);
            transform: translateY(-120%);
            opacity: 0;
            pointer-events: none;
            transition: transform 0.22s ease, opacity 0.22s ease;
          }

          .mobile-nav-drawer.is-open {
            transform: translateY(0);
            opacity: 1;
            pointer-events: auto;
          }

          .mobile-nav-drawer a {
            min-height: 52px;
            display: flex;
            align-items: center;
            padding: 14px 20px;
            border-bottom: 1px solid #e3e1da;
            color: #111;
            text-decoration: none;
            font-size: 16px;
            font-weight: 600;
          }

          .mobile-nav-language {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            min-height: 56px;
            padding: 10px 20px;
            border-top: 1px solid #d9d7d0;
          }

          .mobile-nav-language label {
            font-size: 15px;
            font-weight: 700;
            color: #111;
          }

          .mobile-nav-language select {
            min-width: 132px;
            min-height: 42px;
            padding: 8px 34px 8px 12px;
            border: 1px solid #aaa;
            border-radius: 8px;
            background: #fff;
            color: #111;
            font-size: 15px;
            font-weight: 600;
          }

          .mobile-nav-language select:focus-visible {
            outline: 3px solid #111;
            outline-offset: 2px;
          }

          .mobile-nav-drawer a:last-child {
            border-bottom: 0;
          }

          .mobile-nav-drawer a.active {
            background: #c9ff3d;
          }
        }
      `}</style>
    </>
  )
}
