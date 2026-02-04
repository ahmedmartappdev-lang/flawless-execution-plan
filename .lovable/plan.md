

# Role-Based Pre-Registration System

This plan implements a comprehensive role-based authentication system where user roles are determined by their presence in role-specific tables (`admins`, `vendors`, `delivery_partners`) rather than the `user_roles` table. Customers are users who exist in none of these tables.

---

## Overview

**Current System:**
- Roles stored in `user_roles` table
- `has_role()` and `is_admin()` functions query `user_roles`
- Everyone gets 'customer' role on signup

**New System:**
- Roles determined by presence in `admins`, `vendors`, `delivery_partners` tables
- Admin pre-adds email → user signs up → auto-linked to role table
- Customers = authenticated users not in any role table
- No dependency on `user_roles` for role checking

---

## Part 1: Database Schema Changes

### 1.1 Create Admins Table

```text
Table: admins
+---------------------------+-------------------+--------------------------------------+
| Column                    | Type              | Purpose                              |
+---------------------------+-------------------+--------------------------------------+
| id                        | UUID (PK)         | Primary key                          |
| user_id                   | UUID (nullable)   | Links to auth.users (null = pending) |
| email                     | VARCHAR (unique)  | Pre-registration lookup key          |
| full_name                 | VARCHAR           | Admin's name                         |
| phone                     | VARCHAR(15)       | Contact number                       |
| department                | VARCHAR           | e.g., Operations, Support            |
| designation               | VARCHAR           | Job title                            |
| is_super_admin            | BOOLEAN           | Super admin privileges               |
| status                    | user_status       | active/inactive/suspended            |
| created_at                | TIMESTAMPTZ       | Record creation time                 |
| updated_at                | TIMESTAMPTZ       | Last update time                     |
+---------------------------+-------------------+--------------------------------------+
```

### 1.2 Enhance Delivery Partners Table

Add personal, contact, and document fields:

```text
New Columns for delivery_partners:
+---------------------------+-------------------+--------------------------------------+
| Column                    | Type              | Purpose                              |
+---------------------------+-------------------+--------------------------------------+
| email                     | VARCHAR (unique)  | Pre-registration lookup key          |
| full_name                 | VARCHAR           | Partner's name                       |
| phone                     | VARCHAR(15)       | Primary contact number               |
| alternate_phone           | VARCHAR(15)       | Emergency/alternate contact          |
| address_line1             | VARCHAR           | Residential address                  |
| address_line2             | VARCHAR           | Address line 2                       |
| city                      | VARCHAR           | City                                 |
| state                     | VARCHAR           | State                                |
| pincode                   | VARCHAR(10)       | Postal code                          |
| date_of_birth             | DATE              | DOB for age verification             |
| aadhar_number             | VARCHAR(12)       | Aadhaar ID                           |
| pan_number                | VARCHAR(10)       | PAN card number                      |
| bank_account_number       | VARCHAR           | For payment disbursement             |
| ifsc_code                 | VARCHAR(11)       | Bank IFSC code                       |
| emergency_contact_name    | VARCHAR           | Emergency contact person             |
| emergency_contact_phone   | VARCHAR(15)       | Emergency contact number             |
| profile_image_url         | TEXT              | Profile photo                        |
| aadhar_front_url          | TEXT              | Aadhaar front image                  |
| aadhar_back_url           | TEXT              | Aadhaar back image                   |
| license_front_url         | TEXT              | License front image                  |
| license_back_url          | TEXT              | License back image                   |
+---------------------------+-------------------+--------------------------------------+
```

### 1.3 Enhance Vendors Table

Add owner, contact, and document fields:

```text
New Columns for vendors:
+---------------------------+-------------------+--------------------------------------+
| Column                    | Type              | Purpose                              |
+---------------------------+-------------------+--------------------------------------+
| email                     | VARCHAR (unique)  | Pre-registration lookup key          |
| owner_name                | VARCHAR           | Store owner's full name              |
| phone                     | VARCHAR(15)       | Primary contact number               |
| alternate_phone           | VARCHAR(15)       | Alternate contact                    |
| address_line1             | VARCHAR           | Business address line 1              |
| address_line2             | VARCHAR           | Business address line 2              |
| city                      | VARCHAR           | City                                 |
| state                     | VARCHAR           | State                                |
| pincode                   | VARCHAR(10)       | Postal code                          |
| owner_aadhar_number       | VARCHAR(12)       | Owner's Aadhaar                      |
| owner_photo_url           | TEXT              | Owner's photo                        |
| store_photo_url           | TEXT              | Store front photo                    |
| fssai_number              | VARCHAR           | Food license number                  |
| fssai_certificate_url     | TEXT              | FSSAI certificate image              |
+---------------------------+-------------------+--------------------------------------+
```

### 1.4 Modify user_id Constraints

Make `user_id` nullable in `vendors` and `delivery_partners` tables to allow pre-registration before user signup.

---

## Part 2: Database Functions

### 2.1 Replace Role-Checking Functions

Update `has_role()` and `is_admin()` to check role tables instead of `user_roles`:

```text
is_admin(user_id) → Check if user_id exists in admins table with active status
is_vendor(user_id) → Check if user_id exists in vendors table  
is_delivery_partner(user_id) → Check if user_id exists in delivery_partners table
```

### 2.2 Create Auto-Link Trigger Function

When a user signs up, check if their email exists in any role table and link them:

```text
Function: link_user_on_signup()
Trigger: AFTER INSERT on auth.users

Logic:
1. Get user's email from NEW.email
2. Check admins table → if found with matching email & user_id IS NULL:
   - Update admins.user_id = NEW.id
3. Check vendors table → if found with matching email & user_id IS NULL:
   - Update vendors.user_id = NEW.id  
4. Check delivery_partners table → if found with matching email & user_id IS NULL:
   - Update delivery_partners.user_id = NEW.id
5. Always create profile record for the user
```

### 2.3 Update handle_new_user Function

Remove the automatic `user_roles` insertion. Only create profile.

---

## Part 3: RLS Policy Updates

### 3.1 Update Existing Policies

Replace all `is_admin(auth.uid())` calls with the new function that checks the `admins` table.

### 3.2 New Policies for Admins Table

```text
- SELECT: User can view own record OR is_admin
- INSERT: Only existing admins can insert
- UPDATE: Only admins can update  
- DELETE: Only super_admins can delete
```

### 3.3 Update Vendors & Delivery Partners Policies

```text
- Allow INSERT by admins (for pre-registration)
- Allow INSERT with NULL user_id (pre-registration scenario)
```

---

## Part 4: Frontend Changes

### 4.1 Update useUserRoles Hook

Replace `user_roles` table queries with role table checks:

```text
File: src/hooks/useUserRoles.tsx

New Logic:
- Query admins table for user_id match → isAdmin
- Query vendors table for user_id match → isVendor  
- Query delivery_partners table for user_id match → isDeliveryPartner
- If none match → isCustomer (default for authenticated users)
```

### 4.2 Create Role Validation Hook

```text
File: src/hooks/useRoleValidation.tsx

Purpose: Validate if email is pre-registered for a role before allowing login

Exports:
- validateRoleAccess(email, selectedRole): Promise<{isValid, error}>

Logic:
- 'customer' → Always valid
- 'admin' → Check admins table by email
- 'vendor' → Check vendors table by email
- 'delivery_partner' → Check delivery_partners table by email
```

### 4.3 Redesign Auth Page

```text
File: src/pages/AuthPage.tsx

Changes:
1. Add role selection step (first screen)
   - Customer (default, no restrictions)
   - Delivery Partner (requires pre-registration)
   - Vendor (requires pre-registration)
   - Admin (requires pre-registration)

2. After role selection → show login/signup form

3. On form submit:
   - For 'customer': Normal auth flow
   - For other roles: Validate email exists in role table first
     - If not found: Show "Not registered as [Role]. Contact admin."
     - If found: Proceed with auth, auto-link happens via trigger

4. Post-login redirect:
   - Admin → /admin
   - Vendor → /vendor
   - Delivery Partner → /delivery
   - Customer → /
```

### 4.4 Update ProtectedRoute Component

```text
File: src/components/auth/ProtectedRoute.tsx

Changes:
- Use updated useUserRoles hook (which now queries role tables)
- No changes to component logic, just uses new hook data
```

---

## Part 5: Admin Panel Updates

### 5.1 Create Admin Team Management Page

```text
File: src/pages/admin/AdminTeam.tsx
Route: /admin/team

Features:
- List all admins with status
- "Add Admin" button → form dialog
- Form fields: Email, Full Name, Phone, Department, Designation
- Activate/Deactivate actions
- Shows "Pending" badge if user_id is null (not yet signed up)
```

### 5.2 Update Admin Delivery Page

```text
File: src/pages/admin/AdminDelivery.tsx

Add Features:
- "Add Delivery Partner" button → form dialog
- Pre-registration form with all new fields:
  - Email (required), Full Name, Phone
  - Address fields, Vehicle info
  - Document numbers (Aadhaar, PAN, License)
- Display all new columns in table
- Shows "Pending Signup" badge if user_id is null
```

### 5.3 Update Admin Vendors Page

```text
File: src/pages/admin/AdminVendors.tsx

Add Features:
- Wire "Add Vendor" button → form dialog
- Pre-registration form with all new fields:
  - Email (required), Business Name, Owner Name
  - Phone, Address fields
  - Document numbers (GST, PAN, FSSAI)
- Display new columns in table
- Shows "Pending Signup" badge if user_id is null
```

### 5.4 Update App Routes

```text
File: src/App.tsx

Add Route:
- /admin/team → AdminTeam (protected for admin)
```

---

## Part 6: Updated Auth Flow Diagram

```text
User visits /auth
       │
       ▼
┌──────────────────┐
│  Select Role     │
│  ○ Customer      │
│  ○ Delivery      │
│  ○ Vendor        │
│  ○ Admin         │
└──────────────────┘
       │
       ▼
Is Customer? ──Yes──► Standard login/signup ──► Home (/)
       │
       No
       │
       ▼
┌──────────────────┐
│ Enter email      │
│ + password       │
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ Check role table │
│ for this email   │
└──────────────────┘
       │
 Email found? ──No──► "Not registered. Contact admin."
       │
      Yes
       │
       ▼
Supabase Auth (login or signup)
       │
       ▼
Trigger: link_user_on_signup()
(Sets user_id in role table)
       │
       ▼
Redirect to role dashboard
  • Admin → /admin
  • Vendor → /vendor
  • Delivery → /delivery
```

---

## File Changes Summary

| Action   | File                                      | Purpose                              |
|----------|-------------------------------------------|--------------------------------------|
| CREATE   | `src/hooks/useRoleValidation.tsx`         | Email-based role validation          |
| CREATE   | `src/pages/admin/AdminTeam.tsx`           | Admin user management                |
| UPDATE   | `src/hooks/useUserRoles.tsx`              | Query role tables instead of user_roles |
| UPDATE   | `src/pages/AuthPage.tsx`                  | Role selection + validation flow     |
| UPDATE   | `src/pages/admin/AdminDelivery.tsx`       | Pre-registration form + new columns  |
| UPDATE   | `src/pages/admin/AdminVendors.tsx`        | Pre-registration form + new columns  |
| UPDATE   | `src/components/auth/ProtectedRoute.tsx`  | Uses updated useUserRoles            |
| UPDATE   | `src/App.tsx`                             | Add /admin/team route                |
| DATABASE | New migration                             | Schema + functions + policies        |

---

## Implementation Order

1. **Database Migration** - Add columns, create admins table, update functions
2. **useUserRoles Hook** - Update to query role tables
3. **useRoleValidation Hook** - Create new validation hook
4. **AuthPage** - Add role selection and validation flow
5. **AdminTeam Page** - Create admin management page
6. **AdminDelivery Update** - Add pre-registration form
7. **AdminVendors Update** - Add pre-registration form
8. **App Routes** - Add new admin/team route

---

## Security Notes

- Email columns in role tables are unique to prevent duplicate registrations
- Pre-registration entries have `user_id = NULL` until user signs up
- The auto-link trigger only sets `user_id` once (if NULL)
- RLS policies ensure only admins can create pre-registration entries
- Document fields (Aadhaar, PAN) should be stored securely
- No more dependency on `user_roles` table for role checking

