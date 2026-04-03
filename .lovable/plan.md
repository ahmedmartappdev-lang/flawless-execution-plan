
Goal: fix the remaining OTP verification issue so users see a friendly “Wrong OTP” message when the code is invalid, and existing accounts can still sign in from any device without failing on legacy auth records.

1. Confirm the real failure points
- Review the current `verify-otp` edge function and auth UI flow together.
- Treat this as two separate failure paths:
  - invalid OTP should show a clean user-facing message
  - valid OTP should always resolve to a reusable auth user, even for older accounts

2. Fix client-side error handling for edge functions
- Update `src/hooks/useAuth.tsx` so `verifyOtp()` does not rely only on `error.message` from `supabase.functions.invoke()`.
- Handle Supabase `FunctionsHttpError` properly by reading `await error.context.json()` and returning the edge function’s actual `{ error }` payload.
- This will stop the UI from showing generic messages like “Edge Function returned a non-2xx status code” when the function already sent “Wrong OTP. Please try again.”

3. Make `verify-otp` resilient for legacy/multi-device users
- Refine `supabase/functions/verify-otp/index.ts` so user lookup checks more than just `phone`.
- Reuse an existing auth user if either of these match:
  - `phone === +91...`
  - `email === [phone]@phone.ahmedmart.local`
- If a matching email already exists on an older record, update that user instead of trying to create a new one.
- This prevents failures like `email_exists` when the same person logs in again from another device or after earlier auth attempts.

4. Keep the user-facing messages simple
- Standardize verification failures into friendly responses:
  - wrong/expired/missing OTP → “Wrong OTP. Please try again.”
  - internal auth/session preparation issues → a neutral fallback like “Verification failed. Please try again.”
- Keep technical errors only in logs, not in toasts.

5. Align both login UIs
- Ensure both `src/pages/AuthPage.tsx` and `src/components/auth/MobileAuthSheet.tsx` benefit from the improved `useAuth()` error handling automatically.
- Keep the same UX on desktop and mobile:
  - invalid OTP shows a simple wrong-OTP message
  - valid OTP signs in successfully from another browser/device

6. Validate after implementation
- Test wrong OTP on desktop and mobile
- Test correct OTP for:
  - a brand-new user
  - an already logged-in user on another device/browser
  - an older user record that may already have the synthetic email
- Verify there is no generic non-2xx error shown to users anymore

Technical details
```text
Current gap:
UI -> supabase.functions.invoke('verify-otp')
   -> non-2xx returns generic FunctionsHttpError
   -> UI shows generic error instead of function payload

Planned fix:
UI catches FunctionsHttpError
   -> reads error.context.json()
   -> surfaces payload.error

Current backend risk:
lookup by phone only
   -> create deterministic fake email
   -> create can fail if email already exists on legacy user

Planned fix:
lookup by phone OR fake email
   -> update matched user
   -> create only if neither exists
```
