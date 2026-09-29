# M12 — Club & Agent Workflows

Status: Complete — workflow layer implemented and database security/performance hardened

## Purpose

M12 turns the existing WFM club portal, verification, representation, scouting and commercial foundations into a connected professional workflow for clubs and agents/agencies.

## Implemented

### Agency workspace
- Agency organization record with verification state.
- Agency membership with admin, agent and analyst roles.
- Atomic workspace creation through an authenticated database function.
- Agency-side player relationship submissions.
- Relationship types: representation, management and advisory.
- Evidence URL, source and notes support.
- WFM review status: pending, approved, rejected, revoked.

### Club ↔ agency communication
- Verified agencies can receive controlled contact requests from active club members.
- Requests may optionally be tied to a player.
- Subject/message workflow with pending, accepted, declined and closed states.
- Agency responses use a security-definer RPC that validates the user's club/agency authorization before changing only workflow fields.
- Club workspace now links directly to Agency Contacts.

### Admin workflow
- Agency verification queue.
- Agency relationship review queue.
- WFM-admin review functions preserve reviewer identity and timestamps.
- Agency verification is separate from player representation approval.

### Security
- RLS protects agency organizations, memberships, player requests and contact requests.
- Agency membership is required for private agency records.
- Club membership is required for creating club contact requests.
- Contact requests can only be created for verified agencies.
- Public anonymous execution was revoked from the new security-definer functions and the existing M10 integrity-audit function.
- Agency admin policies were split into action-specific policies to avoid unnecessary permissive SELECT overlap.
- Foreign-key indexes were added for the new workflow tables.

## User workflows

### Agent / agency
Account Settings → Agent / Agency Workspace → Create agency → Submit player relationship → WFM review → Receive club contact request → Accept/decline

### Club
Club Workspace → Agency Contacts → Select verified agency → Optional player → Send inquiry → Agency response

### WFM admin
Admin → Agency Accounts → Verify/reject organization → Agency Relationship Queue → Approve/reject/revoke player relationship

## Design rules

- Verification is never implied by simply creating an agency account.
- Agency verification and player representation are separate decisions.
- Club contact access is limited to verified agencies.
- Private club and agency workflow data remains behind RLS.
- No player rating or transfer prediction is introduced by M12.
- M12 builds on the existing scouting and club portal rather than creating a separate recruitment data model.
