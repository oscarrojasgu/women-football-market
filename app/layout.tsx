import './globals.css'
import './mobile-tables.css'
import './mobile-layout-fixes.css'
import './mobile-scroll-fixes.css'
import './phase2-mobile.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { isWfmLocale, DEFAULT_LOCALE } from './lib/i18n'
import Header from './components/Header'
import MobileNav from './components/MobileNav'
import PlayerActions from './components/PlayerActions'
import AdSlot from './components/AdSlot'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import GoogleAnalytics from './components/GoogleAnalytics'
import AnalyticsConsent from './components/AnalyticsConsent'
import VisitorTracker from './components/VisitorTracker'

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

export default async function RootLayout({children}:{children:ReactNode}) {
  const requestHeaders = await headers()
  const requestLocale = requestHeaders.get('x-wfm-locale')
  const locale = isWfmLocale(requestLocale) ? requestLocale : DEFAULT_LOCALE

  return (
    <html lang={locale}>
      <body>
        <Header />
        <MobileNav />
        <AdSlot placement="top" />
        {children}
        <PlayerActions />
        <Analytics />
        <SpeedInsights />
        <GoogleAnalytics />
        <VisitorTracker />
        <AnalyticsConsent />
      </body>
    </html>
  )
}
