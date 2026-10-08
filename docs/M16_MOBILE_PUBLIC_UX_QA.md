# M16 — Mobile & Public UX QA

**Date:** October 8, 2026
**Status:** Implemented; production deployment verification pending.

## Completed

- Mobile navigation includes Home, Players, Scouting, Contracts, Transfers, Salaries, Clubs and Competitions.
- Mobile navigation labels now use the active WFM locale.
- Mobile navigation touch target is at least 42px for the primary menu and 52px for drawer links.
- Mobile navigation receives visible keyboard focus states.
- Safe-area handling was corrected for left/right padding and top page offset.
- Existing responsive database-table patterns preserve readable data through contained horizontal scrolling where full-width tables are required.
- Global responsive rules prevent common viewport overflow from images, media, tables and layout children.
- Home player cards have a dedicated narrow-screen layout rather than forcing the desktop table into a phone viewport.
- Player profile mobile layout includes stacked position/market-value content and responsive controls.
- Advertising inventory remains reserved and geometry-stable on mobile; no intrusive ad behavior was introduced.

## Public UX areas reviewed

- Home
- Players
- Player profiles
- Clubs
- Competitions
- Contracts
- Transfers
- Salaries
- Pricing
- Contact
- Privacy
- Terms
- Data Corrections
- Mobile navigation
- Footer

## Remaining manual release checks

These require an actual browser/device pass rather than repository inspection:

- iPhone Safari at 375px and 390px widths.
- Android Chrome at 360px and 412px widths.
- Tablet widths around 768px.
- Open/close mobile navigation and language switching.
- Search/filter usability and keyboard behavior.
- Horizontal table scrolling on Transfers, Salaries and workspace tables.
- Player profile image/layout behavior.
- Consent dialog placement and accessibility.
- Login/account CTA behavior.
- Footer links and legal pages.
- Production smoke test after the latest deployment.

## Release rule

M16 is considered technically implemented, but public launch should wait for the manual browser/device smoke test and confirmation that the latest Vercel deployment is successful.
