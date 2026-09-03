
- B10 Clean15.13: Protected startup RPCs must share one terminal Auth Gate. `authRpc` exclusively owns 401 refresh/retry. A server-rejected refresh token closes the gate for the current boot and routes to Sign In; access/membership UI must never infer "no pharmacy" from authentication failure.
