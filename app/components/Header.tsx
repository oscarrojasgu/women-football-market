'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const pages = [
  { href: '/players', label: 'Players' },
  { href: '/contracts', label: 'Contracts' },
  { href: '/transfers', label: 'Transfers' },
  { href: '/salaries', label: 'Salaries' },
  { href: '/clubs', label: 'Clubs' },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <nav className="site-header">
      <Link href="/" className="logo" aria-label="Women’s Football Market home">
        WFM<span>•</span>
      </Link>

      <div className="navlinks">
        {pages.map((page) => {
          const active =
            pathname === page.href ||
            pathname.startsWith(page.href + '/')

          return (
            <Link
              key={page.href}
              href={page.href}
              className={active ? 'active' : ''}
              aria-current={active ? 'page' : undefined}
            >
              {page.label}
            </Link>
          )
        })}
      </div>

      <div className="header-meta">
        <span className="header-status">LIVE DATABASE</span>
        <button className="login" type="button">Sign in</button>
      </div>
    </nav>
  )
}
