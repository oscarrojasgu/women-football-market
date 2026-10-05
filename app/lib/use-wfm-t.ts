'use client'

import { usePathname } from 'next/navigation'
import { getLocaleFromPathname, translate } from './i18n'
import { WFM_EXTRA_TRANSLATIONS } from './wfm-extra-translations'

export function useWfmT() {
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)
  return (key: string) => WFM_EXTRA_TRANSLATIONS[locale][key] ?? translate(locale, key)
}
