# B10 Clean15.7 Test Matrix

1. Handheld: scan same item 10+ times rapidly. Batch Qty and cumulative Received must both increase without Received rolling back.
2. Wait through sync/manifest polling and continue scanning. Received must not restart from 1.
3. CLEAR: local Batch Qty resets; cumulative Received remains unchanged. Next same-item scan starts Batch Qty at 1 and increments cumulative Received by 1.
4. PC: verify cumulative Received matches Handheld after sync.
5. Active Order add/remove and Clean15 Egress behavior: no regression.

### B10 Clean15.12 — Auth Refresh Storm
- [ ] Existing stale iPhone session: first terminal refresh rejection routes to Sign In, not Complete access.
- [ ] Sign in once: authenticated pharmacy workspace restores.
- [ ] Five hard refreshes: workspace restores each time.
- [ ] Supabase logs: no repeated `refresh_token_not_found` storm after terminal rejection/sign-in.
- [ ] Receiving/Handheld quantities and sync unchanged.
