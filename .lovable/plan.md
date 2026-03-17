

## Prevent Out-of-Stock Products from Being Added to Cart

### Problem
Out-of-stock products can still be added to the cart through several paths:
1. **Cart page upsell section** — `handleUpsellAdd` doesn't check stock before adding
2. **Cart store `addItem`** — no stock validation at the store level
3. The visual "Out of Stock" overlays exist on ProductCard, CategoryPage, and ProductDetailsPage, but they rely on z-index overlays which could be bypassed, and there's no backend-level guard

### Solution

#### 1. `src/stores/cartStore.ts` — Guard `addItem`
Add a stock check at the top of `addItem`: if `item.stock_quantity` is defined and `<= 0`, show a toast error and return early without adding. This is the single source of truth that prevents any code path from adding out-of-stock items.

#### 2. `src/pages/customer/CartPage.tsx` — Guard upsell add
In `handleUpsellAdd`, check `product.stock_quantity <= 0 || product.status === 'out_of_stock'` before calling `addItem`. Show the upsell products that are out of stock with a blurred overlay and disabled button instead of the "+" add button.

#### 3. `src/components/customer/ProductCard.tsx` — Already handled
The ProductCard already shows a disabled "Out of Stock" button with a blur overlay. No changes needed.

#### 4. `src/pages/customer/CategoryPage.tsx` — Already handled  
Already shows overlay + "Unavailable" text. No changes needed.

#### 5. `src/pages/customer/ProductDetailsPage.tsx` — Already handled
Main add-to-cart button already disabled for out-of-stock. The inner `ProductCard` also handles it. No changes needed.

### Files to change
- `src/stores/cartStore.ts` — add stock guard in `addItem`
- `src/pages/customer/CartPage.tsx` — add stock check and blur overlay in upsell section

