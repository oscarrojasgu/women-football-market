'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('WFM route error:', error)
  }, [error])

  return (
    <main style={{ minHeight: 'calc(100vh - 76px)', display: 'grid', placeItems: 'center', padding: '40px 20px', background: '#f5f4ef' }}>
      <section style={{ width: '100%', maxWidth: 620, background: '#fff', border: '1px solid #dedcd5', borderRadius: 16, padding: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#777', textTransform: 'uppercase' }}>Women’s Football Market</div>
        <h1 style={{ margin: '14px 0 10px', fontSize: 34, lineHeight: 1.05 }}>We couldn’t load this page</h1>
        <p style={{ margin: 0, color: '#666', lineHeight: 1.55 }}>An unexpected error occurred while loading this WFM page. Try again or return to the home page.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
          <button onClick={() => reset()} style={{ border: '1px solid #111', background: '#111', color: '#fff', borderRadius: 8, padding: '10px 16px', cursor: 'pointer' }}>Try again</button>
          <a href="/" style={{ border: '1px solid #aaa', color: '#111', textDecoration: 'none', borderRadius: 8, padding: '10px 16px' }}>Go home</a>
        </div>
      </section>
    </main>
  )
}
