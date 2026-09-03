
## B10 Clean15.13 — Unified Auth Gate Root Fix
- Root evidence: repeated `/auth/v1/token` 400 `refresh_token_not_found` plus protected workspace RPC 401s during the same mobile refresh.
- Removed the duplicate refresh fallback from `resumeAuthenticatedApp`; `authRpc` is now the sole 401 refresh owner.
- Added a terminal per-boot auth gate: once a refresh credential is rejected, no later protected startup RPC can run with the stale session.
- Bootstrap no longer swallows auth-boundary failures and continues into context/registration RPCs.
- Registration/admin-assignment loaders no longer convert auth failure into a false "no pharmacy" state.
- Terminal auth failure renders Sign In, never Complete access.
- No Receiving, Handheld quantity, manifest/ledger, SQL, or Egress polling logic changed.
