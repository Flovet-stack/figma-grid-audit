import { describe, expect, it } from 'vitest';
import { MARKER, version } from '../../src/index';

describe('package entry', () => {
  it('exports a non-empty version', () => {
    expect(typeof version).toBe('string');
    expect(version.length).toBeGreaterThan(0);
  });

  it('exports the production-exclusion marker', () => {
    expect(MARKER).toBe('__FIGMA_GRID_AUDIT__');
  });
});
