# Project Memory

- The active product is the Soil-to-Sky Edge Field System.
- The root route hosts the dynamic Ingest → Process → Output workspace.
- Engine contracts and registration are in `core/types/pipeline.ts` and `core/registry/engineRegistry.ts`.
- IndexedDB persists local payloads, uploaded files, engine results, actions, and verification records.
- API routes use shared engine modules; the client can run the same deterministic modules offline.
- All current engine outputs and coordinates are simulated. No field actuators or image models are connected.
- Current rebuild requirements: [agent/product_requirements_document.md](../agent/product_requirements_document.md).
- Current implementation progress: [agent/implementation_tasks.md](../agent/implementation_tasks.md).
