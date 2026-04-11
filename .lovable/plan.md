

# Vendor Payments & Admin Vendor Dues System

## What We're Building

1. **Remove vendor Analytics** -- delete route, nav item, and page file; replace with a **Payments** section
2. **Vendor Payments page** -- shows total due amount (sum of vendor's selling_price from delivered orders minus payments received) and a transaction history
3. **Admin Credits page** -- add a **"Vendor Dues"** tab showing all vendors with their due amounts, and a "Record Payment" button (amount + transaction ID) that reduces the due

## Database Changes

**New table: `vendor_payment_transactions`**
- `id` (uuid, PK, default gen_random_uuid())
- `vendor_id` (uuid, NOT NULL, references vendors)
- `amount` (numeric, NOT NULL)
- `transaction_id` (text) -- bank/UPI reference
- `description` (text)
- `transaction_type` (text, 'credit' or 'debit') -- credit = payment to vendor, debit = order revenue accrued
- `balance_after` (numeric, default 0) -- due remaining after this txn
- `created_by` (uuid)
- `created_at` (timestamptz, default now())

RLS: Admins can SELECT/INSERT all; vendors can SELECT their own (matched via `vendors.user_id = auth.uid()`).

**Add column to `vendors` table:**
- `amount_due` (numeric, default 0) -- running total of money owed to vendor

## File Changes

### 1. Migration
- Create `vendor_payment_transactions` table with RLS
- Add `amount_due` column to `vendors`

### 2. Remove Analytics, Add Payments route
- **`src/App.tsx`**: Replace `VendorAnalytics` import + route with `VendorPayments` at `/vendor/payments`
- **`src/components/layouts/DashboardLayout.tsx`**: Change vendor nav item from Analytics to Payments (icon: `Wallet`)
- **Delete** `src/pages/vendor/VendorAnalytics.tsx`

### 3. New file: `src/pages/vendor/VendorPayments.tsx`
- Fetch vendor profile to get `amount_due`
- Calculate total revenue from delivered orders (sum of `order_items.total_price` where order status = 'delivered' and order vendor_id matches)
- Fetch `vendor_payment_transactions` for this vendor, display as transaction list
- Show summary cards: Total Due, Total Earned, Total Paid
- Transaction list with date, amount, type, description, transaction ID

### 4. Update `src/pages/admin/AdminCredits.tsx`
- Add a third tab: **"Vendor Dues"**
- Fetch all vendors with `amount_due > 0` (or all vendors)
- Show table: Vendor Name, Phone, Amount Due, Actions (Record Payment)
- "Record Payment" dialog: amount input + transaction ID input
- On submit: decrease vendor's `amount_due`, insert into `vendor_payment_transactions`
- Stats row: add "Total Vendor Dues" card

### 5. Update `src/pages/vendor/VendorDashboard.tsx`
- Add a stats card showing `amount_due` from vendor profile (already fetched)

### 6. Vendor due calculation
- When orders are delivered, the vendor's `amount_due` should increase. We'll calculate it dynamically from delivered orders minus payments, rather than relying solely on triggers. The admin "Record Payment" will update the `amount_due` column directly.
- On the vendor payments page, we compute: `Total Due = sum(delivered order subtotals at vendor selling price) - sum(payments made)`

## Technical Details

- The `amount_due` on vendors table serves as a cached/running balance updated by admin when recording payments
- Initial `amount_due` can be seeded by summing all delivered orders' subtotals for each vendor (done in the payments page query as a fallback)
- Transaction history provides an audit trail of all payments made to vendors
- No changes to existing customer credit or delivery partner flows

