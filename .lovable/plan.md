

# Plan: Replace Google Auth with Phone OTP (Nimbus IT Solutions)

## Overview
Replace all Google OAuth with phone number + SMS OTP authentication using Nimbus IT Solutions' HTTP GET API. Users enter phone, receive OTP via SMS, enter OTP, and get signed into Supabase.

## Architecture

```text
User enters phone → Edge Function "send-otp"
  → Generates 6-digit OTP, stores in DB table `otp_codes`
  → Calls Nimbus IT API (HTTP GET) to send SMS
  → Returns success

User enters OTP → Edge Function "verify-otp"
  → Checks OTP from `otp_codes` table (valid for 5 min)
  → Uses Supabase Admin SDK to create/find user by phone
  → Returns access_token + refresh_token
  → Client calls supabase.auth.setSession()
```

## Required Secrets (before implementation)
You'll need to provide these Nimbus IT Solutions credentials:
- **NIMBUS_API_BASE_URL** — e.g. `http://yourdomain.com/api/SmsApi/SendSingleApi`
- **NIMBUS_USER_ID** — your Nimbus UserID
- **NIMBUS_PASSWORD** — your Nimbus Password
- **NIMBUS_SENDER_ID** — your registered Sender ID
- **NIMBUS_ENTITY_ID** — your DLT Entity ID
- **NIMBUS_TEMPLATE_ID** — your DLT Template ID for OTP messages

## Database Changes

**New table: `otp_codes`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| phone | text | Phone number |
| otp | text | 6-digit OTP |
| expires_at | timestamptz | Created + 5 minutes |
| verified | boolean | default false |
| created_at | timestamptz | |

RLS: No RLS needed (accessed only from edge functions via service role key).

**Update `handle_new_user` trigger**: Add phone-based linking for admins/vendors/delivery_partners (currently only links by email).

## New Files

1. **`supabase/functions/send-otp/index.ts`**
   - Accepts `{ phone }`, validates format (+91 10-digit)
   - Generates 6-digit OTP, inserts into `otp_codes`
   - Calls Nimbus API via HTTP GET with URL-encoded params
   - Rate limit: max 3 OTPs per phone per 10 minutes

2. **`supabase/functions/verify-otp/index.ts`**
   - Accepts `{ phone, otp }`
   - Checks `otp_codes` for valid, unexpired, unverified match
   - Marks as verified
   - Uses `supabase.auth.admin.createUser()` (if new) or finds existing user by phone
   - Generates session via `supabase.auth.admin.generateLink()` or custom token
   - Returns session tokens to client

## Modified Files

3. **`src/hooks/useAuth.tsx`**
   - Remove `signInWithGoogle`, `signInWithEmail`, `signUpWithEmail`
   - Add `sendOtp(phone): Promise<{success, error?}>`
   - Add `verifyOtp(phone, otp): Promise<{success, error?}>` — calls edge function, then `supabase.auth.setSession()`
   - Keep `signOut` unchanged

4. **`src/pages/AuthPage.tsx`** (desktop)
   - Remove Google button entirely
   - Replace auth-form step with 2-step flow:
     - **Phone input**: +91 prefix, 10-digit input, "Send OTP" button
     - **OTP input**: 6-digit OTP using existing `InputOTP` component, "Verify" button, resend timer
   - Role selection step stays the same
   - On successful verification: role-based redirect (same logic as current AuthCallback)

5. **`src/components/auth/MobileAuthSheet.tsx`** (mobile drawer)
   - Same phone → OTP flow as desktop, compact layout
   - Remove Google button
   - On success: close drawer, role-based redirect

6. **`src/App.tsx`**
   - Remove `/auth/callback` route (no longer needed)
   - Remove `AuthCallback` import

7. **`src/pages/AuthCallback.tsx`** — Delete (OAuth callback no longer needed; role redirect logic moves into `verifyOtp` flow)

8. **`src/hooks/useRoleValidation.tsx`** — Update `validateRoleAccess` to also accept phone-based lookup (currently email-only). For admins/vendors/delivery_partners, check by phone column in addition to email.

## OTP Message Template
The SMS message will follow your DLT-registered template. Example:
`Your OTP for Ahmed Mart login is {OTP}. Valid for 5 minutes.`
You'll need to confirm the exact template text matches your DLT registration.

## Security
- OTPs expire after 5 minutes
- Max 3 OTP requests per phone per 10 min (rate limiting in edge function)
- OTP marked as verified after use (single-use)
- Edge functions validate phone format before processing

