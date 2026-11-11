import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GRID_COLOR,
  type GridError,
  type LayoutGridInput,
  normalizeBreakpoints,
  normalizeGrid,
} from '../../../src/engine';

const errorsOf = (input: unknown): readonly GridError[] => {
  const r = normalizeGrid(input as LayoutGridInput);
  if (r.ok) throw new Error('expected errors');
  return r.errors;
};

describe('normalizeGrid: defaults', () => {
  it('fills STRETCH, zero gutter and offset, visible, Figma red', () => {
    const r = normalizeGrid({ pattern: 'COLUMNS', count: 12 });
    expect(r).toEqual({
      ok: true,
      value: {
        pattern: 'COLUMNS',
        alignment: 'STRETCH',
        count: 12,
        gutterSize: 0,
        offset: 0,
        visible: true,
        color: DEFAULT_GRID_COLOR,
      },
      warnings: [],
    });
  });

  it('keeps sectionSize for fixed alignments', () => {
    const r = normalizeGrid({
      pattern: 'ROWS',
      alignment: 'MIN',
      count: 'auto',
      sectionSize: 8,
      color: 'blue',
      visible: false,
    });
    expect(r.ok && r.value).toMatchObject({
      sectionSize: 8,
      count: 'auto',
      color: 'blue',
      visible: false,
    });
  });

  it('normalizes a GRID', () => {
    expect(normalizeGrid({ pattern: 'GRID', sectionSize: 10 })).toEqual({
      ok: true,
      value: { pattern: 'GRID', sectionSize: 10, visible: true, color: DEFAULT_GRID_COLOR },
      warnings: [],
    });
  });
});

describe('normalizeGrid: warnings for ignored fields', () => {
  it('sectionSize on STRETCH', () => {
    const r = normalizeGrid({ pattern: 'COLUMNS', count: 2, sectionSize: 50 });
    expect(r.ok).toBe(true);
    expect(r.warnings).toEqual([
      {
        field: 'sectionSize',
        message: 'sectionSize has no effect on STRETCH (sections fill the space) and is ignored.',
      },
    ]);
    expect(r.ok && 'sectionSize' in r.value).toBe(false);
  });

  it('offset on CENTER', () => {
    const r = normalizeGrid({
      pattern: 'COLUMNS',
      alignment: 'CENTER',
      count: 2,
      sectionSize: 50,
      offset: 5,
    });
    expect(r.warnings.map((w) => w.field)).toEqual(['offset']);
  });

  it('directional fields on GRID', () => {
    const r = normalizeGrid({
      pattern: 'GRID',
      sectionSize: 8,
      alignment: 'MIN',
      count: 3,
      gutterSize: 1,
      offset: 1,
    });
    expect(r.ok).toBe(true);
    expect(r.warnings.map((w) => w.field)).toEqual(['alignment', 'count', 'gutterSize', 'offset']);
  });

  it('very large counts', () => {
    const r = normalizeGrid({ pattern: 'COLUMNS', count: 1001 });
    expect(r.ok).toBe(true);
    expect(r.warnings[0]?.message).toBe('count 1001 is above 1000 and may slow the overlay.');
  });
});

describe('normalizeGrid: errors say what to do', () => {
  it.each([
    [{ pattern: 'DIAGONAL' }, 'pattern', 'Set pattern to "COLUMNS", "ROWS" or "GRID".'],
    [
      { pattern: 'COLUMNS', count: 2, alignment: 'LEFT' },
      'alignment',
      'Set alignment to "MIN", "MAX", "CENTER" or "STRETCH".',
    ],
    [
      { pattern: 'COLUMNS', count: 0 },
      'count',
      'Set count to a whole number of 1 or more, or to "auto".',
    ],
    [
      { pattern: 'COLUMNS', count: 2.5 },
      'count',
      'Set count to a whole number of 1 or more, or to "auto".',
    ],
    [{ pattern: 'COLUMNS' }, 'count', 'Set count to a whole number of 1 or more, or to "auto".'],
    [
      { pattern: 'COLUMNS', count: 'auto' },
      'count',
      'count "auto" needs a fixed section size. Use a number, or set alignment to MIN, MAX or CENTER.',
    ],
    [
      { pattern: 'COLUMNS', count: 2, gutterSize: -1 },
      'gutterSize',
      'Set gutterSize to a number of px, 0 or more.',
    ],
    [
      { pattern: 'COLUMNS', count: 2, gutterSize: Number.NaN },
      'gutterSize',
      'Set gutterSize to a number of px, 0 or more.',
    ],
    [
      { pattern: 'COLUMNS', count: 2, offset: Number.POSITIVE_INFINITY },
      'offset',
      'Set offset to a number of px, 0 or more.',
    ],
    [
      { pattern: 'COLUMNS', count: 2, alignment: 'MIN' },
      'sectionSize',
      'MIN needs sectionSize: the column width or row height in px, above 0.',
    ],
    [
      { pattern: 'ROWS', count: 2, alignment: 'MAX', sectionSize: 0 },
      'sectionSize',
      'MAX needs sectionSize: the column width or row height in px, above 0.',
    ],
    [
      { pattern: 'GRID' },
      'sectionSize',
      'A GRID needs sectionSize: the square size in px, above 0.',
    ],
    [
      { pattern: 'GRID', sectionSize: -8 },
      'sectionSize',
      'A GRID needs sectionSize: the square size in px, above 0.',
    ],
    [{ pattern: 'COLUMNS', count: 2, visible: 'yes' }, 'visible', 'Set visible to true or false.'],
    [
      { pattern: 'COLUMNS', count: 2, color: ' ' },
      'color',
      'Set color to a CSS colour, for example "rgba(255, 0, 0, 0.1)".',
    ],
    [
      { pattern: 'GRID', sectionSize: 8, color: 3 },
      'color',
      'Set color to a CSS colour, for example "rgba(255, 0, 0, 0.1)".',
    ],
  ])('%o → %s', (input, field, message) => {
    expect(errorsOf(input)).toContainEqual(expect.objectContaining({ field, message }));
  });

  it('never uses the word "invalid"', () => {
    const r = normalizeGrid({ pattern: 'COLUMNS', count: -1, gutterSize: -1, offset: -1 });
    expect(r.ok).toBe(false);
    if (!r.ok) for (const e of r.errors) expect(e.message.toLowerCase()).not.toContain('invalid');
  });

  it('reports the value it received', () => {
    expect(errorsOf({ pattern: 'COLUMNS', count: 0 })[0]?.received).toBe(0);
  });
});

describe('normalizeBreakpoints', () => {
  it('normalizes every grid and keeps names', () => {
    const r = normalizeBreakpoints([
      { minWidth: 0, name: 'Mobile', grids: [{ pattern: 'COLUMNS', count: 4 }] },
      { minWidth: 1200, grids: [{ pattern: 'COLUMNS', count: 12, sectionSize: 1 }] },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value[0]).toMatchObject({ minWidth: 0, name: 'Mobile' });
      expect(r.value[1]).not.toHaveProperty('name');
    }
    expect(r.warnings.map((w) => w.field)).toEqual(['[1].grids[0].sectionSize']);
  });

  it('rejects duplicate and negative minWidth, and prefixes grid errors', () => {
    const r = normalizeBreakpoints([
      { minWidth: 768, grids: [] },
      { minWidth: 768, grids: [] },
      { minWidth: -1, grids: [{ pattern: 'COLUMNS', count: 0 }] },
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.map((e) => e.field)).toEqual([
        '[1].minWidth',
        '[2].minWidth',
        '[2].grids[0].count',
      ]);
      expect(r.errors[0]?.message).toBe(
        'Another breakpoint already uses minWidth 768. Give each breakpoint its own minWidth.',
      );
    }
  });
});
