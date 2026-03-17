

## Show Admin Price Only Across Customer Website

### Problem
Several places show the vendor's `selling_price` instead of the admin-set `admin_selling_price`:

1. **HomePage (line 216)**: `₹{product.selling_price}` — directly uses vendor price
2. **ProductCard (line 18)**: Falls back chain `defaultVariant?.selling_price ?? product.admin_selling_price ?? product.selling_price` — variant prices are vendor prices
3. **ProductDetailsPage (lines 52, 146, 231)**: Same fallback pattern showing variant `selling_price` (vendor price)
4. **CategoryPage (line 271)**: Uses `product.admin_selling_price ?? product.selling_price` — correct for non-variant, but variants not handled
5. **CartPage (line 54)**: Uses `product.admin_selling_price ?? product.selling_price` — correct

### Fix: Use `admin_selling_price` everywhere

Since products without `admin_selling_price` are already filtered out from customer queries (`.not('admin_selling_price', 'is', null)`), we can safely use `admin_selling_price` as the primary price.

#### Files to change:

1. **`src/pages/customer/HomePage.tsx` (line 216)**
   - Change `₹{product.selling_price}` → `₹{product.admin_selling_price ?? product.selling_price}`

2. **`src/components/customer/ProductCard.tsx` (line 18)**
   - Change display price to prioritize admin price: `product.admin_selling_price ?? product.selling_price` (ignore variant's `selling_price` since those are vendor prices)

3. **`src/pages/customer/ProductDetailsPage.tsx`**
   - Line 39 (handleAddToCart): Change `variant?.selling_price ?? p.admin_selling_price ?? p.selling_price` → `p.admin_selling_price ?? p.selling_price`
   - Line 52 (ProductCard helper): Same fix
   - Line 146 (activePrice): Change to `product.admin_selling_price ?? product.selling_price`
   - Lines 231, 254: Variant unit selector and no-variant block — use `product.admin_selling_price ?? product.selling_price` instead of variant selling_price

4. **`src/pages/customer/CategoryPage.tsx` (line 118)**
   - Already correct for non-variant products, no change needed

Note: Variant-level admin pricing is not yet supported in the schema — variants only have vendor `selling_price`. Until admin can set per-variant prices, the product-level `admin_selling_price` should be used as the single display price.

