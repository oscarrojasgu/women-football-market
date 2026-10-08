# M15 — Launch SEO & Discoverability

**Date:** October 8, 2026
**Status:** Implemented; production deployment pending verification.

## Completed

- Production domain standardized to https://www.womenfootballmarket.com in public SEO metadata and entity SEO helpers.
- Players, Clubs, Competitions, Contracts, Transfers and Salaries pages have canonical URLs on the production domain.
- Public pricing, contact, privacy, terms and data-corrections pages have canonical metadata.
- Player, club and competition detail pages use dynamic metadata and entity JSON-LD.
- WFM root layout now exposes Organization JSON-LD.
- Localized English, Spanish, Portuguese, French and German alternate URLs are declared with hreflang metadata for public pages.
- Sitemap uses the production domain and includes the primary public database, commercial and legal pages.
- Robots rules keep administration, API, contributor, scouting and comparison routes out of normal crawling.
- Private account and authentication routes use noindex metadata.
- Admin and contributor workspaces use noindex/nofollow metadata.
- Scouting workspace uses noindex/nofollow metadata.
- Comparison pages use noindex to avoid thin/parameter-driven search results.

## Search strategy

WFM's indexable surface should prioritize player, club, competition, database, contract, salary and transfer pages. Search-facing pages should contain useful original database content rather than thin navigation shells. This aligns with Google Search guidance emphasizing helpful, reliable, people-first content and clear canonical signals.

## Advertising guardrail

WFM advertising remains a monetization layer for the free experience. Ads should not be allowed to obscure main database content or create intrusive interstitials. Professional, Club and Data License experiences should remain ad-free.

## Remaining SEO operations

- Verify the latest production deployment after Vercel completes.
- Connect and verify Google Search Console for the production domain.
- Submit https://www.womenfootballmarket.com/sitemap.xml in Search Console.
- Inspect representative player, club and competition URLs.
- Monitor indexing and crawl errors after soft launch.

SEO implementation is complete for this launch phase; the remaining items are external production verification and ongoing monitoring.