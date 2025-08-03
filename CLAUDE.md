# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BioSentinel is an interactive platform that uses AI and Sentinel satellite imagery to identify and visualize core and transition biodiversity zones in real-time. The project implements the "core-to-transition" organization pattern described in Nature Ecology & Evolution research.

## Architecture

This is a multi-component system with the following structure:

- **frontend/**: Next.js 15 web application with TypeScript, React 19, and TailwindCSS v4
- **backend/**: API REST service and intermediate processing (currently empty/planned)
- **model/**: AI models, analysis scripts, and Jupyter notebooks (currently empty/planned)
- **data/**: Sentinel satellite imagery and training data storage
- **docs/**: Project documentation and presentations

## Development Commands

### Frontend (Next.js)
All frontend commands should be run from the `frontend/` directory:

```bash
# Development server with Turbopack
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint
```

The frontend uses pnpm as the package manager (evidenced by pnpm-lock.yaml).

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS v4
- **Satellite Data**: Sentinel imagery from Copernicus
- **ML/AI**: Python with PyTorch (planned)
- **3D Visualization**: Three.js or Cesium.js (planned)
- **Maps**: Leaflet or WebGL (planned)

## Current Development Status

- ✅ Initial repository structure
- ✅ Frontend Next.js setup
- ⏳ ML model interpolation prototype
- ⏳ 3D visualization implementation
- ⏳ Backend API development
- ⏳ MVP for presentation

## Project Context

This is a Copernicus LAC 2025 Hackathon project focused on biodiversity visualization using satellite data. The core concept is that biodiversity follows non-random patterns with species concentrating in core zones and filtering to transition zones with lower biological richness.