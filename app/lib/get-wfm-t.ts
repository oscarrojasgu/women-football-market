import { headers } from "next/headers"
import { DEFAULT_LOCALE, isWfmLocale, translate } from "./i18n"
import { WFM_EXTRA_TRANSLATIONS } from "./wfm-extra-translations"
import { WFM_ACCOUNT_TRANSLATIONS } from "./wfm-account-translations"
import { WFM_AGENCY_TRANSLATIONS } from "./wfm-agency-translations"
import { WFM_LICENSING_TRANSLATIONS } from "./wfm-licensing-translations"
import { WFM_CLUB_EXTRA_TRANSLATIONS } from "./wfm-club-extra-translations"
import { WFM_CLUB_TRANSLATIONS } from "./wfm-club-translations"
import { WFM_ADMIN_TRANSLATIONS } from "./wfm-admin-translations"
import { WFM_ADMIN_EXTRA_TRANSLATIONS } from "./wfm-admin-extra-translations"
import { WFM_DATA_TRANSLATIONS } from "./wfm-data-translations"
import { WFM_PLAYER_PROFILE_TRANSLATIONS } from "./wfm-player-profile-translations"
import { WFM_PLAYER_PAGE_TRANSLATIONS } from "./wfm-player-page-translations"
import { WFM_MARKET_PAGE_TRANSLATIONS } from "./wfm-market-page-translations"
import { WFM_SCOUTING_WORKSPACE_TRANSLATIONS } from "./wfm-scouting-workspace-translations"
import { WFM_SCOUTING_PROFILES_TRANSLATIONS } from "./wfm-scouting-profiles-translations"
import { WFM_SCOUTING_PLAYER_TRANSLATIONS } from "./wfm-scouting-player-translations"
import { WFM_SCOUTING_COMPARISON_TRANSLATIONS } from "./wfm-scouting-comparison-translations"

export async function getWfmT() {
  const h = await headers()
  const value = h.get("x-wfm-locale")
  const locale = isWfmLocale(value) ? value : DEFAULT_LOCALE
  return (key: string) => WFM_SCOUTING_COMPARISON_TRANSLATIONS[locale][key] ?? WFM_SCOUTING_PLAYER_TRANSLATIONS[locale][key] ?? WFM_SCOUTING_PROFILES_TRANSLATIONS[locale][key] ?? WFM_SCOUTING_WORKSPACE_TRANSLATIONS[locale][key] ?? WFM_PLAYER_PROFILE_TRANSLATIONS[locale][key] ?? WFM_PLAYER_PAGE_TRANSLATIONS[locale][key] ?? WFM_MARKET_PAGE_TRANSLATIONS[locale][key] ?? WFM_DATA_TRANSLATIONS[locale][key] ?? WFM_ADMIN_EXTRA_TRANSLATIONS[locale][key] ?? WFM_ADMIN_TRANSLATIONS[locale][key] ?? WFM_CLUB_EXTRA_TRANSLATIONS[locale][key] ?? WFM_CLUB_TRANSLATIONS[locale][key] ?? WFM_LICENSING_TRANSLATIONS[locale][key] ?? WFM_AGENCY_TRANSLATIONS[locale][key] ?? WFM_ACCOUNT_TRANSLATIONS[locale][key] ?? WFM_EXTRA_TRANSLATIONS[locale][key] ?? translate(locale, key)
}
