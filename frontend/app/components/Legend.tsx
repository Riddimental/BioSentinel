'use client';

import { useState } from 'react';
import { AnalysisResponse } from '../types/api';

interface LegendProps {
  analysisResult: AnalysisResponse;
  onClose: () => void;
  className?: string;
}

export default function Legend({ analysisResult, onClose, className }: LegendProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  if (!analysisResult || !analysisResult.classifications) {
    return null;
  }

  const classifications = Object.entries(analysisResult.classifications);
  const totalPixels = analysisResult.metadata.totalPixels;

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 max-w-xs ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded"></div>
          <h3 className="text-sm font-semibold text-gray-900">Clasificación</h3>
        </div>
        
        <div className="flex items-center space-x-1">
          {/* Collapse/Expand Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={isCollapsed ? 'Expandir' : 'Contraer'}
          >
            <svg 
              className={`w-4 h-4 text-gray-500 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Cerrar"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-3">
          {/* Model Info */}
          <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-gray-700">Modelo:</span>
              <span className="text-gray-600">{analysisResult.model}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Tiempo:</span>
              <span className="text-gray-600">{(analysisResult.metadata.processingTime / 1000).toFixed(1)}s</span>
            </div>
          </div>

          {/* Classifications */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 mb-2">
              Categorías ({classifications.length})
            </h4>
            
            {classifications
              .sort((a, b) => b[1].count - a[1].count) // Sort by count descending
              .map(([key, classification]) => {
                const percentage = ((classification.count / totalPixels) * 100).toFixed(1);
                
                return (
                  <div key={key} className="flex items-center justify-between py-1">
                    <div className="flex items-center flex-1 min-w-0">
                      {/* Color indicator */}
                      <div 
                        className="w-4 h-4 rounded border border-gray-300 mr-2 flex-shrink-0"
                        style={{ backgroundColor: classification.color }}
                        title={`Color: ${classification.color}`}
                      ></div>
                      
                      {/* Name */}
                      <span className="text-xs text-gray-700 truncate flex-1" title={classification.name}>
                        {classification.name}
                      </span>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex flex-col items-end ml-2 flex-shrink-0">
                      <span className="text-xs font-medium text-gray-900">
                        {classification.count.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Total */}
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-700">Total:</span>
              <span className="text-xs font-semibold text-gray-900">
                {totalPixels.toLocaleString()} píxeles
              </span>
            </div>
          </div>

          {/* Image Resolution Info */}
          <div className="mt-2 p-2 bg-blue-50 rounded">
            <div className="flex items-center">
              <svg className="w-3 h-3 text-blue-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-blue-700">
                Resolución Utilizada: {analysisResult.resolution}m
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}