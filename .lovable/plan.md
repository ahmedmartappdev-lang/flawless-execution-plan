
I confirmed the failure pattern: credit checkout attempts are still hitting a DB error (`invalid input value for enum payment_status: "paid"`), while cash orders continue to succeed. So we should fix this in a way that is both robust and wallet-safe (deduct only when order creation succeeds).

### Plan

1. **Move credit checkout to a single transactional Supabase RPC (migration)**
   - Create a new SQL function (e.g. `public.place_customer_order_with_credit`) that:
     - Uses `auth.uid()` as the customer identity (no client-provided customer_id trust).
     - Validates available `profiles.credit_balance` with `FOR UPDATE` row lock.
     - Creates order(s) + order_items.
     - Computes valid `payment_status` internally (`pending` or `completed` only; never `paid`).
     - Deducts used credit from `profiles.credit_balance`.
     - Inserts `customer_credit_transactions` debit ledger row.
     - Returns created order ids/order numbers.
   - This guarantees atomic behavior: no “order created but wallet not deducted” or vice versa.

2. **Refactor `src/hooks/useOrders.tsx` to call RPC instead of direct table inserts for checkout**
   - Replace current credit flow (`orders` insert + later profile update + later ledger insert) with one RPC call.
   - Remove client-side direct credit deduction writes after order creation (that logic moves to SQL transaction).
   - Keep vendor grouping payload, but send grouped data to RPC in one request.
   - Add strict client-side status constants to avoid any legacy `'paid'` path.

3. **Correct partial-credit behavior**
   - If credit fully covers an order: `payment_method='credit'`, `payment_status='completed'`.
   - If credit is partial: keep `payment_status='pending'` and mark remaining payment as cash-compatible behavior (aligning with existing UI message “remainder via cash”).
   - Ensure `credit_used` is stored per order accurately.

4. **Update cache invalidation after successful order**
   - In `useOrders` on success, invalidate:
     - `['orders', user.id]`
     - `['customer-credit-balance', user.id]`
     - `['customer-credit-history', user.id]`
   - This makes wallet deduction and transaction history reflect immediately.

5. **Improve error surfacing**
   - Keep detailed Supabase error logging (`message`, `details`, `hint`, `code`) in `useOrders`.
   - Show user-friendly toast from those fields to avoid generic “Failed to place order” masking real DB issues.

### Technical details

- **Files to change**
  - `supabase/migrations/<new>_customer_credit_checkout_rpc.sql` (new transactional function)
  - `src/hooks/useOrders.tsx` (switch to RPC + invalidate wallet queries)
  - (optional) `src/pages/customer/CheckoutPage.tsx` only if minor UI wording/summary needs alignment for partial-credit labeling.

- **Why this solves your issue**
  - The enum mismatch (`paid`) is eliminated by server-side status computation.
  - Wallet deduction becomes guaranteed and consistent with the placed order.
  - Credit orders and non-credit orders follow the same reliable checkout path.

- **Validation checklist after implementation**
  1. Full-credit order places successfully; wallet decreases by full order amount; status is completed.
  2. Partial-credit order places successfully; wallet decreases by used amount; remaining amount stays pending/cash-compatible.
  3. Cash and UPI still work unchanged.
  4. Credit history shows matching debit transaction with correct `balance_after`.
  5. Retry/concurrent clicks do not produce double-deduction.
