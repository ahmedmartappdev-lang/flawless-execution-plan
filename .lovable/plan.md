

## Plan: 5 Fixes

### 1. Vendor Store Photo Upload (DB + VendorSettings)

The `vendors` table already has a `store_photo_url` column. No migration needed.

**`src/pages/vendor/VendorSettings.tsx`**: Add an `ImageUpload` component in the Store Settings card for uploading the shop image. On save, update `store_photo_url` in the vendors table. Use the existing `product-images` bucket (or create a new `store-images` bucket — but reusing existing is simpler).

### 2. Featured Products — Reactive Add/Cart Button

**`src/pages/customer/HomePage.tsx`** (lines 232-240): The "Add" button is static — it doesn't reflect cart state (quantity, increment/decrement). Replace the simple `+ Add` button with proper cart-aware logic using `useCartStore.getItemQuantity(product.id)`. When quantity > 0, show a `−  qty  +` control instead of `+ Add`. Wire `incrementQuantity` / `decrementQuantity` from the cart store.

### 3. Search Suggestions — Show Admin Price

**`src/components/customer/Header.tsx`** (line 198): Change `₹{product.selling_price}` → `₹{product.admin_selling_price ?? product.selling_price}`.

### 4. Top Picks Vendor Click → Store Products Page

- **New page**: `src/pages/customer/StorePage.tsx` — Fetches products by `vendor_id`, displays vendor info header + product grid using `ProductCard`.
- **`src/App.tsx`**: Add route `/store/:vendorId`.
- **`src/pages/customer/HomePage.tsx`** (line 140): Wrap vendor circle with `onClick={() => navigate(`/store/${store.id}`)}`.

### 5. Place Order Button — Green Color

The `bg-primary` class already maps to green (`--primary: 152 69% 31%`). The button already uses `bg-primary`. Verify it renders green. If it appears differently, ensure no overriding styles. The checkout buttons at lines 763 and 880 already use `bg-primary` — these should be green. No change needed unless the primary color is wrong.

### Files to change
1. `src/pages/vendor/VendorSettings.tsx` — add store photo upload
2. `src/pages/customer/HomePage.tsx` — reactive cart button for featured products, vendor click navigation
3. `src/components/customer/Header.tsx` — admin price in search suggestions
4. `src/pages/customer/StorePage.tsx` — new page for vendor's products
5. `src/App.tsx` — add `/store/:vendorId` route

