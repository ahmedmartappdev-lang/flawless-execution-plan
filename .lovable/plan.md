

# Fix Plan: OAuth 404 Error + Add Team Members

## Problem Summary

Two issues need to be fixed:

1. **OAuth 404 Error**: When you log in via Google on your Vercel deployment, it returns a 404 because Vercel doesn't handle SPA (Single Page Application) routing by default

2. **Missing Team Members**: The database needs delivery partners and vendor email records so they can log in

---

## Part 1: Fix the OAuth 404 Error on Vercel

### The Issue

When Google OAuth completes, it redirects to `https://flawless-execution-plan.vercel.app/auth/callback`. Vercel looks for a physical file at that path, doesn't find one, and returns 404.

### The Solution

Add a `vercel.json` file that tells Vercel to route all requests to `index.html` (standard SPA configuration).

**File to Create:** `vercel.json`

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This single configuration file tells Vercel:
- For ANY route, serve the `index.html` file
- Let React Router handle the actual routing

---

## Part 2: Add Team Members to Database

### Delivery Partners to Add

| Email | Name | Vehicle |
|-------|------|---------|
| singhrittika231@gmail.com | Rittika Singh | Bike |
| mtejash07@gmail.com | Tejash M | Bike |

### Vendor to Add

| Email | Name | Store Name |
|-------|------|------------|
| mishratejash505@gmail.com | Tejash Mishra | Tejash Store |

### Database Migration Required

```sql
-- Add delivery partners
INSERT INTO delivery_partners (email, full_name, phone, status, vehicle_type, user_id)
VALUES 
  ('singhrittika231@gmail.com', 'Rittika Singh', '9999999001', 'active', 'bike', gen_random_uuid()),
  ('mtejash07@gmail.com', 'Tejash M', '9999999002', 'active', 'bike', gen_random_uuid());

-- Add vendor
INSERT INTO vendors (email, business_name, owner_name, status)
VALUES 
  ('mishratejash505@gmail.com', 'Tejash Store', 'Tejash Mishra', 'active');

-- Fix existing vendor with no email
UPDATE vendors 
SET email = 'ahmedmart.appdev@gmail.com', owner_name = 'Ahmed'
WHERE id = '22222222-2222-2222-2222-222222222001';
```

---

## Part 3: Fix the Auto-Link on First Login

### How It Works (Already Implemented)

The `handle_new_user()` trigger in the database already handles auto-linking:

```sql
-- When a user signs up, automatically link their user_id to existing records
UPDATE public.admins SET user_id = NEW.id WHERE email = NEW.email AND user_id IS NULL;
UPDATE public.vendors SET user_id = NEW.id WHERE email = NEW.email AND user_id IS NULL;
UPDATE public.delivery_partners SET user_id = NEW.id WHERE email = NEW.email AND user_id IS NULL;
```

### The Issue

The `delivery_partners` table requires `user_id` to be NOT NULL, but we're inserting records before the user has signed up.

### The Fix

We need to modify the insert to use a placeholder UUID that will be replaced when the user first logs in, OR modify the table to allow NULL user_id temporarily.

**Best approach:** Create records with a placeholder, then the trigger will update on first login.

---

## Implementation Steps

### Step 1: Create vercel.json
Create the SPA routing configuration file in the project root.

### Step 2: Database Migration
Run SQL to:
- Make `user_id` nullable in `delivery_partners` if needed
- Insert delivery partners with email (user_id will be linked on first login)
- Insert vendor with email
- Fix existing vendor record

### Step 3: Test the Flow
1. Deploy the vercel.json change
2. Redeploy to Vercel
3. Test OAuth login for each role

---

## Expected Behavior After Fix

| Role | Email | Dashboard |
|------|-------|-----------|
| Admin | ahmedmart.appdev@gmail.com | /admin |
| Vendor | mishratejash505@gmail.com | /vendor |
| Vendor | ahmedmart.appdev@gmail.com | /vendor |
| Delivery | singhrittika231@gmail.com | /delivery |
| Delivery | mtejash07@gmail.com | /delivery |

When any of these users:
1. Select their role on the login page
2. Click "Continue with Google"
3. Complete Google authentication
4. They will be redirected to their correct dashboard

---

## Technical Summary

| Change | Purpose |
|--------|---------|
| Create `vercel.json` | Fix 404 on OAuth callback for Vercel deployment |
| Database migration | Add delivery partners and vendor email records |
| Update existing vendor | Add missing email to existing vendor |

