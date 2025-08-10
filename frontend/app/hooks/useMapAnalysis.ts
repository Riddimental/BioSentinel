'use client';

import { useState, useCallback } from 'react';
import { AnalysisRequest, AnalysisResponse } from '../types/api';
import { API_BASE_URL } from '../environment';

interface UseMapAnalysisReturn {
  analyze: (request: AnalysisRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  result: AnalysisResponse | null;
  clearResult: () => void;
  clearError: () => void;
}

export function useMapAnalysis(): UseMapAnalysisReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  const analyze = useCallback(async (request: AnalysisRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Starting analysis with request:', request);
      
      const response = await fetch(`${API_BASE_URL}/classify_image/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}` + ` - ${errorData.message || 'Unknown error'}`);
      }

      const data: AnalysisResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      console.log('Analysis completed successfully:', data);
      setResult(data);
      
    } catch (err) {
      console.error('Analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    analyze,
    isLoading,
    error,
    result,
    clearResult,
    clearError
  };
}