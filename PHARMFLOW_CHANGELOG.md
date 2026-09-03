# B10 Clean15.7

Fixed a reconciliation boundary in `applyActiveOrderManifest()` where fresh structural orderData could temporarily overwrite current cumulative receiving quantities. The preserved transaction ledger is now reapplied before the workspace is rendered or persisted.


## B10 Clean15.11 — Auth Session Bootstrap Root Fix
- Root cause confirmed from Supabase log: `get_my_app_context` returned HTTP 401 on iPhone hard refresh.
- Preserve HTTP status on auth request failures.
- Validate restored JWT expiry before protected RPCs and refresh when expired/near expiry.
- On protected RPC 401, perform exactly one serialized refresh and one replay.
- Removed duplicate recursive token-refresh layer from `loadMyAppContext`; `authRpc` is the single recovery owner.
- No polling, Receiving, ledger, manifest, SQL, or Supabase schema changes.
- Unified local asset cache token to `B10CLEAN15_11`.
