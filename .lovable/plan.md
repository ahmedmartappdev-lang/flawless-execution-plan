

## Problem

The `profiles` table UPDATE RLS policy only allows `auth.uid() = user_id` — meaning users can only update their own profile. There's no admin UPDATE policy, so when an admin tries to update another customer's `credit_balance`, it silently fails (or errors).

## Fix

Add an RLS policy on the `profiles` table allowing admins to update any profile:

```sql
CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
```

This single migration resolves the issue. No code changes needed — the `AdminCredits.tsx` mutation logic is correct, it's purely an RLS permission gap.

