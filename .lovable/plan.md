

## Plan: Move role validation to the `send-otp` edge function (backend)

### Problem
The `validatePhoneRole` function runs on the frontend using the anon Supabase client. Since the user is not authenticated at login time, RLS policies on `admins`, `vendors`, and `delivery_partners` block the query, returning no data even when the phone number exists.

### Solution
Move the role validation into the `send-otp` edge function, which already has service-role access and can query any table without RLS restrictions. The frontend will pass the selected role along with the phone number.

### Changes

**1. `supabase/functions/send-otp/index.ts`**
- Accept an optional `role` field in the request body
- If role is not `customer`, query the corresponding table (`admins`, `vendors`, `delivery_partners`) using the service-role client to check if the phone exists and is active
- Return a clear error like `"This number is not registered as Admin"` if not found
- Only proceed to generate and send OTP if validation passes

**2. `src/pages/AuthPage.tsx`**
- Pass `selectedRole` to `sendOtp(phoneNumber, selectedRole)`
- Remove the frontend `validatePhoneRole` function entirely
- Remove the post-verify role check (the role was already validated before OTP was sent)

**3. `src/components/auth/MobileAuthSheet.tsx`**
- Same changes as AuthPage: pass role to `sendOtp`, remove frontend `validatePhoneRole`

**4. `src/hooks/useAuth.tsx`**
- Update `sendOtp` to accept an optional `role` parameter and pass it in the edge function request body

### Flow after fix
```text
User selects role + enters phone
-> Frontend calls send-otp with { phone, role }
-> Edge function (service role) checks role table
-> If not registered: returns error, no OTP sent
-> If registered: generates and sends OTP
-> User enters OTP -> verify-otp proceeds as normal
```

No database migration or RLS policy changes needed.

