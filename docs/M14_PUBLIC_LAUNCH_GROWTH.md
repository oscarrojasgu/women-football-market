# M14 — Public Launch & Growth

Status: Implementation complete — final production gate remains separate

## Purpose

M14 turns the WFM foundation into a coherent public product experience without introducing unnecessary backend complexity.

## Completed

### M14.1 Production readiness alignment
- Updated the Phase 7 production-readiness document to reflect the M8–M13 state.
- Separated completed technical controls from the remaining manual production gates.
- Preserved the distinction between automated build verification and real-browser verification.

### M14.2 Public launch experience
- Homepage discovery cards now link directly to Contracts, Transfers, Salaries and Scouting.
- Added a clear public-to-account conversion section for clubs, agents and scouts.
- Added direct entry points for sign-in/account creation and commercial access.
- Added a public navigation footer covering the major WFM database sections.

### M14.3 Public discovery
- Existing homepage search continues to search player, club, league, position, nationality and agency context.
- Players, clubs and competitions remain directly discoverable through dedicated public routes.
- Public navigation exposes Players, Clubs, Competitions, Contracts, Salaries, Transfers and Scouting.
- Player rows link directly to player detail pages.
- Club and competition indexes link directly to their public detail pages.

### M14.4 Commercial conversion boundary
The public experience clearly separates:
- public database discovery
- authenticated scouting/workspace features
- commercial licensing

A public user is not treated as commercially licensed merely because they can view public data.

### M14.5 Responsive/public UX
Existing responsive CSS covers the homepage player database, navigation, tables, cards, ads and common layout overflow. M14 preserves that system rather than introducing a second visual framework.

## Product positioning

WFM's public product is organized around:

**Discover → Investigate → Scout → Collaborate → License**

- Discover public players, clubs and competitions.
- Investigate contracts, salaries, transfers and market values.
- Scout through authenticated intelligence workflows.
- Collaborate through club/agency workspaces.
- License commercial data through the controlled request/agreement workflow.

## Intentionally not added in M14

- No payment processor.
- No advertising provider integration.
- No new recommendation engine.
- No player performance prediction.
- No public exposure of private scouting data.
- No replacement of existing RLS boundaries.
- No unnecessary redesign of the established WFM visual system.

## Remaining launch gates

M14 does not mark WFM as fully production-ready by itself. The following remain manual/operational gates:

1. Commit a reproducible npm lockfile.
2. Complete real-browser public route smoke testing.
3. Complete authentication and RLS boundary testing.
4. Complete commercial licensing end-to-end smoke testing.
5. Complete desktop/tablet/mobile smoke testing.
6. Rerun the final production build after the lockfile and manual fixes.

These are launch verification tasks, not reasons to add another major application layer.

## Next phase

After the production gates are closed, the roadmap should move to measured launch operations:

**M15 — Launch Operations & Data Growth**

Focus:
- first real contributor/club onboarding
- data-source acquisition workflow
- data coverage expansion
- usage/quality monitoring
- controlled commercial onboarding
- operational metrics

The goal is to grow the data and user base without destabilizing the existing WFM architecture.
