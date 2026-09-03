# PharmFlow Project B — B10 Clean15.7

Handheld Received sync root fix.

- Active Order Manifest remains structural authority only.
- When a manifest is applied, preserved receivingHistory is immediately re-projected onto orderData before statistics/render/save.
- Prevents a structural manifest refresh from rolling cumulative Received backward while local Batch Qty continues correctly.
- No change to Batch Qty semantics, transaction writes, Supabase RPCs, polling cadence, Egress Clean15 behavior, PC receiving logic, or Project A.

### B10 Clean15.9 — Pending User Verification
Handheld Receiving Last Scan uses the same 30-second inactivity boundary as PC. Timer identity is bound to the actual Last Scan transaction so cloud/workspace re-renders do not postpone auto-clear. Auto-clear is UI/local-batch only; Received/history remain authoritative and unchanged. Asset cache token is B10CLEAN15_9.
