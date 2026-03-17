

## Plan: Bill/Credit System + Order Amendment Feature

This is a large feature spanning database schema changes, new pages, and modifications to existing pages across admin and delivery dashboards.

### Understanding the Requirements

1. **Bill/Credit System**: Delivery partners collect cash from customers. Some orders involve vendors who don't provide credit to admin, so the delivery partner pays out-of-pocket (using cash collected from other orders). They upload a "bill" for reimbursement. When admin approves the bill, that amount is deducted from the delivery partner's "cash to transfer to admin."

2. **Delivery Partner Cash Management**: The delivery dashboard needs to track:
   - Orders delivered with payment mode (cash, UPI, etc.)
   - Total cash collected from customers
   - Bills submitted (vendor expenses)
   - Net amount to transfer to admin = Cash Collected - Approved Bills

3. **Admin Bill Interface**: Admin can view, approve, or reject bills submitted by delivery partners.

4. **Order Amendment**: Admin can edit orders (items, quantities, address, notes) that haven't been delivered yet.

---

### Database Changes

**New table: `delivery_bills`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| delivery_partner_id | uuid FK | Links to delivery_partners |
| order_id | uuid FK (nullable) | Related order |
| bill_image_url | text | Uploaded bill photo |
| amount | numeric | Bill amount |
| description | text | What the bill is for |
| status | enum (`pending`, `approved`, `rejected`) | Admin review status |
| admin_notes | text | Admin's reason for approval/rejection |
| reviewed_by | uuid (nullable) | Admin who reviewed |
| reviewed_at | timestamptz | When reviewed |
| created_at | timestamptz | |

**New enum: `bill_status`** — `pending`, `approved`, `rejected`

**RLS Policies for `delivery_bills`:**
- Delivery partners can INSERT their own bills
- Delivery partners can SELECT their own bills
- Admins can SELECT all bills
- Admins can UPDATE bills (approve/reject)

**New storage bucket: `bill-images`** (public)

---

### New Files

1. **`src/pages/admin/AdminBills.tsx`** — Admin bill review interface
   - Table listing all bills with filters (pending/approved/rejected)
   - View bill image, order details, delivery partner info
   - Approve/Reject with notes
   - Summary stats: total pending, total approved amount, etc.

2. **`src/pages/delivery/DeliveryCashManagement.tsx`** — Delivery partner cash tracking
   - Summary cards: Cash Collected, Bills Submitted, Net to Transfer
   - Table of delivered orders with payment mode and amount
   - "Submit Bill" button with form (upload image, enter amount, select order, description)
   - List of submitted bills with status

3. **`src/components/admin/AdminEditOrder.tsx`** — Order amendment dialog
   - Edit item quantities (add/remove items)
   - Edit delivery address
   - Edit customer notes
   - Recalculate totals
   - Only for orders not yet delivered

---

### Modified Files

4. **`src/components/layouts/DashboardLayout.tsx`**
   - Add "Bills" nav item to `adminNavItems` (with `Receipt` icon)
   - Add "Cash Management" nav item to `deliveryNavItems` (with `Wallet` icon)

5. **`src/App.tsx`**
   - Add route `/admin/bills` → `AdminBills`
   - Add route `/delivery/cash` → `DeliveryCashManagement`

6. **`src/pages/admin/AdminOrders.tsx`**
   - Add "Edit Order" option in the dropdown menu for non-delivered orders
   - Open `AdminEditOrder` dialog on click

---

### Technical Details

**Bill submission flow:**
1. Delivery partner navigates to Cash Management page
2. Clicks "Submit Bill" → opens dialog with image upload (using existing `ImageUpload` component with new `bill-images` bucket), amount input, optional order selection, description
3. Inserts row into `delivery_bills` with status `pending`

**Bill approval flow:**
1. Admin navigates to Bills page
2. Sees table of pending bills with delivery partner name, amount, order reference, image preview
3. Clicks approve/reject, optionally adds notes
4. Updates `delivery_bills` row with status, `reviewed_by`, `reviewed_at`, `admin_notes`

**Cash management calculation (client-side aggregation):**
- Cash Collected = SUM of `total_amount` from delivered orders where `payment_method = 'cash'` for this partner
- Approved Bills = SUM of `amount` from `delivery_bills` where `status = 'approved'` for this partner
- Net to Transfer = Cash Collected - Approved Bills

**Order amendment:**
- Admin can update `order_items` (quantity changes, remove items) and `orders` (address, notes, recalculated totals)
- Restricted to orders with status NOT in (`delivered`, `cancelled`, `refunded`)
- Will need new RLS policy on `order_items` for admin UPDATE and DELETE

**Additional RLS migration for order_items:**
- Admin can UPDATE order_items
- Admin can DELETE order_items

