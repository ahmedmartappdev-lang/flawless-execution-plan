

# Fix Plan: Order Editing, Vendor Names, and Search Issues

## Issues Identified

### Issue 3: Edited orders not reflecting to customers (items, not just price)
**Root cause**: The `order_items` table RLS policies block UPDATE and DELETE for all users, including admins using the client SDK. The admin edit flow calls `supabase.from('order_items').delete()` and `.update()` which silently fail due to missing RLS policies. Only the `orders` table total gets updated (hence only price reflects).

**Fix**: Add a database migration to create RLS policies allowing admins to UPDATE and DELETE order_items. Also update the `AdminEditOrder.tsx` save logic to also update the `product_snapshot` for new items (including `vendor_name`).

### Issue 4: Vendor names not visible in customer product sections
**Root cause**: The `ProductCard.tsx` component does receive `product.vendor` from the query (via `useProducts` which selects `vendor:vendors(business_name)`), but the card UI simply does not render the vendor name anywhere. The vendor name only shows on `ProductDetailsPage`.

**Fix**: Add a "Sold by {vendor_name}" line in `ProductCard.tsx` below the product name.

### Issue 5a: Updated products not reflecting in customer order details
**Root cause**: When admin adds a new product to an order via edit, the `product_snapshot` only stores `{ name, image_url }` but misses `vendor_name`, `unit_value`, `unit_type`. Also, the insert of new order_items lacks a `product_id` field. The customer order details view reads from `product_snapshot` for display.

**Fix**: Update `addProductToOrder` in `AdminEditOrder.tsx` to fetch and include full product details in the snapshot. Also include `product_id` in the insert.

### Issue 5b: Search button in edit order not working
**Root cause**: The search query filters by `vendor_id` (`eq('vendor_id', order.vendor_id)`), but the `order` object fetched in `AdminOrders.tsx` uses the relationship alias `vendor:vendors!orders_vendor_id_fkey(business_name)`, so `order.vendor_id` is the raw UUID column which should work. However, the search also uses `admin_selling_price` field — let me check: the search selects `selling_price` but should use `admin_selling_price`. Also the query requires `productSearch.length >= 2` — this might be too restrictive.

Actually, the real issue: the search query selects only `id, name, selling_price, mrp, primary_image_url` but doesn't include `admin_selling_price` or vendor info. Also need to show vendor name in search results.

**Fix**: Update the search query to include `admin_selling_price, vendor:vendors(business_name)` and show vendor name in results. Also reduce min search length to 1.

## Database Migration Required

Add UPDATE and DELETE policies on `order_items` for admins:

```sql
CREATE POLICY "Admins can update order items"
ON public.order_items FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete order items"
ON public.order_items FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));
```

## Files to Modify

1. **`src/components/customer/ProductCard.tsx`** — Add vendor name display below product name
2. **`src/components/admin/AdminEditOrder.tsx`** — Fix search query (include admin_selling_price, vendor name), fix addProductToOrder to include full snapshot with vendor_name, fix insert to include product_id, show vendor name in item list and search results
3. **Database migration** — Add UPDATE/DELETE RLS policies on `order_items` for admins

## Technical Summary
- 1 migration (RLS fix for order_items)
- 2 file edits (ProductCard.tsx, AdminEditOrder.tsx)
- No new files needed

