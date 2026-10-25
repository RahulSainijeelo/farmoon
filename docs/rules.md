# Development Rules

- Follow the Next.js guidance installed with this project before changing App Router APIs.
- Keep engine logic independent from UI components and register new modules through `core/registry/engineRegistry.ts`.
- Validate uploaded data before processing. Preserve plot IDs, source timestamps, and file metadata.
- Mark demo values, generated coordinates, and rule outputs as simulated.
- Require explicit human approval and all four checklist items for chemical spray actions.
- The remote stop must block action recording.
- Keep all browser-only APIs inside client components or browser-safe utility paths.
- Store local records through `core/storage/localEdgeStore.ts`; do not claim cloud synchronization.
- Maintain the flat palette, compact labels, accessible controls, and responsive workspace defined in `agent/system_design_specifications.md`.
