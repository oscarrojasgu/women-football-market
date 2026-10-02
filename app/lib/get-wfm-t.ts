import { headers } from "next/headers"
import { DEFAULT_LOCALE, isWfmLocale, translate } from "./i18n"

export async function getWfmT() {
  const h = await headers()
  const value = h.get("x-wfm-locale")
  const locale = isWfmLocale(value) ? value : DEFAULT_LOCALE
  return (key: string) => translate(locale, key)
}
