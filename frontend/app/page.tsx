'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { boundsToGeoJSON, formatBoundsInfo, validateBounds, getCurrentLocation, getLocationZoom } from './utils/mapUtils';
import { MapComponentRef } from './components/MapComponent';
import MapSearch from './components/MapSearch';
import ControlPanel from './components/ControlPanel';
import Legend from './components/Legend';
import { useMapAnalysis } from './hooks/useMapAnalysis';

// Biodiversity Legend Component
function BiodiversityLegend({ biodiversityData, onClose }: { biodiversityData: any, onClose: () => void }) {
  if (!biodiversityData) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-xs">
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-blue-500 rounded"></div>
            <h3 className="text-sm font-semibold text-gray-900">Biodiversidad</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3">
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded border border-gray-300 mr-2" style={{ backgroundColor: '#FF0000' }}></div>
              <span className="text-xs text-gray-700">Rojo = Mayor concentración</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded border border-gray-300 mr-2" style={{ backgroundColor: '#0000FF' }}></div>
              <span className="text-xs text-gray-700">Azul = Menor concentración</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { geojsonData, activeMetric } = biodiversityData;
  const metricMap = {
    richness: 'Rel_Species_Richness',
    biotaOverlap: 'Biota_Overlap',
    occupancy: 'Rel_Occupancy'
  };
  
  const metricKey = metricMap[activeMetric as keyof typeof metricMap];
  const values = geojsonData.features.map((f: any) => f.properties?.[metricKey]).filter((v: any) => typeof v === 'number');
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-xs">
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-red-500 rounded"></div>
          <h3 className="text-sm font-semibold text-gray-900">Biodiversidad</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-3">
        <div className="mb-2">
          <span className="text-xs font-medium text-gray-700">{metricKey}</span>
        </div>
        <div className="relative">
          <div className="h-4 w-full bg-gradient-to-r from-blue-500 to-red-500 rounded border border-gray-300"></div>
          <div className="flex justify-between mt-1 text-xs text-gray-600">
            <span>{minValue.toFixed(3)}</span>
            <span>{maxValue.toFixed(3)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [selectedModel, setSelectedModel] = useState('bs1.0');
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
  const [localResponse, setLocalResponse] = useState(null);
  const [isBiodiversityLoading, setIsBiodiversityLoading] = useState(false);
  const [biodiversityData, setBiodiversityData] = useState<any>(null);

  
  
  const mapRef = useRef<MapComponentRef>(null);
  const { analyze, isLoading, error: analysisError, result, clearResult } = useMapAnalysis();

  const handleBoundsChange = useCallback((bounds: any) => {
    setCurrentBounds(bounds);
    setBoundsInfo(formatBoundsInfo(bounds));
    
    // Validate bounds
    const validation = validateBounds(bounds);
    setValidationError(validation.valid ? '' : validation.reason || '');
  }, []);

  const handleSelectedMetricChange = (metric: keyof typeof selectedMetrics) => {
    console.log(`Metric selected: ${metric}`);

    if (metric === 'biotaOverlap') {
      setSelectedMetrics({ richness: false, biotaOverlap: true, occupancy: false });
    } else if (metric === 'richness') {
      setSelectedMetrics({ richness: true, biotaOverlap: false, occupancy: false });
    } else if (metric === 'occupancy') {
      setSelectedMetrics({ richness: false, biotaOverlap: false, occupancy: true });
    }

    setTimeout(async () => {
      if (localResponse) { 
        setBiodiversityData({ geojsonData: localResponse, metric });
        mapRef.current.generateImageOverlay(localResponse, metric);
        setShowLegend(true);
      } else {
        console.log('No local data found, requesting from server...');
        await handleBiodiversityAnalysis();
      }
    }, 0);
  };



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
      
      // ⬇️ Dynamic Import (only on client side)
      const Lmod = await import('leaflet');
      const L = Lmod.default ?? Lmod;

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

  const handleShowGeoJSON = async () => {
    const taxa_path = `/GEOJsons/${selectedTaxon}.geojson`;
    const response = await fetch(taxa_path);
    const geojsonData = await response.json();

    if (!mapRef.current) return;
    console.log('model selected: ',selectedModel)
    console.log('taxa selected: ',selectedTaxon)
    mapRef.current?.generateImageOverlay(geojsonData);
  };


  const handleBiodiversityAnalysis = async () => {
    if (selectedModel !== 'bs1.0' || !currentBounds) return;

    const activeMetric = Object.entries(selectedMetrics).find(([_, active]) => active)?.[0];
    if (!activeMetric) return;

    const boundsObj = {
      north: currentBounds.getNorth(),
      south: currentBounds.getSouth(),
      east: currentBounds.getEast(),
      west: currentBounds.getWest()
    };

    const requestBody = {
      model: 'bs1.0',
      taxon: selectedTaxon,
      bounds: boundsObj,
    };

    console.log('Sending request:', requestBody);
    setIsBiodiversityLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/bs10/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      if (data.success && data.geojson) {
        const geojsonData = typeof data.geojson === 'string' ? JSON.parse(data.geojson) : data.geojson;
        setLocalResponse(geojsonData);
        setBiodiversityData({ geojsonData, activeMetric });
        mapRef.current.generateImageOverlay(geojsonData, activeMetric);
        setShowLegend(true);
      }
    } catch (error) {
      console.error('Biodiversity analysis failed:', error);
    } finally {
      setIsBiodiversityLoading(false);
    }
  };


  const handleClearResults = useCallback(() => {
    clearResult();
    setShowLegend(false);
    setAnalyzedBounds(null);
    setBiodiversityData(null);
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
        {showLegend && (result || selectedModel === 'bs1.0') && (
          <div className={`absolute z-[1000] ${selectedModel === 'bs1.0' ? 'bottom-7 left-7' : 'bottom-4 left-4'}`}>
            {selectedModel === 'bs1.0' ? (
              <BiodiversityLegend 
                biodiversityData={biodiversityData}
                onClose={() => setShowLegend(false)}
              />
            ) : result && (
              <Legend
                analysisResult={result}
                onClose={() => setShowLegend(false)}
              />
            )}
          </div>
        )}
        
        {/* Legend Toggle Button (when legend is hidden but results exist) */}
        {!showLegend && (result || (selectedModel === 'bs1.0')) && (
          <div className={`absolute z-[1000] ${selectedModel === 'bs1.0' ? 'top-4 left-4' : 'bottom-4 left-4'}`}>
            <button
              onClick={() => setShowLegend(true)}
              className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-3 shadow-lg transition-colors"
              title="Mostrar leyenda"
            >
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded ${selectedModel === 'bs1.0' ? 'bg-gradient-to-r from-red-500 to-blue-500' : 'bg-gradient-to-r from-green-400 to-blue-500'}`}></div>
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
        isLoading={isLoading || isBiodiversityLoading}
        onAnalyze={handleAnalyze}
        analysisResult={result}
        analysisError={analysisError}
        onClearResults={handleClearResults}
        resolutionThreshold={resolutionThreshold}
        setResolutionThreshold={setResolutionThreshold}
        className="w-1/4"
        onShowGeoJSON={selectedModel === 'bs1.0' ? handleBiodiversityAnalysis : handleShowGeoJSON}
        selectedMetrics={selectedMetrics}
        handleSelectedMetricChange={handleSelectedMetricChange}
        selectedTaxon={selectedTaxon}
        onTaxonChange={setSelectedTaxon}
      />
    </div>
  );
}
