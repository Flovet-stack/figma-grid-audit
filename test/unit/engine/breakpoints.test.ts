import { describe, expect, it } from 'vitest';
import { type Breakpoint, pickBreakpoint } from '../../../src/engine';

const bp = (minWidth: number): Breakpoint => ({ minWidth, grids: [] });
// Deliberately unsorted: order must not matter.
const list = [bp(1200), bp(0), bp(768)];

describe('pickBreakpoint', () => {
  it.each([
    [1440, 1200],
    [1200, 1200],
    [1199, 768],
    [768, 768],
    [375, 0],
    [0, 0],
  ])('width %i → minWidth %i', (width, expected) => {
    expect(pickBreakpoint(width, list)?.minWidth).toBe(expected);
  });

  it('below every breakpoint, falls back to the smallest', () => {
    expect(pickBreakpoint(100, [bp(768), bp(320)])?.minWidth).toBe(320);
  });

  it('returns undefined for an empty list', () => {
    expect(pickBreakpoint(1000, [])).toBeUndefined();
  });
});

describe('engine purity', () => {
  it('loads without a DOM', async () => {
    expect(typeof (globalThis as { window?: unknown }).window).toBe('undefined');
    const engine = await import('../../../src/engine');
    expect(typeof engine.computeSections).toBe('function');
  });
});
