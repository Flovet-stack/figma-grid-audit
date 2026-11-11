# 0001: Strip the current code; rebuild every feature in phases

- **Status:** Approved
- **Proposed:** 2026-11-11 by the product team (roles: Tech Lead, PM, Product, UX)
- **Approved:** 2026-11-11 by Flovet
- **Supersedes:** none
- **Specs:** specs/00-foundations.md

## Context
Of the code's four feature areas, guides and the inspector don't work (review C1, C2), the panel conflicts with the config (C4), and nothing is tested. The brief's differentiator is Figma grid parity, not measuring.

## Research
| Reference | What they do | Adopt / adapt / reject | Why |
|---|---|---|---|
| Browser DevTools grid/flex overlays | Measure boxes, gaps and padding for free | Reject competing | Duplicated effort, and DevTools is better at it |
| VisBug | A general visual inspector inside the page | Reject competing | Same reason |
| React Scan | Does one job well, with a tiny toolbar | Adopt the focus | A narrow tool gets adopted |

Sources: [nerdy.dev VisBug update](https://nerdy.dev/a-2024-visbug-update), [React Scan](https://github.com/aidenybai/react-scan).

## Options
1. **Fix everything in place:** keeps the features, but fixes on top of untested code with mixed state.
2. **Strip to the grid overlay and rebuild with tests (recommended).**
3. Start an empty new repo: the same as 2, but loses the little reusable math.

## Decision
Option 2, updated 2026-11-11 after the brief adopted full GuideFrame parity plus expected-vs-rendered. The **scope is not cut**: every feature in the brief stays planned. The **code** is cut: delete `ruler.ts`, `guide.ts`, `inspector.ts`, `panel.ts`, the wrappers, `public/index.html`, `dist/` and `SOP.md`. Keep the column formula only as a reference. Features return one spec at a time, in this order: expected grid, then rendered grid and comparison, then rulers and guides, then geometry, then the panel and toolbar, then framework entries.

## Consequences
For a while the package does less than the old code claimed, but everything it does works and is tested. The phase order is a proposal; each phase is still planned in its own spec.
