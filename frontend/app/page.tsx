'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
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
  const [currentBounds, setCurrentBounds] = useState<any>(null);
  const [boundsInfo, setBoundsInfo] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [showLegend, setShowLegend] = useState(false);
  const [analyzedBounds, setAnalyzedBounds] = useState<any>(null);
  const [resolutionThreshold, setResolutionThreshold] = useState(50);
  const [selectedTaxon, setSelectedTaxon] = useState('mammals');
  const [selectedMetrics, setSelectedMetrics] = useState({
    biotaOverlap: false,
    richness: true,
    occupancy: false,
  });

  
  
  const mapRef = useRef<MapComponentRef>(null);
  const { analyze, isLoading, error: analysisError, result, clearResult } = useMapAnalysis();

  const handleBoundsChange = useCallback((bounds: any) => {
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
      setAnalyzedBounds(null);
      const mapInstance = mapRef.current;
      if (mapInstance) {
        mapInstance.removeImageOverlay();
      }
      
      // Store the bounds being analyzed
      setAnalyzedBounds(currentBounds);
      
      // Convert bounds to GeoJSON
      const geojson = boundsToGeoJSON(currentBounds);
      
      // Make API call
      await analyze({
        model: selectedModel,
        geojson,
        resolution: resolutionThreshold
      });

    } catch (error) {
      console.error('Analysis failed:', error);
    }
  }, [currentBounds, selectedModel, resolutionThreshold, analyze, clearResult]);

  const handleShowDummyGeoJSON = async () => {
    const taxa_path = `/GEOJsons/${selectedTaxon}.geojson`;
    const response = await fetch(taxa_path);
    const geojsonData = await response.json();

    if (!mapRef.current) return;
    console.log('model selected: ',selectedModel)
    console.log('taxa selected: ',selectedTaxon)

    if (selectedMetrics.richness) {
      mapRef.current?.generateRichnessImageOverlay(geojsonData);
    }
    if (selectedMetrics.biotaOverlap) {
      mapRef.current?.generateBiotaImageOverlay(geojsonData);
    }
    if (selectedMetrics.occupancy) {
      mapRef.current?.generateOccupancyImageOverlay(geojsonData);
    }
  };

  const handleBiodiversityAnalysis = async () => {
    if (selectedModel !== 'bs1.0' || !currentBounds) return;
    
    const metricMap = {
      richness: 'richness' as const,
      biotaOverlap: 'overlap' as const,
      occupancy: 'occupancy' as const
    };
    
    const activeMetric = Object.entries(selectedMetrics).find(([_, active]) => active)?.[0];
    if (!activeMetric) return;
    
    // Calculate center coordinates from current bounds
    const centerLat = (currentBounds.getNorth() + currentBounds.getSouth()) / 2;
    const centerLng = (currentBounds.getEast() + currentBounds.getWest()) / 2;
    
    const requestBody = {
      model: 'bs1.0',
      taxon: selectedTaxon,
      metric: metricMap[activeMetric as keyof typeof metricMap],
      longitude: centerLng,
      latitude: centerLat
    };
    
    console.log('Sending request:', requestBody);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/classify_image/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success && data.geojson && mapRef.current) {
        // Parse GeoJSON string to object if needed
        const geojsonData = typeof data.geojson === 'string' ? JSON.parse(data.geojson) : data.geojson;
        
        if (activeMetric === 'richness') {
          mapRef.current.generateRichnessImageOverlay(geojsonData);
        } else if (activeMetric === 'biotaOverlap') {
          mapRef.current.generateBiotaImageOverlay(geojsonData);
        } else if (activeMetric === 'occupancy') {
          mapRef.current.generateOccupancyImageOverlay(geojsonData);
        }
      }
    } catch (error) {
      console.error('Biodiversity analysis failed:', error);
    }
  };

  const handleClearResults = useCallback(() => {
    clearResult();
    setShowLegend(false);
    setAnalyzedBounds(null);
    const mapInstance = mapRef.current;
    if (mapInstance) {
      mapInstance.removeImageOverlay();
    }
  }, [clearResult]);

  // Effect to display overlay when results are available
  useEffect(() => {
    if (result && result.overlayImage && analyzedBounds) {
      const mapInstance = mapRef.current;
      if (mapInstance) {
        console.log('Using analyzed bounds for overlay:', analyzedBounds);
        // Add the overlay image to the map using the original analyzed bounds
        const overlaySrc = result.overlayImage.startsWith('data:image/')
          ? result.overlayImage
          : `data:image/png;base64,${result.overlayImage}`;
        mapInstance.addImageOverlay(overlaySrc, analyzedBounds);
        // Show the legend
        setShowLegend(true);
      }
    }
  }, [result, analyzedBounds]);

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
        resolutionThreshold={resolutionThreshold}
        setResolutionThreshold={setResolutionThreshold}
        className="w-1/4"
        onShowDummyGeoJSON={selectedModel === 'bs1.0' ? handleBiodiversityAnalysis : handleShowDummyGeoJSON}
        selectedMetrics={selectedMetrics}
        setSelectedMetrics={setSelectedMetrics}
        selectedTaxon={selectedTaxon}
        onTaxonChange={setSelectedTaxon}
      />
    </div>
  );
}
