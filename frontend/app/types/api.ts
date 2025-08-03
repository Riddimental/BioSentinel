// API Types for BioSentinel MVP

export interface AnalysisRequest {
  model: string;
  geojson: GeoJSON.Polygon;
  confidence?: number;
}

export interface ClassificationResult {
  color: string;
  count: number;
}

export interface AnalysisResponse {
  classifications: Record<string, ClassificationResult>;
  image: string; // Base64 encoded image
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
}

// Component Props Types
export interface MapComponentProps {
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
  className?: string;
}

export interface ControlPanelProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  error?: string;
  className?: string;
}

export interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  models: ModelOption[];
  disabled?: boolean;
}

export interface LegendProps {
  classifications: Record<string, ClassificationResult>;
  isVisible: boolean;
  onClose: () => void;
}

// Map related types
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Hook return types
export interface UseMapAnalysisReturn {
  analyze: (request: AnalysisRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  result: AnalysisResponse | null;
  clearResult: () => void;
}