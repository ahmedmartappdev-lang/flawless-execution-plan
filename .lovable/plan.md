

# Fix: "Failed to send OTP" — JSON parse error

## Root Cause

`useAuth.tsx` reads the Supabase URL from `import.meta.env.VITE_SUPABASE_URL`, but this env var may not resolve correctly at build time in the preview environment. Meanwhile, `src/integrations/supabase/client.ts` has the URL **hardcoded**. This mismatch means the fetch call in `sendOtp` could be hitting `undefined/functions/v1/send-otp`, returning an HTML error page or empty response that fails to parse as JSON.

## Fix

**`src/hooks/useAuth.tsx`** — Instead of reading env vars, derive the Supabase URL from the already-configured client or hardcode it consistently:

- Option A (cleanest): Import the Supabase URL from the client module or construct it from `VITE_SUPABASE_PROJECT_ID`
- Option B: Use `supabase.functions.invoke()` instead of raw `fetch`, which handles URL construction and CORS automatically

### Recommended approach: Use `supabase.functions.invoke()`

Replace the raw `fetch` calls in both `sendOtp` and `verifyOtp` with:

```typescript
const { data, error } = await supabase.functions.invoke('send-otp', {
  body: { phone },
});
```

This eliminates the URL/key construction entirely and uses the already-working Supabase client.

## Changes

1. **`src/hooks/useAuth.tsx`**:
   - Remove `SUPABASE_URL` and `SUPABASE_ANON_KEY` constants (lines 6-7)
   - Replace `fetch()` in `sendOtp` with `supabase.functions.invoke('send-otp', { body: { phone } })`
   - Replace `fetch()` in `verifyOtp` with `supabase.functions.invoke('verify-otp', { body: { phone, otp } })`
   - Handle the response format from `functions.invoke()` (returns `{ data, error }`)

No other files need changes.

