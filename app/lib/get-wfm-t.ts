import { headers } from "next/headers"
import { DEFAULT_LOCALE, isWfmLocale, translate } from "./i18n"
import { WFM_EXTRA_TRANSLATIONS } from "./wfm-extra-translations"
import { WFM_ACCOUNT_TRANSLATIONS } from "./wfm-account-translations"
import { WFM_AGENCY_TRANSLATIONS } from "./wfm-agency-translations"

export async function getWfmT() {
  const h = await headers()
  const value = h.get("x-wfm-locale")
  const locale = isWfmLocale(value) ? value : DEFAULT_LOCALE
  return (key: string) => WFM_AGENCY_TRANSLATIONS[locale][key] ?? WFM_ACCOUNT_TRANSLATIONS[locale][key] ?? WFM_EXTRA_TRANSLATIONS[locale][key] ?? translate(locale, key)
}
