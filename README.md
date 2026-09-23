# Women’s Football Market (WFM)

A Transfermarkt-style women’s football intelligence platform focused on players, clubs, contracts, salaries, transfers, market values, statistics, verification and global scouting.

## Current product

- Player database and profiles
- Club database and profiles
- Contracts and salary history
- USD salary normalization when supported by dated exchange-rate data
- Transfer history and market values
- Player statistics and match statistics
- Competition and season normalization
- Verification and source tracking
- Player intelligence and peer benchmarks
- Player comparison
- Advanced scouting search and criteria profiles
- Persistent scouting lists and notes
- Global peer benchmarks across competitions
- Competition-position statistical context
- Cross-league player context
- Scouting list intelligence summaries
- Authentication and private scouting workflows

## Roadmap status

- Phase 1 — Data Foundation: Complete
- Phase 2 — UX Redesign: Complete
- Phase 3 — Player Intelligence: Complete
- Phase 4 — Verification: Complete
- Phase 5 — Scouting Tools: Complete
- Phase 6 Milestone 1 — League Expansion: Complete
- Phase 6 Milestone 2 — International Player & Club Coverage: Complete
- Phase 6 Milestone 3 — Global Contract & Salary Coverage: Complete
- Phase 6 Milestone 4 — Global Transfer & Market-Value Coverage: Complete
- Phase 6 Milestone 5 — Multi-League Intelligence: Complete
- Phase 6 Milestone 6 — Global Scouting Network: Next

## Phase 6 Milestone 5

WFM now provides evidence-based cross-league context without assigning an arbitrary league-strength score.

The intelligence model combines:

1. Individual player production
2. Competition-relative peer context
3. Global same-position/same-season percentile context
4. Competition-position distribution context
5. Cross-league player context

See `docs/PHASE6_MILESTONE5_MULTI_LEAGUE_INTELLIGENCE.md` for the implementation and validation record.

## Stack

Next.js + TypeScript + Supabase/Postgres + Vercel.

## Local development

1. Install Node.js.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

Do not put secret keys in source control.
