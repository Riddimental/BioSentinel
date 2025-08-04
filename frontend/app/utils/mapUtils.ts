// Dynamic import for Leaflet to avoid SSR issues
let L: any = null;
if (typeof window !== 'undefined') {
  L = require('leaflet');
}

/**
 * Convert Leaflet bounds to GeoJSON polygon
 */
export function boundsToGeoJSON(bounds: any): GeoJSON.Polygon {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  
  return {
    type: "Polygon",
    coordinates: [[
      [sw.lng, ne.lat], // NW (top-left)
      [ne.lng, ne.lat], // NE (top-right)  
      [ne.lng, sw.lat], // SE (bottom-right)
      [sw.lng, sw.lat], // SW (bottom-left)
      [sw.lng, ne.lat]  // Close polygon back to NW
    ]]
  };
}

/**
 * Calculate the area of a viewport in square kilometers
 */
export function calculateViewportArea(bounds: any): number {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  
  // Rough calculation using the haversine formula approximation
  const latDiff = ne.lat - sw.lat;
  const lngDiff = ne.lng - sw.lng;
  
  // Convert degrees to approximate kilometers
  const latKm = latDiff * 111; // 1 degree lat ≈ 111 km
  const lngKm = lngDiff * 111 * Math.cos((ne.lat + sw.lat) / 2 * Math.PI / 180); // Adjust for longitude
  
  return Math.abs(latKm * lngKm);
}

/**
 * Validate that bounds are reasonable for analysis
 */
export function validateBounds(bounds: any): { valid: boolean; reason?: string } {
  if (!bounds.isValid()) {
    return { valid: false, reason: 'Invalid bounds' };
  }
  
  const area = calculateViewportArea(bounds);
  
  // Check if area is too large (> 10000 km²)
  if (area > 10000) {
    return { valid: false, reason: 'Area too large for analysis (max 10,000 km²)' };
  }
  
  // Check if area is too small (< 1 km²)
  if (area < 1) {
    return { valid: false, reason: 'Area too small for analysis (min 1 km²)' };
  }
  
  return { valid: true };
}

/**
 * Format bounds information for display
 */
export function formatBoundsInfo(bounds: any): string {
  const area = calculateViewportArea(bounds);
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  
  return `Area: ${area.toFixed(1)} km² | Bounds: ${sw.lat.toFixed(3)}, ${sw.lng.toFixed(3)} to ${ne.lat.toFixed(3)}, ${ne.lng.toFixed(3)}`;
}

/**
 * Get a reasonable initial center and zoom for the map
 */
export function getInitialMapView(): { center: [number, number]; zoom: number } {
  // Default to a view of North America that shows good geographical diversity
  return {
    center: [39.8283, -98.5795], // Geographic center of continental US
    zoom: 4
  };
}

/**
 * Get user's current location using Geolocation API
 */
export function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // Cache location for 1 minute
      }
    );
  });
}

/**
 * Get optimal zoom level based on location type
 */
export function getLocationZoom(accuracy?: number): number {
  if (!accuracy) return 13; // Default city-level zoom
  
  // Adjust zoom based on GPS accuracy
  if (accuracy < 100) return 15;    // Very accurate - neighborhood level
  if (accuracy < 1000) return 13;   // Good accuracy - city level  
  if (accuracy < 5000) return 11;   // Moderate accuracy - metro area
  return 9; // Low accuracy - regional level
}

// Types for geocoding
export interface GeocodingResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string]; // [south, north, west, east]
  type: string;
  importance: number;
}

/**
 * Search for locations using Nominatim (OpenStreetMap) geocoding
 */
export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  if (!query.trim()) return [];
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      new URLSearchParams({
        q: query,
        format: 'json',
        limit: '5',
        addressdetails: '1',
        extratags: '1'
      })
    );
    
    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }
    
    const results: GeocodingResult[] = await response.json();
    return results;
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}

/**
 * Get appropriate zoom level for search result type
 */
export function getSearchResultZoom(type: string): number {
  switch (type) {
    case 'house':
    case 'building':
      return 18;
    case 'amenity':
    case 'shop':
      return 17;
    case 'suburb':
    case 'neighbourhood':
      return 15;
    case 'village':
    case 'town':
      return 13;
    case 'city':
      return 11;
    case 'county':
    case 'state':
      return 8;
    case 'country':
      return 6;
    default:
      return 13; // Default city-level zoom
  }
}

/**
 * Format display name for search results
 */
export function formatSearchResult(result: GeocodingResult): string {
  const parts = result.display_name.split(', ');
  // Show first 3 parts for brevity (e.g., "City, State, Country")
  return parts.slice(0, 3).join(', ');
}