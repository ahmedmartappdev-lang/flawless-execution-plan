

## Problem

The `findAuthUser()` function in `verify-otp` paginates through **all** auth users to find a match by phone or email. This pagination is unreliable — it fails to find existing users, causing a create attempt that hits `phone_exists`, then the recovery lookup also fails with the same pagination bug. This is why the logs show "Create conflict, recovering: phone_exists" followed by "Recovery lookup failed after conflict".

## Root Cause

The GoTrue admin `/admin/users` pagination endpoint is not reliably returning the target user. This could be due to ordering, caching, or format mismatches in the phone field.

## Solution: Skip pagination entirely

Instead of scanning all auth users page by page, use the **profiles table** (which already stores `user_id` and `phone`) to resolve existing users directly, then call the admin API with the known user ID.

### Changes to `supabase/functions/verify-otp/index.ts`

1. **Replace `findAuthUser()` with a direct profiles lookup**:
   - Query `profiles` table: `SELECT user_id FROM profiles WHERE phone = fullPhone LIMIT 1`
   - If found, we have the exact `user_id` — fetch/update via `/auth/v1/admin/users/{id}` directly
   - No pagination, no scanning, no missed users

2. **Fallback: also check by synthetic email** if profiles lookup misses:
   - Query `profiles` table by the synthetic email pattern isn't needed since profiles stores phone
   - As a secondary fallback, try creating the user; if `phone_exists`/`email_exists`, query auth admin API by the specific user ID from a broader search

3. **Flow becomes**:
   ```text
   validate OTP
   → query profiles table by phone → get user_id
   → if found: update auth user by ID (set temp password) → sign in
   → if not found: create new auth user → sign in
   → if create conflicts: re-query profiles (trigger may have created it) → update by ID → sign in
   → mark OTP verified only after session success
   ```

4. **Keep error messages user-friendly** — no changes needed to frontend

### Why this fixes the issue

- The profiles table is indexed and directly queryable — no pagination
- The `handle_new_user` trigger creates a profile row on user creation, so every auth user has a matching profile
- For returning users, profiles already has their `user_id` and `phone`, giving us an instant match

### Files to update
- `supabase/functions/verify-otp/index.ts` — replace pagination with profiles-based lookup

