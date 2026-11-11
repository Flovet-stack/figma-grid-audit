// Decision 0004: the consumer gates the library behind a dev-only dynamic
// import, so production builds contain none of it.
if (import.meta.env.DEV) {
  const { createGridOverlay } = await import('grid-auditor');
  // The default breakpoints (0010) match style.css: 4 / 8 / 12 stretch columns.
  createGridOverlay();
}
