# 202501 - MVP UI Specification for BioSentinel Interactive Platform

## Overview

This specification defines the MVP (Minimum Viable Product) user interface for the BioSentinel platform - an interactive web application that uses AI and Sentinel satellite imagery to identify and visualize biodiversity zones in real-time using the "core-to-transition" organization pattern.

## UI/UX Design

### Layout Structure

The application features a clean, focused interface with two main components:

1. **Main Map Area (70-80% of screen)**
   - Interactive map displaying satellite imagery with pan/zoom controls
   - Overlay display for classification results
   - Legend panel (bottom-left corner when results are displayed)
   - Current viewport indicator (optional border highlight)

2. **Control Panel (20-30% of screen, right side)**
   - Model selection dropdown
   - Model description text area
   - Confidence threshold slider (optional feature)
   - "Analyze Current View" button
   - Loading indicator during processing

### User Workflow

1. **Initial State**: User sees the map centered on a default location
2. **Navigation**: User pans and zooms to desired area of interest
3. **Model Configuration**: User selects desired classification model from dropdown
4. **Execution**: User clicks "Analyze Current View" button to process the visible map area
5. **Results Display**: 
   - Classification overlay appears on the current map view
   - Legend shows color-coded classifications with counts
   - Option to clear results and analyze a different area

### Interaction Patterns

- **Navigation**: Pan and zoom to explore different geographical areas
- **Model Selection**: Dropdown with descriptive model names
- **Analysis Trigger**: Single button click to analyze current viewport
- **Results**: Visual overlay matching the current map bounds with accompanying legend
- **Reset**: Clear button to remove current analysis and explore new areas

## Requirements

### Functional Requirements

- **RF1**: Interactive map with pan and zoom capabilities
- **RF2**: Current viewport bounds extraction as GeoJSON
- **RF3**: Automatic region definition based on visible map area
- **RF4**: Model selection interface with descriptions
- **RF5**: API integration for sending region data and receiving results
- **RF6**: Image overlay display for classification results
- **RF7**: Legend display with classification categories and counts
- **RF8**: Loading states during API processing
- **RF9**: Error handling for API failures
- **RF10**: Responsive design for desktop browsers

### Optional Requirements

- **RO1**: Confidence threshold slider (0-100%)
- **RO2**: Export functionality (GeoJSON, PNG)
- **RO3**: Viewport boundary visualization (highlight current analysis area)
- **RO4**: Mobile responsiveness

### Technical Requirements

- **RT1**: Built with Next.js 15 and React 19
- **RT2**: TypeScript for type safety
- **RT3**: TailwindCSS for styling
- **RT4**: Leaflet.js for map functionality
- **RT5**: Modern ES6+ JavaScript
- **RT6**: RESTful API integration

### Performance Requirements

- **RP1**: Map should load within 2 seconds
- **RP2**: Viewport bounds calculation should be instantaneous (<50ms)
- **RP3**: API requests should timeout after 30 seconds
- **RP4**: Bundle size optimization for fast loading

## Library Analysis & Decision

### Map Libraries Considered

#### 1. Google Earth Engine ❌
- **Pros**: Powerful satellite data processing, extensive datasets
- **Cons**: 
  - Designed for backend analysis, not frontend UI
  - Complex authentication and setup
  - Overkill for region selection and overlay display
  - Not suitable for interactive web applications

#### 2. Google Maps JavaScript API ⚠️
- **Pros**: Familiar interface, good documentation, reliable
- **Cons**:
  - Requires API key and has usage limits
  - Limited built-in GeoJSON manipulation
  - Requires additional libraries for drawing tools
  - More complex overlay management
  - Commercial licensing considerations

#### 3. Mapbox GL JS ✅
- **Pros**: 
  - Modern WebGL-based rendering
  - Built-in drawing via @mapbox/mapbox-gl-draw
  - Excellent performance and smooth interactions
  - Great GeoJSON support
  - Professional appearance
- **Cons**:
  - Requires API key (free tier available)
  - More complex setup
  - Larger bundle size

#### 4. Leaflet.js ✅ **SELECTED**
- **Pros**:
  - Perfect fit for requirements
  - Excellent GeoJSON support out of the box
  - Superior overlay capabilities (ImageOverlay, SVGOverlay)
  - Built-in viewport bounds extraction via `map.getBounds()`
  - Easy coordinate system conversion
  - Lightweight and fast
  - Open source, no API keys required
  - Large ecosystem and community
  - Simple integration with React
- **Cons**:
  - Not WebGL-based (but sufficient for MVP)
  - Requires manual bounds-to-GeoJSON conversion (simple utility function)

### Decision Rationale

**Leaflet.js was selected** for the following reasons:

1. **Perfect Feature Match**: Provides exactly what we need without unnecessary complexity
2. **No API Dependencies**: No keys required, uses OpenStreetMap tiles
3. **Built-in Viewport Support**: `map.getBounds()` provides instant access to current view area
4. **Superior Overlays**: Built-in ImageOverlay perfect for classification results
5. **GeoJSON Native**: First-class GeoJSON support throughout
6. **Lightweight**: Small bundle size important for MVP performance
7. **Developer Experience**: Simple API, extensive documentation
8. **Cost**: Completely free and open source

### Selected Dependencies

```json
{
  "leaflet": "^1.9.4",
  "@types/leaflet": "^1.9.8"
}
```

**Note**: Drawing plugins removed as we no longer need manual region selection.

## API Specification

### Request Format
```typescript
POST /api/analyze
{
  model: string,        // Selected model identifier
  geojson: GeoJSON,     // Current viewport bounds as polygon geometry
  confidence?: number   // Optional confidence threshold (0-100)
}
```

### Viewport to GeoJSON Conversion
```typescript
// Utility function to convert Leaflet bounds to GeoJSON
function boundsToGeoJSON(bounds: L.LatLngBounds): GeoJSON.Polygon {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  
  return {
    type: "Polygon",
    coordinates: [[
      [sw.lng, ne.lat], // NW
      [ne.lng, ne.lat], // NE  
      [ne.lng, sw.lat], // SE
      [sw.lng, sw.lat], // SW
      [sw.lng, ne.lat]  // Close polygon
    ]]
  };
}
```

### Response Format
```typescript
{
  classifications: {
    [category: string]: {
      color: string,    // Hex color code
      count: number     // Number of classified pixels/areas
    }
  },
  image: string        // Base64 encoded overlay image
}
```

### Example Response
```json
{
  "classifications": {
    "forest": {
      "color": "#228B22",
      "count": 1534
    },
    "water": {
      "color": "#4169E1", 
      "count": 892
    },
    "urban": {
      "color": "#696969",
      "count": 445
    }
  },
  "image": "iVBORw0KGgoAAAANSUhEUgAA..."
}
```

## Testing Strategy

### Mock API Implementation

For MVP development and testing, a dummy API will be implemented in `@frontend/app/api/analyze/route.ts` that:

1. **Accepts** the standard request format with viewport bounds
2. **Generates** a dummy classification image sized to match the current map view
3. **Returns** mock classification data with realistic categories:
   - Forest (green): Random count 1000-2000
   - Water (blue): Random count 500-1500  
   - Urban (gray): Random count 200-800
   - Agriculture (yellow): Random count 800-1800
4. **Simulates** realistic API response times (1-3 seconds)
5. **Handles** error scenarios (10% failure rate for testing)

### Mock Data Generation

```typescript
// Dummy image: Canvas-generated pattern matching viewport dimensions
// Classifications: Randomized but deterministic based on viewport bounds
// Response time: 1-3 second delay to simulate processing
// Image overlay: Perfectly aligned with current map bounds
```

## File Structure

```
frontend/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts          # Mock API endpoint
│   ├── components/
│   │   ├── MapComponent.tsx      # Main map with Leaflet
│   │   ├── ControlPanel.tsx      # Right-side controls
│   │   ├── ModelSelector.tsx     # Dropdown component
│   │   └── Legend.tsx            # Results legend
│   ├── hooks/
│   │   └── useMapAnalysis.ts     # API integration hook
│   ├── utils/
│   │   └── mapUtils.ts           # Bounds to GeoJSON conversion
│   ├── types/
│   │   └── api.ts                # TypeScript interfaces
│   └── page.tsx                  # Main application page
```

## Success Criteria

- [ ] User can navigate the map (pan/zoom) smoothly
- [ ] Current viewport bounds are correctly extracted as GeoJSON
- [ ] "Analyze Current View" button triggers API call with proper data
- [ ] API integration works with mock endpoint
- [ ] Classification overlays display correctly aligned with map bounds
- [ ] Legend shows accurate category information with counts
- [ ] Loading states provide clear feedback during processing
- [ ] Error handling works for API failures
- [ ] Responsive design works on desktop browsers
- [ ] Performance meets specified requirements

## Implementation Plan

### Development Phases

### Phase 1: Project Setup & Foundation

#### 1.1 Dependencies Installation
```bash
cd frontend/
npm install leaflet @types/leaflet
npm install --save-dev @types/react @types/node
```

#### 1.2 Project Structure Setup
```
frontend/app/
├── api/analyze/route.ts       # Mock API endpoint
├── components/
│   ├── MapComponent.tsx       # Main map component
│   ├── ControlPanel.tsx       # Right sidebar controls
│   ├── ModelSelector.tsx      # Dropdown for model selection
│   └── Legend.tsx             # Classification results legend
├── hooks/
│   └── useMapAnalysis.ts      # Custom hook for API calls
├── utils/
│   └── mapUtils.ts            # Bounds to GeoJSON utilities
├── types/
│   └── api.ts                 # TypeScript interfaces
└── globals.css                # Updated styles
```

#### 1.3 TypeScript Interfaces
Create type definitions for:
- API request/response models
- Map bounds and GeoJSON types
- Classification results
- Component props

### Phase 2: Core Map Implementation

#### 2.1 MapComponent.tsx
- Initialize Leaflet map with OpenStreetMap tiles
- Set default center and zoom level
- Implement viewport bounds extraction
- Handle map events (moveend, zoomend)
- Expose map instance to parent component

#### 2.2 Map Utilities (mapUtils.ts)
```typescript
// Key functions to implement:
- boundsToGeoJSON(bounds: L.LatLngBounds): GeoJSON.Polygon
- calculateViewportArea(bounds: L.LatLngBounds): number
- validateBounds(bounds: L.LatLngBounds): boolean
```

### Phase 3: Control Panel & UI

#### 3.1 ControlPanel.tsx
- Right sidebar layout with TailwindCSS
- Model selector integration
- Analyze button with loading states
- Results display area

#### 3.2 ModelSelector.tsx
- Dropdown component with model options
- Model descriptions display
- Selection state management

#### 3.3 Basic Styling
- Responsive layout (map 75%, panel 25%)
- Loading indicators
- Button states and interactions
- Mobile-friendly basics

### Phase 4: API Integration

#### 4.1 Mock API Endpoint (api/analyze/route.ts)
```typescript
// Implementation requirements:
- Accept POST requests with model + GeoJSON
- Generate deterministic dummy classifications
- Create base64 encoded overlay image
- Simulate 1-3 second processing time
- Return structured response with categories/counts
- Handle error scenarios (10% failure rate)
```

#### 4.2 Custom Hook (useMapAnalysis.ts)
```typescript
// Hook functionality:
- API request management
- Loading states
- Error handling
- Response data transformation
- Cancel request capability
```

### Phase 5: Results Display

#### 5.1 Image Overlay Integration
- Receive base64 image from API
- Convert to ImageOverlay with correct bounds
- Handle overlay removal/replacement
- Manage overlay opacity and interactions

#### 5.2 Legend Component (Legend.tsx)
```typescript
// Legend features:
- Color-coded categories
- Classification counts
- Collapsible interface
- Positioning (bottom-left)
- Responsive design
```

### Phase 6: Polish & Testing

#### 6.1 Error Handling
- API failure messages
- Network error handling
- Invalid viewport validation
- User feedback for all error states

#### 6.2 Loading States
- Button loading indicators
- Map interaction disable during processing
- Progress feedback
- Cancel analysis option

#### 6.3 Performance Optimization
- Bundle size analysis
- Lazy loading optimization
- Memory management for overlays
- API request debouncing

### Phase 7: Final Integration

#### 7.1 End-to-End Testing
- Complete user workflow testing
- API integration validation
- Cross-browser compatibility
- Responsive design verification

#### 7.2 Documentation Updates
- Component documentation
- API endpoint documentation
- Setup and deployment instructions

## Implementation Checklist

### Sprint 1: Foundation
- [x] Install and configure Leaflet dependencies
- [x] Create project file structure
- [x] Define TypeScript interfaces
- [x] Setup basic Next.js page structure
- [x] Configure TailwindCSS for map + panel layout

### Sprint 2: Map Core
- [x] Implement MapComponent with Leaflet integration
- [x] Add OpenStreetMap tile layer
- [x] Create bounds extraction utilities
- [x] Test viewport bounds to GeoJSON conversion
- [x] Handle map interaction events

### Sprint 3: UI Controls
- [ ] Build ControlPanel component
- [ ] Create ModelSelector dropdown
- [ ] Implement "Analyze Current View" button
- [ ] Add loading states and error messaging
- [ ] Style components with TailwindCSS

### Sprint 4: API Layer
- [ ] Create mock API endpoint in api/analyze/route.ts
- [ ] Implement dummy image generation
- [ ] Build useMapAnalysis custom hook
- [ ] Test API request/response cycle
- [ ] Add error simulation and handling

### Sprint 5: Results Display
- [ ] Integrate ImageOverlay for classification results
- [ ] Build Legend component with color coding
- [ ] Handle overlay positioning and bounds alignment
- [ ] Test complete analysis workflow
- [ ] Optimize overlay performance

### Sprint 6: Polish
- [ ] Comprehensive error handling
- [ ] Loading state improvements
- [ ] Performance optimization
- [ ] Cross-browser testing
- [ ] Mobile responsiveness verification
- [ ] Final integration testing

## Development Guidelines

### Code Standards
- **TypeScript**: Strict mode enabled, no `any` types
- **Components**: Functional components with hooks
- **Styling**: TailwindCSS utility classes
- **State Management**: React hooks (useState, useEffect)
- **Error Handling**: Proper try/catch blocks
- **Performance**: Optimize re-renders with useMemo/useCallback

### Testing Strategy
- **Unit Tests**: Utility functions (mapUtils.ts)
- **Integration Tests**: API hook functionality
- **E2E Tests**: Complete user workflow
- **Performance Tests**: Bundle size and load times
- **Browser Tests**: Chrome, Firefox, Safari compatibility

### Git Workflow
- **Feature Branches**: One branch per major component
- **Commit Messages**: Conventional commits format
- **Pull Requests**: Required for main branch
- **Code Review**: Required before merge

## Success Metrics

### Functional
- [ ] Map loads in <2 seconds
- [ ] Viewport bounds extraction <50ms
- [ ] API requests complete in 1-3 seconds
- [ ] Overlay alignment accuracy 100%
- [ ] Error scenarios handled gracefully

### User Experience
- [ ] Intuitive navigation (pan/zoom)
- [ ] Clear visual feedback during processing
- [ ] Responsive design on desktop
- [ ] Accessible color scheme for legend
- [ ] Professional UI appearance

### Technical
- [ ] Bundle size <500KB
- [ ] Memory usage <100MB
- [ ] No console errors
- [ ] TypeScript strict compliance
- [ ] Cross-browser compatibility

## Risk Mitigation

### Technical Risks
- **Map Performance**: Use Leaflet's built-in optimization features
- **Bundle Size**: Implement tree-shaking and code splitting
- **API Reliability**: Robust error handling and retry logic
- **Browser Compatibility**: Test across major browsers early

### Timeline Risks
- **Scope Creep**: Stick to MVP features only
- **Integration Issues**: Daily integration testing
- **Performance Problems**: Regular performance monitoring
- **External Dependencies**: Pin dependency versions

## Future Enhancements

1. **Custom Region Selection**: Add back drawing tools for specific area analysis
2. **Export Features**: Download results as GeoJSON, PNG, or PDF
3. **Historical Analysis**: Compare results across different time periods
4. **Real-time Updates**: WebSocket integration for live processing updates
5. **3D Visualization**: Integration with Three.js or Cesium for 3D biodiversity mapping
6. **Mobile Optimization**: Touch-friendly interface for tablets and phones
7. **Batch Processing**: Analyze multiple viewport areas in sequence
8. **Area Size Limits**: Intelligent handling of very large viewport areas