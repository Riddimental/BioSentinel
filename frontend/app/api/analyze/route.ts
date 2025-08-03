import { NextRequest, NextResponse } from 'next/server';
import { AnalysisRequest, AnalysisResponse, ClassificationResult } from '../../types/api';

// Mock biodiversity classification categories with Spanish names
const CLASSIFICATION_CATEGORIES = {
  'bosque_primario': {
    name: 'Bosque Primario',
    color: '#228B22',
    baseCount: 1200
  },
  'bosque_secundario': {
    name: 'Bosque Secundario', 
    color: '#32CD32',
    baseCount: 800
  },
  'zona_transicion': {
    name: 'Zona de Transición',
    color: '#9ACD32',
    baseCount: 600
  },
  'pastizales': {
    name: 'Pastizales',
    color: '#FFD700',
    baseCount: 400
  },
  'cultivos': {
    name: 'Cultivos',
    color: '#FFA500',
    baseCount: 300
  },
  'agua': {
    name: 'Cuerpos de Agua',
    color: '#4169E1',
    baseCount: 200
  },
  'urbano': {
    name: 'Área Urbana',
    color: '#696969',
    baseCount: 150
  },
  'suelo_desnudo': {
    name: 'Suelo Desnudo',
    color: '#D2691E',
    baseCount: 100
  }
};

/**
 * Generate a deterministic but varied classification result based on viewport bounds
 */
function generateClassificationResults(bounds: any, model: string, confidence: number): Record<string, ClassificationResult> {
  const results: Record<string, ClassificationResult> = {};
  
  // Use bounds as seed for deterministic randomness
  const seed = Math.abs(bounds.coordinates[0][0][0] + bounds.coordinates[0][0][1]) * 1000;
  const random = (offset: number) => ((seed + offset) % 1000) / 1000;
  
  // Model-specific behavior simulation
  const modelMultipliers = {
    'segformer-b0-ade20k': { forest: 1.2, urban: 0.8, water: 1.0 },
    'sam': { transition: 1.5, mixed: 1.3, sharp: 0.7 },
    'clipseg': { text_based: 1.1, semantic: 1.2, ambiguous: 0.9 },
    'sam-clipseg': { precision: 1.4, combined: 1.3, hybrid: 1.1 },
    'gpt4o-mini': { multimodal: 1.2, interpretation: 1.1, reasoning: 1.0 },
    'k-means': { spectral: 1.0, unsupervised: 0.9, clusters: 1.1 },
    'mkanet': { remote_sensing: 1.3, multispectral: 1.2, spatial: 1.1 }
  };
  
  const multiplier = modelMultipliers[model as keyof typeof modelMultipliers] || { default: 1.0 };
  
  // Generate results for each category
  Object.entries(CLASSIFICATION_CATEGORIES).forEach(([key, category], index) => {
    // Apply confidence threshold - lower confidence = more variation
    const confidenceMultiplier = 0.5 + (confidence / 100) * 0.5;
    
    // Calculate count with some randomness and model-specific adjustments
    const baseVariation = random(index * 100) * 0.6 + 0.7; // 0.7 to 1.3 range
    const modelAdjustment = Object.values(multiplier)[0] || 1.0;
    
    const count = Math.floor(
      category.baseCount * 
      baseVariation * 
      modelAdjustment * 
      confidenceMultiplier
    );
    
    // Only include categories with significant presence
    if (count > 50 || random(index * 50) > 0.7) {
      results[key] = {
        name: category.name,
        color: category.color,
        count: Math.max(count, 25), // Minimum count
        confidence: Math.min(95, confidence + random(index * 25) * 10 - 5) // ±5% variation
      };
    }
  });
  
  return results;
}

/**
 * Generate a mock overlay image (base64 encoded colored rectangle)
 */
function generateMockOverlayImage(classifications: Record<string, ClassificationResult>): string {
  // Create a simple canvas-based image representation
  const width = 400;
  const height = 300;
  
  // Simple base64 encoded 1x1 colored pixel (placeholder)
  // In a real implementation, this would be a proper overlay image matching the viewport bounds
  const colors = Object.values(classifications).map(c => c.color);
  const primaryColor = colors[0] || '#228B22';
  
  // Generate a simple base64 image (this is a minimal placeholder)
  // Real implementation would use Canvas API or image processing library
  const imageData = `data:image/svg+xml;base64,${btoa(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="biodiversity" patternUnits="userSpaceOnUse" width="20" height="20">
          ${colors.map((color, i) => 
            `<rect x="${(i % 4) * 5}" y="${Math.floor(i / 4) * 5}" width="5" height="5" fill="${color}" opacity="0.7"/>`
          ).join('')}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#biodiversity)"/>
      <text x="50%" y="50%" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">
        Clasificación de Biodiversidad
      </text>
    </svg>
  `)}`;
  
  return imageData;
}

/**
 * Simulate processing time based on model complexity
 */
function getProcessingTime(model: string): number {
  const processingTimes = {
    'segformer-b0-ade20k': 1500,
    'sam': 2500,
    'clipseg': 2000,
    'sam-clipseg': 3000,
    'gpt4o-mini': 2200,
    'k-means': 800,
    'mkanet': 1800
  };
  
  return processingTimes[model as keyof typeof processingTimes] || 1500;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    const { model, geojson, confidence = 75 } = body;
    
    // Validation
    if (!model || !geojson) {
      return NextResponse.json(
        { error: 'Missing required fields: model and geojson' },
        { status: 400 }
      );
    }
    
    if (geojson.type !== 'Polygon') {
      return NextResponse.json(
        { error: 'GeoJSON must be a Polygon' },
        { status: 400 }
      );
    }
    
    // Simulate processing time
    const processingTime = getProcessingTime(model);
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Simulate occasional errors (5% failure rate)
    if (Math.random() < 0.05) {
      return NextResponse.json(
        { error: 'Model processing failed. Please try again.' },
        { status: 500 }
      );
    }
    
    // Generate mock results
    const classifications = generateClassificationResults(geojson, model, confidence);
    const overlayImage = generateMockOverlayImage(classifications);
    
    // Calculate total pixels/areas
    const totalCount = Object.values(classifications).reduce((sum, c) => sum + c.count, 0);
    
    const response: AnalysisResponse = {
      success: true,
      model,
      confidence,
      bounds: geojson,
      classifications,
      overlayImage,
      metadata: {
        totalPixels: totalCount,
        processingTime: processingTime,
        timestamp: new Date().toISOString(),
        categories: Object.keys(classifications).length
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}