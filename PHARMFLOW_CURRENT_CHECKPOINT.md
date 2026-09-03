# PHARMFLOW CURRENT CHECKPOINT

## B10 Clean15.11 — AUTH SESSION BOOTSTRAP ROOT FIX
Status: REQUIRES USER VERIFICATION

Confirmed root cause: on mobile hard refresh, `POST /rest/v1/rpc/get_my_app_context` returned HTTP 401 while a persisted authenticated account was still shown locally. Clean15.11 makes protected RPC auth recovery authoritative and bounded: preflight refresh for expired/near-expiry restored JWTs, then one single-flight refresh + one replay on HTTP 401. A 401 is never treated as proof that the user has no pharmacy membership.

Preserve Clean15.9 Handheld Last Scan auto-clear, Clean15.8 cache discipline, Clean15 Egress controls, Receiving sync, Active Order Manifest, and Project A isolation.
