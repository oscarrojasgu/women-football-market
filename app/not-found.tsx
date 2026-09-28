import Link from 'next/link'

export default function NotFound() {
  return (
    <main style={{ minHeight: 'calc(100vh - 76px)', display: 'grid', placeItems: 'center', padding: '40px 20px', background: '#f5f4ef' }}>
      <section style={{ width: '100%', maxWidth: 620, background: '#fff', border: '1px solid #dedcd5', borderRadius: 16, padding: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#777', textTransform: 'uppercase' }}>Women’s Football Market</div>
        <h1 style={{ margin: '14px 0 10px', fontSize: 34, lineHeight: 1.05 }}>Page not found</h1>
        <p style={{ margin: 0, color: '#666', lineHeight: 1.55 }}>The WFM page you requested does not exist or is no longer available.</p>
        <Link href="/" style={{ display: 'inline-block', marginTop: 24, border: '1px solid #111', background: '#111', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '10px 16px' }}>Go home</Link>
      </section>
    </main>
  )
}
