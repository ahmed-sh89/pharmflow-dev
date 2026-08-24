# PHARMFLOW CURRENT CHECKPOINT

Date: 21 August 2026
Version: Phase 2C.11.4.4 — Unified GS1 Right-Side Recovery
Status: READY FOR TEST

## WHY THIS RELEASE
2C.11.4.3 did not restore PC medicine Batch/Serial/Expiry. PC could resolve
Item/GTIN but fields remained blank. Meanwhile Handheld Dompy still truncated
Batch CL0117 to 11.

The previous approach had separate/global plus Handheld-specific recovery paths.
That made the parser difficult to reason about.

## ROOT FIX
There is now ONE separator-loss recovery inside scanner.js for both PC and
Handheld.

Normal GS/FNC1 parsing remains authoritative.

Fallback runs only if the normal parse has GTIN but one or more medicine fields
are incomplete.

It parses from the RIGHT side so Batch values containing digits `17` are safe:
- AI10 Batch -> AI17 Expiry -> AI21 Serial
- AI10 Batch -> AI21 Serial -> AI17 Expiry

For 10->17->21 it uses the LAST structurally valid AI17 date before AI21,
not the first occurrence of digits `17`.

## EXPECTED KNOWN CASES
Dompy:
- GTIN 06285128000307
- Batch CL0117
- Serial 2073835044260
- Expiry Oct 2028

Conestal:
- GTIN 06286059000510
- Batch 240276
- Serial KY5X4W2MWOQK
- Expiry Nov 2026

## REMOVED
- Handheld-specific Batch post-processing from expiry.js.
- Product-specific logic remains prohibited.

## PRESERVED
- Consecutive Batch Qty: USER VERIFIED.
- Handheld Clear Screen top position: USER VERIFIED.
- Undo quantity execution: USER VERIFIED.
- Auto Clear behavior.
- No Receiving logic change.
- No SQL migration.

## TEST
1. PC Conestal -> all four GS1 fields populated.
2. PC Dompy -> CL0117 / 2073835044260 / Oct 2028.
3. Handheld Conestal -> unchanged correct values.
4. Handheld Dompy -> CL0117 / 2073835044260 / Oct 2028.
5. One additional known-good medicine on each device.

## 2026-08-25 — DEV Environment Isolation (B)
Status: READY FOR TEST

- Repository B (`pharmflow-dev`) is designated Development/Test only.
- Dedicated tenant: PharmFlow Dev / DEV001.
- DEV pharmacy UUID: `ffcac9ca-dfca-4344-9490-a77dcdba9d01`.
- Added `js/dev-isolation.js` as a fail-closed client safety boundary.
- Authenticated mutation RPCs are allowed only when the active tenant is DEV001.
- Global GTIN cloud reads remain available; Global GTIN import/commit/delete writes are blocked in B.
- Legacy unscoped shared-session cloud writes are blocked in B to prevent Production session contamination.
- Production repository A and its source files were not modified by this package.

Verification required before DONE:
1. Sign into B as dev001@gmail.com: normal DEV001 workspace opens and tenant-scoped writes work.
2. Sign into B with Health House or Test 01: reads/login may occur, but any mutation must fail with DEV SAFETY BLOCK.
3. In B Settings, Global GTIN update control is unavailable; Global GTIN lookup/read still works.
4. Confirm A continues operating unchanged.
