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
import Footer from './components/Footer'

const wfmStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Women’s Football Market",
  url: "https://www.womenfootballmarket.com",
  description: "Women’s football player, club, contract, salary, transfer and market-value data with scouting intelligence.",
  sameAs: [],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.womenfootballmarket.com'),
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
    url: 'https://www.womenfootballmarket.com'
  },
  alternates: {
    canonical: 'https://www.womenfootballmarket.com',
    languages: {
      en: 'https://www.womenfootballmarket.com',
      es: 'https://www.womenfootballmarket.com/es',
      pt: 'https://www.womenfootballmarket.com/pt',
      fr: 'https://www.womenfootballmarket.com/fr',
      de: 'https://www.womenfootballmarket.com/de'
    }
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(wfmStructuredData).replace(/</g, "\\u003c"),
          }}
        />
        <Header />
        <MobileNav />
        <AdSlot placement="top" />
        {children}
        <Footer />
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
