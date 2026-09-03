# PharmFlow Changelog

## B10 Clean20 — Idle Polling Consolidation
- Removed generic UI activity as the owner of fast receiving cloud polling.
- Limited fast 3s delta sync to a short 30s window after a real receiving transaction.
- Kept idle receiving delta sync at 15s.
- Reduced Needs Review cloud count polling from 6s to 30s with focus/visibility dedupe.
- Set Active Order manifest metadata background cadence to 60s.
- Kept immediate writes and Supabase authority unchanged.
- Loaded modified root `ui.js` and `cloud-workspace.js` explicitly for mobile GitHub deployment consistency.
