'use client';

import { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import { boundsToGeoJSON, formatBoundsInfo, validateBounds } from './utils/mapUtils';
import { MapComponentRef } from './components/MapComponent';
import MapSearch from './components/MapSearch';

// Dynamically import MapComponent to avoid SSR issues
const MapComponent = dynamic(() => import('./components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <div className="text-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p>Loading map...</p>
      </div>
    </div>
  )
});

export default function Home() {
  const [selectedModel, setSelectedModel] = useState('gpt-biodiversity');
  const [isLoading, setIsLoading] = useState(false);
  const [currentBounds, setCurrentBounds] = useState<L.LatLngBounds | null>(null);
  const [boundsInfo, setBoundsInfo] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  
  const mapRef = useRef<MapComponentRef>(null);

  const handleBoundsChange = useCallback((bounds: L.LatLngBounds) => {
    setCurrentBounds(bounds);
    setBoundsInfo(formatBoundsInfo(bounds));
    
    // Validate bounds
    const validation = validateBounds(bounds);
    setValidationError(validation.valid ? '' : validation.reason || '');
  }, []);

  const handleLocationSelect = useCallback((lat: number, lng: number, zoom: number, name: string) => {
    const map = mapRef.current?.getMap();
    if (map) {
      map.setView([lat, lng], zoom);
      console.log(`Selected location: ${name} at ${lat}, ${lng} with zoom ${zoom}`);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!currentBounds) return;
    
    const validation = validateBounds(currentBounds);
    if (!validation.valid) {
      alert(`Cannot analyze: ${validation.reason}`);
      return;
    }

    setIsLoading(true);
    
    try {
      // Convert bounds to GeoJSON
      const geojson = boundsToGeoJSON(currentBounds);
      
      // Log for testing
      console.log('Current bounds:', currentBounds);
      console.log('GeoJSON conversion:', geojson);
      console.log('Bounds info:', boundsInfo);
      
      // TODO: Call API with geojson
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Analysis complete! Check console for GeoJSON output.');
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentBounds, boundsInfo]);

  return (
    <div className="h-screen flex">
      {/* Map Area - 75% width */}
      <div className="flex-1 relative">
        <MapComponent 
          ref={mapRef}
          onBoundsChange={handleBoundsChange}
          className="w-full h-full"
        />
      </div>

      {/* Control Panel - 25% width */}
      <div className="w-1/4 bg-white border-l border-gray-200 p-6 flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">BioSentinel</h1>
          <p className="text-sm text-gray-600">AI-powered biodiversity analysis</p>
        </div>

        {/* Location Search */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Location
          </label>
          <MapSearch 
            onLocationSelect={handleLocationSelect}
            className="w-full"
          />
        </div>

        {/* Model Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Classification Model
          </label>
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="gpt-biodiversity">GPT Biodiversity Model</option>
            <option value="sentinel-classifier">Sentinel Classifier</option>
            <option value="eco-zones">Eco-zones Detector</option>
          </select>
          
          <div className="mt-2 p-3 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-600">
              {selectedModel === 'gpt-biodiversity' && 'Advanced AI model for identifying core and transition biodiversity zones using satellite imagery.'}
              {selectedModel === 'sentinel-classifier' && 'Specialized model trained on Sentinel satellite data for vegetation and land use classification.'}
              {selectedModel === 'eco-zones' && 'Ecological zone detection model focusing on habitat boundaries and transitions.'}
            </p>
          </div>
        </div>

        {/* Analyze Button */}
        <button
          disabled={isLoading || !currentBounds || !!validationError}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-md transition-colors"
          onClick={handleAnalyze}
        >
          {isLoading ? 'Analyzing...' : 'Analyze Current View'}
        </button>

        {/* Validation Error */}
        {validationError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs text-red-600">{validationError}</p>
          </div>
        )}

        {/* Bounds Info */}
        {boundsInfo && (
          <div className="mt-3 p-2 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-600 font-mono">{boundsInfo}</p>
          </div>
        )}

        {/* Status/Info */}
        <div className="mt-6 text-xs text-gray-500">
          <p>Navigate the map to your area of interest, then click analyze to classify the visible region.</p>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="text-xs text-gray-400 text-center">
          BioSentinel MVP v1.0
        </div>
      </div>
    </div>
  );
}
