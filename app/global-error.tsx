'use client'

import { useEffect, useState } from 'react'

const ERROR_COPY: Record<string, { title: string; body: string; retry: string; home: string }> = {
  en: { title: 'Something went wrong', body: 'The page could not be loaded correctly. Try again, or return to the WFM home page.', retry: 'Try again', home: 'Go home' },
  es: { title: 'Algo salió mal', body: 'La página no se pudo cargar correctamente. Inténtalo de nuevo o vuelve al inicio de WFM.', retry: 'Intentar de nuevo', home: 'Ir al inicio' },
  pt: { title: 'Algo deu errado', body: 'A página não foi carregada corretamente. Tente novamente ou volte à página inicial da WFM.', retry: 'Tentar novamente', home: 'Ir para o início' },
  fr: { title: 'Une erreur est survenue', body: 'La page n’a pas pu être chargée correctement. Réessayez ou retournez à l’accueil de WFM.', retry: 'Réessayer', home: 'Accueil' },
  de: { title: 'Etwas ist schiefgelaufen', body: 'Die Seite konnte nicht richtig geladen werden. Versuche es erneut oder kehre zur WFM-Startseite zurück.', retry: 'Erneut versuchen', home: 'Zur Startseite' },
}

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [locale, setLocale] = useState('en')

  useEffect(() => {
    console.error('WFM application error:', error)
    const segment = window.location.pathname.split('/')[1]
    if (['en', 'es', 'pt', 'fr', 'de'].includes(segment)) setLocale(segment)
  }, [error])

  const copy = ERROR_COPY[locale] ?? ERROR_COPY.en
  const homeHref = locale === 'en' ? '/' : `/${locale}`

  return (
    <html lang={locale}>
      <body style={{ margin: 0, background: '#f5f4ef', color: '#121212', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '32px 20px' }}>
          <section style={{ width: '100%', maxWidth: 620, background: '#fff', border: '1px solid #dedcd5', borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#777', textTransform: 'uppercase' }}>Women’s Football Market</div>
            <h1 style={{ margin: '14px 0 10px', fontSize: 34, lineHeight: 1.05 }}>{copy.title}</h1>
            <p style={{ margin: 0, color: '#666', lineHeight: 1.55 }}>{copy.body}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
              <button onClick={() => reset()} style={{ border: '1px solid #111', background: '#111', color: '#fff', borderRadius: 8, padding: '10px 16px', cursor: 'pointer' }}>{copy.retry}</button>
              <a href={homeHref} style={{ border: '1px solid #aaa', color: '#111', textDecoration: 'none', borderRadius: 8, padding: '10px 16px' }}>{copy.home}</a>
            </div>
          </section>
        </main>
      </body>
    </html>
  )
}
