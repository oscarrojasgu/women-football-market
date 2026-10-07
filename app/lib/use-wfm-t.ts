'use client'

import { usePathname } from 'next/navigation'
import { getLocaleFromPathname, translate } from './i18n'
import { WFM_EXTRA_TRANSLATIONS } from './wfm-extra-translations'
import { WFM_ACCOUNT_TRANSLATIONS } from './wfm-account-translations'
import { WFM_AGENCY_TRANSLATIONS } from './wfm-agency-translations'
import { WFM_LICENSING_TRANSLATIONS } from './wfm-licensing-translations'
import { WFM_CLUB_EXTRA_TRANSLATIONS } from './wfm-club-extra-translations'
import { WFM_CLUB_TRANSLATIONS } from './wfm-club-translations'
import { WFM_CONTRIBUTOR_TRANSLATIONS } from './wfm-contributor-translations'
import { WFM_ADMIN_TRANSLATIONS } from './wfm-admin-translations'
import { WFM_ADMIN_EXTRA_TRANSLATIONS } from './wfm-admin-extra-translations'
import { WFM_DATA_TRANSLATIONS } from './wfm-data-translations'

export function useWfmT() {
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)
  return (key: string) => WFM_DATA_TRANSLATIONS[locale][key] ?? WFM_ADMIN_EXTRA_TRANSLATIONS[locale][key] ?? WFM_ADMIN_TRANSLATIONS[locale][key] ?? WFM_CONTRIBUTOR_TRANSLATIONS[locale][key] ?? WFM_CLUB_EXTRA_TRANSLATIONS[locale][key] ?? WFM_CLUB_TRANSLATIONS[locale][key] ?? WFM_LICENSING_TRANSLATIONS[locale][key] ?? WFM_AGENCY_TRANSLATIONS[locale][key] ?? WFM_ACCOUNT_TRANSLATIONS[locale][key] ?? WFM_EXTRA_TRANSLATIONS[locale][key] ?? translate(locale, key)
}
