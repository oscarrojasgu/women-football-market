# M21 — Globalization & Multi-Language Architecture

Status: foundation implemented

## Initial locales
- English (en) — default
- Spanish (es)
- Portuguese (pt)
- French (fr)
- German (de)

## Implemented
- Central locale definitions and controlled UI translations in app/lib/i18n.ts
- Locale-aware URL helper
- Next.js 16 Proxy-based locale routing in proxy.ts
- Locale persistence with wfm-locale cookie
- Language selector in the global header
- Localized navigation links
- Localized document lang attribute
- English remains the existing default URL structure for compatibility

## Architecture rules
1. Football data remains language-neutral and is stored once.
2. UI terminology is translated through the centralized dictionary.
3. Proper names are not translated unless an established localized name exists.
4. Editorial/news translations will be stored separately from source content.
5. Localized SEO metadata and hreflang are required before public localized indexing.
6. Currency, dates and number formatting must be locale-aware.
7. Missing translations fall back to English.
8. New languages must be added to the locale registry before route generation.

## Next implementation layers
1. Translate shared homepage/header/footer terminology.
2. Add localized metadata and canonical/hreflang handling.
3. Add translation records for clubs and competitions.
4. Add editorial/news translation workflow.
5. Add locale-aware currency/date/number formatting.
6. Expand translated page content route by route.
7. Test localized routing, indexing, mobile navigation and fallback behavior.