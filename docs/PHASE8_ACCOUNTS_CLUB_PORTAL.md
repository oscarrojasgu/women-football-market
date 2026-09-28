# Phase 8 — Accounts, Club Portal & Commercial Product

Status: Complete — Phase 8 productization and commercialization foundation complete

## Completed foundation

- Authenticated account settings
- Scout/club account navigation
- Club membership model
- Club access request workflow
- Private club recruitment boards
- Private board candidate records
- Club-only RLS enforcement
- Admin-controlled club membership assignment
- Account-role/membership protection
- Recruitment board search/add/update/remove workflow
- Club team management foundation
- Club-admin invitation records with roles
- Invitation revocation

## Private scouting intelligence

- Saved comparison reports from scouting
- Private club report library
- Reopen saved reports
- Edit report name and description
- Delete saved reports
- Internal sharing through active club membership
- Candidate links preserved from saved comparisons

## Commercial entitlement foundation

- Public access-plan catalog
- User- and club-scoped entitlements
- Admin-controlled entitlement management
- Plan feature flags stored as structured JSON
- Status and effective-date fields for future subscription/billing integration
- No payment provider is assumed or hard-coded into the product yet

## Security model

Club recruitment data and saved reports are private to active members of the associated club. Users cannot self-assign a club or change protected account membership fields. WFM admins control membership assignment, access-request review, and commercial entitlements.

## Next commercial layer

1. Club verification and ownership review UI
2. Scout organization profiles
3. Saved report export controls
4. Data-access tier enforcement in application features
5. Subscription/billing integration boundary
6. Commercial licensing controls
7. Admin commercial dashboard
8. Paid intelligence/report products


## Phase 8 completion

The account, club and commercial foundation is now complete for the current launch architecture.

### Completed commercial workflow

Account → Club Access Request → WFM Review → Club Membership → Club Team → Recruitment Boards → Scouting Discovery → Player Comparison → Private Saved Report Library → Commercial Entitlement

### Completion notes

- Club verification/access remains controlled through WFM review rather than self-assigned permissions.
- Private club records remain protected by database RLS.
- Commercial plans are represented independently from authentication and club membership.
- Entitlements support future billing-provider integration without coupling the database to a specific payment processor.
- The commercial admin dashboard provides controlled plan activation and manual entitlement provisioning.
- Paid exports/licensing and billing can now be implemented against the entitlement boundary rather than changing the core scouting data model.
- No public/private boundary is removed by the commercial layer.
