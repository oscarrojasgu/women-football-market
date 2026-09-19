import './globals.css'
import './mobile-tables.css'
import './mobile-layout-fixes.css'
import './mobile-scroll-fixes.css'
import type { ReactNode } from 'react'
import Header from './components/Header'
import MobileNav from './components/MobileNav'
import PlayerActions from './components/PlayerActions'

export const metadata = {
  title: 'Women’s Football Market',
  description: 'Contracts, salaries and transfers in women’s football.'
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
