# 02: Overlay renderer

Status: In progress (amendment A1 for 0010; the original scope was done 2026-11-11)

Brief: features #1 (expected grid overlay), #2 (responsive breakpoints) and #25 (client-only), plus the first part of #19 (the toggle shortcut). This is the first spec a user can actually see.

## Goal

`createGridOverlay(options)` draws the expected grid for the current breakpoint over the whole page, exactly where Figma would draw it. It updates when the window or the page resizes, toggles with `Shift+G`, and leaves no trace when destroyed. It must never change the host page's layout, styles, scrolling, focus or key handling.

## Decisions

Implements 0002 (API, single store, open shadow root, cleanup with AbortController), 0004 (dev-only import), 0005 (shortcuts §8, mark style §9.1), 0006 (snapped and clipped edges) and 0007 (padding box, document space, breakpoints by `innerWidth`). Uses the engine from spec 01.

## Acceptance criteria

### Public API: `src/index.ts`

- [ ] `createGridOverlay(options): GridOverlay` is exported, along with the types it needs. `version` and `MARKER` stay exported. The engine stays internal.
- [ ] `options`:
  - `breakpoints: BreakpointInput[]` (required)
  - `visible?: boolean` (default `true`)
  - `shortcuts?: { toggle?: 'Shift+G' | 'Mod+G' | false }` (default `'Shift+G'`; `Mod` means Cmd on Mac and Ctrl elsewhere; `false` turns the shortcut off)
- [ ] `GridOverlay` has `show()`, `hide()`, `toggle()`, `isVisible(): boolean`, `update(options)` and `destroy()`.
- [ ] Options are checked with `normalizeBreakpoints`. If they have errors, `createGridOverlay` throws one `Error` that lists every field and fix. Warnings go to `console.warn` once, each with a `[figma-grid-audit]` prefix.
- [ ] Creating a second overlay while one exists returns **the same instance**, updated with the new options, and warns once. After `destroy()`, a new call creates a fresh overlay.
- [ ] Every function is safe to call during server rendering: with no `window`, `createGridOverlay` returns a no-op `GridOverlay` without throwing.

### Rendering: `src/overlay/`

- [ ] **One host element** is appended to `document.documentElement`, with an **open** shadow root and `aria-hidden="true"`. It has `position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 2147483646; contain: strict`. A fixed host doesn't add to the page's scrollable size; this is required, not just a choice.
- [ ] **Document space (0007):** a layer inside the shadow root is sized to the page target (`documentElement.clientWidth` × `scrollHeight`) and moved with `transform: translate(-scrollX, -scrollY)`, updated on `scroll` (passive) at most once per animation frame. Rows and squares stay attached to the content as you scroll.
- [ ] **Columns and rows:** one element per visible section from `clipSections`, positioned with whole-pixel `left`/`width` (or `top`/`height`) from `visibleStart` and `visibleEnd`. Fill is the grid's `color`. The 1 px edge (0005 §9.1) uses CSS relative colour, `rgb(from <color> r g b / calc(alpha * 2.5))`, inside `@supports`; without support, no edge is drawn.
- [ ] **Square grids:** one element with a `repeating-linear-gradient` background in each direction, `sectionSize` px apart and anchored at (0, 0). There is no element per line, so a 50,000 px page stays cheap.
- [ ] **Several grids** in one breakpoint are stacked in the order given. `visible: false` grids are not drawn (0006: they still exist for later snapping specs).
- [ ] **Updates:** a `ResizeObserver` on `documentElement` and `body`, plus window `resize`, all batched into one recompute per animation frame. Recompute = pick the breakpoint by `window.innerWidth`, measure the target, run the engine, and replace only the marks that changed (or all of them; the spec doesn't require diffing, but there must be no flicker).
- [ ] The shadow root holds the only `<style>`. No style, class, attribute or listener is added anywhere else in the host document, apart from the host element itself and the listeners below.

### Shortcuts (0005 §8)

- [ ] Default `Shift+G` toggles visibility. Its event's default is **not** prevented (Shift+G has no browser action).
- [ ] With `toggle: 'Mod+G'`, Cmd/Ctrl+G toggles and **does** call `preventDefault`, because it replaces the browser's "find next". `Shift+G` then does nothing.
- [ ] Shortcuts are ignored when the event's real target (`event.composedPath()[0]`) is an `input`, `textarea` or `select`, is `contenteditable`, or is inside one. This includes targets inside other shadow roots. Shortcuts are also ignored while an IME composition is in progress (`event.isComposing`), and when Alt or Ctrl/Cmd is also held (for `Shift+G`).
- [ ] One `keydown` listener on `window`, in the capture phase, so the page's own `stopPropagation` can't block it. It never calls `stopPropagation` itself.

### Teardown

- [ ] `destroy()` removes the host element, disconnects every observer, cancels any pending animation frame, and removes every listener through one `AbortController`. Calling it twice is safe.

### Playground

- [ ] `playground/src/main.ts` creates an overlay that matches the playground's CSS: below 1200 px, 12 STRETCH columns with offset 24 and gutter 24; from 1200 px, 12 CENTER columns of 74 with gutter 24 (1200 − 2·24 = 1152 = 12·74 + 11·24). Still inside the dev-only branch (0004).
- [ ] Add a second playground page, `playground/rows.html`, that is 3,000 px tall with an 8 px square grid and 24 px rows, to check scrolling by eye.

## Tests (browser project, Chromium)

Each test builds its own fixture page inside the test document and calls `destroy()` afterwards.

1. **Position:** at viewport 1440 × 900 and 375 × 812 (`page.viewport`), every column element's `getBoundingClientRect()` equals the engine's `visibleStart`/`visibleEnd`, to 0 px.
2. **Lines up with real CSS:** a fixture that copies the playground's 12-column CSS grid. At 1440 and at 1000, the left edge of each of its 12 grid items equals the matching column's left edge, to ≤ 0.5 px. This is the first end-to-end proof that expected-grid maths matches the browser.
3. **Non-invasive:**
   - `scrollWidth`, `scrollHeight` and a sample of page element rects are identical before and after creating the overlay.
   - `document.activeElement` doesn't change.
   - Clicking a page button underneath a column still fires the button's click handler.
4. **Style isolation:** a page rule `div { background: blue !important; display: none !important }` doesn't change the overlay. The overlay's styles don't change a page `div`.
5. **Shortcuts:** Shift+G toggles. Nothing happens when typing in an `input`, a `textarea`, a `contenteditable` element, an `input` inside an open shadow root, or during IME composition. With the default settings, Cmd/Ctrl+G is not prevented; with `toggle: 'Mod+G'`, it is prevented and toggles.
6. **Breakpoints and scrollbar (0007):** on a page with a vertical scrollbar and CSS that changes at `min-width: 768px`, the overlay's breakpoint changes at exactly the same `innerWidth` as the CSS.
7. **Document space:** on a 3,000 px page with 24 px rows, after `scrollTo(0, 500)` and one frame, the first visible row's top on screen is −500 + 0 (still attached to the document).
8. **Lifecycle:** a second `createGridOverlay` returns the same object; `destroy()` leaves no host element in the document; a key press after `destroy()` doesn't throw or toggle anything; `destroy()` twice is fine.
9. **Errors:** a breakpoint with `count: 0` throws an error whose message contains `[0].grids[0].count` and the fix text.

## Amendment A1: editable default breakpoints (0010)

Implements 0010. Where A1 conflicts with the criteria above, A1 wins.

### Engine: `src/engine/`

- [ ] `DEFAULT_BREAKPOINTS`, frozen (with nested objects frozen too), with the exact values in 0010: Mobile 0 (4 stretch, 16/16), Tablet 768 (8 stretch, 24/24) and Desktop 1200 (12 stretch, 80/24). All grids use the default colour.
- [ ] A pure `mergeBreakpoints(defaults, input, extendDefaults)` that never mutates its inputs:
  - An entry whose `name` matches a default is deep-merged into it: a field the entry leaves out keeps the default value, and `grids` merge index by index.
  - An entry with a new `name` is added. If it has no `minWidth` or no grids, the error names the field and gives the fix.
  - With `extendDefaults: false`, the input is used as it is.
  - The output is sorted by `minWidth`. If two breakpoints share a `minWidth`, one error names both.
  - The output then goes through `normalizeBreakpoints` as before.
- [ ] Unit tests cover: no input (gives the defaults); editing one field of Desktop; adding a 1024 breakpoint between Tablet and Desktop; the opt-out; a duplicate `minWidth`; a new breakpoint with no `minWidth`; inputs left unmutated. Coverage of `src/engine` stays at 100%.

### Public API

- [ ] `createGridOverlay(options?)`: `options` and `breakpoints` are both optional.
- [ ] New option: `extendDefaults?: boolean` (default `true`).
- [ ] New method: `GridOverlay.setBreakpoints(breakpoints, { extendDefaults? })` applies the same rules and redraws on the next frame. Invalid input throws, and the old grid stays on screen. `update(options)` also goes through the merge.
- [ ] New export: `DEFAULT_BREAKPOINTS`.
- [ ] The no-op overlay used during server rendering also has `setBreakpoints`.

### Playground

- [ ] `main.ts` calls `createGridOverlay()` with no breakpoints.
- [ ] `style.css` matches the defaults:
  - Mobile: 4 columns, 16 px padding and gap.
  - From 768: 8 columns, 24 px padding and gap.
  - From 1200: 12 columns, 80 px padding, 24 px gap.
  - These replace the old 1200 px container and 12-column layout.
- [ ] `rows.html` stays as it is.

### Tests (browser)

10. **Defaults:** with no options, there are 4, 8 and 12 column elements at widths 375, 1024 and 1440, and each one's position matches the engine.
11. **Lines up with the playground CSS:** test 2, rerun with the new playground CSS at 375, 1024 and 1440 (≤ 0.5 px).
12. **Live edit:** `setBreakpoints([{ name: 'Desktop', grids: [{ count: 16 }] }])` at 1440 gives 16 columns after one frame, with no new host element. An invalid call throws and keeps 12 columns.
13. Tests 2 and 6 move from the old `PLAYGROUND` config to the defaults.

### Docs

- [ ] README: the defaults table, editing a default, adding a breakpoint, `extendDefaults: false`, and `setBreakpoints`.

## Out of scope

Rulers, guides, panel, toolbar (later specs). The rendered grid, deviations and container targets (brief #3–5). Baseline grid. The React entry and the other framework entries. `Ctrl/Cmd+Shift+G`. Persisting the visibility state.

## Edge cases

- **The page changes height** (content loads): the `ResizeObserver` on `body` updates the layer height.
- **`html { overflow: hidden }`**: there are no scroll events, and the layer simply stays at (0, 0).
- **Zoom and a `devicePixelRatio` of 2:** snapped edges are whole CSS pixels, so lines stay sharp at any whole-number zoom. A fractional zoom may blur 1 px edges, which is acceptable.
- **Body with a CSS transform or `filter`:** our host is a child of `<html>`, not `<body>`, so `position: fixed` still refers to the viewport.
- **A page that already uses z-index 2147483647:** that element shows above our overlay. This is acceptable and documented: we're one below, so the panel in later specs can sit above our own grid.

## Files and patterns to follow

- `src/overlay/` for the renderer, store and shortcuts. `src/index.ts` for the public API only.
- Engine: `src/engine/index.ts` (`normalizeBreakpoints`, `pickBreakpoint`, `computeSections`, `clipSections`, `computeSquares`).
- Tests: `test/browser/`. Viewport control: `page` from `vitest/browser`.

## Boundaries

- Always: one shadow host; whole-pixel positions from the engine; one AbortController for every listener.
- Ask first: any runtime dependency, any public API not listed above (A1 adds `extendDefaults`, `setBreakpoints` and `DEFAULT_BREAKPOINTS`), any change to engine behaviour.
- Never: read `process.env`; touch `document.body`'s styles or attributes; call `stopPropagation`; call `preventDefault` except for `Mod+G` when it's turned on.

## Check

- `pnpm check` passes, including all browser tests above.
- Screenshots of the playground at 390 × 844 and 1440 × 900, and of `rows.html` scrolled to 1000 px, attached to the PR.
- Workflow E review of the diff, including the non-invasive checks.
