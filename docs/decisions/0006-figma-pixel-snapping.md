# 0006: Snap grid edges to whole pixels the way Figma does

- **Status:** Approved
- **Proposed:** 2026-11-11 by the product team (roles: Tech Lead, Frontend, Product)
- **Approved:** 2026-11-11 by Flovet
- **Supersedes:** none (amends spec 01's "no rounding" rule)
- **Specs:** specs/01-grid-engine.md

## Context

Spec 01 kept exact floats and said "never round inside the engine". The Figma proof (Flovet, 2026-11-11) shows that Figma draws layout guides on whole pixels, so exact floats can be up to 0.5 px off what the designer sees. Our product promises Figma parity, and a deviation of 1 px is our default tolerance, so half a pixel matters.

## Research (measured in Figma by Flovet)

| Frame                                   | Exact maths                              | Figma                                         | Rounded to the nearest pixel, ties down      |
| --------------------------------------- | ---------------------------------------- | --------------------------------------------- | -------------------------------------------- |
| 12 stretch columns, 1440 / 80 / 24      | width 84.67, starts 80, 188.67 … 1275.33 | width 85, starts 80, 189 … 1275               | 80, 189 … 1275; first width 165 − 80 = 85 ✅ |
| 4 centred columns, 80 / 20, in 375      | starts −2.5, 97.5 …                      | starts −3 (shown as 0, clipped), 97, 197, 297 | −3, 97, 197, 297 ✅                          |
| Same, in 376                            | −2, 98 …                                 | 98                                            | 98 ✅                                        |
| Same, in 374                            | −3, 97 …                                 | 97                                            | 97 ✅                                        |
| Bottom rows, left overflow, square grid | whole numbers already                    | same                                          | same ✅                                      |

Both edges of a section are rounded independently, so stretch columns can come out 1 px different in width (84 or 85), the way browsers snap fractional layouts. The tie rule (x.5 rounds **down**) comes from the 375 frame (−2.5 → −3 and 97.5 → 97). **Ordinary rounding gets this wrong:** `Math.round(-2.5)` is −2 and `Math.round(97.5)` is 98.

**Clipping (Flovet, 2026-11-11):** in the 375 frame, Figma reports the first column as starting at 0 and **77** wide, while the second and third are 80 wide. That fits a column running from −3 to 77 (snapped from −2.5 to 77.5) and drawn only inside the frame: 80 − 3 = 77. If Figma had moved the column into the frame instead, it would be 80 wide and the second column would start at 100, not 97. So sections keep their true positions, and what's visible and measurable is clipped at the frame edge. Frame 4 check: with Clip content on, the columns past 1000 are hidden. So the guides are clipped to the frame, the same as the frame's content. We always clip to the container; following a per-frame clip setting is out of scope (web containers have `overflow` instead, which a later spec can use).

Not yet verified: a positive tie at the start, for example 4 × 80 / 20 centred in **385**, where the exact start is 2.5. The rule predicts the second column starts at **102**. One more check in Figma would confirm it.

## Options

1. **Keep floats** (spec 01 as written): simple, but up to 0.5 px from Figma, so we'd report false deviations.
2. **Round in the renderer only:** the engine stays exact, but every consumer (overlay, snapping, deviations) has to remember to round, the same way.
3. **The engine returns both (recommended):** each section keeps exact `start` and `size`, plus Figma-snapped `snappedStart` and `snappedEnd`, rounded as `Math.ceil(v − 0.5)`. Everything that compares with Figma uses the snapped values; the exact ones stay for debugging and tests.

## Decision

Option 3. The snap function lives in the engine, is tested against every frame in the table above, and is used everywhere we draw or compare grid lines.

## Consequences

- Spec 01 changes: the "never round inside the engine" boundary is replaced by this decision. `Section` gets `snappedStart` and `snappedEnd`. The proof table goes into the tests as fixtures.
- The renderer and any comparison must clip sections to the container (`visibleStart = max(snappedStart, 0)`, `visibleEnd = min(snappedEnd, L)`), and drop sections with no visible part.
- Square-grid lines are rounded the same way (no effect for whole-number sizes).
- If the 385 check shows ties going the other way, this decision is superseded before spec 02 starts.
