# 0011: Next features: geometry inspector, page comparison, container layout overlay

- **Status:** Approved (build order superseded by 0012)
- **Proposed:** 2026-11-11 by the product team (roles: Tech Lead, Project Manager, Product, UX, UI, Frontend). Revised the same day after Flovet's direction.
- **Approved:** 2026-11-11 by Flovet
- **Supersedes:** none
- **Specs:** none yet

## Context

Spec 02 (expected page grid, editable breakpoints) is merged. Flovet decided to skip the 0.1.0 release for now and set the direction:

- **Compare against the page grid only**, at each breakpoint. Comparisons inside container elements come later.
- **Selected containers show their own layout**, the way Chrome DevTools does: grid tracks and spacing. They aren't compared with anything.
- **A simple geometry inspector like Figma's:** the element's name and main class (`div.container`), its dimensions and its spacing.

Flovet's answers: the rendered side of the comparison is the **inspected element's edges**, and elements are picked by **hover, with click to pin**.

The brief lists these as #17 (geometry inspection, Shift+M), #4 (comparison) and #3 (rendered grid). CLAUDE.md forbids restoring the inspector without a new approved decision; this entry is that decision.

## Research

| Reference                     | What they do                                                                                                                                              | Adopt / adapt / reject                                                        | Why                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Chrome DevTools element hover | A tooltip shows `tag.class` and `W × H`, with padding and margin tinted on the page                                                                       | **Adopt** the label format (`div.container  1200 × 400`)                      | Developers read it without learning anything new                                              |
| Chrome DevTools grid overlay  | For `display: grid`/`inline-grid`, draws tracks, gaps and line numbers, and can label each track "authored − computed"                                    | **Adopt** tracks and gaps; **reject** line numbers and authored sizes for now | Keeps the overlay quiet (brief: quiet chrome)                                                 |
| CSS Grid 2 §7.2.6             | `getComputedStyle().gridTemplateColumns`/`Rows` return used track sizes in px, `repeat()` expanded, implicit tracks included. A subgrid axis has no sizes | **Adopt** as the source for container tracks                                  | Exact and cheap. A browser test pins the behaviour, because the spec may drop implicit tracks |
| Flexbox                       | No track API; only the children's boxes and `gap`                                                                                                         | **Adapt**: show the gaps between flex items, not columns                      | Honest about what the DOM knows                                                               |
| Figma measuring               | Red distance lines with values; Alt/Option + hover measures from the selection to another layer; measures bounding boxes                                  | **Adopt** red lines, Alt-hover distances and the box model                    | Brief: Figma-native interactions (0005)                                                       |
| Decision 0005                 | Rendered = dashed blue-violet with hatched gaps; deviations = 2 px magenta bars with px labels                                                            | **Adopt** unchanged                                                           | Already approved                                                                              |

Sources (opened):

- https://www.w3.org/TR/css-grid-2/ (§7.2.6)
- https://developer.chrome.com/docs/devtools/css/grid
- https://help.figma.com/hc/en-us/articles/360039956974-Measure-distances-between-layers

## Decision

Three specs, in this order. Each one is useful on its own.

### Spec 03: geometry inspector (#17)

- **Shift+M** toggles inspect mode, which is off by default. Shortcuts follow 0005 and are ignored in editable fields.
- **Hover:** an outline on the element's border box, plus a label: `tag.firstClass` (or `tag#id` when there's no class; `tag` alone if neither), then `W × H` in px, rounded per 0006.
- **Spacing:** padding and margin tinted, with their px values. Values of 0 are hidden.
- **Click pins** the element. The click is captured only while inspect mode is on, so the page never receives it then. Esc or a click on empty space unpins.
- **Alt + hover** while an element is pinned shows red distance lines to the hovered element, as in Figma.
- No panel, and no editing.

### Spec 04: page comparison (#4, page target only)

- For the hovered or pinned element, its left and right border-box edges are compared with the nearest edge of an expected column, on the page grid of the active breakpoint.
- If the gap is more than the tolerance (1 px default, from the brief), a magenta bar is drawn with a signed px label (`+3 px`). Edges within tolerance get no mark.
- The comparison updates when the breakpoint switches.
- Only columns are compared. Rows are out of scope.

### Spec 05: container layout overlay (#3, display only)

- A pinned element that is a grid container shows its tracks and gaps in the 0005 rendered style. A flex container shows its item gaps.
- This overlay isn't compared with anything. Subgrid, line numbers and container comparison come later.

### Public API

- New option **`inspect?: { shortcut?: string; tolerance?: number }`**. The toggle shortcut defaults to `Shift+M`, and `tolerance` defaults to 1.
- This is the only new API surface. Approving this entry approves it. Anything else asks first.

## Consequences

- The release moves to after spec 05.
- 0011 replaces the earlier idea of a "container target" for the expected grid. That waits until container comparison is decided.
- **The non-invasive rule changes in one place:** clicks are captured, but only while inspect mode is on. A test proves that clicks reach the page when inspect mode is off.
- Reviews check the label format, that 0 values are hidden, the tolerance, and the browser test that pins the track-size behaviour.
