# 01: Grid engine

Status: Done (2026-11-11; Figma proof passed, see test/unit/engine/figma-proof.test.ts)

Brief: features #1 (expected grid with full Figma parity) and #2 (responsive breakpoints). This spec covers only the maths: no DOM, no rendering.

## Goal

Given a set of layout grids written in Figma's terms and a container size, return the exact rectangles Figma would draw. Given a list of breakpoints and a width, return the active one. Every later visual feature (overlay, snapping, deviations) builds on these numbers, so they must match Figma exactly and be fully unit-tested.

## Decisions

Implements 0002 and 0006 (pure engine in `src/engine/`, no DOM). Uses 0005's vocabulary (the design brief, §8 and §9.1, for names and defaults).

## Figma model (verified 2026-11-11)

The config mirrors Figma's Plugin API `LayoutGrid` type, so that a future import (brief #27, #30) maps one to one. The REST API is the same, except it has no `MAX`.

| Field         | Values                                         | Meaning                                                                                                                                     |
| ------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `pattern`     | `'COLUMNS' \| 'ROWS' \| 'GRID'`                |                                                                                                                                             |
| `alignment`   | `'MIN' \| 'MAX' \| 'CENTER' \| 'STRETCH'`      | UI: Left/Top, Right/Bottom, Center, Stretch. Not used for `GRID`                                                                            |
| `count`       | integer ≥ 1, or `'auto'` (Figma: `Infinity`)   | Number of columns or rows                                                                                                                   |
| `sectionSize` | px > 0                                         | Column width / row height / square size. Ignored for `STRETCH`                                                                              |
| `gutterSize`  | px ≥ 0                                         | Space between sections                                                                                                                      |
| `offset`      | px ≥ 0                                         | Space from the start edge (MIN), from the end edge (MAX), or on both sides (STRETCH, which Figma's UI calls "Margin"). Ignored for `CENTER` |
| `visible`     | boolean, default `true`                        |                                                                                                                                             |
| `color`       | CSS colour string, default `rgba(255,0,0,0.1)` | Figma's default is red at 10%                                                                                                               |

Sources: Figma Plugin API `LayoutGrid` (https://developers.figma.com/docs/plugins/api/LayoutGrid/); REST API file property types (https://developers.figma.com/docs/rest-api/file-property-types/); help article "Create layout guides" (https://help.figma.com/hc/en-us/articles/360040450513).

## Acceptance criteria

### Types and validation: `src/engine/types.ts`, `src/engine/validate.ts`

- [ ] Exported types `LayoutGrid` (a union of the directional and `GRID` shapes), `Breakpoint` (`{ minWidth: number; grids: LayoutGrid[]; name?: string }`) and `Box` (`{ width: number; height: number }`).
- [ ] `normalizeGrid(input)` fills in defaults and returns `{ ok: true, grid }` or `{ ok: false, errors: GridError[] }`. Each error names the field, the value received and how to fix it (Copy rules: say what happened and the fix, and never use the word "invalid"). Examples: a negative gutter, `count: 0`, a fixed alignment without `sectionSize`, a `GRID` without `sectionSize`, a `NaN` or non-finite number.
- [ ] Fields that don't apply to a pattern or alignment (such as `sectionSize` with `STRETCH`, or `offset` with `CENTER`) are ignored silently, as in Figma, but stay listed in a `warnings` array. Both results carry `warnings: GridWarning[]`, so the shape is `{ ok: true, grid, warnings }` or `{ ok: false, errors, warnings }`.

### Geometry: `src/engine/layout.ts`

- [ ] `computeSections(grid, box)` returns `Section[]`, where each section is `{ index, start, size }` along the grid's axis (x for columns, y for rows) in px, relative to the container's top-left corner.
  - **STRETCH:** `size = (L − 2·offset − (n−1)·gutter) / n`; `start_i = offset + i·(size + gutter)`.
  - **MIN:** `start_i = offset + i·(sectionSize + gutter)`.
  - **MAX:** sections end at `L − offset`, so `start_i = L − offset − (n−i)·sectionSize − (n−1−i)·gutter`.
  - **CENTER:** `total = n·sectionSize + (n−1)·gutter`; `start_0 = (L − total) / 2`; offset is ignored.
  - **`count: 'auto'`** (fixed alignments only): `n = floor((A + gutter) / (sectionSize + gutter))`, where the available length `A` is `L − offset` for MIN and MAX, and `L` for CENTER. `count: 'auto'` with `STRETCH` is a validation error (Figma needs a section size to fit columns automatically, and STRETCH has none).
  - `L` is `box.width` for columns and `box.height` for rows.
- [ ] `computeSquares(grid, box)` for `GRID` returns `{ xs: number[]; ys: number[] }`, the line positions every `sectionSize` px starting at 0 and ending at or before the box edge (assumption: Figma's square grid is anchored at the frame's top-left; the Figma proof checks this too).
- [ ] Pixel snapping and clipping follow 0006: each section keeps exact `start` and `size`, plus `snappedStart` and `snappedEnd` (`Math.ceil(v − 0.5)`). `clipSections(sections, L)` returns only the visible parts, clipped to `[0, L]`. Square-grid lines are snapped the same way.
- [ ] Overflow is not an error. If fixed sections don't fit, they are returned as they are, even outside the box. **Assumption to verify in the Figma proof:** Figma draws overflowing fixed sections rather than clipping or hiding them; add a fourth frame to the proof for this. A `STRETCH` grid whose computed size is ≤ 0 returns `[]` with a warning.

### Breakpoints: `src/engine/breakpoints.ts`

- [ ] `pickBreakpoint(width, breakpoints)` returns the breakpoint with the largest `minWidth` that is ≤ `width`. If `width` is below every `minWidth`, it returns the smallest one (so a grid always shows). Input order doesn't matter. Two breakpoints with the same `minWidth` are a validation error.

### Exports

- [ ] Everything is exported from `src/engine/index.ts`. It is **not** re-exported from the package entry `src/index.ts` (0002 keeps the public API to `createGridOverlay`; making the engine public needs a separate decision).
- [ ] The engine imports nothing from the DOM. A lint rule or test makes sure of it: a unit test running in the Node project imports `src/engine` with no `window` defined.

### Tests: `test/unit/engine/*.test.ts`

- [ ] A table of test cases for every alignment × pattern, including: 12-column stretch at 1440 (offset 80, gutter 24 → size 84.666…, i.e. (1440 − 160 − 264) / 12); 8-column stretch at 768; 4-column stretch at 375; MIN/MAX/CENTER with fixed sizes; `auto` count; a `GRID` of 8 px on 100 × 50; and zero gutter.
- [ ] Each case says where its expected numbers came from: either worked out by hand from the formulas above, or read from a real Figma frame (Flovet will check 5 cases in Figma, see Check).
- [ ] Property tests (written by hand, no new dependency): for STRETCH, the sections plus gutters plus 2·offset add up to `L` within 1e-9, and the sections never overlap for any valid input.
- [ ] Each validation error has a test that checks its message.
- [ ] 100% line and branch coverage for `src/engine/` (Vitest coverage with the v8 provider; add `@vitest/coverage-v8` pinned exactly).

## Notes for spec 02 (not built here)

- **Which box:** the engine takes a box but doesn't say whether it's the container's border box, padding box or content box. Figma measures from the frame edge, so spec 02 must decide which CSS box matches a Figma frame (probably the border box, minus scrollbars) and log it as a decision.
- **Rows on a scrolling page:** for a `ROWS` grid on the viewport, `L` could be the viewport height or the document height. Spec 02 decides.

## Out of scope

- Rendering, the DOM, the overlay, shortcuts (spec 02).
- The rendered grid (reading CSS from the DOM) and the comparison of expected vs rendered (later specs, brief #3 and #4).
- Baseline grid (#6), Figma import (#27, #30), variables.

## Edge cases

- `L = 0` (a hidden container): return `[]` with no error.
- MAX or CENTER with `count: 'auto'` and a `sectionSize` larger than `L`: return `[]`.
- Floats in the input (for example `gutter: 0.5`) are allowed.
- `offset` with `CENTER` is ignored, with a warning.
- Very large counts (10,000): no performance problem (O(n)), but a warning above 1,000.

## Files and patterns to follow

- Folders: `src/engine/README.md` (0002). Test layout: `test/unit/` (spec 00).
- Formulas: this spec. The legacy stretch formula is in `docs/notes/legacy-column-formula.md`, but it measured `innerWidth`, which the engine doesn't do: the engine only takes a box.

## Boundaries

- Always: pure functions, `readonly` inputs, no mutation, and full types with no `any`.
- Ask first: any runtime dependency, or any public export from `src/index.ts`.
- Never: DOM access in `src/engine/`, or rounding any other way than 0006.

## Check

- `pnpm check` passes, and coverage for `src/engine` is 100%.
- **Figma proof:** Flovet builds 5 frames in Figma (12-column stretch at 1440/80/24, 4-column CENTER at 80/20 in 375, 3-row MAX at 100/16/offset 24 in 800 tall, plus a 6-column MIN at 300/20 in a 1000-wide frame to check overflow and a 10 px square grid on a 95 × 95 frame to check anchoring) and reads the x/y positions with Alt-measure. The engine's output for those cases must match to 0.01 px. Their screenshots go in the PR description.
- Workflow E review of the diff.

## Accepted changes from the build (Flovet, 2026-11-11)

1. A valid result is `{ ok: true, value, warnings }` (named `value`, not `grid`), so grids and breakpoint lists share one `Result` type.
2. `computeSections` returns `{ sections, warnings }`, so a STRETCH grid that doesn't fit can carry its warning.
3. `count` has no default: leaving it out of a COLUMNS or ROWS grid is an error.
