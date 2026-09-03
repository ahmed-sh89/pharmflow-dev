
### B10 Clean15.13 — Awaiting user verification
Unified Auth Gate root fix applied after Supabase logs confirmed refresh-token rejection (400) followed by protected RPC 401s. Expected result: stale session causes one terminal auth recovery to Sign In; no Complete access false state and no refresh-token request storm. Receiving/Handheld operational paths unchanged.
