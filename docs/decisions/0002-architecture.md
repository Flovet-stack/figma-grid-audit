# 0002: Architecture: pure engine, one renderer, vanilla API

- **Status:** Approved
- **Proposed:** 2026-11-11 by the product team (roles: Tech Lead, Frontend, UX)
- **Approved:** 2026-11-11 by Flovet
- **Supersedes:** none
- **Specs:** specs/01-grid-engine.md

## Context

The current state lives in the DOM, the panel and the config at the same time (C4). The math only covers Stretch (H1), measures the wrong width (H2), and teardown leaks listeners (H4).

## Research

| Reference          | What they do                                                                                           | Adopt / adapt / reject | Why                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------ | ---------------------- | ---------------------------------------------------------------------------------------------------- |
| React Scan         | Wrapper div plus shadow root, explicit `remove()`                                                      | Adopt                  | Clean, idempotent lifecycle                                                                          |
| VisBug             | One shared token stylesheet in Shadow DOM                                                              | Adopt                  | Theming through CSS variables (fixes H5)                                                             |
| Figma layout grids | Columns, rows and grid patterns; stretch/min/center/max alignment; count, gutter, offset, section size | Adopt the exact model  | That's the product's promise (verify the fields against the Figma REST `LayoutGrid` type in spec 01) |

## Decision

- `engine/`: pure functions `(gridSpec, containerBox) → rects[]`. No DOM. 100% unit tested.
- `overlay/`: one **open** shadow root, rendering from a single store `{ grids, visible, target }`. Cleanup through `AbortController`. `init()` is idempotent.
- Keys: one configurable toggle (default `Ctrl+Shift+G`). Events are ignored when they come from inputs, textareas or contenteditable elements. Default actions are never blocked otherwise.
- Public API: `createGridOverlay(options) → { show, hide, toggle, update, destroy }`. Optional `/react` entry with `<GridOverlay />` that handles StrictMode and stable options.
- Vue and Svelte wrappers are dropped. The vanilla API is the adapter.

## Consequences

The engine is testable without a browser. Renderer tests need browser mode. The API break is fine because nothing is published yet.
