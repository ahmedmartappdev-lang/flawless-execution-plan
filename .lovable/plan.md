

# Implementation Plan

## Overview
This plan addresses 6 items: banner ordering/swiping fix, vendor name visibility in admin and delivery dashboards, edited order reflection to customers with credit adjustment, time slots for products, and credit due cash collection tracking.

---

## 1. Fix Banner Display Order and Add Touch Swipe Support

**Problem**: Banners ignore `display_order` and don't support swipe gestures on mobile.

**Changes**:
- **HeroBannerSlider.tsx**: Add touch event handlers (`onTouchStart`, `onTouchMove`, `onTouchEnd`) for swipe detection. The current slider uses CSS `translateX` but has no touch handling.
- **useBanners.tsx**: The query already orders by `display_order ASC` -- the issue is likely that `currentSlide` resets or the slider doesn't render all banners. Will verify the slider renders all items correctly with `min-w-full` instead of `flex-shrink-0`.

---

## 2. Show Vendor Name in Admin Order Details and Delivery Dashboard

**Problem**: Vendor/store name is not visible alongside order items.

**Changes**:
- **AdminOrders.tsx** (line 74): Add `vendors:vendor_id(business_name)` to the select query. Display vendor name in the order details dialog and in the order items section.
- **AdminEditOrder.tsx**: Fetch vendor name alongside existing data; show it in the edit dialog header.
- **DeliveryActive.tsx** (line ~44): Add `vendors:vendor_id(business_name)` to the delivery orders query. Show "Store: {vendor name}" in the order card.

---

## 3. Reflect Edited Orders to Customers + Credit Balance Adjustment

**Problem**: When admin edits an order (changes items/amounts), the customer sees stale data, and if the order used credits, the credit balance is not adjusted.

**Changes**:
- **AdminEditOrder.tsx**: After updating order totals, check if the order used credits (`order.credit_used > 0`). Calculate the difference between old and new `total_amount`. If the total changed and credits were used, adjust the customer's `credit_balance` in `profiles` and insert a `customer_credit_transactions` record describing the adjustment. Also invalidate `orders` query key (not just `admin-orders`) so customer views refresh.
- Add realtime invalidation on orders table for customer order views (already exists via `useRealtimeInvalidation` in `useOrders.tsx`).

---

## 4. Time Slots Feature (Breakfast, Lunch, Dinner)

**Database changes** (migration):
- Create `time_slots` table: `id`, `name` (e.g. "Breakfast"), `start_time` (TIME), `end_time` (TIME), `is_active`, `display_order`, `created_at`, `updated_at`.
- Create `product_time_slots` junction table: `id`, `product_id` (UUID), `time_slot_id` (UUID), with unique constraint on `(product_id, time_slot_id)`.
- Add RLS: public can read active time slots; admins can manage both tables.

**Admin UI**:
- New page `AdminTimeSlots.tsx` for CRUD on time slots.
- Add route and nav item to admin nav.
- Update `ProductForm.tsx` to include a multi-select for time slots when creating/editing products.

**Customer UI**:
- **useProducts.tsx**: Fetch product time slots alongside products.
- **ProductCard.tsx**: Check if current time falls within any of the product's active time slots. If not, render the card greyed out and disable add-to-cart.
- **ProductDetailsPage.tsx**: Same check; disable purchase button with a message like "Available during Breakfast (8:00 AM - 11:00 AM)".
- **CartPage.tsx / CheckoutPage.tsx**: Validate at checkout that all cart items are within their time slots.

---

## 5. Track Credit Due Cash Collection by Delivery Partners

**Current flow**: Customers with credit can pay their due amount in cash to the delivery partner, but there's no mechanism to record this.

**Database changes** (migration):
- Create `credit_cash_collections` table: `id`, `customer_id` (UUID), `delivery_partner_id` (UUID), `amount` (NUMERIC), `collected_at` (TIMESTAMPTZ DEFAULT now()), `verified_by` (UUID, nullable), `verified_at` (TIMESTAMPTZ, nullable), `status` (TEXT DEFAULT 'pending' -- pending/verified/rejected), `order_id` (UUID, nullable), `notes` (TEXT, nullable).
- RLS: delivery partners can insert their own collections; admins can view/update all; customers can view their own.

**Delivery UI**:
- Add a "Collect Payment" button on the delivery active order page when order has `credit_used > 0`.
- Simple form: amount input (pre-filled with credit due), submit to `credit_cash_collections`.

**Admin UI**:
- New section in `AdminCredits.tsx` or a dedicated tab showing pending cash collections.
- Admin can verify/reject. On verification, reduce the customer's `credit_balance` (due amount) in `profiles` and log in `customer_credit_transactions`.

---

## Technical Details

**Files to create**:
- `src/pages/admin/AdminTimeSlots.tsx`
- `src/hooks/useTimeSlots.tsx`

**Files to modify**:
- `src/components/customer/home/HeroBannerSlider.tsx` (swipe + ordering fix)
- `src/pages/admin/AdminOrders.tsx` (vendor name in query + display)
- `src/components/admin/AdminEditOrder.tsx` (credit adjustment on edit, vendor name)
- `src/pages/delivery/DeliveryActive.tsx` (vendor name, collect payment button)
- `src/components/admin/ProductForm.tsx` (time slot multi-select)
- `src/components/customer/ProductCard.tsx` (time slot greyout)
- `src/pages/customer/ProductDetailsPage.tsx` (time slot check)
- `src/hooks/useProducts.tsx` (join time slots)
- `src/pages/admin/AdminCredits.tsx` (cash collection verification)
- `src/components/layouts/DashboardLayout.tsx` (add Time Slots nav item)
- `src/App.tsx` (add routes)

**Migrations needed**: 2 migrations (time_slots + product_time_slots tables; credit_cash_collections table).

