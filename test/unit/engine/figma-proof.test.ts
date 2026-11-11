import { describe, expect, it } from 'vitest';
import {
  clipSections,
  computeSections,
  computeSquares,
  type DirectionalGrid,
  type LayoutGridInput,
  normalizeGrid,
  snap,
} from '../../../src/engine';

// Values measured in real Figma frames by Flovet on 2026-11-11 (spec 01 Check, decision 0006).
// These are the source of truth: if Figma and the formulas disagree, Figma wins.

const grid = (input: LayoutGridInput): DirectionalGrid => {
  const r = normalizeGrid(input);
  if (!r.ok || r.value.pattern === 'GRID') throw new Error('test grid must be directional');
  return r.value;
};
const visible = (g: DirectionalGrid, L: number) =>
  clipSections(computeSections(g, { width: L, height: L }).sections, L);

describe('snap (0006)', () => {
  it.each([
    [84.67, 85],
    [188.666, 189],
    [1275.333, 1275],
    [-2.5, -3],
    [97.5, 97],
    [77.5, 77],
    [2.5, 2],
    [0.4, 0],
    [-0.4, 0],
  ])('%d → %d', (v, expected) => {
    expect(snap(v)).toBe(expected);
  });

  it('never returns negative zero', () => {
    expect(Object.is(snap(-0.2), 0)).toBe(true);
  });
});

describe('Figma proof', () => {
  it('frame 1: 12 stretch columns, 1440 / margin 80 / gutter 24', () => {
    const v = visible(grid({ pattern: 'COLUMNS', count: 12, offset: 80, gutterSize: 24 }), 1440);
    expect(v[0]).toMatchObject({ visibleStart: 80, visibleEnd: 165 }); // 85 wide
    expect(v[1]?.visibleStart).toBe(189);
    expect(v[11]).toMatchObject({ visibleStart: 1275, visibleEnd: 1360 });
  });

  it('frame 2: 4 centred columns of 80 / gutter 20 in 375, first one clipped to 77', () => {
    const v = visible(
      grid({ pattern: 'COLUMNS', alignment: 'CENTER', count: 4, sectionSize: 80, gutterSize: 20 }),
      375,
    );
    expect(v.map((s) => [s.visibleStart, s.visibleEnd - s.visibleStart])).toEqual([
      [0, 77],
      [97, 80],
      [197, 80],
      [297, 78], // clipped at 375 on the right
    ]);
  });

  it.each([
    [376, 98],
    [374, 97],
  ])('frame 2 at %i wide: second column at %i', (L, expected) => {
    const v = visible(
      grid({ pattern: 'COLUMNS', alignment: 'CENTER', count: 4, sectionSize: 80, gutterSize: 20 }),
      L,
    );
    expect(v[1]?.visibleStart).toBe(expected);
  });

  it('frame 3: 3 bottom rows of 100 / gutter 16 / offset 24 in 800', () => {
    const v = visible(
      grid({
        pattern: 'ROWS',
        alignment: 'MAX',
        count: 3,
        sectionSize: 100,
        gutterSize: 16,
        offset: 24,
      }),
      800,
    );
    expect(v.map((s) => s.visibleStart)).toEqual([444, 560, 676]);
  });

  it('frame 4: 6 left columns of 300 / gutter 20 in 1000, clip on hides the overflow', () => {
    const v = visible(
      grid({ pattern: 'COLUMNS', alignment: 'MIN', count: 6, sectionSize: 300, gutterSize: 20 }),
      1000,
    );
    expect(v.map((s) => [s.visibleStart, s.visibleEnd])).toEqual([
      [0, 300],
      [320, 620],
      [640, 940],
      [960, 1000],
    ]);
  });

  it('frame 5: 10 px square grid on 95 × 95 anchored top-left', () => {
    const { xs, ys } = computeSquares(
      { pattern: 'GRID', sectionSize: 10, visible: true, color: 'red' },
      {
        width: 95,
        height: 95,
      },
    );
    expect(xs).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90]);
    expect(ys).toEqual(xs);
  });
});

describe('clipSections', () => {
  it('drops sections entirely outside, including ones before 0', () => {
    const g = grid({
      pattern: 'COLUMNS',
      alignment: 'CENTER',
      count: 3,
      sectionSize: 100,
      gutterSize: 0,
    });
    // Exact starts −50, 50, 150 in 200: the first is half visible.
    expect(visible(g, 200).map((s) => s.visibleStart)).toEqual([0, 50, 150]);
    const wide = grid({
      pattern: 'COLUMNS',
      alignment: 'CENTER',
      count: 5,
      sectionSize: 100,
      gutterSize: 0,
    });
    // Exact starts −150 … 250 in 200: the outer two are fully hidden.
    expect(visible(wide, 200).map((s) => s.index)).toEqual([1, 2, 3]);
  });
});
