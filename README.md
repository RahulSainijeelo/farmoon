# Soil-to-Sky Edge Field System

An offline-first prototype for ingesting farm telemetry and imagery, running modular agronomic rules, and recording safety-gated actions and follow-up verification.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The workspace is designed to run on a local edge gateway without an internet connection after the app is available on that device.

## Workflow

1. Select one of six registered engines in the feature rail.
2. Add CSV or JSON telemetry, aerial files, or a JSON-line LoRa stream over Web Serial.
3. Normalize the payload, run the engine, review zone status and confidence, and export GeoJSON or actuator command packets.
4. Approve actions. Drone spray actions require all four safety checks. The remote stop blocks dispatch.
5. Ingest a follow-up payload for the same plot to record verification against pending actions.

The local store uses IndexedDB for normalized payloads, uploaded files, engine results, actions, and verification records. Engine execution falls back to deterministic client-side rules when the API is unavailable.

## Architecture

- `core/types/pipeline.ts`: shared manifests, payloads, engine results, actions, and verification contracts.
- `core/registry/engineRegistry.ts`: engine registration and dispatch.
- `core/ingest/`: CSV/JSON normalization and JPEG EXIF GPS/time extraction.
- `core/storage/localEdgeStore.ts`: browser IndexedDB store.
- `engines/`: soil, water, weed, disease, climate, and sensor-fusion engines.
- `app/api/`: ingest, engine, and action route handlers.
- `components/pipeline/`: schema-driven three-stage workspace.
- `components/icons/SystemIcons.tsx`: custom system SVG icon set.
- `agent/`: product, architecture, design, and implementation plans.

## Simulation limits

All recommendations and coordinates are simulation outputs. No actuator is connected. The repository does not include trained image models, orthomosaic segmentation, or hardware credentials; image-derived zones therefore remain illustrative and low-confidence. JPEG EXIF GPS is parsed locally. Other aerial formats need plot coordinates supplied in the ingest form.

The previous prototype routes (`/field`, `/sensors`, `/drone`, `/alerts`, `/actions`, `/verify`, `/farmer`, `/impact`, and `/about`) redirect to the unified workspace.

## Commands

```bash
npm run build
npm run lint
```
