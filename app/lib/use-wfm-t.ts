'use client'

import { usePathname } from 'next/navigation'
import { getLocaleFromPathname, translate } from './i18n'

export function useWfmT() {
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)
  return (key: string) => translate(locale, key)
}
