# Figma Grid Audit design brief

- **Status:** Approved (decision [0005](../decisions/0005-figma-native-interaction-and-visual-language.md), 2026-11-11).
- **Written:** 2026-11-11 by the product team (roles: Product, UX, UI, Copy, Frontend, Tech Lead)
- **Decisions:** [0005 Figma-native interaction and visual language](../decisions/0005-figma-native-interaction-and-visual-language.md)

This brief describes how Figma Grid Audit should look, feel and behave, and why. `PROJECT_BRIEF.md` stays the source of truth for scope. Decision 0005 holds the research. This file shows how the pieces fit.

## How this brief is structured

It follows the same structure as the AniKansou brief. Sections 1–5 explain why and for whom. Sections 6–10 describe the system, borrowing Atlassian and GOV.UK's "foundations" approach. Sections 11–13 cover the proof and sign-off.

---

## 1. Overview

A dev-only overlay that sits on top of someone else's web app. It draws the **expected** grid (from Figma), the **rendered** grid (from the DOM) and their deviations, and adds rulers, guides, measuring and a control panel. The UI is two things: **marks on the canvas** (grids, guides, measurements) and **chrome** (rulers, toolbar, panel).

## 2. Problem

Our users spend their day in Figma. Every gesture they already know there (Alt to measure, dragging a guide off a ruler, Shift+arrow to nudge, red for measurements) is muscle memory. A tool that behaves "almost like Figma" is worse than one that behaves differently on purpose, because users make mistakes exactly where the two differ. Our overlay also sits on top of a page we don't control, so it must never be mistaken for, or clash with, the app underneath.

## 3. Audience and context of use

- Front-end and design engineers, often with Figma open on a second screen, checking a page at several viewport widths.
- Sessions are short and frequent: toggle it on, check something, toggle it off. Discovery has to be instant, and getting out has to be even faster.
- The tool runs inside any app, so it meets any colours, light or dark, any fonts and any z-index.

## 4. Goals and success criteria

| Goal                            | Success looks like                                                                                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feels like Figma                | A Figma user can place, duplicate, nudge and delete a guide, and measure between two elements, without reading the docs (tested with 3–5 users thinking aloud) |
| Expected vs rendered is obvious | Users can tell which grid is which in grayscale and without a legend after first use                                                                           |
| Never in the way                | Zero layout shift, zero swallowed keys in inputs, and the overlay hides in one keystroke                                                                       |
| Legible on any page             | All chrome text and controls meet WCAG 2.2 AA on both light and dark host pages                                                                                |

## 5. Scope and constraints

- This brief covers every visible part of the brief's features #1–#21.
- **No web fonts, images or icon fonts are loaded into the host.** Everything uses the system font stack and inline SVG.
- Everything renders in one shadow root (decision 0002). No host CSS can reach it, and none of ours can leak out.
- References are for inspiration. We never copy Figma's or GuideFrame's logos, names, icons, illustrations or exact brand colours, and we never claim to be affiliated with Figma.

## 6. Design principles

1. **Figma's rules, not Figma's look.** Gestures, shortcuts, units and default colours for marks follow Figma's documented behaviour. The chrome is our own: quiet, neutral and clearly a separate tool.
2. **The page is the hero.** Figma's own UI3 principle: keep users in flow and put their work at the centre. The chrome is compact, collapses to a toolbar, and stays away from content.
3. **Marks say what, colour says which.** Fill vs outline vs dashed tells expected, rendered and guide apart. Colour helps but is never the only cue.
4. **Show state, never hide it in tooltips.** UI3 dropped "training wheels" such as needing a tooltip to read state. Every toggle shows its state and its shortcut inline.
5. **One keystroke out.** Every mode can be left with Esc, and the whole overlay with its toggle.

## 7. Personality and voice

Precise, calm, technical. It talks like a measuring tool, not a mascot. Labels use Figma's vocabulary ("Layout guides", "Columns", "Gutter", "Offset"). Numbers are always shown with units (`24 px`). Copy is sentence case, with no exclamation marks.

## 8. Interaction model (Figma parity)

Wherever Figma documents a behaviour, we match it. Where Figma has no equivalent in a browser, we follow GuideFrame or DevTools, noted in the table.

| Action                  | Our behaviour                                                                                                                  | Source                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| Toggle layout grids     | `Shift+G` (Figma's shortcut). Also `Ctrl/Cmd+G`, see note                                                                      | Figma: layout guides                     |
| Toggle rulers           | `Shift+R`                                                                                                                      | Figma convention; GuideFrame             |
| Open the control panel  | `Ctrl/Cmd+Shift+G`                                                                                                             | GuideFrame                               |
| Create a guide          | Drag from the horizontal or vertical ruler                                                                                     | Figma: guides                            |
| Duplicate a guide       | `Alt/Option`+drag an existing guide                                                                                            | Figma: guides                            |
| Delete a guide          | Drag it back onto a ruler, select it and press `Delete`, or right-click → Remove guide                                         | Figma: guides (all three)                |
| Select several guides   | `Shift`+click or `Shift`+drag a marquee                                                                                        | GuideFrame                               |
| Nudge                   | Arrow keys = 1 px, `Shift`+arrow = 10 px                                                                                       | Figma defaults (small 1, big 10)         |
| Lock guides / undo      | `Shift+L` / `Shift+Z`                                                                                                          | GuideFrame                               |
| Measure                 | Pin (click) an element, hold `Alt/Option`, hover another: red lines with horizontal and vertical distances to its bounding box | Figma: measure distances                 |
| Measure nested elements | `Ctrl/Cmd+Alt` hover reaches into nested children                                                                              | Figma: nested layers                     |
| Geometry inspector      | `Shift+M`                                                                                                                      | Figma's measurement tool key; GuideFrame |
| Guide position          | When a guide is near an element, show its distance to that element, and highlight its position on the ruler                    | Figma: Alt-drag guide measuring          |
| Hidden grids            | Still work for snapping while hidden                                                                                           | Figma: "hidden guides still function"    |
| Leave a mode            | `Esc` cancels a drag, clears the pin, then clears the selection                                                                | Nielsen: user control                    |

**Shortcut rules:**

- Shortcuts are ignored while focus is in `input`, `textarea`, `select` or `[contenteditable]`.
- We call `preventDefault` only for a shortcut we actually handle.
- Every shortcut can be remapped in the config.
- **Open question (needs your call):** `Ctrl/Cmd+G` is the browser's "find next" in Chrome, Firefox and Safari. GuideFrame takes it over. Figma uses `Shift+G`. We recommend `Shift+G` as the default with `Ctrl/Cmd+G` as an opt-in. This changes feature #19 in the brief, so 0005 asks you to approve it.

## 9. Foundations

### 9.1 Colour: marks on the page

| Mark                         | Look                                                                                                                   | Why                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Expected grid**            | Filled columns and rows, red at 10% opacity (Figma's default layout-guide colour and opacity), with a 1 px edge at 25% | Users read it as "the Figma grid" instantly                                     |
| **Rendered grid**            | No fill. **Dashed** 1 px outlines of each track, with gap areas hatched, in a cool blue-violet                         | Outline vs fill tells the two apart even in grayscale or for colour-blind users |
| **Deviation**                | A solid 2 px magenta bar between the expected line and the rendered edge, with a px label (`+3 px`)                    | A third shape and a third colour; the label carries the meaning                 |
| **Ruler guides**             | Solid 1 px cyan. When selected: 2 px, with a position label                                                            | Distinct from all three grid marks                                              |
| **Measurement and snapping** | Red lines with red value pills                                                                                         | Figma uses red for snapping and measurement lines                               |
| **Hover outline**            | 1 px blue box with a small dimension label below it (`240 × 64`)                                                       | Figma shows a layer's dimensions in blue under its bounding box                 |

All mark colours are CSS custom properties, and users can set them per grid in the config, the same way Figma sets colour and opacity per guide. Exact hex values are chosen in the spec and checked for 3:1 contrast on white, #FFFFFF, and dark, #121212, test pages.

### 9.2 Colour: chrome

- **Neutral and theme-aware.** Dark chrome on any page by default (like DevTools and GuideFrame), and a light theme the user can choose. One accent is used for active toggles and focus. It is not Figma's exact purple or blue.
- Chrome surfaces get a 1 px border and a soft shadow so they stand out on any host background.

### 9.3 Typography

- System UI stack (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`) for labels, and `ui-monospace` with tabular numbers for every value.
- Labels: 11–12 px. Values: 11 px mono. Panel title: 12 px semibold. Measurement pills: 11 px mono, bold.
- Lesson from UI3: users said its small text was hard to read. We keep 11 px as the minimum, and the panel has a 125% scale setting.

### 9.4 Spacing, size and shape

- A 4 px base unit. Panel rows are 32 px high with 8/12 px padding. Ruler thickness is 20 px.
- Hit targets: guides get an 8 px invisible grab zone around the 1 px line, and controls are at least 24 × 24 px (WCAG 2.2 target size minimum).
- Radius: 8 px for the panel, 6 px for controls, and fully round (pill) for value labels.

### 9.5 Icons

Inline SVG at 16 px, with a 1.5 px stroke, drawn by us. No icon font and no external set, so nothing loads into the host. Icons sit next to labels and never replace them (UI3: visible labels carry the context).

### 9.6 Motion

Close to none. 120 ms opacity fades when the panel opens or closes, with no motion at all under `prefers-reduced-motion`. Marks never animate, because a grid that moves isn't a reference.

## 10. Layout: the chrome

| Element              | Placement                                                                        | Behaviour                                                                                                                                                                                                                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rulers**           | Top and left edges, 20 px, with a corner square that shows the units             | Ticks in document space that follow the scroll. When an element is selected, its range is highlighted on the ruler (Figma: rulers highlight the selected frame's coordinates)                                                                                                                                    |
| **Toolbar**          | Floating at the bottom centre (UI3 puts toolbars at the bottom in every product) | One pill: Grid · Rulers · Guides · Inspector · Lock, each with its state and shortcut on hover, plus a button that opens the panel. Can be dragged to the corners                                                                                                                                                |
| **Control panel**    | Floating at the top right, 260 px wide, can be moved and collapsed               | Sections in the same order as Figma's right sidebar: **Layout guides** (one row per grid: show/hide eye, type, count, gutter, margin/offset, colour, opacity) → **Compare** (show expected / rendered / both, tolerance) → **Snapping** (elements, columns, guides) → **Guides** (clear, export) → **Shortcuts** |
| **Breakpoint badge** | Top of the panel                                                                 | Shows the active breakpoint and grid, for example `Tablet · 8 cols · 16 px gutter` (GuideFrame does the same)                                                                                                                                                                                                    |

Why the panel floats here when UI3 docked its panels: Figma docked them because they covered the canvas. We are layered over someone else's app and can't take space away from it, so the panel floats and collapses to the toolbar instead. This is Figma's "Minimize UI" pattern, used as our default.

## 11. Components: direction

- **Toggle row:** label, the shortcut in a muted keycap, and a switch. State is visible without hovering.
- **Number field:** a mono value with its unit, and Figma-style scrubbing (drag on the label to change the value). Arrow keys step by 1, and Shift+arrow by 10.
- **Value pill:** used for measurements, guide positions and deviations: mono, bold, with a px unit.
- **Keycap:** shows each shortcut with the right modifier for the platform (⌘ on Mac, Ctrl elsewhere).

## 12. Accessibility

- The chrome is fully keyboard operable, with a visible focus ring that has at least 3:1 contrast. The panel is a labelled dialog region, and toggles are real switches (`role="switch"`).
- Never colour alone: expected, rendered and deviation each have their own shape.
- Every label sets its accessible name (UI3 matched visible labels to aria-labels).
- Text has at least 4.5:1 contrast. Marks have at least 3:1 against both test backgrounds.
- `prefers-reduced-motion` is respected. The overlay never traps focus or moves focus away from the host page.

## 13. Approval and next steps

1. Flovet approves or rejects decision 0005, including the shortcut question in §8.
2. The rest of the brief is unaffected. Specs 01 (engine) and 02 (overlay renderer) build on this brief.
3. A small usability test with 3–5 Figma users comes after the guides and measuring features ship (Krug: test small and often).

## Sources

Opened:

- Figma, "Create layout guides": https://help.figma.com/hc/en-us/articles/360040450513
- Figma, "Add guides to the canvas or frames": https://help.figma.com/hc/en-us/articles/360040449713
- Figma, "Measure distances between layers": https://help.figma.com/hc/en-us/articles/360039956974
- Figma, "Adjust alignment, rotation, position and dimensions" (nudge values, red snapping guides, blue dimension label): https://help.figma.com/hc/en-us/articles/360039956914
- Figma blog, "Our approach to designing UI3": https://www.figma.com/blog/our-approach-to-designing-ui3/
- Chrome DevTools, "Inspect CSS grid": https://developer.chrome.com/docs/devtools/css/grid
- GuideFrame demo (viewed live, overlay and panel on): https://guide-frame.vercel.app/

Seen only as search summaries (unverified):

- UI3 text-size complaints: https://www.925studios.co/blog/figma-design-breakdown, https://forum.figma.com/t/ui3-feedback/77610/14
- PixelSnap 2 (snappable guides, tolerance mode, measuring several objects): https://pixelsnap.com/
- Figma accessibility (keyboard measuring limits): https://help.figma.com/hc/en-us/articles/35063862380311
- VisBug and React Scan (Shadow DOM chrome): see `docs/review-2026-11-11.md`
