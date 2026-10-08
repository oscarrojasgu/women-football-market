# M17 — Soft Launch Readiness

**Date:** October 8, 2026
**Status:** Prepared; external/manual launch checks remain.

## Current technical gate

- Latest production commit: `e424b5a6d669643c0937358cd368e89cdea6d95f`
- Vercel production deployment: **SUCCESS**
- Production domain: https://www.womenfootballmarket.com
- SEO foundation: implemented
- Analytics and first-party activity tracking: implemented
- Privacy, Terms and Data Corrections: published
- Contact pathway: implemented
- Pricing/access plans: configured
- Data verification dashboard: implemented
- Canonical current-club model: implemented
- Mobile/public UX QA: technically implemented

## Soft-launch audience

Start with a controlled group rather than immediately promoting WFM broadly:

1. Women’s football club contacts
2. Scouts and analysts
3. Agencies/player representatives
4. Women’s football media
5. Trusted industry contacts

The objective is to validate credibility, usability, data corrections and commercial interest before a public marketing push.

## Soft-launch acceptance criteria

### Product
- Public navigation works on desktop and mobile.
- Player, club, competition, contract, transfer and salary pages load.
- Search and filters work.
- Account creation/login works.
- Language selector works.
- Legal and contact links work.

### Data
- Current club is consistent across public surfaces.
- Historical contracts remain attached to their historical clubs.
- Transfers preserve from/to relationships.
- Salary values remain tied to the relevant contract.
- Reported/estimated/verified confidence is visible where applicable.
- Data corrections have a clear reporting path.

### Commercial
- Free access works without requiring payment.
- Professional and Club plans display the configured pricing.
- Data License inquiries route to Contact WFM.
- Commercial access remains separate from data verification.
- No claim is made that an entitlement alone proves payment.

### Privacy
- Analytics does not load before consent.
- Anonymous visitors remain pseudonymous.
- GA4 does not receive names or email addresses.
- First-party activity tracking respects analytics consent.
- Privacy, Terms and Data Corrections are reachable from the public site.

### Monitoring
- GA4 Realtime is functioning.
- WFM first-party visitor activity is visible to administrators.
- Commercial dashboard records signed-in account activity.
- Verification dashboard can receive/review corrections.
- Contact Requests can be reviewed by WFM administrators.

## External actions before inviting the first users

- Complete manual browser/device smoke test.
- Verify Google Search Console for the production domain.
- Submit the production sitemap.
- Inspect representative player, club and competition URLs.
- Confirm production Supabase environment variables.
- Confirm Vercel production environment variables.
- Confirm no test transfer records remain in production.
- Confirm no placeholder/test content is exposed publicly.
- Establish a simple issue log for soft-launch feedback.

## First soft-launch cycle

Use the first group to answer five questions:

1. Can users find the information they need?
2. Do they trust the data and understand confidence labels?
3. Which pages/features generate the most engagement?
4. Which data corrections are requested most often?
5. Is there genuine interest in Professional, Club or Data License access?

Do not activate aggressive advertising during this validation period. Protect the database experience and use the analytics/commercial dashboards to learn where demand exists.

## Public-launch gate

Move from soft launch to public launch only after:

- No critical product defects remain.
- No critical data-consistency defects remain.
- Privacy/consent behavior passes review.
- Search Console is verified and sitemap submitted.
- Manual mobile/browser QA passes.
- At least one real external user has successfully completed the core discovery workflow.
- Contact and correction requests are operational.
- WFM has a documented process for responding to data disputes.

## Post-soft-launch priorities

- Fix critical feedback first.
- Expand verified data coverage.
- Improve localization coverage.
- Add high-value database content before adding complexity.
- Measure conversion interest before changing pricing.
- Consider sponsorship/advertising only after meaningful traffic is established.
