

## Redesign Order Success Screen to Match Provided Design

### Current state
The order success screen (lines 190-219) is a simple centered view showing just the order number with two buttons. We need to replace it with a rich, data-driven success page matching the provided HTML design.

### Data available at success time
Currently `orderSuccess` only stores `{ orderNumber: string }`. We need to expand this to capture a snapshot of the order data at placement time (items, address, payment method, total) since the cart is cleared after success.

### Changes to `src/pages/customer/CheckoutPage.tsx`

1. **Expand `orderSuccess` state** to store full order context:
   - `orderNumber`, `items` (snapshot of cart items), `selectedAddress`, `paymentMethod`, `total`, `subtotal`, `deliveryFee`, `platformFee`, `smallOrderFee`, `gst`, `creditUsed`

2. **Update `handlePlaceOrder`** to save all this data into state before cart clears.

3. **Replace the success screen** (lines 190-219) with the provided design:
   - **Animated green checkmark** circle with scale-in animation
   - **"Order Placed Successfully!"** heading + order number subtext
   - **Order Status tracker** — 4-step horizontal progress (Order Placed → Preparing → On the Way → Delivered) with first step active and green, "Arriving in 25-30 mins" label
   - **Order Summary card** — list snapshotted items with name, quantity, price
   - **Total Amount** row
   - **Delivery Address card** — address type badge + full address from snapshot
   - **Payment Method card** — shows selected method (Ahmad Credit / UPI / Cash) and amount
   - **"Back to Home" button** — navigates to `/`

4. **No new backend queries needed** — all data comes from the snapshot captured at order placement time.

### Files to change
- `src/pages/customer/CheckoutPage.tsx` — expand orderSuccess state type, update handlePlaceOrder, rewrite success view

