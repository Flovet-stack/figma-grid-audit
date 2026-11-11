// Decision 0004: the consumer gates the library behind a dev-only dynamic
// import, so production builds contain none of it.
if (import.meta.env.DEV) {
  const { version } = await import('figma-grid-audit');
  console.info(`figma-grid-audit ${version} loaded (dev only)`);
}
