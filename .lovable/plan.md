

# Google Maps Integration Plan

## Overview
Integrate Google Maps API across the application so users can pick their exact location on a map when adding/editing addresses. The coordinates will be stored and used for delivery tracking, distance calculations, and navigation.

## What Changes

### 1. Store the API Key
Since the Google Maps JavaScript API key is a **publishable** client-side key, it will be stored as a `VITE_GOOGLE_MAPS_API_KEY` environment variable (added to `.env`). This is safe for browser use.

### 2. Create a Reusable Map Picker Component
A new `src/components/ui/map-picker.tsx` component that:
- Loads the Google Maps JavaScript API via a script tag
- Shows an interactive map with a draggable marker
- Includes a search box powered by Google Places Autocomplete for address lookup
- Has a "Use My Location" button for GPS-based positioning
- On marker placement or address search, reverse-geocodes to auto-fill address fields (address line, city, state, pincode)
- Returns latitude, longitude, and parsed address components to the parent

### 3. Update the Address Form (`AddressForm.tsx`)
- Embed the MapPicker component at the top of the form
- When user picks a location on the map, auto-populate address_line1, city, state, pincode fields
- Store latitude and longitude (currently hardcoded as `null`)
- Users can still manually edit the auto-filled fields

### 4. Update Admin Create Order Address Form
- Add the same MapPicker to the inline address creation form in `AdminCreateOrder.tsx`
- Auto-fill address fields and store coordinates when admin picks a location

### 5. Delivery Fee Calculation Based on Distance
- Update `getDeliveryFee()` in `cartStore.ts` to accept distance parameter
- Update `useOrders.tsx` to calculate distance between vendor and customer coordinates using the Haversine formula (no API call needed)
- Apply tiered delivery fee: free for orders over 199 rupees, otherwise based on distance

### 6. Show Location on Order Details
- In `OrderDetailsSidebar.tsx`, show a small static Google Map image of the delivery location using the stored coordinates
- In `DeliveryActive.tsx`, the navigation button already uses coordinates -- no change needed

## Technical Details

### MapPicker Component Structure
```text
+----------------------------------+
|  [Search address...]             |
|  [Use My Location]               |
+----------------------------------+
|                                  |
|        Google Map                |
|          (pin)                   |
|                                  |
+----------------------------------+
|  Selected: 28.6139, 77.2090     |
+----------------------------------+
```

### Files to Create
- `src/components/ui/map-picker.tsx` -- Reusable Google Maps picker with Autocomplete and reverse geocoding

### Files to Modify
- `.env` -- Add `VITE_GOOGLE_MAPS_API_KEY`
- `index.html` -- Load Google Maps JS API script with Places library
- `src/components/customer/AddressForm.tsx` -- Integrate MapPicker, pass lat/lng on submit
- `src/components/admin/AdminCreateOrder.tsx` -- Add MapPicker to address creation section
- `src/components/customer/OrderDetailsSidebar.tsx` -- Show static map preview of delivery location
- `src/stores/cartStore.ts` -- Optionally enhance delivery fee logic with distance

### Dependencies
No new npm packages needed. Google Maps JavaScript API is loaded via script tag.

### API Key Security
The Google Maps JavaScript API key is restricted by Google to specific domains/referrers. It is designed to be used in the browser and is safe to include in client-side code.

