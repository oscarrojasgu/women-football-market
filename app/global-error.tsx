'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('WFM application error:', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#f5f4ef', color: '#121212', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '32px 20px' }}>
          <section style={{ width: '100%', maxWidth: 620, background: '#fff', border: '1px solid #dedcd5', borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#777', textTransform: 'uppercase' }}>Women’s Football Market</div>
            <h1 style={{ margin: '14px 0 10px', fontSize: 34, lineHeight: 1.05 }}>Something went wrong</h1>
            <p style={{ margin: 0, color: '#666', lineHeight: 1.55 }}>The page could not be loaded correctly. Try again, or return to the WFM home page.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
              <button onClick={() => reset()} style={{ border: '1px solid #111', background: '#111', color: '#fff', borderRadius: 8, padding: '10px 16px', cursor: 'pointer' }}>Try again</button>
              <a href="/" style={{ border: '1px solid #aaa', color: '#111', textDecoration: 'none', borderRadius: 8, padding: '10px 16px' }}>Go home</a>
            </div>
          </section>
        </main>
      </body>
    </html>
  )
}
