
# Fix: Selected Role-Based Routing (Non-Forced)

## The Problem

When you select "Admin" and log in via **Google OAuth**, you end up on the customer homepage (`/`) instead of the admin dashboard. This happens because:

1. You select Admin role on the login page
2. Google OAuth redirects you away from the app
3. When you come back, the app has forgotten which role you selected
4. You land on `/` (customer homepage) by default

**Email/password login works correctly** - it remembers your role selection.

---

## The Solution

We'll save your selected role temporarily before OAuth redirect, then read it when you return and send you to the correct dashboard.

---

## What Will Change

### 1. Save Selected Role Before Google Login

When you click "Continue with Google", we'll save your selected role (Admin/Vendor/Delivery/Customer) to browser storage before redirecting.

### 2. Create a Callback Page

A new page at `/auth/callback` that:
- Shows a loading spinner
- Reads which role you selected
- Checks if you're actually registered for that role
- Sends you to the right dashboard

### 3. Update Google Login Redirect

Google login will now redirect to `/auth/callback` instead of `/`

### 4. Add Dashboard Shortcut in Header

For users with special roles (Admin/Vendor/Delivery) browsing as customers:
- Show a "Dashboard" button in the header
- One-click access to your role dashboard

---

## How It Will Work

### Flow 1: Admin logs in via Google
```text
1. Select "Admin" on auth page
2. Click "Continue with Google"
3. Role "admin" saved to storage
4. Google authentication
5. Return to /auth/callback
6. App reads saved role
7. Confirms you're an admin
8. Redirected to /admin
```

### Flow 2: Admin wants to shop as customer
```text
1. Select "Customer" on auth page  
2. Log in (Google or email)
3. Role "customer" saved
4. Land on customer homepage (/)
5. Shop normally
6. If admin wants dashboard: click "Dashboard" in header
```

---

## Files to Change

| File | Change |
|------|--------|
| `src/pages/AuthPage.tsx` | Save selected role to localStorage before OAuth |
| `src/hooks/useAuth.tsx` | Update OAuth redirect to `/auth/callback` |
| `src/pages/AuthCallback.tsx` | **NEW** - Handle OAuth return and role-based redirect |
| `src/App.tsx` | Add `/auth/callback` route |
| `src/components/customer/Header.tsx` | Add "Dashboard" button for role users |

---

## Technical Details

### Role Storage
- Uses `localStorage` with key `selectedAuthRole`
- Cleared after successful redirect
- Falls back to customer role if not set

### Auth Callback Page Logic
```text
1. Wait for authentication to complete
2. Read stored role from localStorage
3. If role is admin/vendor/delivery:
   a. Validate user has that role in database
   b. If valid: redirect to role dashboard
   c. If not valid: show error, redirect to home
4. If role is customer: redirect to /
5. Clear stored role
```

### Dashboard Button in Header
- Only shows for authenticated users with admin/vendor/delivery roles
- Links to appropriate dashboard based on their highest role
- Allows quick switching from customer view to dashboard
