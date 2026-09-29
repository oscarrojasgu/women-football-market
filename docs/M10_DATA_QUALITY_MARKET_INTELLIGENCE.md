# M10 — Data Quality & Market Intelligence

## Status

**M10 — COMPLETE**

M10 establishes the first production data-integrity engine for WFM without changing public data or silently correcting records.

## Integrity audit engine

Supabase function:

`public.wfm_run_integrity_audit()`

The function is:
- admin-authorized through `public.wfm_admins`
- executable by authenticated users, but returns audit data only for authorized WFM admins
- `SECURITY DEFINER` with an explicit `search_path`
- read-only against the audited data
- ordered with errors before warnings

## Checks implemented

### Players
- Missing player name
- Duplicate player name + date of birth

### Contracts
- Invalid date ranges
- Negative salary values
- Missing source
- Confidence states that require a source but have none
- Incomplete USD conversion metadata
- Overlapping contracts for the same player

### Salary records
- Negative salary values
- Missing source

### Market values
- Negative market values
- Missing source

### Transfers
- Identical from/to club
- Negative transfer fee
- Missing source

### Sources
- Missing URL
- Missing reliability classification

## Initial audit result

The current production dataset was checked with the same integrity rules before enabling the engine.

The only detected issue was:

- **15 contract records** with USD salary fields but incomplete conversion metadata.

No player-name, duplicate-player, bad-contract-date, negative-salary, overlapping-contract, transfer, market-value, or source-integrity issues were detected by the initial audit query.

The 15 conversion records are intentionally **not auto-corrected**. Their source/conversion metadata needs to be reviewed before values are changed.

## Migration

`supabase/migrations/20260929163000_m10_integrity_audit_engine.sql`

The database migration was applied successfully to the WFM Supabase project and the migration is also committed to GitHub.

## Design decision

M10 does not automatically modify questionable market data. WFM should flag questionable records first and preserve the underlying evidence until a human/admin review determines the correct correction.

## Next layer

M11 can build on this foundation with scouting intelligence and market analytics using only records that meet WFM's data-quality and provenance rules.
