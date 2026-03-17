
Goal: show vendor/store name consistently above product rows in customer flows (Cart, Checkout, Order Details, Product Details sidebar), and fix missing-data paths so it actually appears.

1) Fix data source gaps (why name is missing)
- `src/pages/customer/HomePage.tsx`: stop passing raw `...product` to cart. Build explicit cart payload with `vendor_name: product.vendor?.business_name`.
- `src/pages/customer/CategoryPage.tsx`:
  - update product query to include vendor relation (`vendor:vendors(business_name)`),
  - pass `vendor_name` in `handleAddToCart`.
- `src/pages/customer/OrdersPage.tsx` (reorder path): when re-adding old items, pass `vendor_name` from `order.vendor?.business_name` (fallback to snapshot if present).
- `src/stores/cartStore.ts`: harden `addItem` normalization so if caller sends `vendor` object but not `vendor_name`, store derives it (`item.vendor_name ?? item.vendor?.business_name`).

2) Ensure vendor label is rendered in every requested UI
- `src/pages/customer/CartPage.tsx`: keep vendor line above unit row, but render with robust fallback (stored vendor_name, then resolved name map if needed).
- `src/pages/customer/CheckoutPage.tsx`:
  - keep vendor line in main order summary,
  - add vendor line to desktop right “Quick Summary” rows (currently missing),
  - add vendor line in order-success summary rows too.
- `src/pages/customer/OrdersPage.tsx` (order details modal): add “Sold by …” above each product row in the item list.
- `src/pages/customer/ProductDetailsPage.tsx`: add “Sold by [vendor business name]” in right-side product info block under title/brand.

3) Make order details reliably have vendor data
- `src/hooks/useOrders.tsx`: include vendor relation in order fetch (`vendor:vendors(business_name)`), so Orders modal can display store name without extra requests.
- (Future-proof) while creating order snapshots, include `vendor_name` in `product_snapshot` so historical order details still show vendor even if vendor record changes later.

4) Backward compatibility for existing cart items
- For persisted cart items already missing `vendor_name`, add a lightweight fallback lookup in Cart/Checkout (query vendor names by `vendor_id` and map in UI) so users see names immediately without clearing cart.

Technical details
- Display format everywhere: `Sold by <Business Name>` directly above quantity/unit row.
- Fallback chain for UI: `item.vendor_name || order.vendor?.business_name || item.product_snapshot?.vendor_name`.
- No schema migration required (order snapshot is JSONB); relation fetch change is in query only.

Validation (end-to-end)
- Add one item each from Home, Category, and Product Details.
- Verify vendor name appears in:
  1) Cart item row,
  2) Checkout main summary + desktop quick summary + success summary,
  3) Orders → View Details modal item rows,
  4) Product Details right info panel.
- Verify reorder flow also preserves/shows vendor names.
