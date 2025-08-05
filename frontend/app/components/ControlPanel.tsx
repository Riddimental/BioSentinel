'use client';

import { useState } from 'react';
import ModelSelector from './ModelSelector';
import { AnalysisResponse } from '../types/api';

interface ControlPanelProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  currentBounds: any;
  boundsInfo: string;
  resolutionThreshold: number;
  setResolutionThreshold: (value: number) => void;
  validationError: string;
  isLoading: boolean;
  onAnalyze: () => void;
  analysisResult?: AnalysisResponse | null;
  analysisError?: string | null;
  onClearResults?: () => void;
  className?: string;
  onShowDummyGeoJSON?: () => void;
  selectedMetrics?: any;
  setSelectedMetrics?: (metrics: any) => void;
  selectedTaxon?: string;
  onTaxonChange?: (taxon: string) => void;
}

export default function ControlPanel({
  selectedModel,
  onModelChange,
  currentBounds,
  boundsInfo,
  resolutionThreshold,
  setResolutionThreshold,
  validationError,
  isLoading,
  onAnalyze,
  analysisResult,
  analysisError,
  onClearResults,
  className,
  onShowDummyGeoJSON,
  selectedMetrics,
  setSelectedMetrics,
  selectedTaxon,
  onTaxonChange
}: ControlPanelProps) {

  return (
    <div className={`bg-white border-l border-gray-200 p-6 flex flex-col ${className || ''} max-h-[90vh] overflow-y-auto`}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-center space-x-3">
        <img
          src="/logo.png"
          alt="BioSentinel Logo"
          className="h-10 w-auto"
        />
        <h1 className="text-2xl font-bold text-gray-900">BioSentinel-UV</h1>
      </div>
      <p className="text-sm text-gray-600">Análisis de biodiversidad con IA</p>

      {/* Model Selection */}
      <div className="mb-6">
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={onModelChange}
        />
      </div>

      {/* Image Resolution (Optional Feature) */}
      {selectedModel != 'bs1.0' && (<div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Resolución de Imagen
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="range"
            min="10"
            max="50"
            step="5"
            value={resolutionThreshold}
            onChange={(e) => setResolutionThreshold(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <span className="text-sm font-medium text-gray-700 min-w-[3rem]">
            {resolutionThreshold}m
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Resolución de imagen para el análisis: Un valor más alto puede mejorar la precisión 
          de los resultados, pero también reduce el tamaño del área que se puede analizar. 
          Si seleccionas la resolución más alta (10m por píxel), 
          el área de interés debe ser menor a aproximadamente 839 km².
        </p>
      </div>)}

      {/* Current View Info */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Vista Actual</h3>
        {boundsInfo ? (
          <div className="p-2 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-600 font-mono">{boundsInfo}</p>
          </div>
        ) : (
          <div className="p-2 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-500">Cargando información del mapa...</p>
          </div>
        )}
      </div>

      {/* BS1.0 Controls */}
      {selectedModel === 'bs1.0' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Taxón
          </label>
          <select 
            value={selectedTaxon}
            onChange={(e) => onTaxonChange?.(e.target.value)}
            className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white mb-4"
          >
            <option value="mammals">Mamíferos</option>
            <option value="birds">Aves</option>
            <option value="reptiles">Reptiles</option>
            <option value="amphibians">Anfibios</option>
          </select>
          
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Métrica
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="metric"
                checked={selectedMetrics?.richness}
                onChange={() => setSelectedMetrics?.({richness: true, biotaOverlap: false, occupancy: false})}
                className="mr-2"
              />
              <span className="text-sm">Riqueza de especies: número de especies distintas presentes en una zona.</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="metric"
                checked={selectedMetrics?.biotaOverlap}
                onChange={() => setSelectedMetrics?.({richness: false, biotaOverlap: true, occupancy: false})}
                className="mr-2"
              />
              <span className="text-sm">Solapamiento de biota: regiones donde coexisten múltiples grupos taxonómicos.</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="metric"
                checked={selectedMetrics?.occupancy}
                onChange={() => setSelectedMetrics?.({richness: false, biotaOverlap: false, occupancy: true})}
                className="mr-2"
              />
              <span className="text-sm">Ocupación relativa: áreas donde una especie o grupo está firmemente establecido.</span>
            </label>
          </div>
        </div>
      )}

      {/* Analyze Button */}
      <button
        disabled={isLoading || (selectedModel !== 'bs1.0' && (!currentBounds || !!validationError))}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center mb-4"
        onClick={selectedModel === 'bs1.0' ? onShowDummyGeoJSON : onAnalyze}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Analizando...
          </>
        ) : (
          <>
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {selectedModel === 'bs1.0' ? 'Analizar Biodiversidad' : 'Analizar Vista Actual'}
          </>
        )}
      </button>

      {/* Validation Error */}
      {validationError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <svg className="h-4 w-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{validationError}</p>
          </div>
        </div>
      )}

      {/* Analysis Error */}
      {analysisError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <svg className="h-4 w-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-700">Error de Análisis</p>
              <p className="text-xs text-red-600 mt-1">{analysisError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-green-900">Resultados del Análisis</h4>
            {onClearResults && (
              <button
                onClick={onClearResults}
                className="text-xs text-green-700 hover:text-green-900 underline"
              >
                Limpiar
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="text-xs text-green-700">
              <p><strong>Modelo:</strong> {analysisResult.model}</p>
              <p><strong>Categorías:</strong> {analysisResult.metadata.categories}</p>
              <p><strong>Tiempo:</strong> {(analysisResult.metadata.processingTime / 1000).toFixed(1)}s</p>
            </div>
            
            {/* Classifications Preview */}
            <div className="max-h-32 overflow-y-auto">
              {Object.entries(analysisResult.classifications).map(([key, classification]) => (
                <div key={key} className="flex items-center text-xs py-1">
                  <div 
                    className="w-3 h-3 rounded mr-2 border border-gray-300"
                    style={{ backgroundColor: classification.color }}
                  ></div>
                  <span className="flex-1 truncate text-green-700">{classification.name}</span>
                  <span className="text-green-600 ml-2">{classification.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!analysisResult && (
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-1">¿Cómo usar?</h4>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
            <li>Navega el mapa a tu área de interés</li>
            <li>Selecciona el modelo de clasificación</li>
            <li>Ajusta la resolución del área de interes si es necesario</li>
            <li>Haz clic en "Analizar Vista Actual"</li>
          </ol>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="text-xs text-gray-400 text-center border-t border-gray-100 pt-4">
        <p>BioSentinel-UV MVP v1.0</p>
        <p className="mt-1">Copernicus LAC 2025 Hackathon</p>
      </div>
    </div>
  );
}