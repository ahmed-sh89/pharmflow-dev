# PHARMFLOW TEST MATRIX — B10 Clean15.10

1. Mobile Project B, already-authenticated account with pharmacy access: hard Refresh 5 times. Expected: returns to PharmFlow workspace every time; **Complete access must never appear**.
2. Close tab, reopen Project B. Expected: stored session restores and workspace opens normally.
3. Sign out explicitly. Expected: normal Sign In screen.
4. Sign in again. Expected: pharmacy workspace opens normally.
5. Handheld smoke test: Receiving opens; one scan succeeds; Last Scan auto-clears after 30 seconds.
6. Egress non-regression: no new perpetual polling was added; continue current RPC/egress verification separately.
