# PHARMFLOW CHANGELOG — 2C.11.4.4
- Replaced multiple separator-loss heuristics with one right-side structural GS1 recovery.
- Fixed AI17 ambiguity inside Batch values such as CL0117.
- Removed Handheld-only GS1 post-processing.
- Kept normal FNC1 parsing primary.
- No Receiving or database changes.

## 2026-08-25 — DEVISO1
- Added dedicated DEV001 client safety boundary to repository B.
- Blocked cross-tenant mutations from the development deployment.
- Made system-wide Global GTIN cloud master read-only in B.
- Blocked legacy non-tenant-scoped shared-session writes in B.
