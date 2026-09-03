# B10 Clean15.7 Test Matrix

1. Handheld: scan same item 10+ times rapidly. Batch Qty and cumulative Received must both increase without Received rolling back.
2. Wait through sync/manifest polling and continue scanning. Received must not restart from 1.
3. CLEAR: local Batch Qty resets; cumulative Received remains unchanged. Next same-item scan starts Batch Qty at 1 and increments cumulative Received by 1.
4. PC: verify cumulative Received matches Handheld after sync.
5. Active Order add/remove and Clean15 Egress behavior: no regression.

### Clean15.9 verification
- Handheld scan: Last Scan remains visible before 30 seconds and disappears at ~30 seconds without manual CLEAR. [PENDING USER]
- Workspace sync/status refresh during the 30 seconds does not postpone Last Scan disappearance. [PENDING USER]
- After auto-clear, scanning the same item starts local Batch Qty at 1 while cumulative Received continues from the prior total. [PENDING USER]
- Manual CLEAR preserves the same batch-boundary behavior and does not change Received/history. [PENDING USER]
- PC 30-second Last Scan auto-clear remains unchanged. [PENDING USER]
- Deploy loads B10CLEAN15_9 assets without manual cache clearing. [PENDING USER]
