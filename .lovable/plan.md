

## Plan: Split Auth — OTP for Customer & Delivery, Google Auth for Vendor & Admin

### Summary
Currently all roles use phone OTP login. This change will restrict OTP login to **Customer** and **Delivery Partner** only, while **Vendor** and **Admin** will use **Google OAuth** exclusively.

### Changes Required

#### 1. AuthPage.tsx (Desktop auth page)
- Keep the 4 role options in role selection
- When **Customer** or **Delivery Partner** is selected → proceed to phone-input → OTP flow (unchanged)
- When **Vendor** or **Admin** is selected → skip phone/OTP entirely, show a "Sign in with Google" button instead
- After Google sign-in succeeds, validate the user's email exists in the `vendors` or `admins` table respectively, then redirect to the correct dashboard
- Add a new auth step type `'google-auth'` to handle the Google sign-in UI

#### 2. MobileAuthSheet.tsx (Mobile auth drawer)
- Remove **Vendor** and **Admin** from the role options (keep only Customer & Delivery Partner, since those are the only OTP roles)
- Alternatively, add Vendor/Admin with Google auth — but since the mobile sheet is typically for customer-facing flows, removing them is cleaner

#### 3. useAuth.tsx hook
- Add a `signInWithGoogle()` method that calls `supabase.auth.signInWithOAuthProvider({ provider: 'google' })` with appropriate redirect URL
- The redirect URL should point back to the app with role context

#### 4. Google OAuth callback handling
- After Google OAuth redirect, the `onAuthStateChange` listener already picks up the session
- Add post-login role validation: check if the Google-authenticated email exists in `admins` or `vendors` table
- Redirect accordingly or show "access denied"

#### 5. Supabase Configuration
- Google OAuth provider must be enabled in the Supabase dashboard (Authentication → Providers → Google)
- The user will need to configure Google Cloud OAuth credentials

### Technical Details

**AuthPage.tsx changes:**
- Add `'google-auth'` to the `AuthStep` type
- In `handleRoleSelect`: if role is `vendor` or `admin`, set step to `'google-auth'` instead of `'phone-input'`
- New Google auth step UI: shows role badge, "Sign in with Google" button, and access requirement notice
- Google sign-in calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth?role=vendor' } })`
- On page load, check URL params for `role` and if user is authenticated, validate role access and redirect

**MobileAuthSheet.tsx changes:**
- Filter `roleOptions` to only show `customer` and `delivery_partner`

**useAuth.tsx changes:**
- Add `signInWithGoogle(role: SelectedRole)` method

**No database changes needed** — the existing `admins` and `vendors` tables already have `email` columns used for role verification.

