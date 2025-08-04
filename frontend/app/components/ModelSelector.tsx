'use client';

interface Model {
  id: string;
  name: string;
  description: string;
  category: 'transformer' | 'segmentation' | 'multimodal' | 'clustering' | 'cnn' | 'tree-based';
}

const models: Model[] = [
  {
    id: 'segformer-b0-ade20k',
    name: 'SegFormer-B0 ADE20K',
    description: 'Modelo de segmentación semántica basado en Transformers, optimizado para tareas de visión por computadora. Es la variante más pequeña y eficiente de la familia SegFormer, preentrenada en el dataset ADE20K para clasificar píxeles en imágenes.',
    category: 'transformer'
  },
  {
    id: 'sam',
    name: 'Segment Anything Model (SAM)',
    description: 'Modelo de segmentación generalista desarrollado por Meta AI que genera máscaras precisas de regiones segmentadas a partir de una imagen y un "prompt". Entrenado con un dataset masivo (SA-1B) y es ideal para segmentación interactiva.',
    category: 'segmentation'
  },
  // {
  //   id: 'clipseg',
  //   name: 'CLIPSeg',
  //   description: 'Modelo de segmentación basado en texto que permite segmentar imágenes usando lenguaje natural como prompt. Combina un fine-tuning de CLIP con un decoder ligero, ideal para usuarios no técnicos.',
  //   category: 'segmentation'
  // },
  // {
  //   id: 'sam-clipseg',
  //   name: 'Combinación SAM + CLIPSeg',
  //   description: 'Arquitectura que aprovecha CLIPSeg para generar máscaras iniciales por clase a partir de prompts textuales, refinadas con SAM para mejorar la precisión de los bordes. Combina clasificación textual con alta precisión geométrica.',
  //   category: 'segmentation'
  // },
  // {
  //   id: 'gpt4o-mini',
  //   name: 'GPT-4o - mini',
  //   description: 'Modelo multimodal nativo de OpenAI que puede razonar sobre texto, imagen, audio y video. Interpreta imágenes como RGB y está entrenado para análisis de imágenes, segmentación visual cualitativa, OCR e interpretación geográfica.',
  //   category: 'multimodal'
  // },
  {
    id: 'k-means',
    name: 'Clustering con K-Means',
    description: 'Algoritmo de clustering no supervisado utilizado para segmentación espectral de imágenes multibanda, como las de Sentinel-2. Agrupa píxeles en clústeres según la similitud de su firma espectral.',
    category: 'clustering'
  },
  {
    id: 'mkanet',
    name: 'MKANet (Multiscale Kernel Attention Network)',
    description: 'Red neuronal convolucional ligera diseñada para segmentación semántica de imágenes remotas. Utiliza atención espacial y de canal para mejorar la detección de objetos en imágenes multiespectrales.',
    category: 'cnn'
  },
  {
    id: 'bs1.0',
    name: 'BS1.0',
    description: 'BS-1.0 es un modelo enfocado en la detección de diversidad biológica. Estima métricas como riqueza (richness), ocupación (occupancy) y solapamiento de biota (biota overlap) para distintos grupos taxonómicos, incluyendo aves, mamíferos, reptiles y anfibios, a partir de imágenes satelitales y datos de campo. Está basado en el algoritmo Random Forest.',
    category: 'tree-based'
  }

,
];

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  className?: string;
}

export default function ModelSelector({ selectedModel, onModelChange, className }: ModelSelectorProps) {
  const currentModel = models.find(m => m.id === selectedModel);

  const getCategoryColor = (category: Model['category']) => {
    switch (category) {
      case 'transformer': return 'bg-blue-100 text-blue-800';
      case 'segmentation': return 'bg-green-100 text-green-800';
      case 'multimodal': return 'bg-purple-100 text-purple-800';
      case 'clustering': return 'bg-orange-100 text-orange-800';
      case 'cnn': return 'bg-red-100 text-red-800';
      case 'tree-based': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: Model['category']) => {
    switch (category) {
      case 'transformer': return 'Transformer';
      case 'segmentation': return 'Segmentación';
      case 'multimodal': return 'Multimodal';
      case 'clustering': return 'Clustering';
      case 'cnn': return 'CNN';
      case 'tree-based': return 'Tree-based';
      default: return 'Otro';
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Modelo de Clasificación
      </label>
      
      <select 
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
      
      {/* Model Details */}
      {currentModel && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          {/* Category Badge */}
          <div className="mb-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(currentModel.category)}`}>
              {getCategoryLabel(currentModel.category)}
            </span>
          </div>
          
          {/* Description */}
          <p className="text-xs text-gray-600 leading-relaxed">
            {currentModel.description}
          </p>
        </div>
      )}
    </div>
  );
}