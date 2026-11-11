# 0007: What box a Figma frame maps to, and where the overlay lives

- **Status:** Approved
- **Proposed:** 2026-11-11 by the product team (roles: Tech Lead, Frontend, UX)
- **Approved:** 2026-11-11 by Flovet
- **Supersedes:** none
- **Specs:** specs/02-overlay-renderer.md

## Context

The engine (spec 01) takes a box and returns sections inside it. Spec 01 left two questions for the renderer:

1. **Which box?** A Figma frame has one rectangle. A CSS element has four (margin, border, padding and content), and a scrollbar can take up part of it.
2. **Rows on a scrolling page.** A desktop design is usually one tall Figma frame (for example 1440 × 4000), so rows and square grids run the whole height of the design. A browser shows only part of a page at a time.

Both change every number we draw, so they need to be decided before spec 02.

## Research

| Reference                                | What they do                                                                                                                              | Adopt / adapt / reject                                                                                                            | Why                                                                                                                                                |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Figma frames                             | Stretch guides take the frame's full width and height; fixed guides anchor to the frame's edges. Guides are clipped to the frame (0006)   | **Adopt** the frame edge as the reference                                                                                         | Parity                                                                                                                                             |
| CSS `clientWidth` / `clientHeight` (MDN) | The padding box: includes padding, excludes borders and scrollbars. On `<html>` it's the viewport minus the scrollbar. Returns an integer | **Adopt** the padding box; **adapt** by measuring fractional sizes with `getBoundingClientRect()` minus borders and the scrollbar | A CSS border takes space that a Figma stroke doesn't, and content can't sit under a scrollbar. Integers would cause 0.5 px errors we've just fixed |
| GuideFrame                               | Rulers with ticks in "document space"; overlays scoped to containers                                                                      | **Adopt** document space                                                                                                          | The grid has to stay attached to the content as you scroll                                                                                         |
| Chrome DevTools grid overlay             | Drawn on the grid container and scrolls with the page                                                                                     | **Adopt**                                                                                                                         | Developers already expect this                                                                                                                     |

Sources (opened): https://developer.mozilla.org/en-US/docs/Web/API/Element/clientWidth, https://help.figma.com/hc/en-us/articles/360039957934. GuideFrame and DevTools: see decision 0005.

## Options

1. **Viewport space:** the overlay is fixed to the screen and rows repeat over whatever is showing. Simple, but row 3 of the design never lines up with row 3 of the page once you scroll.
2. **Document space (recommended):** the page target is the whole document, `documentElement.clientWidth` × `scrollHeight`. The overlay is positioned in document coordinates, so rows and squares scroll with the content, the way a tall Figma frame works.
3. **Ask the user every time:** too much setup for the first run.

## Decision

- **A frame is the element's padding box:** `getBoundingClientRect()` minus the left and right border widths and the vertical scrollbar (measured as `offsetWidth − clientWidth − borders`); the same for height. The frame's origin is the padding box's top-left corner.
- **The default target is the page:** width = `document.documentElement.clientWidth` (the viewport without its scrollbar), height = `document.documentElement.scrollHeight`, origin (0, 0) of the document.
- **Document space:** the overlay is laid out in document coordinates and scrolls with the page. Columns look the same either way, but rows and square grids line up with the content they belong to.
- **Breakpoints** are chosen by `window.innerWidth`, the same width CSS media queries use (scrollbar included), so the grid switches at exactly the same moment as the page's CSS. The grid itself is then laid out on the scrollbar-free width above.

## Consequences

- Fixes the "≈15 px scrollbar drift" from the review (H2).
- Container targets (brief #5) reuse the same padding-box rule in a later spec.
- Picking by `innerWidth` but laying out on `clientWidth` is deliberate: it matches CSS twice, once for when to switch and once for where content can sit. Spec 02 tests a page whose CSS changes at 768 px, with a scrollbar showing, and checks the grid switches at the same width.
- A very tall page (for example 50,000 px) with rows or squares means a lot of lines. Spec 02 draws square grids with a CSS background instead of one element per line.
