# 0013: Keep panel edits across reloads, and copy them back to code

- **Status:** Approved
- **Proposed:** 2026-11-11 by the product team (roles: Tech Lead, Project Manager, Product, UX, Copy, Frontend)
- **Approved:** 2026-11-11 by Flovet
- **Supersedes:** none
- **Specs:** none yet (spec 04)

## Context

Spec 03 shipped the control panel, but edits are lost on reload. 0012 made spec 04 "persist panel edits" and asked for a decision first on three questions:

1. **Storage:** where the edits are kept.
2. **Precedence:** what happens when saved edits and the code config disagree.
3. **Copy config:** how the user gets panel edits back into code.

Two risks shape the answers:

- **Drift.** The brief promises that the overlay matches the Figma spec. Saved edits that silently override the code would make the overlay show something the code doesn't say (review C4 was this bug in the old panel).
- **Shared origins.** `localhost:5173` is reused by every project a developer runs, so edits saved for one app can show up in another.

## Research

| Reference                                                   | What they do                                                                                                                                                  | Adopt / adapt / reject                                | Why                                                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| GuideFrame                                                  | Guides persist per route. No export, copy or reset is documented                                                                                              | **Adopt** persistence; **reject** per route for grids | Grids belong to the app, not to one page. Per-route storage stays for guides (#16)      |
| Chrome DevTools "Changes" tab (not opened, from experience) | Lists edits made in DevTools and offers "Copy all changes" so they can be pasted into source                                                                  | **Adopt** the idea                                    | Edits made in a tool should flow back to the source of truth, not live only in the tool |
| Clipboard API (MDN)                                         | `writeText` needs a secure context, and `localhost` counts as one. It rejects with `NotAllowedError` when blocked, so call it from a click and catch failures | **Adopt** with a fallback                             | Works on dev servers. The fallback is a selectable text box                             |
| Web Storage                                                 | `localStorage` is per origin. It can throw (private mode, quota, blocked)                                                                                     | **Adopt** with try/catch                              | No dependency, synchronous, survives reloads                                            |

Sources (opened):

- https://guide-frame.vercel.app/
- https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText

## Options

**Precedence** (the main choice):

1. **Saved edits always win over code.** Simple, but changing the code config has no visible effect while old edits exist. That brings back the C4 drift.
2. **Code always wins; edits are never saved.** Safe, but it's the current behaviour the user asked to change.
3. **Saved edits win only while the code config is unchanged (recommended).** Edits are saved together with a fingerprint of the code config they were made against. On load, if the fingerprint still matches, the edits are reapplied. If the code changed, or the edits came from another app on the same origin, they're set aside. They aren't silently deleted: the panel says so and offers to restore them.

## Decision

Option 3, with these rules:

- **Storage:** one `localStorage` entry per origin under `grid-auditor:v1`. It holds:
  - the edited breakpoints, in full
  - a fingerprint of the code config they were made against (the normalized breakpoints, serialized and hashed)
  - the panel position

  Every read and write is wrapped in try/catch. If storage fails, edits still work for the session and nothing is logged more than once.
- **Load:** if the stored fingerprint equals the current code config's fingerprint, the saved breakpoints are used and the badge shows **"Edited"**. Otherwise they're set aside, and the panel shows: "Your code's grid changed since your last edits. Restore edits / Discard."
- **Runtime code calls:** `update()` and `setBreakpoints()` still win, as in spec 03. They also clear saved edits, so a later reload matches the code.
- **Reset:** a **"Reset to code"** button in the Layout guides section clears the edits and shows the code config again.
- **Copy config:** a **"Copy config"** button copies a `createGridOverlay({ breakpoints: [...], extendDefaults: false })` snippet. It contains every breakpoint with only the fields Figma shows, so pasting it reproduces exactly what's on screen. If clipboard access fails, a read-only text box with the snippet appears, already selected.
- **New option:** `persist?: boolean` (default `true`). With `false`, nothing is read or written, which is useful for tests and CI. This is the only new public API, and approving this entry approves it.

## Consequences

- **The drift risk is contained.** When the code changes, it shows; old edits never quietly win.
- **One origin, one app's edits.** Two apps on the same port overwrite each other's saved edits. Either app sees the "code changed" notice, so nothing is applied silently. Edits per path or per project are out of scope.
- The fingerprint uses the normalized config, so reformatting or reordering fields in the code doesn't count as a change, but any value change does.
- **Reviews check:**
  - storage errors are handled
  - nothing is written when `persist: false`
  - the notice appears after a code change
  - the copied snippet, run through `createGridOverlay`, reproduces the edited grid exactly (round-trip test)
