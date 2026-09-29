# M13 — Commercial & Licensing Infrastructure

Status: Implementation complete — final CI/Vercel verification pending

## Purpose

M13 converts WFM's existing commercial entitlement foundation into a controlled licensing workflow. It deliberately does not hard-code a payment processor. Licensing, agreements, scope and access are separated so a billing provider can be connected later without redesigning the data model.

## Implemented

### License products
- Research Access
- Professional Scouting
- Commercial Data License
- API / Data Feed
- Product type, scope, active state and description.

### License requests
Authenticated users can submit a product, intended use, requested term, optional club context and requested scope.

Request states: pending, under_review, approved, rejected, withdrawn.

### Agreements
WFM administrators can issue an agreement after a request is approved. Agreements store a unique reference, licensee user or club, start/end dates, permitted scope, restrictions, commercial terms, document URL, signed timestamp and lifecycle status.

Creating an active agreement also provisions the existing WFM entitlement model with the corresponding commercial plan.

### Access audit
wfm_license_access_log records licensed actions such as view, export, download, API access and report access. Licensees can write only their own active-agreement access events; WFM admins can review the audit trail.

### Security
- RLS enabled on every new public table.
- License products are publicly readable only while active.
- License requests are private to the requester, authorized club members, and WFM admins.
- Agreements are private to the licensee and WFM admins.
- Access logs are not publicly readable.
- Licensing RPCs use SECURITY INVOKER and rely on RLS plus explicit authorization checks.
- Anonymous execution of licensing RPCs is revoked.
- Foreign-key indexes added after advisor review.
- Existing commercial plan/entitlement SELECT policies were consolidated to avoid unnecessary multiple-permissive-policy evaluation.

## User workflow

Account → Commercial Licensing → choose product → describe intended use → submit request → WFM review → approved request → executed agreement → entitlement → licensed access logging.

## Admin workflow

Admin → Licensing → review request → approve/reject → issue agreement with reference/terms → active commercial entitlement.

## Billing boundary

No payment provider is assumed in M13. A future billing integration can map payment/subscription events to the existing license-request, agreement and entitlement records without exposing payment credentials to WFM's public client.

## Design rules

- An entitlement is not treated as a substitute for a signed license agreement.
- A license request is not itself commercial authorization.
- Scope and restrictions are stored with the agreement rather than inferred from a plan name.
- Payment processing remains outside the application until a provider is intentionally selected and integrated.
