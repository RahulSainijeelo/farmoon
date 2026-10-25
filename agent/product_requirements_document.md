# Product Requirements Document (PRD)

## 1. Product Overview
An offline-capable, Next.js web application for the **Integrated Soil-to-Sky Autonomous Farming System**. The platform connects aerial drone imagery and ground LoRa sensor telemetry into a closed-loop workflow (`Ingest -> Process -> Act & Verify`) tailored for smallholder farm operations.

## 2. Core Functional Requirements

### FR-1: Zero-Hardcode Feature Extensibility
- The UI must not contain hardcoded pages or static forms for individual farm parameters.
- Adding a new farm parameter or hardware sensor requires only registering a new engine module conforming to `FeatureManifest`.

### FR-2: Stage 1 — Multi-Modal Hardware Data Ingestion
- **Aerial Data**: Accept RGB imagery, thermal/multispectral rasters, and pre-stitched orthomosaic tiles with embedded GPS metadata.
- **Ground Data**: Accept batch `.csv`/`.json` logs or live serial/network streams from ESP32-class sensor nodes (soil moisture, temperature, humidity, pH, solar/climate).
- **Validation**: Reject malformed packets or missing geospatial keys immediately at ingest with concise error codes.

### FR-3: Stage 2 — Autonomous Feature Engines
- **Multi-Parameter Support**: Must process at least 6 farm parameters across registered engines:
  1. Soil Status (Moisture, pH, Temp)
  2. Water Need (Irrigation volume & timing)
  3. Weed Detection (Spatial patch segmentation)
  4. Pest/Disease Alerts (Foliage classification & confidence)
  5. Crop Condition / Canopy Stress (Thermal/RGB indices)
  6. Sunlight & Microclimate (Ambient temp/humidity anomalies)
- **Uncertainty & Confidence**: Every engine output must calculate a numeric confidence score (`0.0 - 1.0`). Low-confidence detections (`< 0.75`) automatically flag `requiresHumanApproval = true`.

### FR-4: Stage 3 — Actionable Reports & Closed-Loop Verification
- **Zone-Wise Prescription Map**: Render spatial zones with flat status colors indicating where intervention is required.
- **Targeted Actuator Outputs**:
  - Exportable drone spray prescription map (GeoJSON/Waypoint format).
  - Irrigation valve/pump trigger payload (duration in minutes, target zone).
  - Ground robot inspection task coordinates.
  - Plain-language SMS/voice advisory string for local farmer dispatch.
- **Human-in-the-Loop Safety**: Chemical spray actions require explicit operator confirmation and provide a permanent manual kill-switch in the top utility bar.
- **Verification Loop**: Each executed action remains in an `AWAITING_VERIFICATION` state until a subsequent Stage 1 scan is ingested for the same plot, automatically generating a verification report (Problem Resolved vs. Persist).

## 3. Non-Functional Requirements
- **NFR-1 Visual Compliance**: Strictly zero gradients, zero emojis, zero AI-generated conversational filler, and concise 1-3 word labels.
- **NFR-2 Offline Degradation**: Must function on a local field edge gateway without active internet using local browser storage and local API routes.
- **NFR-3 Performance**: Stage 1 file parsing and Stage 2 local inference/rule execution must complete within `< 3 seconds` for standard sensor packets and `< 10 seconds` for image tiles.