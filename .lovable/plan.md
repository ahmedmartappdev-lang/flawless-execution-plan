

# Cash Return Tracking System

## Overview
When admin records a customer credit payment, they can assign it to a delivery agent. This updates the agent's "net to transfer" balance. The agent can then submit a "cash returned" request (similar to bills), and admin approves/rejects it, reducing the agent's net-to-transfer upon approval.

## New Database Table

**`cash_returns`** -- tracks cash that delivery partners return to admin:
- `id` (uuid, PK)
- `delivery_partner_id` (uuid, NOT NULL)
- `amount` (numeric, NOT NULL)
- `description` (text)
- `status` (text, default 'pending') -- pending / approved / rejected
- `admin_notes` (text)
- `reviewed_by` (uuid)
- `reviewed_at` (timestamptz)
- `created_at` (timestamptz, default now())

RLS: Delivery partners can INSERT and SELECT their own; admins can SELECT all and UPDATE.

**Modify `credit_cash_collections`** -- add `delivery_partner_id` column (it already has one, good). But the admin "Record Payment" flow in AdminCredits doesn't currently insert into `credit_cash_collections` or track which delivery agent collected it. We need to make the "Record Payment" dialog optionally assign a delivery partner.

## Changes

### 1. Migration
- Create `cash_returns` table with RLS policies.

### 2. `src/pages/admin/AdminCredits.tsx`
- In the "Record Payment" dialog, add an optional "Delivery Agent" dropdown (fetch all delivery partners).
- When a delivery partner is selected, also insert a record into `credit_cash_collections` with status='verified' (since admin is directly recording it), so it shows in the agent's cash management dashboard and affects their net-to-transfer calculation.

### 3. `src/pages/delivery/DeliveryCashManagement.tsx`
- Add a third tab: **"Cash Returned"**.
- Fetch `cash_returns` for this partner.
- Add a "Return Cash" button that opens a dialog (amount + description), inserts into `cash_returns`.
- Show list of cash return requests with status.
- Update the **Net to Transfer** calculation: `cashCollected - approvedBills - approvedCashReturns`.
- Also add verified cash collections to the calculation: `cashCollected - approvedBills + verifiedCollections - approvedCashReturns`.

### 4. `src/pages/admin/AdminBills.tsx`
- Add a **"Cash Returns"** tab using Tabs component.
- Fetch all `cash_returns` with delivery partner info.
- Show table with approve/reject buttons for pending entries.
- On approval, no balance changes needed (it's just tracking that cash was physically handed back).

### 5. `src/pages/delivery/DeliveryDashboard.tsx`
- Update net-to-transfer calculation to also subtract approved cash returns.

## Files to Modify
1. **Migration** -- create `cash_returns` table
2. `src/pages/admin/AdminCredits.tsx` -- add delivery agent selector to Record Payment
3. `src/pages/delivery/DeliveryCashManagement.tsx` -- add Cash Returned tab, update net calculation
4. `src/pages/admin/AdminBills.tsx` -- add Cash Returns tab with approve/reject
5. `src/pages/delivery/DeliveryDashboard.tsx` -- update net calculation

