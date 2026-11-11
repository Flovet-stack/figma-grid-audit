# 03: Control panel: grid settings

Status: Done (https://github.com/Flovet-stack/grid-auditor/pull/4)

Brief: feature #20 (floating control panel), the **Layout guides** section only, and the second part of #19 (`Ctrl/Cmd+Shift+G` opens the panel). This is the first time a user can set and change grids on the page without touching code.

## Goal

A floating panel, inside the existing shadow root, shows the active breakpoint and lets the user edit each of its grids the way Figma's Layout guides section does. Every edit redraws the grid straight away. The panel holds no state of its own: it reads from and writes to the overlay's single store, so code (`update`, `setBreakpoints`) and panel can never disagree about what's on screen.

## Decisions

Implements 0012. Follows 0002 (single store, shadow root, AbortController), 0005 (design brief §8 shortcuts, §9.2–9.4 chrome, §10 placement, §11 components, §12 accessibility), 0006 (snapping is unchanged) and 0010 (validation and merge rules). Builds on spec 02.

## Acceptance criteria

### Opening and placement

- [ ] **Shortcut:** `Ctrl+Shift+G` (Cmd+Shift+G on Mac) toggles the panel. It calls `preventDefault`, because it replaces the browser's "find previous". It follows the spec 02 rules for editable targets, IME composition and capture phase.
- [ ] **Turning it off:** new option `shortcuts.panel?: 'Mod+Shift+G' | false` (default `'Mod+Shift+G'`). This is the only API addition (0005: "every shortcut can be remapped").
- [ ] **New methods:** `GridOverlay.openPanel()`, `closePanel()` and `isPanelOpen()`, so frameworks and tests can drive it without keys. The no-op server-side overlay has them too.
- [ ] **Opening it doesn't show the grid.** The panel can be open while the grid is hidden. The panel's header shows the grid's visibility as a switch that does the same as `Shift+G`.
- [ ] **Placement:** the panel floats 12 px from the top right of the viewport, is 260 px wide, and is never taller than the viewport minus 24 px (the body scrolls inside it). Dragging the header moves it, but it can't be dragged off screen. The position resets on reload (persisting is spec 04).
- [ ] A close button sits in the header, and `Esc` closes the panel while focus is inside it.

### Content (design brief §10)

- [ ] **Breakpoint badge** at the top shows the active breakpoint and a summary of its first grid, for example `Desktop · 12 cols · 24 px gutter`. It updates when the breakpoint switches during a resize.
- [ ] **Layout guides section:** one row per grid in the **active** breakpoint, in the store's order. Each row has:
  - an eye toggle (`visible`)
  - pattern (Columns, Rows, Grid)
  - a colour swatch and an opacity % that together write the grid's `color`
  - for Columns and Rows: count (a number, or `Auto` when alignment isn't Stretch), alignment (Stretch, Left/Top, Center, Right/Bottom, using Figma's labels), gutter, and **Margin** for Stretch or **Offset** otherwise (Figma's labels), plus width or height for non-Stretch
  - for Grid: size
- [ ] **Add and remove:** a "+" button adds a grid to the active breakpoint, using the engine's defaults for a Columns grid. Each row has a remove button. Removing the last grid leaves the breakpoint with none, which is allowed, and nothing is drawn.
- [ ] **Number fields (§11):** mono, tabular numbers, with the unit shown. Arrow keys step by 1, Shift+arrow by 10, and Enter or blur commits. Scrubbing by dragging the label is out of scope.

### Edits and the store

- [ ] **Edits go through the store.** Each commit is the same as calling `setBreakpoints` with that breakpoint's grids (0010 merge and validation), and it redraws on the next frame.
- [ ] **Invalid values:** the field shows an inline error saying what to fix (for example "Count must be 1 or more"), linked with `aria-describedby`. The last valid grid stays on screen. Nothing throws, and nothing is logged.
- [ ] **Code wins:** `update()` or `setBreakpoints()` from code replaces any panel edits, and the panel re-renders from the store. This is documented in the README.
- [ ] **Only the active breakpoint is edited.** Resizing into another breakpoint shows that breakpoint's grids, and edits to the first one are kept in the store.

### Non-invasive and accessible (brief constraints, design brief §12)

- [ ] **Still one host element.** `aria-hidden="true"` moves from the host to the marks layer. The host keeps `pointer-events: none`, and only the panel sets `pointer-events: auto`.
- [ ] **Focus:** opening the panel doesn't move focus. The panel is a labelled region (`role="dialog"`, `aria-modal="false"`, name "Grid Auditor") reachable with Tab. Focus is never trapped.
- [ ] **Keys stay inside:** key events from inside the panel never trigger the page's own shortcuts, using `stopPropagation` on events that come from the panel's own controls only. Our own shortcuts are ignored while typing in a panel field (the spec 02 editable rule already covers this through `composedPath`).
- [ ] **Clicks stay inside:** pointer events on the panel don't reach the page. Pointer events anywhere else are unchanged.
- [ ] **Chrome look (§9.2–9.4, §11):**
  - dark chrome, one accent, a 1 px border and a soft shadow
  - 11–12 px system-ui labels and 11 px mono values
  - 32 px rows, an 8 px panel radius and a 6 px control radius
  - controls of at least 24 × 24 px
  - toggles are `role="switch"`
  - a visible focus ring at 3:1
  - text contrast of 4.5:1
  - a 120 ms fade that is off under `prefers-reduced-motion`
  - inline SVG icons, each next to a visible label or with an accessible name

  Exact hex values are chosen here and listed as CSS custom properties in `render.ts`'s styles.

## Tests (browser, Chromium)

1. **Open and close:** `Ctrl+Shift+G` opens and closes the panel and is prevented. With `shortcuts.panel: false` it does nothing. `openPanel()` and `closePanel()` work. `Esc` inside the panel closes it.
2. **Badge:** at 1440 it reads `Desktop · 12 cols · 24 px gutter`. At 800 it reads Tablet.
3. **Live edit:** changing Desktop's count to 16 in the panel gives 16 column elements after one frame. The positions match the engine (as in spec 02 test 1).
4. **Invalid:** typing `0` in count shows the error, sets `aria-invalid`, keeps 12 columns, and throws nothing.
5. **Add, remove and visibility:** add a Rows grid, and row marks appear. Remove it, and they're gone. The eye toggle hides one grid only.
6. **Code wins:** after a panel edit, `setBreakpoints(...)` replaces it, and the panel shows the new values.
7. **Non-invasive:**
   - spec 02 test 3 passes with the panel open
   - a click on a page button outside the panel still fires
   - a page `keydown` listener doesn't see keys typed in a panel field
   - `document.activeElement` doesn't change on open
8. **Accessibility:** every control has an accessible name. `axe-core`, run as a **dev** dependency in tests only, reports no violations for the panel. Tab reaches every control, and the focus ring is visible.
9. **Off-screen:** dragging the header past the viewport edge keeps the panel fully visible.

## Out of scope

- **Other panel sections:** Compare, Snapping, Guides and Shortcuts.
- **Not built yet:** the toolbar, the light theme, the 125% scale, label scrubbing, and editing breakpoints themselves (names, `minWidth`, adding a breakpoint).
- **Saving and pasting:** persisting edits or panel position, and "Copy config" (spec 04). Paste from Figma (#27).
- **Later features:** the inspector, comparison and the container overlay.

## Edge cases

- **A narrow viewport (360 px):** the panel is `min(260px, 100vw − 24px)` wide and stays usable.
- **A breakpoint switch while a field is focused:** the uncommitted value is dropped. Focus moves to the panel heading, not out to the page.
- **The page uses `rem` or zoom:** the panel uses px only, so the host's root font size can't resize it.
- **A host page with `* { box-sizing: content-box !important }`:** the shadow root isolates the panel. Spec 02's style-isolation test is extended to the panel.

## Files and patterns to follow

- New `src/overlay/panel.ts`: builds the DOM and dispatches to the store. Any styles beyond `STYLES` in `render.ts` live in a `panel` block of the same single `<style>`.
- Store and actions: `src/overlay/create.ts`. Add one internal `setGrids(breakpointName, grids)` path that reuses `parse`.
- Shortcuts: `src/overlay/shortcuts.ts` (add `Mod+Shift+G`).
- Tests: `test/browser/panel.test.ts`.

## Boundaries

- Always: the panel reads only from the store; one AbortController; no global CSS.
- Ask first: any runtime dependency, any public API beyond `shortcuts.panel`, `openPanel`, `closePanel` and `isPanelOpen`, and any change to engine behaviour.
- Never: read `process.env`; trap or move focus away from the page on open; `stopPropagation` on events that didn't start in the panel.

## Check

- `pnpm check` passes, including the browser tests above.
- Screenshots of the playground with the panel open at 390 × 844 and 1440 × 900, plus one after a live edit, attached to the PR.
- `/product-team` Workflow E on the diff.
