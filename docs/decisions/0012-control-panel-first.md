# 0012: Build the control panel's grid settings first

- **Status:** Approved
- **Proposed:** 2026-11-11 by the product team (roles: Tech Lead, Project Manager, Product, UX, UI, Copy, Frontend)
- **Approved:** 2026-11-11 by Flovet
- **Supersedes:** the build order in 0011 and the phase order in 0001. The rest of both stays in force.
- **Specs:** specs/03-control-panel.md

## Context

Flovet: stripping the panel was wrong, because the panel is what gives the user control.

Today the only way to enter a grid is in code (`createGridOverlay({ breakpoints })`, `update()`, `setBreakpoints()`). The brief's core loop starts with "set the expected grid (pasted from Figma)". It also says the overlay is used by "front-end and design engineers". Neither can tune a grid while looking at the page.

0001 removed the old `panel.ts` because it fought the config (review C4) and was untested. It kept the panel in scope (brief #20) but placed it near the end of the phases. The panel's design is already approved in `docs/design/design-brief.md` §10–12 (0005).

## Research

| Reference                          | What they do                                                                        | Adopt / adapt / reject                          | Why                                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Figma right sidebar, Layout guides | One row per grid: eye, type, count, gutter, margin/offset, colour; edits apply live | **Adopt** (already in design brief §10)         | Designers already know it                                                                |
| GuideFrame                         | Floating control panel with grid settings and a breakpoint readout                  | **Adopt** the breakpoint badge (already in §10) | [ref] parity                                                                             |
| Old `panel.ts` (review C4)         | The panel kept its own state, separate from the config                              | **Reject** that model                           | The cause of C4. 0002's single store fixes it: the panel only reads and writes the store |

Sources: design brief §10–12 and decisions 0001, 0002, 0005. All are in the repo. No new external sources were needed, because the design was researched and approved under 0005.

## Decision

New order:

1. **Spec 03: control panel, grid settings.** Implements design brief §10–12:
   - The floating panel, toggled with Cmd/Ctrl+Shift+G (brief #19).
   - The breakpoint badge.
   - The **Layout guides** section: one row per grid in the active breakpoint, with type, count, gutter, margin/offset, alignment, colour, opacity and an eye toggle, plus add and remove grid.
   - Edits go through the store and the existing validation (0002, 0010) and redraw at once. Invalid input shows an inline error and keeps the last valid grid.
   - Out of scope: the other panel sections (Compare, Snapping, Guides, Shortcuts) and the toolbar. Each arrives with its feature.
2. **Spec 04: persist panel edits.** Edits are kept across reloads, and there's a way to copy them back into code (for example "Copy config"), so the panel never silently drifts from the config. This needs its own small decision on storage and precedence first.
3. Then 0011's three features in its order: geometry inspector, page comparison, container layout overlay.

Paste from Figma (brief #27) stays a separate research decision. The panel's number fields are the entry path until then.

## Consequences

- No new public API: the panel is driven by the store and by the existing shortcut options (0005). Anything else asks first.
- **This adds UI to the host page.** It renders inside the shadow root, never moves focus away from the page, and keyboard events go to the panel only while it has focus (brief constraints, design brief §12).
- **Reviews check:**
  - the panel never holds state the store doesn't (no repeat of C4)
  - WCAG 2.2 AA on the panel
  - screenshots at 390 px and 1440 px, light and dark
- Without spec 04, panel edits are lost on reload. That's acceptable for one spec, but spec 04 follows straight after.
