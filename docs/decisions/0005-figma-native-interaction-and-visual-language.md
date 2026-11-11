# 0005: Figma-native interaction and visual language

- **Status:** Approved
- **Proposed:** 2026-11-11 by the product team (roles: Product, UX, UI, Copy, Frontend, Tech Lead)
- **Approved:** 2026-11-11 by Flovet
- **Supersedes:** none
- **Specs:** specs/01-grid-engine.md

## Context

The brief promises "Interactions like Figma" and "Quiet chrome". Users carry Figma's muscle memory, and the overlay sits on top of pages we don't control. We need one written set of interaction rules and a visual language before spec 02 draws anything. The full system is in [`docs/design/design-brief.md`](../design/design-brief.md).

## Research

| Reference                    | What they do                                                                                                                                                 | Adopt / adapt / reject                                                                                                 | Why                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Figma layout guides          | Columns/rows/grid; Left/Center/Right/Stretch; offset for fixed types, margin and gutter for Stretch; default red at 10%; `Shift+G`; hidden guides still work | **Adopt** behaviour, defaults and vocabulary                                                                           | It's the expected grid users are checking against |
| Figma ruler guides           | Drag from a ruler; Alt-drag duplicates; delete by dragging back, pressing Delete or right-click; Alt-drag shows the distance to the frame                    | **Adopt**                                                                                                              | Muscle memory                                     |
| Figma measuring              | Alt+hover shows red lines with H and V distances to the bounding box; Cmd/Ctrl+Alt reaches nested layers; nudge 1 / 10                                       | **Adopt**                                                                                                              | Same                                              |
| Figma UI3                    | Work at the centre; floating bottom toolbar; floating panels removed for crowding the canvas; visible labels instead of tooltip state                        | **Adapt**: bottom toolbar and visible state; the panel floats but collapses, because we can't take space from the host | We're layered over someone else's app             |
| GuideFrame                   | Dark floating panel with toggles and shortcuts, breakpoint badge, `Cmd/Ctrl+G` toggle                                                                        | **Adopt** the panel pattern and badge; **reject** `Cmd/Ctrl+G` as the default                                          | It overrides the browser's find-next              |
| Chrome DevTools grid overlay | Per-grid colour, track sizes (authored and computed), line labels, extended lines                                                                            | **Adopt** for the rendered grid's labels and per-grid colour                                                           | Developers already read DevTools grids            |
| PixelSnap 2                  | Snappable guides, tolerance mode for alignment                                                                                                               | **Adopt** a tolerance setting for deviations                                                                           | Matches our 1 px tolerance rule                   |

Sources: listed in the design brief's Sources section (Figma help ×4, the UI3 blog, Chrome DevTools docs and the GuideFrame live demo were opened; the rest are search summaries).

## Options

1. **Copy Figma's look and behaviour:** the most familiar, but it risks brand confusion and clashes with the host's UI.
2. **Figma's behaviour, our own neutral chrome (recommended):** the gestures, shortcuts, mark colours and vocabulary follow Figma; the panel and toolbar are our own.
3. **GuideFrame's model:** proven, but it differs from Figma (`Cmd+G`), and copying a competitor gives us no identity.

## Decision

Option 2, as specified in the design brief §6–§12:

- **Interactions** follow the table in §8. The default grid toggle is `Shift+G`, and `Cmd/Ctrl+G` is an opt-in setting. This **amends the project brief's feature #19**.
- **Marks:** expected = filled red at 10%; rendered = dashed blue-violet outlines; deviation = magenta bar with a px label; guides = cyan; measurement = red. Each one is a different shape, so colour is never the only cue.
- **Chrome:** neutral dark/light theme, system font, mono numbers, minimum 11 px text, a floating bottom toolbar and a collapsible top-right panel with sections in Figma's sidebar order.

## Consequences

- Specs 02 onward must test the shortcuts in §8, including that they're ignored in editable fields.
- Mark colours must pass 3:1 on the light and dark test pages. A review checks this with screenshots at 390 px and 1440 px.
- A usability test with Figma users is planned after the guides and measuring features ship.
