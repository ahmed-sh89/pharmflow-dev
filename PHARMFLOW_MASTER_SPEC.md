
### Authentication bootstrap invariant — B10 Clean15.13
All protected startup RPCs are serialized behind one authentication gate. Authentication failure is distinct from pharmacy-access state. A terminal refresh-token rejection invalidates only local credentials, aborts remaining protected bootstrap work, and requires Sign In; it must never render Complete access or trigger parallel/repeated refresh chains.
