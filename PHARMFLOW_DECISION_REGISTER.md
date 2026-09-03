# PHARMFLOW DECISION REGISTER

## B10 Clean15.10
**Decision:** Authentication session validity and pharmacy workspace membership resolution are separate states.

A valid authenticated session with an unresolved/failed workspace-context request must never be treated as a confirmed account with no pharmacy. Only a successfully resolved context may drive the Complete access screen.

Bootstrap retries are bounded and event-driven; this fix must not reintroduce high-frequency Supabase polling.
