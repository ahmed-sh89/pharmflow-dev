
## B10 Clean15.13 Auth Gate verification
- [ ] Mobile stale-session refresh routes to Sign In, not Complete access.
- [ ] After one fresh Sign In, 5 consecutive page refreshes restore the same pharmacy workspace.
- [ ] Supabase logs show no repeated 400 refresh-token storm during refresh.
- [ ] `get_my_app_context` / registration RPCs do not continue after terminal auth rejection in the same boot.
- [ ] Receiving PC/Handheld behavior remains unchanged.
