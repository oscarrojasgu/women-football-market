import './globals.css'
import './mobile-tables.css'
import './mobile-layout-fixes.css'
import './mobile-scroll-fixes.css'
import './phase2-mobile.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Header from './components/Header'
import MobileNav from './components/MobileNav'
import PlayerActions from './components/PlayerActions'

export const metadata: Metadata = {
  metadataBase: new URL('https://women-football-market.vercel.app'),
  title: {
    default: 'Women’s Football Market',
    template: '%s | Women’s Football Market'
  },
  description: 'Women’s football player, club, contract, salary, transfer and market-value data with scouting intelligence.',
  openGraph: {
    type: 'website',
    siteName: 'Women’s Football Market',
    title: 'Women’s Football Market',
    description: 'Women’s football player, club, contract, salary, transfer and market-value data with scouting intelligence.',
    url: 'https://women-football-market.vercel.app'
  },
  twitter: {
    card: 'summary',
    title: 'Women’s Football Market',
    description: 'Women’s football player, club, contract, salary, transfer and market-value data with scouting intelligence.'
  },
  robots: {
    index: true,
    follow: true
  }
}

export default function RootLayout({children}:{children:ReactNode}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <MobileNav />
        {children}
        <PlayerActions />
      </body>
    </html>
  )
}
