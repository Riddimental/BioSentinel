'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { MapComponentProps } from '../types/api';
import { getInitialMapView, getCurrentLocation, getLocationZoom } from '../utils/mapUtils';
import 'leaflet.heat';


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
  addImageOverlay: (imageUrl: string, bounds: any, obj_bounds: any) => void;
  removeImageOverlay: () => void;
  addGeoJSONLayer: (geojsonData: GeoJSON.GeoJsonObject) => void;
  removeGeoJSONLayer: () => void;
  generateImageOverlay: (geojsonData: GeoJSON.FeatureCollection, metric?: string) => void;
}


const MapComponent = forwardRef<MapComponentRef, MapComponentProps>(({ 
  onBoundsChange, 
  className 
}, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const imageOverlay = useRef<L.ImageOverlay | null>(null);
  const geoJsonLayer = useRef<L.GeoJSON | null>(null);
  const currentGeojsonData = useRef<GeoJSON.FeatureCollection | null>(null);
  const currentMetric = useRef<string>('');


  useImperativeHandle(ref, () => ({
      getMap: () => mapInstance.current,
      getBounds: () => mapInstance.current?.getBounds() || null,

      generateImageOverlay: async (
        geojsonData: GeoJSON.FeatureCollection, 
        metric: string
      ) => {
        if (!mapInstance.current) return;

        currentGeojsonData.current = geojsonData;
        if (metric === 'richness') {
          currentMetric.current = 'Rel_Species_Richness';
        }
        if (metric === 'biotaOverlap') {
          currentMetric.current = 'Biota_Overlap';
        }
        if (metric === 'occupancy') {
          currentMetric.current = 'Rel_Occupancy';
        }

        // Extraer puntos con valor numérico para el metric dado
        const points = geojsonData.features
          .map((f: any) => {
            const [lng, lat] = f.geometry.coordinates;
            const val = f.properties?.[currentMetric.current];
            return (lat != null && lng != null && typeof val === 'number') 
              ? { lat, lng, value: val } 
              : null;
          })
          .filter((p: any) => p !== null) as {lat: number, lng: number, value: number}[];

        if (points.length === 0) {
          console.warn(`No valid points found for metric '${currentMetric.current}'.`);
          return;
        }

        const latitudes = points.map(p => p.lat);
        const longitudes = points.map(p => p.lng);
        const bounds = L.latLngBounds(
          [Math.min(...latitudes), Math.min(...longitudes)],
          [Math.max(...latitudes), Math.max(...longitudes)]
        );

        const width = 256;
        const height = 256;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Generar la grilla interpolada con IDW
        const grid: number[][] = [];
        for (let y = 0; y < height; y++) {
          const row: number[] = [];
          for (let x = 0; x < width; x++) {
            const lat = bounds.getSouth() + (bounds.getNorth() - bounds.getSouth()) * (1 - y / height);
            const lng = bounds.getWest() + (bounds.getEast() - bounds.getWest()) * (x / width);

            let num = 0, den = 0;
            for (const p of points) {
              const d = Math.hypot(lat - p.lat, lng - p.lng) + 1e-6;
              const w = 1 / (d ** 2);
              num += p.value * w;
              den += w;
            }
            row.push(num / den);
          }
          grid.push(row);
        }

        // Normalizar valores
        const flat = grid.flat();
        const min = Math.min(...flat);
        const max = Math.max(...flat);

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const norm = (grid[y][x] - min) / (max - min + 1e-6);
            const r = Math.round(255 * norm);
            const b = Math.round(255 * (1 - norm));
            ctx.fillStyle = `rgb(${r},0,${b})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }

        const imageUrl = canvas.toDataURL();

        if (imageOverlay.current) {
          mapInstance.current.removeLayer(imageOverlay.current);
        }

        // Usar clase CSS genérica basada en el metric
        const className = `overlay-${currentMetric.current.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        imageOverlay.current = L.imageOverlay(imageUrl, bounds, {
          opacity: 0.7,
          interactive: true,
          className,
        });

        // Tooltip
        imageOverlay.current.on('mousemove', (e: any) => {
          const { lat, lng } = e.latlng;
          const value = getValueAtCoordinate(lat, lng, currentGeojsonData.current, currentMetric.current);
          if (value !== null) {
            const popup = L.popup()
              .setLatLng([lat, lng])
              .setContent(`${currentMetric.current}: ${value.toFixed(4)}`)
              .openOn(mapInstance.current!);
          }
        });

        imageOverlay.current.on('mouseout', () => {
          mapInstance.current?.closePopup();
        });

        imageOverlay.current.addTo(mapInstance.current);

      },

      addImageOverlay: (imageUrl: string, bounds = null, obj_bounds = null) => {
        if (!mapInstance.current) return;

        if (bounds === null){
          const southWest = L.latLng(obj_bounds.south, obj_bounds.west);
          const northEast = L.latLng(obj_bounds.north, obj_bounds.east);

          bounds = L.latLngBounds(southWest, northEast);
        }

        if (imageOverlay.current) {
          mapInstance.current.removeLayer(imageOverlay.current);
        }

        imageOverlay.current = L.imageOverlay(imageUrl, bounds, {
          opacity: 0.6,
          interactive: false,
          className: 'biodiversity-overlay'
        });

        imageOverlay.current?.on('error', (e) => {
          console.error('Image overlay failed to load:', e);
        });

        imageOverlay.current?.on('load', () => {
          console.log('Image overlay loaded successfully');
        });

        imageOverlay.current?.addTo(mapInstance.current);
      },

      removeImageOverlay: () => {
        if (imageOverlay.current && mapInstance.current) {
          mapInstance.current.removeLayer(imageOverlay.current);
          imageOverlay.current = null;
        }
      },

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
          onEachFeature: (
            feature: GeoJSON.Feature<GeoJSON.Geometry, { name?: string }>,
            layer: L.Layer
          ) => {
            if (feature.properties?.name) {
              layer.bindPopup(feature.properties.name);
            }
          }
        }).addTo(mapInstance.current);

        // Zoom automático a los bounds del GeoJSON
        try {
          const bounds = geoJsonLayer.current?.getBounds();
          if (bounds?.isValid()) {
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

  // Helper function to get value at specific coordinate
  const getValueAtCoordinate = (lat: number, lng: number, geojsonData: GeoJSON.FeatureCollection | null, metric: string): number | null => {
    if (!geojsonData) return null;
    
    // Find the closest point to the cursor position
    let closestDistance = Infinity;
    let closestValue = null;
    
    for (const feature of geojsonData.features) {
      const [fLng, fLat] = (feature.geometry as any).coordinates;
      const distance = Math.hypot(lat - fLat, lng - fLng);
      
      if (distance < closestDistance && distance < 0.01) { // Within ~1km threshold
        closestDistance = distance;
        closestValue = (feature.properties as any)?.[metric];
      }
    }
    
    return closestValue;
  };

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