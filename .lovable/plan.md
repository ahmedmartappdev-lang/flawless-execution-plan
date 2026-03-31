
Goal: fix the login OTP SMS flow so users either receive the OTP or see the real failure reason.

What I found:
- The frontend is already using `supabase.functions.invoke('send-otp')`, so the earlier client-side URL issue is no longer the main problem.
- The current `send-otp` edge function stores the OTP, calls Nimbus, reads the response text, and then always returns success.
- It does not check `smsResponse.ok` and does not verify whether the Nimbus response body means “accepted” or “rejected”.
- So the app can show “OTP sent” even when the SMS provider actually failed.
- The login OTP message text also has to exactly match the DLT-approved template connected to `NIMBUS_TEMPLATE_ID`; if it does not, Nimbus may reject or silently not deliver.

Implementation plan:
1. Harden `supabase/functions/send-otp/index.ts`
   - switch to the full recommended CORS headers for web clients
   - validate all required Nimbus secrets before sending
   - capture the inserted OTP row id
   - call Nimbus and inspect both HTTP status and response text
   - only return success if the provider actually accepts the message
   - if SMS sending fails, remove the just-created OTP row so unusable OTPs are not left in the database
   - add safe logs: masked phone, provider status, provider response, cleanup result; do not log the OTP value

2. Make the SMS gateway handling strict
   - treat non-2xx responses as failures
   - treat known provider error text / rejection text as failures
   - return clear error messages from the edge function so the existing frontend toast becomes accurate

3. Keep the frontend mostly unchanged
   - `src/hooks/useAuth.tsx` can remain as-is with `supabase.functions.invoke(...)`
   - no major UI rewrite is needed; once the edge function returns truthful results, the current login screen will reflect the correct state

4. Verify the template/config path
   - confirm the login SMS body exactly matches the DLT-approved template for `NIMBUS_TEMPLATE_ID`
   - if the code fix still shows provider rejection, the remaining issue is likely Nimbus-side config: template mismatch, sender/entity/template mapping, or account permissions

Files to update:
- `supabase/functions/send-otp/index.ts`
- optionally `supabase/functions/verify-otp/index.ts` for CORS/header consistency only

Technical details:
```text
Current flow:
client -> send-otp
  -> insert otp_codes
  -> call Nimbus
  -> ignore provider failure
  -> return success

Planned flow:
client -> send-otp
  -> validate input + secrets
  -> insert otp_codes and keep inserted id
  -> call Nimbus
  -> if provider rejects: delete inserted OTP, return error
  -> if provider accepts: return success
```

Expected result:
- Users will no longer get false “OTP sent” messages.
- Login OTP delivery failures will become visible and diagnosable.
- If SMS still does not arrive after this hardening, we can then fix the exact Nimbus template/account issue with clear evidence from the logs.
