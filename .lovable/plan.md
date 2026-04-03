
Goal: fix the OTP re-login bug properly so an existing user can log in again after logout or from another device without hitting `phone_exists` / recovery failures.

What the code and logs show
- The current `verify-otp` function no longer paginates auth users, but it still assumes every existing auth user has a matching `profiles.phone`.
- Logs prove the failure path is:
  ```text
  OTP valid
  -> profiles lookup by phone returns no row
  -> create auth user attempted
  -> /auth/v1/admin/users returns phone_exists
  -> retry profiles lookup still returns no row
  -> verification fails
  ```
- So the real issue is not OTP validation. It is identity reconciliation:
  - an auth user already exists in Supabase Auth
  - but that user is not discoverable through the current `profiles.phone` lookup
  - therefore the function incorrectly tries to create a duplicate auth user

Likely root cause
- The function depends too heavily on `profiles.phone`.
- Some old or inconsistent users likely exist in Auth without a usable matching `profiles.phone` row.
- The `handle_new_user` trigger exists in migrations, but current runtime behavior suggests some users were created before that logic, or have incomplete linkage data.
- Because creation uses the same phone again, Supabase correctly rejects it with `phone_exists`.

Implementation plan
1. Refactor `supabase/functions/verify-otp/index.ts` into a deterministic “resolve or reuse” flow
- Add small helpers inside the function file:
  - `getProfileUserIdByPhone(fullPhone)`
  - `listAuthUsersPage(page, perPage)`
  - `findAuthUserByPhoneOrEmail(fullPhone, fakeEmail)`
  - `updateAuthUserForLogin(userId, fakeEmail, tempPassword)`
- Keep OTP validation exactly as-is and continue marking OTP verified only after session success.

2. Resolve existing users using multiple sources, in order
- First check `profiles.phone = fullPhone`.
- If that fails, search Auth users directly for either:
  - `user.phone === fullPhone`
  - `user.email === fakeEmail`
- This avoids depending only on `profiles`.
- If both profile lookup and auth lookup miss, only then create a new auth user.

3. Add conflict recovery that re-checks Auth, not just profiles
- If create returns `phone_exists` or `email_exists`, do not only retry `profiles`.
- Immediately do a direct auth-user lookup by phone/email and reuse that user.
- This addresses the exact log pattern now happening.

4. Optionally self-heal missing profile linkage during successful re-login
- When an auth user is found from Auth but profile lookup had failed, add a repair step:
  - check whether a `profiles` row exists for that `user_id`
  - if missing, create one with `user_id`, default name, and `fullPhone`
  - if present but phone is null/mismatched, update phone
- This turns broken legacy users into healthy users for future logins.
- Use service-role access inside the edge function; no schema change needed.

5. Keep sign-in token generation compatible
- Continue using the password grant flow with a temporary password after updating/reusing the canonical auth user.
- Do not introduce single-device restrictions.
- Logging in from another device should remain fully supported.

6. Preserve clean user-facing errors
- Invalid/missing/expired OTP: `Wrong OTP. Please try again.`
- Any unresolved backend failure after all recovery attempts: `Verification failed. Please try again.`
- Do not expose `phone_exists` or account-creation wording to users.

Files to update
- `supabase/functions/verify-otp/index.ts` — main fix
- `src/hooks/useAuth.tsx` — only if needed to preserve friendly error parsing consistently; current parsing already looks mostly correct

Validation after implementation
- Existing user logs out and logs back in on same device
- Existing user logs in from another browser/incognito/device
- Existing user with missing/broken profile linkage can still log in
- Wrong OTP still shows the friendly wrong-OTP message
- Supabase logs no longer show the repeated pattern:
  ```text
  Create conflict, recovering via profiles: phone_exists
  Recovery profile lookup failed after conflict
  ```

Technical details
```text
Current failure:
profiles lookup only
-> miss
-> create auth user
-> phone_exists
-> retry profiles lookup
-> miss again
-> fail

Planned flow:
validate OTP
-> lookup profile by phone
-> if missing, lookup auth user by phone or synthetic email
-> if found, repair profile linkage if needed
-> update auth user with temp password
-> sign in
-> mark OTP verified

If create conflicts:
-> lookup auth user by phone/email again
-> reuse resolved user
-> continue login
```
