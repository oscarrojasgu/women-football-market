# Women’s Football Market — Stage 1 MVP

A starter for a women’s football Transfermarkt-style database focused on player contracts, salaries and moves.

## Stage 1 includes
- Public-facing homepage prototype
- Player search/filter prototype
- Market-leader player table
- Contract / transfer / salary / scouting product sections
- Supabase/Postgres schema for players, clubs, contracts, transfers, salaries and sources
- Confidence system: verified, reported, estimated, rumored, unknown

## Recommended stack
Next.js + TypeScript + Supabase/Postgres. Supabase's current Next.js quickstart supports TypeScript, Tailwind and cookie-based auth.

## Run locally
1. Install Node.js.
2. In this folder run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

For the database, create a Supabase project and run `supabase/schema.sql` in its SQL Editor. Do not put secret keys in source control.

## Next stage
Connect the homepage to Supabase, build player profiles, and create the admin dashboard where you can add/edit players, contracts, transfers, salaries and sources without touching code.
