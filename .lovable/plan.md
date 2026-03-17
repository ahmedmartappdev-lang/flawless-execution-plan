

## Redesign Checkout Page to Match Provided Design

### What changes

Completely rewrite `src/pages/customer/CheckoutPage.tsx` to match the provided Ahmad Mart checkout design, with all data sourced from backend hooks.

### Data sources (all existing, no new tables needed)

| UI Element | Source |
|---|---|
| User name | `profiles` table via new query (fetch `full_name` by `user.id`) |
| Address | `useAddresses()` hook (already used) |
| Cart items + totals | `useCartStore()` (already used) |
| Credit balance | `useCustomerCredits()` (already used) |
| Delivery/platform fees | `useDeliveryFeeConfig()` (already used) |
| Order placement | `useOrders()` (already used) |

### New UI sections to implement

1. **Progress stepper** — 3 steps: Cart (done) → Checkout (active) → Order Placed. Visual only, derived from current page state.

2. **Delivery address card** — Shows user's `full_name` from profiles, address type badge, full address, "Standard Delivery - Arriving in 15-20 mins" label, Change button to toggle address list.

3. **Delivery instruction chips** — Quick-select toggles: "Ring the bell", "Leave at door", "Call me", "Guard room". Selected chips append to `customerNotes` state. Not hardcoded — stored in a local array, but the selection feeds into the order's `customer_notes` field.

4. **Order summary with "Edit Cart" link** — Lists items with image, name, quantity, price. "Edit Cart" navigates back to `/cart`.

5. **Bill total breakdown** — Item total, delivery fee, platform fee, small order fee, GST, total. All computed from existing hooks.

6. **Payment method section** — Ahmad Mart credit card (gradient card showing available credit with coverage message), UPI option, COD option. Credit card only shows when `creditBalance > 0`.

7. **Savings badge** — Green banner showing total savings (MRP vs selling price).

8. **Policy sections** — Cancellation policy and safety info (static text, acceptable as store policies).

9. **Mobile bottom bar** — Shows amount to pay (adjusted for credit if selected), payment method label, Place Order button.

10. **Bottom navigation** — Already exists via `BottomNavigation` component, but checkout currently doesn't use `CustomerLayout`. Will include it for mobile.

### Implementation steps

1. **Add a `useProfile` query** inside CheckoutPage to fetch `full_name` from `profiles` table for the current user.

2. **Rewrite CheckoutPage** with the new layout:
   - Green/primary themed header with progress stepper
   - Single-column mobile layout, two-column desktop
   - All sections described above
   - Delivery instruction chips as toggleable state that maps to `customerNotes`
   - Credit card gradient component showing balance and coverage status
   - Existing `AddressForm` dialog for add/edit

3. **No database changes needed** — all data already exists in the schema.

### Files to change
- `src/pages/customer/CheckoutPage.tsx` — Full rewrite

### Color/theme notes
- Primary green: uses existing CSS variables (`--primary`)
- Credit card gradient: `bg-gradient-to-br from-primary to-primary/80`
- Flipkart-orange place order button: `bg-[#fb641b]` (already used)
- Surface background: existing `bg-muted/40` or `bg-surface`

