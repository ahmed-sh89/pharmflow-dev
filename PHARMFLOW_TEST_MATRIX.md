# PHARMFLOW TEST MATRIX — 2C.11.4.4
| ID | Test | Expected | Status |
|---|---|---|---|
| PC-CONESTAL | Conestal PC | 240276 / KY5X4W2MWOQK / Nov 2026 | READY FOR TEST |
| PC-DOMPY | Dompy PC | CL0117 / 2073835044260 / Oct 2028 | READY FOR TEST |
| HH-CONESTAL | Conestal Handheld | Correct unchanged | READY FOR TEST |
| HH-DOMPY | Dompy Handheld | CL0117 / 2073835044260 / Oct 2028 | READY FOR TEST |
| REG-BATCH | Consecutive Batch Qty | Preserved | USER VERIFIED |
| REG-CLEAR | Top Clear Screen | Preserved | USER VERIFIED |
| REG-UNDO | Undo quantity | Preserved | USER VERIFIED |

## DEV Environment Isolation — DEVISO1
| Test | Expected | Status |
|---|---|---|
| B + DEV001 login | Workspace opens | READY FOR TEST |
| B + DEV001 tenant write | Write affects DEV001 only | READY FOR TEST |
| B + non-DEV tenant mutation | DEV SAFETY BLOCK; no write | READY FOR TEST |
| B Global GTIN read | Existing master can be read/used | READY FOR TEST |
| B Global GTIN update/delete | Blocked | READY FOR TEST |
| Production A regression | No source change / behavior unchanged | READY FOR TEST |
