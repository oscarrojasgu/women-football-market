'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const pages = [
  { href: '/', label: 'Home' },
  { href: '/players', label: 'Players' },
  { href: '/scouting', label: 'Scouting' },
  { href: '/contracts', label: 'Contracts' },
  { href: '/transfers', label: 'Transfers' },
  { href: '/salaries', label: 'Salaries' },
  { href: '/clubs', label: 'Clubs' },
]

export default function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const currentPage =
    pages.find((page) => {
      if (page.href === '/') return pathname === '/'
      return pathname === page.href || pathname.startsWith(`${page.href}/`)
    })?.label || 'Women’s Football Market'

  return (
    <>
      <div className="mobile-nav">
        <Link href="/" className="mobile-nav-brand" onClick={() => setOpen(false)}>
          WFM<span>•</span>
        </Link>

        <div className="mobile-nav-title">{currentPage}</div>

        <button
          type="button"
          className={`mobile-nav-menu ${open ? 'is-open' : ''}`}
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
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
            href={page.href}
            className={
              pathname === page.href ||
              (page.href !== '/' && pathname.startsWith(`${page.href}/`))
                ? 'active'
                : ''
            }
            onClick={() => setOpen(false)}
          >
            {page.label}
          </Link>
        ))}
      </div>

      <style jsx global>{`
        .mobile-nav,
        .mobile-nav-drawer {
          display: none;
        }

        @media (max-width: 650px) {
          body {
            padding-top: 64px;
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
            padding: 0 max(16px, env(safe-area-inset-left)) 0 max(16px, env(safe-area-inset-right));
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
            padding: 17px 20px;
            border-bottom: 1px solid #e3e1da;
            color: #111;
            text-decoration: none;
            font-size: 16px;
            font-weight: 600;
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
