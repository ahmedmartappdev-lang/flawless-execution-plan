
# Fix: Role-Based Login Timeout for Delivery Partner/Vendor/Admin

## Problem Identified

When logging in directly as Delivery Partner, Vendor, or Admin via Google OAuth, users see "Connection timed out" error. However, logging in as Customer first and then clicking the Dashboard button works fine.

## Root Cause

There's a **mismatch between how roles are validated vs. how roles are checked**:

| Step | Method | Works? |
|------|--------|--------|
| Login validation (AuthCallback) | Checks by **email** | Yes |
| Dashboard access (ProtectedRoute) | Checks by **user_id** | Fails if user_id is NULL |

For pre-populated users who haven't logged in before, their records have `user_id = NULL`. The `handle_new_user()` trigger only fires on **first signup**, not on subsequent logins.

### Example Data State

| Table | Email | user_id |
|-------|-------|---------|
| delivery_partners | singhrittika231@gmail.com | NULL |
| delivery_partners | mtejash07@gmail.com | linked |

When Rittika logs in:
1. AuthCallback checks email → finds her → redirects to `/delivery`
2. ProtectedRoute checks `user_id` → query returns nothing → timeout

---

## Solution

### Two-Part Fix

**Part 1: Update `useUserRoles` to check by email as fallback**

When the `user_id` lookup returns nothing, also try looking up by the user's email. This ensures pre-populated users get access immediately.

**Part 2: Link `user_id` on login (not just signup)**

Create a mechanism to update `user_id` when a user logs in, so that future queries work by `user_id`. This can be:
- An edge function called after OAuth
- OR updating records directly in the AuthCallback before redirect

---

## Implementation Details

### File 1: `src/hooks/useUserRoles.tsx`

**Change:** Modify each role query to:
1. First try by `user_id` (current behavior)
2. If no result, also try by `email` as fallback
3. If found by email, trigger background `user_id` update

```typescript
// Example for delivery partner check
const { data: deliveryData } = useQuery({
  queryKey: ['user-delivery-status', user?.id, user?.email],
  queryFn: async () => {
    if (!user?.id) return null;
    
    // Try by user_id first
    let { data, error } = await supabase
      .from('delivery_partners')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    // Fallback: try by email
    if (!data && user.email) {
      const emailResult = await supabase
        .from('delivery_partners')
        .select('id')
        .eq('email', user.email.toLowerCase())
        .maybeSingle();
      
      if (emailResult.data) {
        data = emailResult.data;
        // Trigger user_id linking in background
        linkUserIdToRole('delivery_partners', emailResult.data.id, user.id);
      }
    }
    
    return data;
  },
});
```

### File 2: `src/hooks/useUserRoles.tsx` (helper function)

Add a helper function to link `user_id` to the role record:

```typescript
async function linkUserIdToRole(
  table: 'admins' | 'vendors' | 'delivery_partners', 
  recordId: string, 
  userId: string
) {
  await supabase
    .from(table)
    .update({ user_id: userId })
    .eq('id', recordId)
    .is('user_id', null);
}
```

### File 3: `src/components/auth/ProtectedRoute.tsx`

No changes needed - it will work once useUserRoles returns correct data.

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/hooks/useUserRoles.tsx` | Add email fallback + auto-link user_id |

---

## How It Will Work After Fix

### Flow: New user pre-populated as Delivery Partner

```text
1. Admin adds email to delivery_partners (user_id = NULL)
2. User selects "Delivery Partner" on auth page
3. User logs in via Google
4. AuthCallback validates by email → passes
5. Redirects to /delivery
6. useUserRoles checks:
   a. user_id lookup → no result
   b. email lookup → found!
   c. Background: links user_id
7. isDeliveryPartner = true → access granted
8. Future logins: user_id lookup works directly
```

### Flow: Any new user added in future

Same flow works automatically - no manual intervention needed after adding email to role table.

---

## Benefits

1. **Immediate fix**: Pre-populated users can login directly to their dashboards
2. **Self-healing**: Records automatically get `user_id` linked after first login
3. **Future-proof**: Works for any new users added to any role table
4. **No database changes**: Works with existing schema
