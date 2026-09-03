
- B10 Clean15.13: Protected startup RPCs must share one terminal Auth Gate. `authRpc` exclusively owns 401 refresh/retry. A server-rejected refresh token closes the gate for the current boot and routes to Sign In; access/membership UI must never infer "no pharmacy" from authentication failure.


### B10 Clean15.14 — Supabase auth error ownership
Supabase response header `x-sb-error-code` is authoritative for Auth terminal error classification when present; body error codes remain fallback. Terminal refresh-token rejection is an Auth boundary and must never be represented as missing pharmacy access.


### B10 Clean15.15 — Bootstrap presentation ownership
During initial auth/workspace restoration, `authBooting` owns the visible auth surface. Sign In and Complete access must not render until bootstrap resolves. This is a presentation gate only and must not add auth/network retries.
