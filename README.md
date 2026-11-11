# Grid Auditor

A dev-only browser overlay that shows the **expected** Figma layout grid next to the grid your page **actually rendered**, so you can see where they disagree.

Works with layout grids from Figma. Not affiliated with or endorsed by Figma.

> **Status: pre-release.** Nothing usable yet. The plan is in [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md) and [`specs/`](specs/).

## Planned usage

The library never runs in production. Load it only in development with a dynamic import, so your bundler drops it from production builds:

```ts
// Vite
if (import.meta.env.DEV) {
  const { version } = await import('grid-auditor');
}
```

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
