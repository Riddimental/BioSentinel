'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { MapComponentProps } from '../types/api';
import { getInitialMapView, getCurrentLocation, getLocationZoom } from '../utils/mapUtils';

// Dynamic import for Leaflet to avoid SSR issues
let L: any = null;
if (typeof window !== 'undefined') {
  L = require('leaflet');
  
  // Fix for default markers in Next.js
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

export interface MapComponentRef {
  getMap: () => any;
  getBounds: () => any;
  addImageOverlay: (imageUrl: string, bounds: any) => void;
  removeImageOverlay: () => void;
}

const MapComponent = forwardRef<MapComponentRef, MapComponentProps>(({ 
  onBoundsChange, 
  className 
}, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const imageOverlay = useRef<L.ImageOverlay | null>(null);
  const geoJsonLayer = useRef<L.GeoJSON | null>(null);


  useImperativeHandle(ref, () => ({
      getMap: () => mapInstance.current,
      getBounds: () => mapInstance.current?.getBounds() || null,
      
      addImageOverlay: (imageUrl: string, bounds: L.LatLngBounds) => {
        if (!mapInstance.current) return;

        if (imageOverlay.current) {
          mapInstance.current.removeLayer(imageOverlay.current);
        }

        imageOverlay.current = L.imageOverlay(imageUrl, bounds, {
          opacity: 0.7,
          interactive: false,
          className: 'biodiversity-overlay'
        });

        imageOverlay.current.on('error', (e) => {
          console.error('Image overlay failed to load:', e);
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
      },

      /** NUEVO: Agregar GeoJSON */
      addGeoJSONLayer: (geojsonData: GeoJSON.GeoJsonObject) => {
        if (!mapInstance.current) return;

        // Limpiar geojson previo
        if (geoJsonLayer.current) {
          mapInstance.current.removeLayer(geoJsonLayer.current);
        }

        // Crear nuevo geojson layer
        geoJsonLayer.current = L.geoJSON(geojsonData, {
          style: {
            color: 'red',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3,
          },
          onEachFeature: (feature, layer) => {
            if (feature.properties?.name) {
              layer.bindPopup(feature.properties.name);
            }
          }
        }).addTo(mapInstance.current);

        // Zoom automático a los bounds del GeoJSON
        try {
          const bounds = geoJsonLayer.current.getBounds();
          if (bounds.isValid()) {
            mapInstance.current.fitBounds(bounds);
          }
        } catch (e) {
          console.warn('No bounds available for GeoJSON');
        }
      },

      /** NUEVO: limpiar capa geojson */
      removeGeoJSONLayer: () => {
        if (geoJsonLayer.current && mapInstance.current) {
          mapInstance.current.removeLayer(geoJsonLayer.current);
          geoJsonLayer.current = null;
        }
      }
    }));


  useEffect(() => {
    if (!mapContainer.current || mapInstance.current || !L) return;

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