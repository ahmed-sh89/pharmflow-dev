# PharmFlow Project B — B10 Clean15.7

Handheld Received sync root fix.

- Active Order Manifest remains structural authority only.
- When a manifest is applied, preserved receivingHistory is immediately re-projected onto orderData before statistics/render/save.
- Prevents a structural manifest refresh from rolling cumulative Received backward while local Batch Qty continues correctly.
- No change to Batch Qty semantics, transaction writes, Supabase RPCs, polling cadence, Egress Clean15 behavior, PC receiving logic, or Project A.

# PharmFlow Project B — B10 Clean15.8

Asset cache version root fix.

- All local JS/CSS references in `index.html` use one release token: `B10CLEAN15_8`.
- Prevents mixed-version browser cache after Project B deployments.
- No Service Worker or Cache API was introduced.
- No receiving, Handheld, PC, Supabase, sync, polling, Egress, SQL, or business logic was changed.
- Clean15.7 Received reconciliation remains preserved unchanged.
