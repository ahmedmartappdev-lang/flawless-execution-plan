import { useState, useEffect, useCallback } from 'react';
import { useServiceAreas } from '@/hooks/useServiceAreas';

interface UserLocation {
  lat: number;
  lng: number;
  city: string;
  state: string;
  fullAddress: string;
}

const STORAGE_KEY = 'user-selected-location';

function getSavedLocation(): UserLocation | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(getSavedLocation);
  const [isLoading, setIsLoading] = useState(!getSavedLocation());
  const [isServiceable, setIsServiceable] = useState(true);
  const { isLocationServiceable, serviceAreas, isLoading: areasLoading } = useServiceAreas();

  // Check serviceability whenever location or areas change
  useEffect(() => {
    if (location && !areasLoading) {
      setIsServiceable(isLocationServiceable(location.lat, location.lng));
    }
  }, [location, serviceAreas, areasLoading, isLocationServiceable]);

  const saveLocation = useCallback((loc: UserLocation) => {
    setLocation(loc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  }, []);

  const reverseGeocode = useCallback((lat: number, lng: number): Promise<UserLocation> => {
    return new Promise((resolve) => {
      // Use a simple fallback if Google Maps isn't loaded
      if (!window.google?.maps) {
        resolve({ lat, lng, city: 'Unknown', state: '', fullAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
        return;
      }
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
        if (status === 'OK' && results[0]) {
          const components = results[0].address_components;
          const city = components.find((c: any) => c.types.includes('locality'))?.long_name || '';
          const state = components.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name || '';
          const country = components.find((c: any) => c.types.includes('country'))?.long_name || '';
          resolve({
            lat,
            lng,
            city: city || 'Unknown',
            state,
            fullAddress: [city, state, country].filter(Boolean).join(', '),
          });
        } else {
          resolve({ lat, lng, city: 'Unknown', state: '', fullAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
        }
      });
    });
  }, []);

  // Auto-detect on first load if no saved location
  useEffect(() => {
    if (getSavedLocation()) {
      setIsLoading(false);
      return;
    }
    if (!navigator.geolocation) {
      setIsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        saveLocation(loc);
        setIsLoading(false);
      },
      () => {
        setIsLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, [reverseGeocode, saveLocation]);

  const updateLocation = useCallback(async (lat: number, lng: number) => {
    const loc = await reverseGeocode(lat, lng);
    saveLocation(loc);
  }, [reverseGeocode, saveLocation]);

  return { location, isLoading, isServiceable, updateLocation };
}
