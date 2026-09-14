import './globals.css'
import type { ReactNode } from 'react'
import Header from './components/Header'

export const metadata = {
  title: 'Women’s Football Market',
  description: 'Contracts, salaries and transfers in women’s football.'
}

export default function RootLayout({children}:{children:ReactNode}) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  )
}
