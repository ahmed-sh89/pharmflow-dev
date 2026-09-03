# PHARMFLOW CHANGELOG

## B10 Clean15.10 — Auth Workspace Refresh Root Fix
- Added explicit `contextResolved` / `contextError` state to authentication context resolution.
- Prevented `renderAuthState()` from rendering Complete access while authenticated workspace context is unresolved.
- Replaced the swallowed bootstrap context error with a bounded three-attempt context bootstrap retry.
- No perpetual polling or new background timer was introduced.
- Unified local asset release token to `B10CLEAN15_10` so the auth fix is loaded without manual cache clearing.
- No SQL, Supabase schema, receiving, Handheld scan, quantity, manifest, ledger, or Egress polling logic changed.
