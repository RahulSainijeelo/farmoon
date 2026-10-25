# Development Task Breakdown

## Phase 1: Foundation & Dynamic Registry
- [x] **1.1 Project Initialization**: Configure Next.js App Router, TypeScript, and flat CSS color tokens.
- [x] **1.2 Universal Contracts**: Create `core/types/pipeline.ts` defining `FeatureManifest`, `Stage1Payload`, `Stage2Result`, actions, and verification records.
- [x] **1.3 Engine Registry**: Implement `core/registry/engineRegistry.ts` for engine registration, lookup, and dispatch.
- [x] **1.4 Custom SVG Icon Library**: Build `components/icons/SystemIcons.tsx` with seven stroke-based system icons.
- [x] **1.5 Offline Edge Store**: Build `core/storage/localEdgeStore.ts` with IndexedDB stores for normalized payloads, uploaded files, engine results, actions, and verifications.

## Phase 2: Stage 1 — Hardware Data Ingestion Layer
- [x] **2.1 Dynamic Ingest Component**: The workspace renders file input and metadata fields from the active manifest.
- [ ] **2.2 Spatial & EXIF Parser**: JPEG EXIF GPS/time, CSV, and JSON parsing are implemented. TIFF EXIF and full GeoJSON geometry validation remain.
- [x] **2.3 Serial / LoRa Packet Receiver**: Web Serial reads newline-delimited JSON packets from a gateway at 9600 baud.
- [x] **2.4 Stage 1 API Endpoint**: `POST /api/ingest` validates and normalizes file uploads and telemetry into `Stage1Payload`.

## Phase 3: Stage 2 — Modular Feature Engines
- [x] **3.1 Engine Dispatcher**: `POST /api/engine/[engineId]` dispatches to the registered processor.
- [x] **3.2 Soil & Climate Telemetry Engine**: Implemented deterministic threshold evaluation for soil moisture, temperature, humidity, and pH packets.
- [x] **3.3 Water-Need Forecasting Engine**: Implemented a deterministic irrigation demand estimate from moisture deficit and crop stage.
- [ ] **3.4 Drone Weed Mapping Engine**: The interface emits illustrative zones and spray commands; orthomosaic segmentation and calibrated doses need model data.
- [ ] **3.5 Crop Disease & Stress Engine**: The interface emits low-confidence illustrative results; RGB/thermal inference and leaf confirmation need model data.
- [ ] **3.6 Soil-to-Sky Sensor Fusion Engine**: A deterministic telemetry risk combiner exists; aerial/ground fusion and false-positive validation remain.

## Phase 4: Stage 3 — Reports, Actuators & Closed-Loop Verification
- [x] **4.1 Dynamic Report Renderer**: Render zone metrics, statuses, confidence, and recommended actions from `Stage2Result`.
- [x] **4.2 Prescription Map Component**: Render a color-coded SVG zone grid and export zone polygons as GeoJSON. Coordinates are explicitly synthetic.
- [x] **4.3 Actuator Command Generator**: Approve safety-gated actions and export GeoJSON or actuator command JSON for drone, valve, rover, and SMS outputs.
- [x] **4.4 Closed-Loop Verification Tracker**: Link same-plot follow-up ingests to pending actions and persist before/after status records.

## Implementation Boundary

This prototype is fully wired for deterministic rules and simulated outputs. No actuator dispatch, image model inference, calibrated field map, MQTT transport, or cloud synchronization is configured. Image-analysis engines must remain marked as simulated until model assets and validation data are added.
