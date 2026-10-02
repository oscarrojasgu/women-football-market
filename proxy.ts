import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_LOCALE, isWfmLocale } from './app/lib/i18n'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.') || pathname === '/favicon.ico') return NextResponse.next()
  const firstSegment = pathname.split('/')[1]
  const locale = isWfmLocale(firstSegment) ? firstSegment : null
  if (locale) {
    const rewrittenUrl = request.nextUrl.clone()
    rewrittenUrl.pathname = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '') || '/'
    const response = NextResponse.rewrite(rewrittenUrl)
    response.cookies.set('wfm-locale', locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
    response.headers.set('x-wfm-locale', locale)
    return response
  }
  const cookieLocale = request.cookies.get('wfm-locale')?.value
  if (cookieLocale && isWfmLocale(cookieLocale) && cookieLocale !== DEFAULT_LOCALE) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = `/${cookieLocale}${pathname === '/' ? '' : pathname}`
    return NextResponse.redirect(redirectUrl)
  }
  const response = NextResponse.next()
  response.headers.set('x-wfm-locale', DEFAULT_LOCALE)
  return response
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }