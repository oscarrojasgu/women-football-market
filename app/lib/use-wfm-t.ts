'use client'

import { usePathname } from 'next/navigation'
import { getLocaleFromPathname, translate } from './i18n'
import { WFM_EXTRA_TRANSLATIONS } from './wfm-extra-translations'
import { WFM_ACCOUNT_TRANSLATIONS } from './wfm-account-translations'
import { WFM_AGENCY_TRANSLATIONS } from './wfm-agency-translations'

export function useWfmT() {
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)
  return (key: string) => WFM_AGENCY_TRANSLATIONS[locale][key] ?? WFM_ACCOUNT_TRANSLATIONS[locale][key] ?? WFM_EXTRA_TRANSLATIONS[locale][key] ?? translate(locale, key)
}
