
## B10 Clean15.13 — Unified Auth Gate Root Fix
- Root evidence: repeated `/auth/v1/token` 400 `refresh_token_not_found` plus protected workspace RPC 401s during the same mobile refresh.
- Removed the duplicate refresh fallback from `resumeAuthenticatedApp`; `authRpc` is now the sole 401 refresh owner.
- Added a terminal per-boot auth gate: once a refresh credential is rejected, no later protected startup RPC can run with the stale session.
- Bootstrap no longer swallows auth-boundary failures and continues into context/registration RPCs.
- Registration/admin-assignment loaders no longer convert auth failure into a false "no pharmacy" state.
- Terminal auth failure renders Sign In, never Complete access.
- No Receiving, Handheld quantity, manifest/ledger, SQL, or Egress polling logic changed.


## B10 Clean15.14 — Auth Header Error Code Root Fix
- Root cause confirmed from Supabase logs: refresh-token rejection code was supplied as response header `x-sb-error-code: refresh_token_not_found`, while the client read only JSON body error codes.
- `authRequest()` now captures the Supabase response-header error code first.
- Existing terminal stale-session handling can now close the auth gate on the first confirmed invalid refresh token.
- Bumped auth/app asset versions to B10CLEAN15_14.
- No operational Receiving/Handheld/SQL changes.


## B10 Clean15.15 — Auth Bootstrap UI Gate
- User verification in a clean Incognito session confirmed authentication and workspace restoration are valid, but hard refresh briefly rendered Sign In before the stored session/context finished resolving.
- Added one explicit bootstrap presentation gate: while `body.authBooting` is active, both Sign In forms and Complete access are suppressed and only `Preparing PharmFlow` may render.
- No Auth RPC, token refresh, workspace membership, Receiving, Handheld, SQL, manifest/ledger, or Egress polling behavior changed.
- Unified local asset cache token in `index.html` to `B10CLEAN15_15` so the UI-gate release cannot mix prior cached assets.
