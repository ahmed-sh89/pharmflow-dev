# B10 Clean15.7

Fixed a reconciliation boundary in `applyActiveOrderManifest()` where fresh structural orderData could temporarily overwrite current cumulative receiving quantities. The preserved transaction ledger is now reapplied before the workspace is rendered or persisted.

# B10 Clean15.8

Unified cache-busting for all local JavaScript and CSS assets loaded by `index.html`. Every local runtime asset now uses the same `B10CLEAN15_8` release token so a Project B deployment cannot mix stale cached JS/CSS with newly deployed files. External CDN dependencies and business logic are unchanged.
