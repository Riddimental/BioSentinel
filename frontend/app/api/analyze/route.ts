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
function generateClassificationResults(bounds: any, model: string, resolution: number): Record<string, ClassificationResult> {
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
    // Apply resolution threshold - lower resolution = more variation
    const resolutionMultiplier = 0.5 + (resolution / 100) * 0.5;
    
    // Calculate count with some randomness and model-specific adjustments
    const baseVariation = random(index * 100) * 0.6 + 0.7; // 0.7 to 1.3 range
    const modelAdjustment = Object.values(multiplier)[0] || 1.0;
    
    const count = Math.floor(
      category.baseCount * 
      baseVariation * 
      modelAdjustment * 
      resolutionMultiplier
    );
    
    // Only include categories with significant presence
    if (count > 50 || random(index * 50) > 0.7) {
      results[key] = {
        name: category.name,
        color: category.color,
        count: Math.max(count, 25), // Minimum count
        resolution: Math.min(95, resolution + random(index * 25) * 10 - 5) // ±5% variation
      };
    }
  });
  
  return results;
}

/**
 * Generate a PNG-like overlay image using programmatic approach
 */
function generateMockOverlayImage(classifications: Record<string, ClassificationResult>): string {
  const width = 800;
  const height = 600;
  
  console.log('Generating biodiversity overlay with classifications:', Object.keys(classifications));
  
  // Create a sophisticated SVG that looks like a realistic biodiversity analysis
  return createBiodiversityVisualization(width, height, classifications);
}

/**
 * Create a realistic biodiversity visualization using SVG
 */
function createBiodiversityVisualization(
  width: number, 
  height: number, 
  classifications: Record<string, ClassificationResult>
): string {
  const classificationArray = Object.entries(classifications);
  const cellSize = 25; // Size of each "pixel" in the classification
  
  // Generate classification pattern
  let patterns = '';
  let cells = '';
  
  // Create pattern definitions for each classification
  classificationArray.forEach(([key, classification], index) => {
    // Clean the key to ensure valid ID
    const cleanKey = key.replace(/[^a-zA-Z0-9]/g, '_');
    patterns += `<pattern id="pattern_${cleanKey}" patternUnits="userSpaceOnUse" width="${cellSize}" height="${cellSize}"><rect width="${cellSize}" height="${cellSize}" fill="${classification.color}" opacity="0.7"/><circle cx="${cellSize/2}" cy="${cellSize/2}" r="${cellSize/6}" fill="${classification.color}" opacity="0.9"/></pattern>`;
  });
  
  // Create cellular pattern across the image
  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      // Use classification weights to create realistic distribution
      const seed = (x * 0.1 + y * 0.07 + Math.sin(x * 0.01) + Math.cos(y * 0.01));
      const index = Math.floor(Math.abs(seed) % classificationArray.length);
      const [key, classification] = classificationArray[index];
      const cleanKey = key.replace(/[^a-zA-Z0-9]/g, '_');
      
      // Create slight size variation for more realistic look
      const variation = 2 + Math.sin(x * 0.05 + y * 0.03) * 2;
      const actualSize = cellSize - variation;
      const offset = variation / 2;
      
      cells += `<rect x="${x + offset}" y="${y + offset}" width="${actualSize}" height="${actualSize}" fill="url(#pattern_${cleanKey})" opacity="0.8"/>`;
    }
  }
  
  // Create the complete SVG (compact format to avoid encoding issues)
  const svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><defs>${patterns}<linearGradient id="envGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:rgba(34,139,34,0.15)"/><stop offset="30%" style="stop-color:rgba(154,205,50,0.1)"/><stop offset="70%" style="stop-color:rgba(255,215,0,0.1)"/><stop offset="100%" style="stop-color:rgba(65,105,225,0.15)"/></linearGradient></defs><rect width="100%" height="100%" fill="rgba(255,255,255,0.1)"/>${cells}<rect width="100%" height="100%" fill="url(#envGradient)"/><g opacity="0.9"><rect x="10" y="10" width="280" height="60" fill="rgba(0,0,0,0.7)" rx="5"/><text x="150" y="30" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">Analisis de Biodiversidad</text><text x="150" y="50" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="Arial" font-size="12">${classificationArray.length} categorias</text></g></svg>`;
  
  try {
    // Clean the SVG content and encode it properly
    const cleanedSvgContent = svgContent
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/>\s+</g, '><')  // Remove spaces between tags
      .trim();
    
    const dataUrl = `data:image/svg+xml;base64,${btoa(cleanedSvgContent)}`;
    console.log('Generated biodiversity visualization, size:', dataUrl.length, 'bytes');
    return dataUrl;
  } catch (error) {
    console.error('Error encoding SVG:', error);
    // Fallback to URL encoding instead of base64
    const urlEncodedSvg = encodeURIComponent(svgContent);
    const dataUrl = `data:image/svg+xml;charset=utf-8,${urlEncodedSvg}`;
    console.log('Generated biodiversity visualization (URL encoded), size:', dataUrl.length, 'bytes');
    return dataUrl;
  }
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
    const { model, geojson, resolution = 75 } = body;
    
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
    const classifications = generateClassificationResults(geojson, model, resolution);
    const overlayImage = generateMockOverlayImage(classifications);
    
    // Calculate total pixels/areas
    const totalCount = Object.values(classifications).reduce((sum, c) => sum + c.count, 0);
    
    const response: AnalysisResponse = {
      success: true,
      model,
      resolution,
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