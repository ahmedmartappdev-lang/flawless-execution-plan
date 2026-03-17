

## Redesign Cart Page to Match Ahmad Mart Design

### What changes

Rewrite `src/pages/customer/CartPage.tsx` to match the provided design with all data from backend.

### Data sources (all existing)

| UI Element | Source |
|---|---|
| Default address | `useAddresses()` hook |
| Cart items + vendor grouping | `useCartStore()` |
| Credit balance | `useCustomerCredits()` |
| Delivery/platform fees | `useDeliveryFeeConfig()` + `computeDeliveryFee()` |
| Upsell products | `useTrendingProducts()` |

### New UI sections

1. **Header** — "My Cart" with back button + "Clear All" button (calls `clearCart()`)
2. **Delivery address strip** — Shows default address from `useAddresses()`, "Change" button navigates to `/addresses`
3. **Estimated delivery chip** — Green pill: "Estimated Delivery: 30-45 mins"
4. **Cart items grouped by vendor** — Group `items` by `vendor_id`, show vendor header with `vendor_name`, each item as a card with image, name, unit, price, savings badge, and rounded quantity controls
5. **Ahmad Credit Card section** — Toggle to use credit, shows balance from `useCustomerCredits()`, green banner when enabled showing "Ahmad Credit Card applied"
6. **Bill Details** — Item total, discount (MRP savings), delivery fee, platform fee, "To Pay" with "Covered!" badge if credit covers it all. Uses `computeDeliveryFee()` from `useDeliveryFeeConfig`
7. **Savings banner** — Green banner showing total savings
8. **Upsell section** — "You might also need" horizontal scroll from `useTrendingProducts()`
9. **Fixed bottom bar** — Shows amount to pay (adjusted for credit), "Ahmad Credit Used" label when credit covers, Place Order button navigating to `/checkout`
10. **Bottom navigation** — Already handled by existing `BottomNavigation` component

### Key implementation details

- Group items by `vendor_id` using `Object.groupBy` or reduce
- Credit toggle state: when enabled, subtract `creditBalance` from `grandTotal` to get `toPay`
- Pass credit selection state to checkout via URL param or store
- Use `computeDeliveryFee(config, itemTotal)` instead of hardcoded `getDeliveryFee()`
- Empty cart state preserved with current design

### Files to change
- `src/pages/customer/CartPage.tsx` — Full rewrite

