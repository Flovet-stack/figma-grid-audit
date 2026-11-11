# Standard Operating Procedure (SOP): Figma Grid Audit Development

This document serves as the primary source of truth for any AI agent or developer picking up work on this project.

## 🎯 Project Goal
Build a framework-agnostic npm package that allows developers to visualize Figma-style layout grids in the browser and perform high-precision geometry audits of the rendered DOM.

## 🏗️ Technical Architecture
The project follows a **Core + Wrapper** architecture to ensure it is non-invasive and framework-agnostic.

### 1. The Core (`/src/core`)
- **Language:** Pure TypeScript.
- **Isolation:** ALL UI elements (Grid, Rulers, Control Panel) must be rendered inside a **Shadow Root**.
- **Styling:** Inject CSS strings directly into the Shadow Root to avoid external dependencies.
- **Logic:** 
    - Math-based grid calculation: `(ViewportWidth - (2 * Margin) - ((Count - 1) * Gutter)) / Count`.
    - Event-driven state management for visibility, breakpoints, and pinning.
    - Use `pointer-events: none` on the main overlay, `pointer-events: auto` on interactive elements.

### 2. The Wrappers (`/src/wrappers`)
- Thin adapters for React, Vue, and Svelte.
- These wrappers should only handle the lifecycle (init on mount, destroy on unmount).

### 3. Build Pipeline
- **Bundler:** `tsup` (esbuild) for fast ESM/CJS output.
- **Production:** Ensure the package is tree-shakable and provides no-op functions when `NODE_ENV === 'production'`.

## 🛠️ Development Workflow
When adding new features:
1. **Update Core Logic:** Implement the math or DOM manipulation in the Vanilla TS core.
2. **Shadow DOM Integration:** Add the necessary HTML/CSS into the Shadow Root logic.
3. **Interaction Layer:** Map keyboard shortcuts or mouse events to the Core state.
4. **Verify Non-Invasiveness:** Ensure the tool does not shift the host app's layout (check for `position: fixed` and `z-index` conflicts).

## 📌 Feature Roadmap Priority
1. **Phase 1 (The Reference):** Declarative Grid $\rightarrow$ Responsive Breakpoints $\rightarrow$ Shadow Root Overlay.
2. **Phase 2 (The Inspection):** Rulers $\rightarrow$ Draggable Guides $\rightarrow$ DOM Snapping.
3. **Phase 3 (The Audit):** Pin-and-Compare $\rightarrow$ Distance Measuring $\rightarrow$ Control Panel.
4. **Phase 4 (The Synergy):** Grid-Snapping Guides $\rightarrow$ Deviation Highlighting.

## ⚠️ Critical Constraints
- **NO** external CSS frameworks (Tailwind, Bootstrap, etc.).
- **NO** heavy dependencies in the Core.
- **ALWAYS** ensure `pointer-events` are managed to prevent blocking the app's functionality.
- **NEVER** modify the host document's global CSS.
