# PHARMFLOW MASTER SPEC — Auth Refresh Addendum

- Project B remains isolated from Project A.
- Supabase remains authoritative for authentication and pharmacy membership.
- Hard refresh must restore the stored authenticated session and resolve `get_my_app_context` before making an access decision.
- Transient API/Auth/network failures must fail closed without falsely showing Complete access.
- Complete access is valid only when context resolution succeeds and confirms no active pharmacy workspace.
- Cache-busting release tokens must be updated with each deployment containing changed local assets.
