# Specs

One file per task: `NN-short-name.md`, small enough for one agent session. Format: product-team skill, Workflow D.

- Only write a spec on **Approved** decisions in `docs/decisions/`; link them ("Implements 0002"), never restate them.
- Each spec has testable acceptance criteria and a **Check** section (commands that must pass + end-to-end proof).
- Status line at the top: `Draft` → `Ready` → `In progress` → `Done (PR link)`.

## Planned (0001–0004 approved 2026-11-11)

| #   | Spec                                              | Implements       |
| --- | ------------------------------------------------- | ---------------- |
| 00  | [Foundations](00-foundations.md) (Done)           | 0001, 0003, 0004 |
| 01  | [Grid engine](01-grid-engine.md) (Done)           | 0002             |
| 02  | [Overlay renderer](02-overlay-renderer.md) (Done) | 0002, 0004–0007  |
| 03  | First release 0.1.0                               | 0003, 0004       |
