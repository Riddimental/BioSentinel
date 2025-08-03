'use client';

import { useState } from 'react';

export default function Home() {
  const [selectedModel, setSelectedModel] = useState('gpt-biodiversity');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="h-screen flex">
      {/* Map Area - 75% width */}
      <div className="flex-1 relative bg-gray-100">
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Map Component</h2>
            <p>Leaflet map will be rendered here</p>
          </div>
        </div>
      </div>

      {/* Control Panel - 25% width */}
      <div className="w-1/4 bg-white border-l border-gray-200 p-6 flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">BioSentinel</h1>
          <p className="text-sm text-gray-600">AI-powered biodiversity analysis</p>
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
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-md transition-colors"
          onClick={() => {
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 2000); // Temporary mock
          }}
        >
          {isLoading ? 'Analyzing...' : 'Analyze Current View'}
        </button>

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
