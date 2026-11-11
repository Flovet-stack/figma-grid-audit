# Figma Grid Audit: agent instructions

## Before any task
- Read `PROJECT_BRIEF.md` and the spec in `specs/` for the current task.
- Build only what that spec asks. If no spec covers the task, ask first.
- Build only on decisions in `docs/decisions/` with status `Approved`. If a task needs a decision that isn't logged, stop and ask.

## Commands
To be added by spec 00 (format, lint, typecheck, test, build, publint/attw).

## Always
- Run every check and show the output before saying a task is done.
- After each task, run /product-team Workflow E on the diff.
- Keep the package non-invasive: one shadow host, no global CSS, no swallowed host events.

## Ask first
- Adding any runtime dependency, a new public API, or a new entry point.

## Never
- Read `process.env` in library code.
- Restore stripped features (rulers, guides, inspector, panel) without a new approved decision.
