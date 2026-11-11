# Project brief: Figma Grid Audit

Last updated: 2026-11-11

This brief describes the whole product. It does not change when a phase or sprint is planned: phase plans and task specs live in `specs/`.

## Product

- What it is: an in-browser overlay for a running web app that shows two grids side by side. One is the **expected grid** (the layout grid from Figma); the other is the **rendered grid** (the structure the browser actually laid out). It adds rulers, guides and geometry tools so developers can see where the two differ.
- Users and their main job: front-end and design engineers building from Figma who need to check spacing and alignment against the real DOM instead of switching back and forth with static mocks.
- Core loop: set the expected grid (pasted from Figma) → turn on the overlay → compare it with the rendered grid → place guides and measure → find each deviation and fix it → resize through the breakpoints and repeat.
- Differentiators:
  - **Expected vs rendered.** Other overlays draw one configured grid. We draw both the Figma spec and the grid the page actually produced, and highlight where they disagree.
  - Exact Figma layout-grid parity: columns, rows and grid patterns; stretch, min, center and max alignment; offsets and section sizes; per breakpoint.

### Definitions

- **Expected grid:** the layout grid the design calls for, from the user's config (Figma's values).
- **Rendered grid:** the grid read from the live DOM: CSS Grid tracks and gaps, flex rows and their gaps, and the content box of the chosen container. The page's layout drawn as columns, not a configured overlay.
- **Deviation:** an expected line and the nearest rendered edge that differ by more than a tolerance (default 1 px).

## How scope is delivered (rules for AI agents)

- The features below are the full planned scope. They are built **gradually, one small piece at a time**.
- **Never implement more than the current task spec asks for.** Never attempt several features at once, and never build a feature "while you're there".
- The current task is always defined by a spec in `specs/`. If no spec covers it, ask before building.
- **Nothing runs without approval.** The product team (product-team skill) researches and makes every product, UX, UI and architecture decision, and Flovet approves each one. No feature or execution starts until the decisions behind it are logged in `docs/decisions/` and approved.
- Phase plans never edit this brief. Only a decision Flovet has approved changes it.
- Later features may shape design choices (for example, leave room in the store), but are not built early.

## Full feature scope

Tags: **[ref]** = a feature GuideFrame has (https://guide-frame.vercel.app/), which is our baseline for parity. **[ours]** = our differentiator. **[research]** = needs a feasibility check before a decision.

### Must have

**Grids**

1. Expected grid overlay: columns, rows and grid patterns with Figma's alignment types, count, gutter, offset and section size. Several grids can be stacked. **[ref]** **[ours: full Figma parity]**
2. Responsive breakpoints: a different expected grid per viewport width, switching automatically. **[ref]**
3. Rendered grid overlay: draws the grid the page actually laid out (CSS Grid tracks and gaps, flex gaps, the container's content box) for a chosen container or the hovered one. **[ours]** **[research]**
4. Expected vs rendered comparison: show either grid or both, each in its own colour, with deviations highlighted and their size in px. **[ours]**
5. Container-scoped overlays: scope a grid to one element (such as a centred max-width wrapper) instead of the viewport. **[ref]**
6. Baseline grid: horizontal rhythm lines. **[ours]**

**Rulers and guides**

7. Rulers with ticks in document space (they follow the scroll). Shift+R toggles them. **[ref]**
8. Draggable guides pulled from either ruler. **[ref]**
9. Option/Alt-drag duplicates a guide. **[ref]**
10. Shift-drag selects several guides. **[ref]**
11. Arrow keys nudge the selected guides (Shift+Arrow for bigger steps). **[ref]**
12. Lock every guide with Shift+L. **[ref]**
13. Undo the last guide change with Shift+Z. **[ref]**
14. Snapping, toggled separately: to element edges, to columns (expected and rendered), and to other guides. **[ref]**
15. Clear all guides. **[ref]**
16. Guides saved per route, kept across reloads. **[ref]**

**Geometry**

17. Geometry inspection: dimensions, padding, gaps and alignment of the hovered element. Shift+M toggles it. **[ref]**
18. Pin and compare: pin one element and read exact distances to another. **[ref]**

**Controls**

19. Toggle the overlay with Cmd/Ctrl+G, and open the floating control panel with Cmd/Ctrl+Shift+G. **[ref]**
20. Floating control panel: switches for each layer, snapping options, grid settings and a shortcut reference. **[ref]**
21. Mini toolbar showing the state of each layer: grid, rulers, guides, inspector and lock. **[ref]**

**Packaging**

22. Framework-agnostic core with a vanilla JS API. **[ref]**
23. React and Next.js entry: one component near the root. **[ref]**
24. Svelte and Vue entries. **[ref]**
25. Client-only, with nothing shipped in production builds. **[ref]**

### Nice to have

26. Deviation report: a list of every mismatch on the current page, with the element and the px difference. **[ours]**
27. Paste grid settings copied from Figma's inspect panel. **[ours]** **[research]**
28. Export and import guide sets as JSON so they can be shared with the team. **[ours]**
29. Breakpoint sweep: step through each breakpoint and collect the deviations from all of them. **[ours]**

### Can wait

30. Import layout grids straight from a Figma file through the Figma REST API (needs a token). **[ours]** **[research]**
31. Run audits in CI: a Playwright helper that fails a test when a deviation is over the tolerance. **[ours]**
32. Browser-extension build that works on any site without installing the package. **[research]**

## Stack

- TypeScript (strict), no runtime dependencies in the core. Vanilla core plus thin framework entries.
- Build and quality tooling follows decision 0003: tsdown, Vitest with browser mode, Biome, publint/attw, Changesets, GitHub Actions, Vite playground.

## Data sources and licences

- No runtime data sources. Grid settings come from user config.
- Package licence: MIT (0003).
- GuideFrame is a reference only: we never copy its name, logo, code, copy or exact visual style.

## Design direction

References are for inspiration only: never copy their logos, names, icons, illustrations or exact brand colours.

- **Feature parity with GuideFrame** (https://guide-frame.vercel.app/) as the baseline; Figma is the source of truth for grid behaviour and vocabulary.
- **Interactions like Figma:** rulers, guide dragging, Alt-to-duplicate, Shift to multi-select, nudging with the arrow keys, and red distance lines that feel familiar to designers.
- **Quiet chrome:** the overlay is a reference, not a distraction. Thin lines, low-opacity fills, a compact panel and toolbar, and nothing animated without a reason.
- **Non-invasive:** everything renders in one shadow root; the overlay never changes the host's layout, styles, focus or key handling (shortcuts ignore editable fields).
- **The product team researches, then decides** (product-team skill, Step 1), and logs each decision in `docs/decisions/` for Flovet's approval.

## Decisions (newest first)

Product-wide decisions only. Every decision, with its research, is logged in `docs/decisions/`.

- 2026-11-11: Feature scope set to GuideFrame parity plus expected-vs-rendered comparison.
- 2026-11-11: Remove the current untested code and rebuild in phases (0001); pure engine with a single store and a vanilla API (0002); tooling (0003); production exclusion handled by the consumer (0004).

## Domain rules and vocabulary

- Use Figma's terms: layout grid, pattern (columns / rows / grid), alignment (stretch / min / center / max), count, gutter, offset, section size.
- "Expected" and "rendered" always mean the definitions above, never "design" and "actual".
- Units: CSS px in document space; the deviation tolerance defaults to 1 px.

## Constraints

- Never break the host app. No global CSS, no swallowed events outside our own shortcuts, and no layout shift.
- Zero production footprint, proved by a test.
- Every feature ships with tests (unit for the math, browser-mode tests for the overlay).
- Keyboard-reachable panel and WCAG 2.2 AA contrast for the overlay's own UI.

## Active roles

- Tech Lead, Project Manager, Product, UX, UI, Copy, Frontend. Skip: Database, Backend, Gamification.
