import './globals.css'
import './mobile-tables.css'
import type { ReactNode } from 'react'
import MobileNav from './components/MobileNav'

export const metadata = {
  title: 'Women’s Football Market',
  description: 'Contracts, salaries and transfers in women’s football.'
}

export default function RootLayout({children}:{children:ReactNode}) {
  return (
    <html lang="en">
      <body>
        <MobileNav />
        {children}
      </body>
    </html>
  )
}
