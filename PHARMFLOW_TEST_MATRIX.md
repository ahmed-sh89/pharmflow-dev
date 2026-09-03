# B10 Clean15.7 Test Matrix

1. Handheld: scan same item 10+ times rapidly. Batch Qty and cumulative Received must both increase without Received rolling back.
2. Wait through sync/manifest polling and continue scanning. Received must not restart from 1.
3. CLEAR: local Batch Qty resets; cumulative Received remains unchanged. Next same-item scan starts Batch Qty at 1 and increments cumulative Received by 1.
4. PC: verify cumulative Received matches Handheld after sync.
5. Active Order add/remove and Clean15 Egress behavior: no regression.


## Clean15.11 verification
- Mobile authenticated hard refresh x5: workspace restores; no false Complete access screen.
- Supabase API log after refresh: `get_my_app_context` should resolve 200 after any bounded token refresh; no repeated 401 loop.
- Leave app idle 5 minutes: no new auth retry loop.
- Handheld Last Scan auto-clear remains 30 seconds.
- Receiving quantities/sync unchanged.
