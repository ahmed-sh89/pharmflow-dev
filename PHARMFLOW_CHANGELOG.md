# B10 Clean15.7

Fixed a reconciliation boundary in `applyActiveOrderManifest()` where fresh structural orderData could temporarily overwrite current cumulative receiving quantities. The preserved transaction ledger is now reapplied before the workspace is rendered or persisted.

## B10 Clean15.9 — Handheld Last Scan Auto-Clear Root Fix
- Unified Receiving Last Scan inactivity timer across PC and Handheld.
- Handheld Last Scan now clears 30 seconds after the actual scan identity, not after workspace/sync renders.
- Cloud/workspace refreshes cannot restart/postpone the timer for the same scan.
- Auto-clear resets only the device-local current batch and UI; cumulative Received/history are untouched.
- Manual Handheld CLEAR cancels the same timer and keeps identical data-safe semantics.
- Updated all local JS/CSS cache tokens to B10CLEAN15_9 so the fix is fetched without manual cache clearing.
