

## Restore OTP Display for Customers

### Problem
The `delivery_otp` field exists on orders in the database, but it's not displayed anywhere in the customer UI. When an order is `out_for_delivery`, the customer needs to see their OTP to share with the delivery partner for verification.

### Changes

#### `src/pages/customer/OrdersPage.tsx`

1. **Active order card** (around line 172-177): Add an OTP display block when `order.status === 'out_for_delivery'` and `order.delivery_otp` exists. Show it as a prominent, styled section with large spaced-out digits (like a PIN display) with a label like "Share this OTP with delivery partner".

2. **Order details modal** (around line 360-416): Add an OTP section in the modal when the order has a `delivery_otp` and status is `out_for_delivery`. Display it between the status and items sections.

### Design
- OTP displayed as 4 large digits in individual boxes with a dashed border, centered
- Background: light primary/green tint
- Label: "Delivery OTP" with subtext "Share this code with your delivery partner"
- Only visible when status is `out_for_delivery`

### Files to change
- `src/pages/customer/OrdersPage.tsx`

