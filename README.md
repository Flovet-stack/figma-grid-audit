# Grid Auditor

A dev-only browser overlay that shows the **expected** Figma layout grid next to the grid your page **actually rendered**, so you can see where they disagree.

Works with layout grids from Figma. Not affiliated with or endorsed by Figma.

> **Status: pre-release.** Nothing usable yet. The plan is in [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md) and [`specs/`](specs/).

## Usage

The library never runs in production. Load it only in development with a dynamic import, so your bundler drops it from production builds:

```ts
// Vite
if (import.meta.env.DEV) {
  const { createGridOverlay } = await import('grid-auditor');
  createGridOverlay(); // Shift+G toggles the grid
}
```

## Breakpoints

With no options, you get three default breakpoints (Figma Stretch columns):

| Name    | From width | Columns | Margin | Gutter |
| ------- | ---------- | ------- | ------ | ------ |
| Mobile  | 0          | 4       | 16     | 16     |
| Tablet  | 768        | 8       | 24     | 24     |
| Desktop | 1200       | 12      | 80     | 24     |

The breakpoint with the largest "from width" that fits the window is used. You can edit the defaults and add as many breakpoints as you like:

```ts
createGridOverlay({
  breakpoints: [
    // Same name as a default: edits it. Fields you leave out keep their default values.
    { name: 'Desktop', grids: [{ count: 16 }] },
    // New name: adds a breakpoint. It needs a minWidth and at least one grid.
    {
      name: 'Laptop',
      minWidth: 1024,
      grids: [{ pattern: 'COLUMNS', count: 12, offset: 40, gutterSize: 24 }],
    },
  ],
});
```

- `extendDefaults: false` ignores the defaults and uses only your breakpoints.
- `overlay.setBreakpoints(breakpoints, { extendDefaults })` changes them while the page runs, with no reload.
- `DEFAULT_BREAKPOINTS` is exported (read-only) if you want to copy it.
- Two breakpoints with the same `minWidth` are an error.

## Control panel

Press **Ctrl+Shift+G** (**Cmd+Shift+G** on Mac) to open the panel. It shows the active breakpoint and lets you edit its grids the way Figma's Layout guides section does: type, count, alignment, width, gutter, margin or offset, colour and opacity. You can also add, remove, show and hide grids. Changes appear straight away.

- Arrow keys change a value by 1, and Shift+arrow by 10. Enter or leaving the field applies it.
- Panel edits are lost on reload for now. Calling `update()` or `setBreakpoints()` from code replaces them.
- `overlay.openPanel()`, `overlay.closePanel()` and `overlay.isPanelOpen()` control it from code.
- `shortcuts: { panel: false }` turns the shortcut off.

## Development

Requires Node 24 and pnpm 11.

```bash
pnpm install
pnpm exec playwright install chromium
pnpm dev     # playground
pnpm check   # everything CI runs
```

## Licence

MIT
