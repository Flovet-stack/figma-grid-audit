# 0010: Editable default breakpoints (mobile 4, tablet 8, desktop 12), plus any number of custom ones

- **Status:** Approved
- **Proposed:** 2026-11-11 by the product team (roles: Product, UX, Frontend, Tech Lead)
- **Approved:** 2026-11-11 by Flovet
- **Supersedes:** none (extends the API from 0002 and spec 02)
- **Specs:** 02 (amendment A1)

## Context

Testing spec 02, Flovet saw 12 columns on mobile. That was the playground's config, not a bug, but it shows two gaps:

1. The playground doesn't look like a real responsive design.
2. A user must write every breakpoint before seeing anything.

Flovet wants a flexible system:

- Three default breakpoints with default values.
- Users can edit those values at any time.
- Users can add as many extra breakpoints as they like.

This changes the public API, so it needs a decision (CLAUDE.md: ask first).

## Research

| Reference                                                | What they do                                                                             | Adopt / adapt / reject                                                   | Why                                                                    |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Bootstrap 5.3 breakpoints                                | Min-widths 0 / 576 / 768 / 992 / 1200 / 1400; 12 columns; 24 px (1.5rem) gutter          | **Adapt**: reuse **768** and **1200** as our tablet and desktop cut-offs | The most widely copied web breakpoints, so most pages switch near them |
| Material 3 window size classes                           | Compact < 600, Medium 600–839, Expanded ≥ 840; 16 px margins on compact, 24 px on medium | **Adapt**: 16 px margin and gutter on mobile, 24 px on tablet            | A common mobile-first convention                                       |
| Typical Figma web templates (and Flovet's proof frame 1) | 4 columns on mobile, 8 on tablet, 12 on desktop (1440 / margin 80 / gutter 24)           | **Adopt** 4 / 8 / 12, and 80 / 24 at desktop                             | Matches what designers draw, and what we already proved against Figma  |
| Tailwind `theme.extend` vs `theme`                       | `extend` merges keys into the defaults (a matching key overrides); `theme` replaces them | **Adopt** the pattern: merge by name by default, with an opt-out         | Developers already know it; adding or editing one item is one line     |

Sources (opened): [Bootstrap breakpoints](https://getbootstrap.com/docs/5.3/layout/breakpoints/). Search summaries: [Android window size classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/window-size-classes?hl=it). The 4 / 8 / 12 convention is an assumption drawn from common Figma templates and frame 1, not one published standard. Bootstrap's 24 px gutter and the Tailwind pattern come from general knowledge, not pages opened here.

## Options

1. **Keep `breakpoints` required:** explicit, but nothing shows until users configure it.
2. **Optional; the user's list replaces the defaults:** simple, but editing one default value means copying all three.
3. **Optional; the user's list merges with the defaults by name, editable at runtime (recommended):** edit a default, add new ones, or opt out of the defaults entirely.

## Decision

Option 3.

**Defaults** (all Figma Stretch columns):

| Name    | `minWidth` | Columns | Margin (`offset`) | Gutter |
| ------- | ---------- | ------- | ----------------- | ------ |
| Mobile  | 0          | 4       | 16                | 16     |
| Tablet  | 768        | 8       | 24                | 24     |
| Desktop | 1200       | 12      | 80                | 24     |

**Configuration:**

- `createGridOverlay(options?)` works with no options at all.
- Any number of breakpoints is allowed. They're sorted by `minWidth`, and the active one is still the largest `minWidth` at or below the window width.
- `breakpoints` entries merge with the defaults by `name`:
  - **Same name as a default:** edits it. Fields you leave out keep their default values (for example, `{ name: 'Desktop', columns: { count: 16 } }` changes only the count).
  - **New name:** adds a breakpoint. It must give a `minWidth` and its grids.
- `extendDefaults: false` ignores the defaults and uses only your list.
- Removing a single default is out of scope for now. Use `extendDefaults: false` instead.
- Two breakpoints with the same `minWidth` are an error. The message names both breakpoints.

**At runtime:**

- `overlay.setBreakpoints(breakpoints, { extendDefaults? })` swaps the config live and redraws, using the same merge rules.
- The future control panel (feature #20) will edit breakpoints through this same method.

**Exports:**

- `DEFAULT_BREAKPOINTS`: read-only and frozen, for reference or copying.

**Playground:**

- Uses the defaults.
- Its CSS gets matching mobile, tablet and desktop grids, so the overlay and the page agree at every width.

## Consequences

- Spec 02 needs an amendment to cover this. Flovet decides when.
- The engine gets a pure, unit-tested `mergeBreakpoints(defaults, input, extendDefaults)`. The overlay calls it both at creation and in `setBreakpoints`.
- The README documents the defaults table, editing a default, adding one, opting out, and `setBreakpoints`.
- New tests:
  - unit tests for the merge rules (edit, add, opt-out, duplicate `minWidth`);
  - a browser test checking 4, 8 and 12 columns at 375, 1024 and 1440;
  - a browser test showing `setBreakpoints` redraws without a reload.
- The existing breakpoint-switch test (spec 02, test 6) keeps working.
