# 04: Persist panel edits

Status: Done (https://github.com/Flovet-stack/grid-auditor/pull/6)

Brief: completes feature #20 (control panel) by making edits last. It builds on spec 03.

## Goal

Grid edits made in the panel survive a reload, but only while the code config they were made against is unchanged. The user can reset to the code at any time, and can copy their edits as a ready-to-paste config, so the code stays the source of truth.

## Decisions

Implements 0013. Follows 0002 (single store), 0005 (design brief §10–12: chrome and copy), 0010 (merge and validation) and 0012. Builds on spec 03.

## Acceptance criteria

### Storage: new `src/overlay/persist.ts`

- [ ] **Entry:** one `localStorage` entry, `grid-auditor:v1`, holding JSON `{ version: 1, fingerprint, breakpoints, panel?: { x, y } }`.
  - `breakpoints` are the edited breakpoints, written as inputs with only the fields that apply (the same shape as the panel's `toInput`).
  - `panel` is set only once the panel has been dragged.
- [ ] **Fingerprint:** a pure function of the **normalized code config**, meaning the breakpoints after merge and normalize, before any panel edits. Use a stable serialization (keys sorted) and a small non-crypto hash, such as FNV-1a, returned as a hex string.
  - The same config written in a different field order gives the same fingerprint.
  - Any value change gives a different one.
  - Unit tests cover both.
- [ ] **Errors:** every `localStorage` access is in try/catch. If storage throws or is missing, edits keep working for the session, and one `console.warn` with the `[grid-auditor]` prefix is logged per overlay.
- [ ] **Bad data:** a stored entry that isn't valid JSON, has another `version`, or fails `normalizeBreakpoints` is ignored and removed. Nothing throws.

### Load (`createGridOverlay`)

- [ ] **No entry, or `persist: false`:** behaves exactly as spec 03.
- [ ] **Fingerprint matches:** the stored breakpoints become the store's breakpoints before the first paint, and the stored panel position is restored and clamped to the viewport. The badge ends with ` · Edited`, for example `Desktop · 16 cols · 24 px gutter · Edited`.
- [ ] **Fingerprint differs:** the code config is used, and the stored entry is kept, set aside. When the panel opens, a notice above Layout guides reads: "Your code's grid changed since your last edits." It has two buttons:
  - **Restore edits:** applies the stored breakpoints as if they matched, and re-saves them under the current fingerprint.
  - **Discard:** removes the entry.

  The notice is `role="status"`, and it is dismissed by either button.

### Save

- [ ] **What saves:** every successful panel edit (`setGrids`) writes the entry with the current code fingerprint. A failed edit writes nothing. A drag writes the panel position on `pointerup`. Writes are coalesced to at most one per animation frame.
- [ ] **Code calls clear it:** `update()` and `setBreakpoints()` from code remove the entry and the "Edited" state, as 0013 requires.
- [ ] **Turning it off:** new option `persist?: boolean` (default `true`). With `false`, nothing is read, written or removed. `update({ persist })` can change it at runtime.

### Panel controls (design brief §10–11)

- [ ] **Reset to code:** shown in the Layout guides header only while there are edits. It removes the entry, restores the code config, and moves focus to the "Layout guides" heading.
- [ ] **Copy config:** at the bottom of the Layout guides section.
  - **The snippet:** a `createGridOverlay({ extendDefaults: false, breakpoints: [...] })` call with every breakpoint and only the fields that apply to each grid.
  - **Formatting:** strings are single-quoted, `color` is `rgba(...)`, there's 2-space indentation, and no trailing commas are needed.
  - **On success:** the button label changes to "Copied" for 1.5 s, announced through `aria-live`.
  - **On failure:** if `navigator.clipboard.writeText` rejects or is missing, a read-only `<textarea>` with the snippet appears under the button, focused and fully selected, with a "Copy failed. Select and copy the text below." note.
- [ ] **Labels:** both buttons follow the spec 03 chrome and have visible text labels. Strings are in sentence case, as written here.

## Tests

### Unit (`test/unit/persist.test.ts`, node)

1. Fingerprint: stable across key order, and changes on any value change.
2. Snippet: for each grid pattern and alignment, the snippet passes `normalizeBreakpoints` (after `extendDefaults: false`) and gives exactly the stored breakpoints (round trip).
3. Parse: invalid JSON, the wrong version and an invalid grid each return "nothing stored".

### Browser (`test/browser/persist.test.ts`; each test clears `localStorage` before and after)

4. **Survives reload:** edit count to 16, destroy, then create with the same options. There are 16 columns, and the badge ends with `· Edited`.
5. **Code changed:** save edits, then create with a different config. The code grid shows, the notice appears when the panel opens, Restore applies the edits, and Discard removes the entry.
6. **Reset to code:** clears the entry and shows the code grid. The button disappears.
7. **Code calls win:** after an edit, `setBreakpoints(...)` removes the entry.
8. **`persist: false`:** a spy on `Storage.prototype` sees no reads or writes.
9. **Storage throws:** with `setItem` stubbed to throw, edits still apply, one warning is logged, and nothing throws.
10. **Copy config:**
    - with the clipboard stubbed, the copied text, evaluated as options, reproduces the edited grid (same column rects)
    - with `writeText` rejecting, the textarea appears, focused and selected
11. **Panel position:** a drag is restored after a reload and clamped when the viewport is smaller.
12. **Accessibility:** axe reports no violations with the notice and the textarea showing.

## Out of scope

- **Not per path or project:** storing edits per path or per project, or syncing between tabs (no `storage` event handling).
- **No breakpoint editing:** editing breakpoints' names or widths in the panel.
- **No Figma import:** paste from Figma (#27).
- **No history:** undo history.
- **No other state:** persisting grid visibility or whether the panel is open.

## Edge cases

- **Two apps on one origin:** the second app gets the "code changed" notice, never silently applied edits.
- **The code config gains a breakpoint:** the fingerprint changes, so the notice shows. Restore replaces the full list with the stored one, so the new breakpoint is dropped until the user resets. The notice copy doesn't need to explain this.
- **Quota exceeded:** this is the same as storage throwing. Edits are tiny, so it's not expected in practice.
- **An edit leaves a breakpoint with zero grids:** this is valid, and it's saved and restored as zero grids.

## Files and patterns to follow

- New `src/overlay/persist.ts`: fingerprint, read, write, clear and snippet. Keep it pure where possible, with storage passed in, so the node unit tests can cover it.
- `src/overlay/create.ts`: load before the first `flush`, and save in `setGrids`.
- `src/overlay/panel.ts`: the notice, Reset, Copy, the "Edited" badge, and the position callbacks. Reuse `toInput`, and export it if needed.
- README: the Control panel section gains "Edits are saved", Reset, Copy config and `persist: false`. Remove the "lost on reload" line.

## Boundaries

- Always: try/catch around storage; one host; the store stays the single source of truth.
- Ask first: any runtime dependency, any public API beyond `persist`, and any change to the engine.
- Never: read `process.env`; write storage when `persist` is `false`; apply set-aside edits without the user's click.

## Check

- `pnpm check` passes, including the tests above.
- Playground proof: edit, reload, and see "Edited". Change `main.ts`, reload, and see the notice. Copy config, paste the result into `main.ts`, and see the same grid. Attach screenshots to the PR.
- `/product-team` Workflow E on the diff.
