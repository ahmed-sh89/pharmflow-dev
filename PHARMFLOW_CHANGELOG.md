# B10 Clean15.7

Fixed a reconciliation boundary in `applyActiveOrderManifest()` where fresh structural orderData could temporarily overwrite current cumulative receiving quantities. The preserved transaction ledger is now reapplied before the workspace is rendered or persisted.
