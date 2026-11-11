import { describe, expect, it } from 'vitest';
import {
  type BreakpointInput,
  DEFAULT_BREAKPOINTS,
  mergeBreakpoints,
  normalizeBreakpoints,
} from '../../../src/engine';

// Decision 0010, spec 02 amendment A1.

const ok = (r: ReturnType<typeof mergeBreakpoints>) => {
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r.value;
};

describe('DEFAULT_BREAKPOINTS', () => {
  it('has the values from 0010 and is valid', () => {
    expect(
      DEFAULT_BREAKPOINTS.map((b) => [
        b.name,
        b.minWidth,
        b.grids[0]?.count,
        b.grids[0]?.offset,
        b.grids[0]?.gutterSize,
      ]),
    ).toEqual([
      ['Mobile', 0, 4, 16, 16],
      ['Tablet', 768, 8, 24, 24],
      ['Desktop', 1200, 12, 80, 24],
    ]);
    for (const b of DEFAULT_BREAKPOINTS) expect(b.grids[0]?.alignment).toBe('STRETCH');
    expect(normalizeBreakpoints(DEFAULT_BREAKPOINTS).ok).toBe(true);
  });

  it('is frozen all the way down', () => {
    expect(Object.isFrozen(DEFAULT_BREAKPOINTS)).toBe(true);
    expect(Object.isFrozen(DEFAULT_BREAKPOINTS[0])).toBe(true);
    expect(Object.isFrozen(DEFAULT_BREAKPOINTS[0]?.grids)).toBe(true);
    expect(Object.isFrozen(DEFAULT_BREAKPOINTS[0]?.grids[0])).toBe(true);
  });
});

describe('mergeBreakpoints', () => {
  it('no input gives the defaults', () => {
    expect(ok(mergeBreakpoints(DEFAULT_BREAKPOINTS, undefined))).toEqual(DEFAULT_BREAKPOINTS);
    expect(ok(mergeBreakpoints(DEFAULT_BREAKPOINTS, []))).toEqual(DEFAULT_BREAKPOINTS);
  });

  it('edits one field of a default and keeps the rest', () => {
    const out = ok(
      mergeBreakpoints(DEFAULT_BREAKPOINTS, [{ name: 'Desktop', grids: [{ count: 16 }] }]),
    );
    expect(out[2]).toEqual({
      name: 'Desktop',
      minWidth: 1200,
      grids: [{ pattern: 'COLUMNS', alignment: 'STRETCH', count: 16, offset: 80, gutterSize: 24 }],
    });
    expect(out[0]).toEqual(DEFAULT_BREAKPOINTS[0]);
  });

  it('edits a default minWidth and re-sorts', () => {
    const out = ok(mergeBreakpoints(DEFAULT_BREAKPOINTS, [{ name: 'Tablet', minWidth: 1300 }]));
    expect(out.map((b) => b.name)).toEqual(['Mobile', 'Desktop', 'Tablet']);
    expect(out[2]?.grids).toEqual(DEFAULT_BREAKPOINTS[1]?.grids);
  });

  it('adds extra grids after the default ones', () => {
    const out = ok(
      mergeBreakpoints(DEFAULT_BREAKPOINTS, [
        { name: 'Mobile', grids: [{}, { pattern: 'ROWS', count: 'auto', sectionSize: 8 }] },
      ]),
    );
    expect(out[0]?.grids).toHaveLength(2);
    expect(out[0]?.grids[0]).toEqual(DEFAULT_BREAKPOINTS[0]?.grids[0]);
  });

  it('adds a new 1024 breakpoint between Tablet and Desktop', () => {
    const laptop: BreakpointInput = {
      name: 'Laptop',
      minWidth: 1024,
      grids: [{ pattern: 'COLUMNS', count: 12 }],
    };
    const out = ok(mergeBreakpoints(DEFAULT_BREAKPOINTS, [laptop]));
    expect(out.map((b) => b.name)).toEqual(['Mobile', 'Tablet', 'Laptop', 'Desktop']);
    expect(out[2]).toBe(laptop);
  });

  it('extendDefaults: false uses only the input, sorted', () => {
    const out = ok(
      mergeBreakpoints(
        DEFAULT_BREAKPOINTS,
        [
          { minWidth: 900, grids: [{ pattern: 'COLUMNS', count: 6 }] },
          { name: 'Desktop', minWidth: 0, grids: [{ pattern: 'COLUMNS', count: 2 }] },
        ],
        false,
      ),
    );
    expect(out.map((b) => b.minWidth)).toEqual([0, 900]);
    expect(out[0]?.grids[0]?.count).toBe(2);
  });

  it('a duplicate minWidth names both breakpoints', () => {
    const r = mergeBreakpoints(DEFAULT_BREAKPOINTS, [
      { name: 'Small tablet', minWidth: 768, grids: [{ pattern: 'COLUMNS', count: 6 }] },
    ]);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]?.message).toContain('"Tablet"');
    expect(r.errors[0]?.message).toContain('"Small tablet"');
  });

  it('labels unnamed breakpoints by index', () => {
    const r = mergeBreakpoints(DEFAULT_BREAKPOINTS, [
      { minWidth: 0, grids: [{ pattern: 'GRID' }] },
    ]);
    expect(!r.ok && r.errors[0]?.message).toContain('breakpoint 1');
  });

  it('a new breakpoint needs a minWidth and grids', () => {
    const r = mergeBreakpoints(DEFAULT_BREAKPOINTS, [{ name: 'Laptop' }, { grids: [] }]);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.field)).toEqual([
      '[0].minWidth',
      '[0].grids',
      '[1].minWidth',
      '[1].grids',
    ]);
    expect(r.errors[0]?.message).toContain('"Laptop"');
    expect(r.errors[2]?.message).toContain('breakpoint 1');
  });

  it('never mutates its inputs', () => {
    const before = JSON.stringify(DEFAULT_BREAKPOINTS);
    const input = [{ name: 'Desktop', grids: [{ count: 16 }] }];
    const inputBefore = JSON.stringify(input);
    mergeBreakpoints(DEFAULT_BREAKPOINTS, input);
    expect(JSON.stringify(DEFAULT_BREAKPOINTS)).toBe(before);
    expect(JSON.stringify(input)).toBe(inputBefore);
  });
});
