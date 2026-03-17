

## Credit Card-Style Credit System

### Concept
Transform the credit system from a simple wallet into a **credit card model**:
- **Credit Limit**: The total amount admin allocates (e.g., ₹5000) — stored as a new `credit_limit` column on `profiles`
- **Due Amount**: When a customer uses credit to pay for orders, that becomes a due amount they owe back
- **Available Credit**: `credit_limit - due_amount` = what they can still spend
- The existing `credit_balance` field will track the **due amount** (how much the customer owes). When admin allocates credit, it sets the `credit_limit`. When customer uses credit for an order, `credit_balance` (due) increases. When customer pays back, `credit_balance` (due) decreases.

### Database Changes (Migration)

1. **Add `credit_limit` column to `profiles`**:
   ```sql
   ALTER TABLE profiles ADD COLUMN credit_limit numeric DEFAULT 0;
   ```
   This represents the total credit line given by admin. The existing `credit_balance` will be repurposed to track **due amount** (amount owed).

2. **Update `place_customer_order_with_credit` RPC**: Instead of checking `credit_balance >= credit_used`, check `credit_limit - credit_balance >= credit_used` (available = limit - due). After order, increase `credit_balance` (due) instead of decreasing it.

### Frontend Changes

#### 1. `src/pages/admin/AdminCredits.tsx`
- Add **3 new stats cards**: Total Credit Limits issued, Total Due Amount across all customers, Customers with Due
- Add **"Due Amount"** column in the customer table showing `credit_balance` (due) with red styling
- Change "Credit Balance" column header to "Credit Limit" showing `credit_limit`
- Add **"View Transactions"** button per customer row that opens a dialog showing that customer's full `customer_credit_transactions` history
- When admin allocates credit, update `credit_limit` instead of `credit_balance`
- Add a separate "Record Payment" action (debit type) that reduces the due amount

#### 2. `src/hooks/useCustomerCredits.ts`
- Fetch both `credit_limit` and `credit_balance` (due) from profiles
- Expose `creditLimit`, `dueAmount` (credit_balance), and `availableCredit` (limit - due)

#### 3. `src/pages/customer/OrdersPage.tsx` (Credit Summary Card)
- Show **Credit Limit**, **Used/Due**, and **Available** in the 3-column grid
- Progress bar shows due/limit ratio

#### 4. `src/pages/customer/CreditHistoryPage.tsx`
- Update balance card to show Credit Limit, Due Amount, and Available Credit

#### 5. `src/pages/customer/CheckoutPage.tsx`
- Credit payment option shows available credit (`credit_limit - credit_balance`) instead of raw balance
- Validation: ensure `creditUsed <= availableCredit`

#### 6. `src/hooks/useOrders.tsx` / RPC function
- Update the `place_customer_order_with_credit` function to:
  - Validate: `credit_limit - credit_balance >= p_credit_used`
  - After order: `credit_balance = credit_balance + p_credit_used` (increase due)
  - Transaction log: record as debit with new balance

### Files to Change
- **Migration**: Add `credit_limit` column, update `place_customer_order_with_credit` RPC
- `src/pages/admin/AdminCredits.tsx` — due column, view transactions dialog, stats
- `src/hooks/useCustomerCredits.ts` — expose limit/due/available
- `src/pages/customer/OrdersPage.tsx` — update credit card UI
- `src/pages/customer/CreditHistoryPage.tsx` — update balance display
- `src/pages/customer/CheckoutPage.tsx` — use available credit for validation

