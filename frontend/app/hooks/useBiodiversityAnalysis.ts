'use client';

import { useState, useCallback } from 'react';
import { BiodiversityRequest, BiodiversityResponse } from '../types/api';

interface UseBiodiversityAnalysisReturn {
  analyze: (request: BiodiversityRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  result: BiodiversityResponse | null;
  clearResult: () => void;
}

export function useBiodiversityAnalysis(): UseBiodiversityAnalysisReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BiodiversityResponse | null>(null);

  const analyze = useCallback(async (request: BiodiversityRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/classify_image/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: BiodiversityResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResult(data);
      
    } catch (err) {
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

  return {
    analyze,
    isLoading,
    error,
    result,
    clearResult
  };
}