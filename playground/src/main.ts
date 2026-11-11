// Decision 0004: the consumer gates the library behind a dev-only dynamic
// import, so production builds contain none of it.
if (import.meta.env.DEV) {
  const { createGridOverlay } = await import('figma-grid-audit');
  // Matches style.css: a 1200 px container with 24 px padding and a 12-column, 24 px gap grid.
  createGridOverlay({
    breakpoints: [
      { minWidth: 0, grids: [{ pattern: 'COLUMNS', count: 12, offset: 24, gutterSize: 24 }] },
      {
        minWidth: 1200,
        grids: [
          { pattern: 'COLUMNS', alignment: 'CENTER', count: 12, sectionSize: 74, gutterSize: 24 },
        ],
      },
    ],
  });
}
