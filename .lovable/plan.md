
# UI Polish and Banner Backend Integration

## Issues Identified

### 1. Muddy Yellow Hover on Buttons
The `accent` CSS variable is set to a yellow/gold color (`45 93% 47%`). The shadcn `ghost` and `outline` button variants use `hover:bg-accent hover:text-accent-foreground`, causing an ugly yellow/mud hover on all ghost buttons, dropdowns, sidebar nav items, etc. This needs to be changed to a neutral hover color.

### 2. Hero Banner Hardcoded
The main homepage hero banner uses a static `/banner.jpg` file. It needs to be connected to a backend `banners` table so admins can manage banner images from the dashboard.

### 3. Input Styling
Inputs across the app use `rounded-md` (the default). They should use a rectangular shape with slight corner rounding (`rounded-lg` / ~8px). Placeholder text should be removed or minimized.

### 4. Search Bar Placeholder
The search bar has placeholder text like "Search for 'Biryani' or 'Grocery'..." - this should be emptied or made minimal.

---

## Plan

### Step 1: Fix Accent/Hover Colors (index.css)
Change `--accent` from yellow to a neutral light gray for both light and dark modes so ghost/outline button hovers look clean:
- Light: `--accent: 210 20% 96%` (soft gray) and `--accent-foreground: 222 47% 11%` (dark text)
- Dark: `--accent: 217 33% 17%` and `--accent-foreground: 210 40% 98%`

This fixes the muddy hover across all shadcn buttons, dropdowns, sidebar links, and navigation menus.

### Step 2: Create `banners` Database Table
Create a migration for a `banners` table with columns:
- `id` (uuid, PK)
- `title` (text)
- `image_url` (text, required)
- `link_url` (text, optional)
- `display_order` (integer)
- `is_active` (boolean, default true)
- `created_at`, `updated_at`

Add RLS policies: public read for active banners, admin full access.

Create the `banner-images` storage bucket (public).

### Step 3: Create `useBanners` Hook
A simple hook to fetch active banners ordered by `display_order`.

### Step 4: Update HomePage Hero Section
Replace the static `<img src="/banner.jpg">` with a dynamic banner fetched from the `banners` table. If no banners exist, fall back to the current static image.

### Step 5: Create Admin Banners Management Page
Add a `/admin/banners` page where admins can:
- Add banners with image upload (using the existing `ImageUpload` component)
- Set display order, active/inactive toggle
- Edit and delete banners

Add "Banners" nav item to the admin sidebar in `DashboardLayout.tsx`.

### Step 6: Fix Input Styling Globally
Update `src/components/ui/input.tsx` to use `rounded-lg` instead of `rounded-md` and remove placeholder defaults.

Update `src/components/ui/textarea.tsx` similarly.

### Step 7: Remove/Minimize Placeholder Texts
- Header search bar: remove the placeholder text or set to empty
- Auth page inputs: already have placeholders - keep minimal ones like "Email" and "Password" but ensure they're subtle
- Profile page inputs: remove verbose placeholders

---

## Technical Details

### Database Migration SQL
```sql
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  image_url text NOT NULL,
  link_url text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active banners"
  ON public.banners FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage banners"
  ON public.banners FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('banner-images', 'banner-images', true);

CREATE POLICY "Public can view banner images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banner-images');

CREATE POLICY "Admins can upload banner images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'banner-images' AND
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete banner images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'banner-images' AND
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
```

### Files to Create
- `src/hooks/useBanners.tsx` - Banner CRUD hook
- `src/pages/admin/AdminBanners.tsx` - Admin banner management page

### Files to Edit
- `src/index.css` - Fix accent color variables
- `src/components/ui/input.tsx` - rounded-lg, no placeholder
- `src/components/ui/textarea.tsx` - rounded-lg
- `src/pages/customer/HomePage.tsx` - Dynamic banner from DB
- `src/components/customer/Header.tsx` - Remove verbose search placeholder
- `src/components/layouts/DashboardLayout.tsx` - Add Banners nav item
- `src/App.tsx` - Add /admin/banners route
- `src/pages/customer/ProfilePage.tsx` - Remove verbose placeholders
