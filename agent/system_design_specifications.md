# UI/UX Design Specification

## 1. Core Principles
- **Zero Hardcoding**: All navigation items, feature modules, form inputs, and report templates are rendered dynamically from system registry schemas.
- **Strict Minimalism**: High-contrast, utilitarian layout designed for field operators and farmers. No marketing copy, no AI filler text, and no long descriptions.
- **Flat Color System**: Solid hex colors only. Zero CSS gradients (`linear-gradient`, `radial-gradient` are strictly prohibited).
- **No Emojis**: Unicode emojis are banned across the codebase. Visual cues rely strictly on custom 1.5px stroke SVG icons.

## 2. Color Palette (Flat Solids)
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `--bg-primary` | `#F8F9FA` | Main application background |
| `--bg-surface` | `#FFFFFF` | Cards, panels, and input containers |
| `--bg-muted` | `#E9ECEF` | Disabled states, secondary badges, borders |
| `--text-primary` | `#111827` | Primary data values, headers, labels |
| `--text-secondary` | `#4B5563` | Metadata, units, timestamps |
| `--accent-primary` | `#1B4332` | Primary actions, active stage indicators |
| `--status-normal` | `#2D6A4F` | Verified status, optimal thresholds |
| `--status-warn` | `#D97706` | Threshold warnings, low confidence |
| `--status-danger` | `#DC2626` | Critical alerts, manual override required |
| `--border-std` | `#D1D5DB` | 1px solid structural dividers |

## 3. Typography & Copy Rules
- **Font Stack**: `Inter, -apple-system, BlinkMacSystemFont, sans-serif` for UI; `JetBrains Mono, monospace` for sensor telemetry, coordinates, and packet logs.
- **Text Constraints**:
  - Labels: Maximum 3 words.
  - Status messages: Maximum 6 words (e.g., `Soil moisture below threshold: 18%`).
  - Zero conversational or explanatory paragraphs.

## 4. Custom SVG Icon Set
Use strictly 24x24 viewBox, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.5"`.
- `icon-sky`: Drone / Orthomosaic quad-rotor frame.
- `icon-soil`: Ground node / 3-prong probe symbol.
- `icon-ingest`: Upward arrow into tray (Stage 1).
- `icon-engine`: Hexagonal gear / processor node (Stage 2).
- `icon-action`: Target crosshair / actuator valve (Stage 3).
- `icon-verify`: Checkmark inside shield (Closed-loop verification).
- `icon-alert`: Triangle warning outline.

## 5. Layout & Dynamic Shell
- **Top Utility Bar (48px height)**: System status indicator (Online / Edge Local), active plot selector, and emergency kill-switch trigger.
- **Left Feature Rail (220px width)**: Dynamically maps over registered feature engines. Shows icon + short feature title.
- **Main Workspace (Fluid)**: Divided into a fixed 3-Stage Pipeline Header and a dynamic Stage Viewport below it.
  - **Stage 1 View (Ingest)**: Dropzone and serial/stream port selector dynamically configured by the active feature's `inputSchema`.
  - **Stage 2 View (Engine)**: Real-time processing queue, telemetry normalisation log, and rule/model execution state.
  - **Stage 3 View (Output)**: Split view with GeoJSON Zone Map on the left (60% width) and Action/Prescription cards + Verification trigger on the right (40% width).

## 6. Implemented Prototype Notes
- The feature rail, metadata inputs, accepted file formats, and stream controls are manifest-driven.
- The output view uses a color-coded SVG grid for small-screen field inspection and exports GeoJSON with synthetic coordinates.
- Uploaded values and engine results are labeled as simulated until surveyed boundaries, hardware, and calibrated model assets are connected.
