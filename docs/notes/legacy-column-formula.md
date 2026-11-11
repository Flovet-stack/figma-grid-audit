# Legacy column formula (reference for spec 01)

From the pre-rebuild `src/core/geometry.ts` (recoverable at commit `chore: snapshot before rebuild`). Covers only Figma's **Stretch** column alignment, and used `window.innerWidth` (which includes the scrollbar; see review H2).

```ts
columnWidth = (containerWidth - 2 * margin - (columns - 1) * gutter) / columns;
columnStart[i] = margin + i * (columnWidth + gutter);
```

Spec 01 replaces this with the full Figma model (stretch / min / center / max, rows, grid, section size).
