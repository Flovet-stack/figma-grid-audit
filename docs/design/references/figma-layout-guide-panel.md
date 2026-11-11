# Figma layout-guide panel (reference)

Screenshots from Flovet, 2026-11-11: [columns](figma-columns-panel.png) · [rows](figma-rows-panel.png) · [grid](figma-grid-panel.png). They show Figma's popover for editing one layout guide. Our panel's "Layout guides" section (design brief §10) uses the same fields in the same order, so a Figma user can copy values across row by row. We copy the structure, not Figma's exact visuals.

## Fields, in order

| Row            | Columns                                                          | Rows                            | Grid             | Notes                                                                                                          |
| -------------- | ---------------------------------------------------------------- | ------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| Header         | Pattern dropdown ("Columns") + close                             | "Rows"                          | "Grid"           | Switching the pattern changes the fields below                                                                 |
| Count          | Dropdown with text entry (Auto available)                        | same                            | —                | Engine: `count` (number or `'auto'`)                                                                           |
| Color          | Swatch · hex `FF0000` · opacity `10 %`                           | same                            | same             | Hex and opacity are separate fields. Engine: `color` (we accept any CSS colour; the panel edits hex + opacity) |
| Type           | Stretch / Left / Center / Right                                  | Stretch / Top / Center / Bottom | —                | Engine: `alignment` STRETCH / MIN / CENTER / MAX                                                               |
| Width / Height | Shows **"Auto", disabled** for Stretch; a number for fixed types | same                            | —                | Engine: `sectionSize` (ignored for STRETCH)                                                                    |
| Margin         | Shown for **Stretch** (96 in the shots)                          | same                            | —                | Engine: `offset`. Figma labels it "Offset" for Left/Right/Top/Bottom; to confirm for fixed types               |
| Gutter         | Shown (20 in the shots)                                          | same                            | —                | Engine: `gutterSize`                                                                                           |
| Size           | —                                                                | —                               | Square size (10) | Engine: `sectionSize` for GRID                                                                                 |

## What this confirms or changes

- **Confirms the engine model:** every field in the popover maps one to one onto spec 01's config.
- **Stretch with Width = "Auto":** the size field stays visible but disabled, rather than hidden. Our panel does the same, so the layout doesn't jump when the type changes.
- **The label changes, the field doesn't:** stretch shows "Margin" and fixed types show "Offset", both stored in `offset`.
- **The Grid popover shows only Size and Color.** That matches the engine warning that other fields have no effect on a GRID.
- **Still to check in Figma:** the fields shown for Left, Center and Right (is Gutter shown? Is Offset hidden for Center?), and what values a new guide starts with.
