if (import.meta.env.DEV) {
  const { createGridOverlay } = await import('figma-grid-audit');
  createGridOverlay({
    breakpoints: [
      {
        minWidth: 0,
        grids: [
          { pattern: 'GRID', sectionSize: 8, color: 'rgba(0, 120, 255, 0.12)' },
          { pattern: 'ROWS', alignment: 'MIN', count: 'auto', sectionSize: 24, gutterSize: 24 },
        ],
      },
    ],
  });
}
