
Goal: make OTP login work reliably for returning users after logout or on a different device, so the flow reuses the existing account instead of failing with “user account creation error”.

What I found
- The main problem is in `supabase/functions/verify-otp/index.ts`.
- Even after OTP is valid, the function can still try to create a new auth user and fail with `phone_exists`.
- Supabase logs already confirm this exact backend failure.
- The current frontend error handling is mostly fine; the real bug is that the backend is not always reconciling existing users correctly.
- There is also a second reliability issue: the OTP is marked `verified: true` before user/session creation finishes, so a good OTP can get consumed even when login fails.

Implementation plan
1. Harden existing-user resolution in `supabase/functions/verify-otp/index.ts`
- Keep the current normalized phone format (`+91...`) and synthetic email format (`[phone]@phone.ahmedmart.local`).
- Replace the “lookup once, else create” flow with a “resolve or recover” flow:
  - first search existing auth users by phone
  - then search by synthetic email
  - if both exist on different records, prefer the phone-matched user as the canonical account
- Only create a new auth user when neither phone nor synthetic email matches any existing user.

2. Add duplicate-safe recovery when create/update fails
- If create returns `phone_exists` or `email_exists`, do not return “Failed to create user account.”
- Instead, immediately re-run a broader auth-user lookup and reuse the matching account.
- If update fails because of legacy data shape, retry with the matched user rather than failing the whole login.
- Keep technical details only in logs; return a simple retryable message to the UI only if recovery truly fails.

3. Reorder OTP consumption
- Do not mark the OTP as verified immediately after matching it.
- New order:
  1. validate OTP
  2. resolve/reuse/create auth user
  3. generate session tokens
  4. mark OTP as verified only after session creation succeeds
- This prevents valid OTPs from being wasted when account recovery hits an edge case.

4. Keep re-login behavior intentionally supported
- Make login idempotent for returning users:
  - logout and login again should work
  - same phone on another browser/device should work
  - old accounts created earlier should still work
- Multi-device access should remain allowed; no single-device restriction should be introduced.

5. Keep user-facing errors clean
- Wrong or expired OTP: `Wrong OTP. Please try again.`
- Unexpected backend failure after recovery attempts: `Verification failed. Please try again.`
- Remove the account-creation wording from normal relogin paths because returning users should not see account-creation errors.

Files to update
- `supabase/functions/verify-otp/index.ts` — main fix
- `src/hooks/useAuth.tsx` — only minor adjustment if needed to preserve friendly fallback messaging consistently

Validation after implementation
- Existing user logs out and logs back in on same device
- Existing user logs in from a different browser/incognito/device
- Existing user with legacy auth record logs in again successfully
- Wrong OTP still shows the friendly wrong-OTP message
- Successful login no longer shows account-creation errors

Technical notes
```text
Current failure path:
valid OTP
-> existing auth user not reliably matched
-> create user attempted
-> Supabase returns phone_exists
-> user sees account creation error

Planned failure-resistant path:
valid OTP
-> search auth users by phone
-> else search by synthetic email
-> if create hits phone_exists/email_exists, recover by re-querying and reusing existing user
-> sign in
-> only then mark OTP as used
```

Not planned
- No database schema change is needed for this fix
- No auth-store redesign is required unless testing shows a separate session-bootstrap issue
