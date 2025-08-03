'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import L from 'leaflet';
import { MapComponentProps } from '../types/api';
import { getInitialMapView, getCurrentLocation, getLocationZoom } from '../utils/mapUtils';

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface MapComponentRef {
  getMap: () => L.Map | null;
  getBounds: () => L.LatLngBounds | null;
  addImageOverlay: (imageUrl: string, bounds: L.LatLngBounds) => void;
  removeImageOverlay: () => void;
}

const MapComponent = forwardRef<MapComponentRef, MapComponentProps>(({ 
  onBoundsChange, 
  className 
}, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const imageOverlay = useRef<L.ImageOverlay | null>(null);

  useImperativeHandle(ref, () => ({
    getMap: () => mapInstance.current,
    getBounds: () => mapInstance.current?.getBounds() || null,
    addImageOverlay: (imageUrl: string, bounds: L.LatLngBounds) => {
      if (!mapInstance.current) return;
      
      // Remove existing overlay
      if (imageOverlay.current) {
        mapInstance.current.removeLayer(imageOverlay.current);
      }
      
      // Add new overlay with proper error handling for SVG data URLs
      imageOverlay.current = L.imageOverlay(imageUrl, bounds, {
        opacity: 0.6,
        interactive: false,
        className: 'biodiversity-overlay'
      });
      
      // Error handling for overlay loading
      imageOverlay.current.on('error', (e) => {
        console.warn('Image overlay failed to load:', e);
      });
      
      imageOverlay.current.on('load', () => {
        console.log('Image overlay loaded successfully');
      });
      
      imageOverlay.current.addTo(mapInstance.current);
    },
    removeImageOverlay: () => {
      if (imageOverlay.current && mapInstance.current) {
        mapInstance.current.removeLayer(imageOverlay.current);
        imageOverlay.current = null;
      }
    }
  }));

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    // Initialize map with default view
    const { center, zoom } = getInitialMapView();
    const map = L.map(mapContainer.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Store map instance
    mapInstance.current = map;

    // Handle bounds change events
    const handleBoundsChange = () => {
      if (onBoundsChange && mapInstance.current) {
        onBoundsChange(mapInstance.current.getBounds());
      }
    };

    // Listen to map events
    map.on('moveend', handleBoundsChange);
    map.on('zoomend', handleBoundsChange);

    // Try to get user's location and center map there
    getCurrentLocation()
      .then((location) => {
        if (mapInstance.current) {
          console.log('User location found:', location);
          const zoomLevel = getLocationZoom();
          mapInstance.current.setView([location.lat, location.lng], zoomLevel);
          
          // Add a marker at user's location
          L.marker([location.lat, location.lng])
            .addTo(mapInstance.current)
            .bindPopup('Your location')
            .openPopup();
        }
      })
      .catch((error) => {
        console.log('Could not get user location:', error.message);
        console.log('Using default map center');
        // Map stays at default location - no problem!
      });

    // Initial bounds callback
    handleBoundsChange();

    // Cleanup function
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [onBoundsChange]);

  return (
    <div 
      ref={mapContainer} 
      className={`leaflet-container ${className || ''}`}
      style={{ height: '100%', width: '100%' }}
    />
  );
});

MapComponent.displayName = 'MapComponent';

export default MapComponent;