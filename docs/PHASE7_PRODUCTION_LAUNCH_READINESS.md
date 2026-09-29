# Phase 7 — Production & Launch Readiness

Status: Final manual gate required

## Verified through M13

### Database security
- Security-invoker views are in place for public intelligence views.
- WFM admin authorization continues to use `wfm_admins`.
- M10 integrity audit is restricted to authorized WFM admins.
- M12 and M13 privileged RPCs were hardened so anonymous/public execution is revoked.
- M13 licensing RPCs use `SECURITY INVOKER` and explicit authorization checks.

### Database performance
- Previously unindexed foreign keys identified during production-readiness review were indexed.
- Multiple-permissive-policy warnings identified in the production-readiness pass were addressed.
- M13 licensing tables have dedicated foreign-key and workflow indexes.
- Remaining unused-index advisor findings are informational and are intentionally retained while WFM continues to expand.

### Application security
- Browser Supabase access uses only public client configuration.
- No `service_role` secret is present in the repository.
- Private admin, contributor, verification, scouting, club, agency, and licensing workflows rely on authentication and RLS boundaries.

### SEO / discovery
- `app/robots.ts` and `app/sitemap.ts` are present.
- Public player, club, and competition pages have SEO metadata and structured data.
- Private/admin/API areas are excluded from public indexing.

### Dependency stability
- Dependencies are pinned rather than using direct `latest` tags.
- Production-build GitHub Actions workflow is present.
- Route-level and global error boundaries are present.
- A committed npm lockfile is still required before the final production gate is closed.

## M13 commercial readiness
- Commercial licensing product catalog is implemented.
- Authenticated licensing requests are implemented.
- Admin review workflow is implemented.
- License agreements and access logging are implemented.
- Billing/payment processing remains deliberately outside the application until a payment provider is selected.
- Licensing UI import-path build issue was corrected in commit `ee3de2569b69d6cdbaa78f63bb8cabf6e96cf8be`.

## Automated verification
- The repository has a production-build workflow that runs `npm run build` on pushes and pull requests targeting `main`, plus manual dispatch.
- M8 automated production builds were verified successfully.
- M13 changes have been pushed through the repository workflow/deployment pipeline; the latest licensing-admin correction is on `main`.

## Final production gate still required

### 1. Dependency reproducibility
- Add and commit `package-lock.json`.
- Re-run the production build after the lockfile is present.

### 2. Public-route smoke test
Verify in a real browser:
- `/`
- `/players`
- `/players/[id]`
- `/clubs`
- `/clubs/[id]`
- `/competitions`
- `/competitions/[id]`
- `/contracts`
- `/salaries`
- `/transfers`
- `/robots.txt`
- `/sitemap.xml`

### 3. Authentication and authorization smoke test
Use separate test accounts where applicable:
- unauthenticated public access
- normal authenticated account
- player/contributor workflow
- club workspace
- agency workspace
- WFM admin
- verification workflow
- scouting/private workflow
- commercial licensing workflow

Confirm users cannot cross the intended RLS boundaries.

### 4. Commercial licensing smoke test
Verify end-to-end:
- user views active products
- user submits request
- admin sees request
- admin moves request through review
- approved request can receive an agreement
- agreement creates the intended entitlement
- access logging remains private
- rejected requests do not create active licensed access

### 5. Responsive smoke test
Test representative public and authenticated pages at:
- desktop
- tablet
- mobile

Pay particular attention to:
- tables
- navigation
- player/club detail layouts
- scouting comparison
- licensing/admin cards
- long IDs and status labels

## Current gate state

| Gate | Status |
|---|---|
| Database security review | Complete |
| Database performance review | Complete |
| Application secret review | Complete |
| SEO / indexing configuration | Complete |
| M8 structured data | Complete |
| M10 data-integrity engine | Complete |
| M11 scouting intelligence | Complete |
| M12 club/agency workflows | Complete |
| M13 commercial licensing | Complete |
| Licensing admin import correction | Complete |
| npm lockfile | Required |
| Live browser route verification | Required |
| Auth/RLS boundary verification | Required |
| Commercial workflow smoke test | Required |
| Mobile/desktop smoke test | Required |

WFM should not be treated as fully production-ready until the remaining manual gates are completed and the final production build is rerun.
