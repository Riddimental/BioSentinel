'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import { boundsToGeoJSON, formatBoundsInfo, validateBounds, getCurrentLocation, getLocationZoom } from './utils/mapUtils';
import { MapComponentRef } from './components/MapComponent';
import MapSearch from './components/MapSearch';
import ControlPanel from './components/ControlPanel';
import Legend from './components/Legend';
import { useMapAnalysis } from './hooks/useMapAnalysis';

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
  const [selectedModel, setSelectedModel] = useState('segformer-b0-ade20k');
  const [currentBounds, setCurrentBounds] = useState<L.LatLngBounds | null>(null);
  const [boundsInfo, setBoundsInfo] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [showLegend, setShowLegend] = useState(false);
  
  const mapRef = useRef<MapComponentRef>(null);
  const { analyze, isLoading, error: analysisError, result, clearResult } = useMapAnalysis();

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

  const handleCenterOnUser = useCallback(async () => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    try {
      const location = await getCurrentLocation();
      const zoom = getLocationZoom();
      map.setView([location.lat, location.lng], zoom);
      
      // Add or update user location marker
      L.marker([location.lat, location.lng])
        .addTo(map)
        .bindPopup('Your current location')
        .openPopup();
        
      console.log('Centered on user location:', location);
    } catch (error) {
      console.error('Could not get user location:', error);
      alert('Unable to get your location. Please check your browser permissions.');
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!currentBounds) return;
    
    const validation = validateBounds(currentBounds);
    if (!validation.valid) {
      alert(`No se puede analizar: ${validation.reason}`);
      return;
    }

    try {
      // Clear previous results and overlay
      clearResult();
      setShowLegend(false);
      const mapInstance = mapRef.current;
      if (mapInstance) {
        mapInstance.removeImageOverlay();
      }
      
      // Convert bounds to GeoJSON
      const geojson = boundsToGeoJSON(currentBounds);
      
      // Make API call
      await analyze({
        model: selectedModel,
        geojson,
        confidence: 75 // This will come from the ControlPanel slider later
      });
      
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  }, [currentBounds, selectedModel, analyze, clearResult]);

  const handleClearResults = useCallback(() => {
    clearResult();
    setShowLegend(false);
    const mapInstance = mapRef.current;
    if (mapInstance) {
      mapInstance.removeImageOverlay();
    }
  }, [clearResult]);

  // Effect to display overlay when results are available
  useEffect(() => {
    if (result && result.overlayImage && currentBounds) {
      const mapInstance = mapRef.current;
      if (mapInstance) {
        // Add the overlay image to the map
        mapInstance.addImageOverlay(result.overlayImage, currentBounds);
        // Show the legend
        setShowLegend(true);
      }
    }
  }, [result, currentBounds]);

  return (
    <div className="h-screen flex">
      {/* Map Area - 75% width */}
      <div className="flex-1 relative">
        <MapComponent 
          ref={mapRef}
          onBoundsChange={handleBoundsChange}
          className="w-full h-full"
        />
        
        {/* Map Overlay Controls */}
        <div className="absolute top-4 right-4 z-[1000] flex gap-2">
          {/* Search Box */}
          <div className="w-64">
            <MapSearch 
              onLocationSelect={handleLocationSelect}
              className="w-full"
            />
          </div>
          
          {/* Center on User Button */}
          <button
            onClick={handleCenterOnUser}
            className="flex-shrink-0 bg-white hover:bg-gray-50 border border-gray-300 rounded-md p-2 shadow-sm transition-colors"
            title="Center on your location"
          >
            <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        
        {/* Legend Overlay */}
        {showLegend && result && (
          <div className="absolute bottom-4 left-4 z-[1000]">
            <Legend
              analysisResult={result}
              onClose={() => setShowLegend(false)}
            />
          </div>
        )}
        
        {/* Legend Toggle Button (when legend is hidden but results exist) */}
        {!showLegend && result && (
          <div className="absolute bottom-4 left-4 z-[1000]">
            <button
              onClick={() => setShowLegend(true)}
              className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-3 shadow-lg transition-colors"
              title="Mostrar leyenda"
            >
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Leyenda</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8" />
                </svg>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Control Panel - 25% width */}
      <ControlPanel
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        currentBounds={currentBounds}
        boundsInfo={boundsInfo}
        validationError={validationError}
        isLoading={isLoading}
        onAnalyze={handleAnalyze}
        analysisResult={result}
        analysisError={analysisError}
        onClearResults={handleClearResults}
        className="w-1/4"
      />
    </div>
  );
}
