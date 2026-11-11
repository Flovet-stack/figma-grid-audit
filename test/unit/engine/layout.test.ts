import { describe, expect, it } from 'vitest';
import {
  computeSections,
  computeSquares,
  type DirectionalGrid,
  type LayoutGridInput,
  normalizeGrid,
  type SquareGrid,
} from '../../../src/engine';

const grid = (input: LayoutGridInput): DirectionalGrid => {
  const r = normalizeGrid(input);
  if (!r.ok || r.value.pattern === 'GRID') throw new Error('test grid must be directional');
  return r.value;
};

const starts = (g: DirectionalGrid, width: number, height = 1000) =>
  computeSections(g, { width, height }).sections.map((s) => s.start);

// Expected values are worked out by hand from the formulas in specs/01-grid-engine.md.
// The Figma proof (spec Check) confirms a subset against real Figma frames.
describe('computeSections', () => {
  it('STRETCH: 12 columns at 1440, offset 80, gutter 24', () => {
    const g = grid({ pattern: 'COLUMNS', count: 12, offset: 80, gutterSize: 24 });
    const { sections } = computeSections(g, { width: 1440, height: 900 });
    expect(sections).toHaveLength(12);
    // (1440 − 160 − 11·24) / 12 = 84.666…
    for (const s of sections) expect(s.size).toBeCloseTo(1016 / 12, 9);
    expect(sections[0]?.start).toBe(80);
    expect(sections[11]?.start).toBeCloseTo(80 + 11 * (1016 / 12 + 24), 9);
    const last = sections[11];
    expect((last?.start ?? 0) + (last?.size ?? 0)).toBeCloseTo(1360, 9);
  });

  it('STRETCH: 8 columns at 768, offset 40, gutter 16', () => {
    const g = grid({ pattern: 'COLUMNS', count: 8, offset: 40, gutterSize: 16 });
    const { sections } = computeSections(g, { width: 768, height: 1024 });
    expect(sections.map((s) => s.size)).toEqual(Array(8).fill(72));
    expect(sections.map((s) => s.start)).toEqual([40, 128, 216, 304, 392, 480, 568, 656]);
  });

  it('STRETCH: 4 columns at 375, offset 20, gutter 12', () => {
    const g = grid({ pattern: 'COLUMNS', count: 4, offset: 20, gutterSize: 12 });
    const { sections } = computeSections(g, { width: 375, height: 812 });
    expect(sections.map((s) => s.size)).toEqual(Array(4).fill(74.75));
    expect(sections.map((s) => s.start)).toEqual([20, 106.75, 193.5, 280.25]);
  });

  it('STRETCH with zero gutter and zero offset splits evenly', () => {
    const g = grid({ pattern: 'COLUMNS', count: 3 });
    expect(starts(g, 300)).toEqual([0, 100, 200]);
  });

  it('ROWS measure along the height', () => {
    const g = grid({ pattern: 'ROWS', count: 2, gutterSize: 10 });
    const { sections } = computeSections(g, { width: 9999, height: 210 });
    expect(sections).toEqual([
      { index: 0, start: 0, size: 100 },
      { index: 1, start: 110, size: 100 },
    ]);
  });

  it('STRETCH that cannot fit returns no sections and a warning', () => {
    const g = grid({ pattern: 'COLUMNS', count: 12, offset: 80, gutterSize: 24 });
    const r = computeSections(g, { width: 100, height: 100 });
    expect(r.sections).toEqual([]);
    expect(r.warnings[0]?.message).toMatch(/don't fit in 100 px/);
  });

  it('MIN: starts at the offset', () => {
    const g = grid({
      pattern: 'COLUMNS',
      alignment: 'MIN',
      count: 3,
      sectionSize: 100,
      gutterSize: 20,
      offset: 10,
    });
    expect(starts(g, 1000)).toEqual([10, 130, 250]);
  });

  it('MIN overflow is returned, not clipped (assumption checked in the Figma proof)', () => {
    const g = grid({
      pattern: 'COLUMNS',
      alignment: 'MIN',
      count: 6,
      sectionSize: 300,
      gutterSize: 20,
    });
    expect(starts(g, 1000)).toEqual([0, 320, 640, 960, 1280, 1600]);
  });

  it('MAX: 3 rows of 100, gutter 16, offset 24, in 800 tall', () => {
    const g = grid({
      pattern: 'ROWS',
      alignment: 'MAX',
      count: 3,
      sectionSize: 100,
      gutterSize: 16,
      offset: 24,
    });
    expect(starts(g, 500, 800)).toEqual([444, 560, 676]);
  });

  it('CENTER: 4 columns of 80, gutter 20, in 375 (overflows equally both sides)', () => {
    const g = grid({
      pattern: 'COLUMNS',
      alignment: 'CENTER',
      count: 4,
      sectionSize: 80,
      gutterSize: 20,
    });
    expect(starts(g, 375)).toEqual([-2.5, 97.5, 197.5, 297.5]);
  });

  it('CENTER ignores offset', () => {
    const g = grid({
      pattern: 'COLUMNS',
      alignment: 'CENTER',
      count: 1,
      sectionSize: 100,
      offset: 50,
    });
    expect(starts(g, 300)).toEqual([100]);
  });

  it('auto count: MIN fits floor((A + g) / (s + g)) sections', () => {
    const g = grid({
      pattern: 'COLUMNS',
      alignment: 'MIN',
      count: 'auto',
      sectionSize: 100,
      gutterSize: 20,
    });
    expect(starts(g, 1000)).toHaveLength(8);
    const withOffset = grid({
      pattern: 'COLUMNS',
      alignment: 'MIN',
      count: 'auto',
      sectionSize: 100,
      gutterSize: 20,
      offset: 100,
    });
    expect(starts(withOffset, 1000)).toHaveLength(7);
  });

  it('auto count: MAX and CENTER', () => {
    const max = grid({
      pattern: 'COLUMNS',
      alignment: 'MAX',
      count: 'auto',
      sectionSize: 100,
      gutterSize: 0,
      offset: 50,
    });
    expect(starts(max, 1000)).toEqual([50, 150, 250, 350, 450, 550, 650, 750, 850]);
    const center = grid({
      pattern: 'COLUMNS',
      alignment: 'CENTER',
      count: 'auto',
      sectionSize: 100,
      gutterSize: 0,
    });
    expect(starts(center, 1050)).toEqual([25, 125, 225, 325, 425, 525, 625, 725, 825, 925]);
  });

  it('auto count with a section larger than the container gives no sections', () => {
    const max = grid({ pattern: 'COLUMNS', alignment: 'MAX', count: 'auto', sectionSize: 500 });
    const center = grid({
      pattern: 'COLUMNS',
      alignment: 'CENTER',
      count: 'auto',
      sectionSize: 500,
    });
    expect(starts(max, 400)).toEqual([]);
    expect(starts(center, 400)).toEqual([]);
  });

  it('a zero-size container gives no sections and no warning', () => {
    const g = grid({ pattern: 'COLUMNS', count: 12 });
    expect(computeSections(g, { width: 0, height: 0 })).toEqual({ sections: [], warnings: [] });
  });

  it('accepts fractional inputs', () => {
    const g = grid({ pattern: 'COLUMNS', count: 2, gutterSize: 0.5, offset: 0.25 });
    expect(computeSections(g, { width: 101, height: 1 }).sections.map((s) => s.size)).toEqual([
      50, 50,
    ]);
  });
});

describe('computeSections properties (STRETCH)', () => {
  // Deterministic pseudo-random inputs (LCG), so failures are reproducible.
  let seed = 42;
  const rand = (max: number) => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return (seed / 2 ** 32) * max;
  };

  it('sections + gutters + 2·offset add up to the length, with no overlaps', () => {
    for (let k = 0; k < 500; k++) {
      const count = 1 + Math.floor(rand(24));
      const gutterSize = rand(40);
      const offset = rand(120);
      const width = 2 * offset + (count - 1) * gutterSize + 1 + rand(2000);
      const g = grid({ pattern: 'COLUMNS', count, gutterSize, offset });
      const { sections } = computeSections(g, { width, height: 1 });
      expect(sections).toHaveLength(count);
      const sum = sections.reduce((a, s) => a + s.size, 0) + (count - 1) * gutterSize + 2 * offset;
      expect(Math.abs(sum - width)).toBeLessThan(1e-9);
      for (let i = 1; i < sections.length; i++) {
        const prev = sections[i - 1] as { start: number; size: number };
        expect((sections[i]?.start ?? 0) - (prev.start + prev.size)).toBeGreaterThanOrEqual(-1e-9);
      }
    }
  });
});

describe('computeSquares', () => {
  const square = (sectionSize: number): SquareGrid => ({
    pattern: 'GRID',
    sectionSize,
    visible: true,
    color: 'red',
  });

  it('8 px squares on 100 × 50, anchored top-left', () => {
    const { xs, ys } = computeSquares(square(8), { width: 100, height: 50 });
    expect(xs).toEqual([0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96]);
    expect(ys).toEqual([0, 8, 16, 24, 32, 40, 48]);
  });

  it('includes the edge line when the size divides exactly', () => {
    expect(computeSquares(square(10), { width: 30, height: 0 })).toEqual({
      xs: [0, 10, 20, 30],
      ys: [],
    });
  });
});
