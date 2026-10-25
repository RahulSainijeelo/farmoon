# System Architecture

## Current application

The application is a Next.js App Router workspace with a dynamic three-stage pipeline:

```text
Stage 1: Ingest  ->  Stage 2: Process  ->  Stage 3: Report, act, verify
```

Engine manifests define accepted file types, metadata fields, stream protocol, and supported actuator types. The feature rail and ingest fields read those manifests. Engines return the shared `Stage2Result` contract, which drives the zone map, confidence display, action list, and exports.

## Source layout

```text
app/
  api/ingest/route.ts             # Multipart normalization endpoint
  api/engine/[engineId]/route.ts  # Engine dispatcher
  api/action/route.ts             # Safety gate and simulated command record
  page.tsx                        # Pipeline workspace entry
  layout.tsx                      # Metadata and global CSS
core/
  types/pipeline.ts               # Manifests, payloads, results, actions
  registry/engineRegistry.ts      # Registered engine lookup and dispatch
  ingest/normalize.ts             # CSV, JSON, GeoJSON properties, file validation
  ingest/exif.ts                  # JPEG EXIF GPS and capture-time reader
  storage/localEdgeStore.ts       # IndexedDB persistence
engines/
  soilTelemetryEngine.ts
  waterNeedEngine.ts
  weedMappingEngine.ts
  cropDiseaseEngine.ts
  climateStressEngine.ts
  sensorFusionEngine.ts
components/
  icons/SystemIcons.tsx           # Seven stroke SVG icons
  pipeline/PipelineWorkspace.tsx  # Interactive client workspace
```

The old feature URLs redirect to `/`. The root workspace is the only active UI.

## Data flow

1. The client submits JSON telemetry and selected files as `FormData` to `POST /api/ingest`.
2. The ingest adapter validates the engine, plot metadata, file extensions, CSV headers, and telemetry shape. JPEG EXIF GPS/time are extracted; aerial files without EXIF GPS require plot coordinates.
3. The normalized `Stage1Payload` and uploaded files are saved to IndexedDB. If the local route is unavailable, the same normalizer runs in the browser.
4. `POST /api/engine/[engineId]` calls the registered pure rule module. The client uses that same module as an offline fallback.
5. Results include zone polygons, statuses, confidence, actions, and an explicit simulation flag. The UI renders the result, exports GeoJSON, and exports actuator JSON packets.
6. Spray recommendations require all four safety confirmations. The remote stop blocks simulated dispatch. Approved commands remain `AWAITING_VERIFICATION` until a same-plot follow-up ingest produces a matching zone result.

## Offline storage

`localEdgeStore` uses browser IndexedDB with separate stores for normalized payloads, original uploaded files, engine results, actions, and verification records. No SQLite or cloud sync layer is configured. The app uses local API routes when available and deterministic client-side normalizer/engine fallbacks when they are not.

## Engine boundaries

All six engines are registered through `engineRegistry.ts` and implement a common `process(Stage1Payload)` contract. Soil, water, and climate outputs use deterministic thresholds. Sensor fusion combines available telemetry indicators. Weed and disease modules expose the expected output shape, but image-derived zones are illustrative because no trained models or calibration data are present.

## Prototype limits

- Actuator commands are recorded locally; no drone, pump, or rover receives them.
- GeoJSON coordinates are synthetic grid coordinates, not surveyed plot boundaries.
- JPEG GPS/time extraction is implemented. TIFF metadata extraction and full geometry validation are pending.
- Web Serial reads newline-delimited JSON at 9600 baud. MQTT and HTTP polling are not configured.
- The application does not include model files, cloud synchronization, identity management, or multi-farm access control.
