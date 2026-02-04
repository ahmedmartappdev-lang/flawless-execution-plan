
# Implementation Plan: Phases 3, 4, and 5

Based on my review, Phases 1 and 2 are complete. Here's the detailed plan for the remaining phases.

---

## Phase 3: Admin Forms and Management

### 3.1 Category Form (Admin)
Create a dialog-based form for creating and editing categories.

**New file:** `src/components/admin/CategoryForm.tsx`
- Dialog component with form fields:
  - Name (required)
  - Slug (auto-generated from name, editable)
  - Description (optional)
  - Image URL (text input for now)
  - Display Order (number)
  - Active Status (switch/checkbox)
  - Parent Category (select dropdown for sub-categories)
- Form validation using react-hook-form + zod
- Create and update mutations

**Update:** `src/pages/admin/AdminCategories.tsx`
- Wire "Add Category" button to open CategoryForm dialog
- Wire "Edit" menu item to open CategoryForm with existing data
- Add state management for dialog open/close

---

### 3.2 Product Form (Admin/Vendor)
Create a comprehensive dialog form for products.

**New file:** `src/components/admin/ProductForm.tsx`
- Dialog with form fields:
  - Name, Slug (auto-generated)
  - Description, Brand
  - SKU (auto-generated if empty)
  - MRP, Selling Price (auto-calculate discount %)
  - Stock Quantity
  - Min/Max Order Quantity
  - Unit Type (select: kg, g, l, ml, piece, pack, dozen)
  - Unit Value
  - Category (select dropdown)
  - Primary Image URL
  - Status (select: active, inactive, out_of_stock, discontinued)
  - Featured/Trending toggles
- Auto-calculate discount percentage when MRP and selling price change
- Form validation

**Update:** `src/pages/admin/AdminProducts.tsx`
- Wire "Add Product" and "Edit" to ProductForm

**Update:** `src/pages/vendor/VendorProducts.tsx`
- Reuse ProductForm for vendors (auto-assign vendor_id)

---

### 3.3 Vendor Management Actions
Add functional approve/reject/suspend actions.

**Update:** `src/pages/admin/AdminVendors.tsx`
- Add mutations for:
  - Approve vendor (set status to 'active')
  - Reject vendor (set status to 'inactive')
  - Suspend vendor (set status to 'suspended')
- Wire dropdown menu items to these mutations
- Add confirmation dialog for destructive actions
- Optional: Add "View Details" dialog showing full vendor info

---

## Phase 4: Role-Based Route Protection

### 4.1 ProtectedRoute Component
Create a wrapper component that checks user roles before rendering protected content.

**New file:** `src/components/auth/ProtectedRoute.tsx`
- Props: `allowedRoles` (array of roles), `children`, optional `redirectTo`
- Uses `useUserRoles` hook to check current user's roles
- Shows loading spinner while checking roles
- Redirects to `/auth` if not logged in
- Redirects to `/` (or custom path) if logged in but unauthorized
- Renders children if authorized

**Update:** `src/App.tsx`
- Wrap admin routes with `<ProtectedRoute allowedRoles={['admin']}>`
- Wrap vendor routes with `<ProtectedRoute allowedRoles={['vendor']}>`
- Wrap delivery routes with `<ProtectedRoute allowedRoles={['delivery_partner']}>`
- Wrap customer-only routes (checkout, orders) with auth check

---

## Phase 5: Category Browsing

### 5.1 Category Page
Create a dedicated page for browsing products within a category.

**New file:** `src/pages/customer/CategoryPage.tsx`
- Route: `/category/:slug`
- Fetch category by slug
- Display category header (image, name, description)
- Breadcrumb navigation (Home > Category Name)
- Grid of products filtered by category
- Sort options (Price low-high, high-low, Name, Popularity)
- Filter options (In Stock, On Sale)
- Loading and empty states
- Reuse existing ProductCard component

**Update:** `src/App.tsx`
- Add route: `<Route path="/category/:slug" element={<CategoryPage />} />`

**Update:** `src/pages/customer/HomePage.tsx`
- Make category cards clickable, linking to `/category/:slug`

---

## File Changes Summary

| Action | File |
|--------|------|
| CREATE | `src/components/admin/CategoryForm.tsx` |
| CREATE | `src/components/admin/ProductForm.tsx` |
| CREATE | `src/components/auth/ProtectedRoute.tsx` |
| CREATE | `src/pages/customer/CategoryPage.tsx` |
| UPDATE | `src/pages/admin/AdminCategories.tsx` |
| UPDATE | `src/pages/admin/AdminProducts.tsx` |
| UPDATE | `src/pages/admin/AdminVendors.tsx` |
| UPDATE | `src/pages/vendor/VendorProducts.tsx` |
| UPDATE | `src/App.tsx` |
| UPDATE | `src/pages/customer/HomePage.tsx` |

---

## Implementation Order

1. **Phase 3.1** - Category Form (enables category management)
2. **Phase 3.2** - Product Form (enables product management)
3. **Phase 3.3** - Vendor Management (completes admin actions)
4. **Phase 4** - Route Protection (secures all dashboards)
5. **Phase 5** - Category Page (enhances customer browsing)

---

## Technical Notes

- All forms will use shadcn/ui Dialog, Form, Input, Select, Switch components
- Form validation with react-hook-form + zod
- Mutations use tanstack-query with optimistic updates where appropriate
- ProtectedRoute uses existing `useUserRoles` hook for role checking
- Category browsing reuses existing `useProducts` and `useCategories` hooks
