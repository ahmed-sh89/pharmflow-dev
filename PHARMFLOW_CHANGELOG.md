# B10 Clean15.7

Fixed a reconciliation boundary in `applyActiveOrderManifest()` where fresh structural orderData could temporarily overwrite current cumulative receiving quantities. The preserved transaction ledger is now reapplied before the workspace is rendered or persisted.

## B10 Clean15.12 — Auth Refresh Storm Root Fix (2026-09-03)
- USER evidence: `/auth/v1/token?grant_type=refresh_token` repeatedly returned HTTP 400 `refresh_token_not_found`, followed by protected RPC 401s.
- Terminal refresh-token rejection now clears only stale local auth credentials and routes to Sign In instead of preserving/retrying a dead session.
- `authRpc` is the single protected-RPC 401 recovery owner; duplicate context-loader refresh recursion removed.
- Refresh remains single-flight. Transient network/server refresh failures remain non-destructive.
- No Receiving, Handheld quantity, ledger, manifest, SQL, schema, or Egress polling changes.
