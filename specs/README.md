# Specs

One file per task: `NN-short-name.md`, small enough for one agent session. Format: product-team skill, Workflow D.

- Only write a spec on **Approved** decisions in `docs/decisions/`; link them ("Implements 0002"), never restate them.
- Each spec has testable acceptance criteria and a **Check** section (commands that must pass + end-to-end proof).
- Status line at the top: `Draft` → `Ready` → `In progress` → `Done (PR link)`.

## Planned (0001–0004 approved 2026-11-11)

| #   | Spec                                                       | Implements             |
| --- | ---------------------------------------------------------- | ---------------------- |
| 00  | [Foundations](00-foundations.md) (Done)                    | 0001, 0003, 0004       |
| 01  | [Grid engine](01-grid-engine.md) (Done)                    | 0002                   |
| 02  | [Overlay renderer](02-overlay-renderer.md) (Done)          | 0002, 0004–0007, 0010  |
| 03  | [Control panel: grid settings](03-control-panel.md) (Done) | 0002, 0005, 0010, 0012 |
| 04  | [Persist panel edits](04-persist-panel-edits.md) (Ready)   | 0012, 0013             |
| 05  | Geometry inspector                                         | 0005, 0006, 0011       |
| 06  | Page comparison (expected vs element edges)                | 0005, 0011             |
| 07  | Container layout overlay (grid tracks, flex gaps)          | 0005, 0011             |
| 08  | First release 0.1.0                                        | 0003, 0004             |
