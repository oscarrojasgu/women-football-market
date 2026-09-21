# WFM Phase 5 — Milestone 1: Scouting Workspace Architecture

Status: COMPLETE

## Purpose

Establish the persistent database foundation for WFM scouting workflows without duplicating player, contract, salary, transfer, market-value, or statistics records.

## Implemented

### `scouting_lists`
Named, user-owned scouting lists with name, description, active/archived status, ownership through `auth.users`, and timestamps.

### `scouting_list_players`
Player membership for scouting lists with parent-list ownership, player foreign key, authenticated user who added the player, optional list-specific note, and a unique `(list_id, player_id)` guard.

### `scouting_notes`
Private scouting notes with authenticated owner, player or list target, note type, note content, and timestamps.

Supported note types:
- general
- watch
- follow_up
- evaluation
- contract
- availability

### `saved_searches`
Persistent user-owned saved-search definitions with name, description, JSONB filter state, sort key, sort direction, and timestamps.

The JSONB filter structure preserves the existing Players-page scouting filters without duplicating player data.

## Security

All four tables have RLS enabled. Users can only manage their own lists, list memberships, notes, and saved searches. List-player policies also require ownership of the parent scouting list, preventing cross-user list manipulation by UUID.

Authenticated table grants are explicit and anonymous access is not granted.

## Performance

Indexes cover list ownership, list membership, player membership, membership creator, note owner/player/list, and saved-search ownership.

## Existing behavior preserved

The existing browser-local scouting shortlist/workflow system remains intact for now. Phase 5 will migrate that behavior into persistent authenticated records rather than abruptly removing the current workflow.

## Next milestone

**Phase 5 — Milestone 2: Scouting List & Saved Search UI**

1. Build the authenticated `/scouting` workspace.
2. Create, rename, and archive scouting lists.
3. Add/remove players from lists.
4. Add player scouting notes.
5. Save/load/delete searches.
6. Replace browser-only shortlist persistence with authenticated persistence when signed in.
7. Preserve the current scouting filters and descriptive percentile/archetype language.

Player-data enrichment remains a parallel workstream and does not block Phase 5.
