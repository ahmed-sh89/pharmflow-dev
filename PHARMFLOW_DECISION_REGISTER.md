# PHARMFLOW DECISION REGISTER — 2C.11.3.3

## D-2026-08-21-EXP-12 — Expiry deletion PC-only
APPROVED. All destructive Expiry History actions are restricted to PC.
Handheld history is operational/view-only. This includes both single-record
Delete and Delete All Expiry History.

## D-2026-08-21-EXP-13 — Clear Screen distinction
APPROVED. Handheld may retain CLEAR SCREEN because it is visual-only and does
not delete or modify saved Expiry data.

## 2026-08-25 — Dedicated Development Tenant Boundary
**Decision:** Repository/deployment B (`pharmflow-dev`) is permanently bound for mutations to PharmFlow Dev tenant `DEV001` (`ffcac9ca-dfca-4344-9490-a77dcdba9d01`). Production Health House and Test 01 remain outside B's write boundary. The system-wide Global GTIN master is read-only from B. Legacy cloud-session writes without pharmacy scoping are disabled in B.

**Reason:** Development and redesign work must not be able to mutate Production/A data even when both deployments use the same Supabase project.

**Non-regression:** Do not copy `js/dev-isolation.js` or its script include into Production repository A.

- B10 Clean15.12: Server-confirmed `refresh_token_not_found` is terminal. Never preserve/retry that credential; clear local auth only and require Sign In. Protected RPC 401 recovery has one owner and refresh is single-flight.
