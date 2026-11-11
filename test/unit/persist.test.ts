import { describe, expect, it, vi } from 'vitest';
import { type Breakpoint, type BreakpointInput, normalizeBreakpoints } from '../../src/engine';
import {
  fingerprint,
  parseStored,
  STORAGE_KEY,
  safeStorage,
  snippet,
  toInputs,
} from '../../src/overlay/persist';

// Spec 04 unit tests: fingerprint, snippet round trip, parsing and guarded storage.

const norm = (input: BreakpointInput[]): readonly Breakpoint[] => {
  const r = normalizeBreakpoints(input);
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r.value;
};

const ALL: BreakpointInput[] = [
  {
    name: "Mo'bile",
    minWidth: 0,
    grids: [
      { pattern: 'COLUMNS', alignment: 'STRETCH', count: 4, offset: 16, gutterSize: 16 },
      {
        pattern: 'ROWS',
        alignment: 'MIN',
        count: 'auto',
        sectionSize: 24,
        gutterSize: 0,
        offset: 8,
      },
    ],
  },
  {
    name: 'Desktop',
    minWidth: 1200,
    grids: [
      { pattern: 'COLUMNS', alignment: 'CENTER', count: 12, sectionSize: 74, gutterSize: 24 },
      {
        pattern: 'COLUMNS',
        alignment: 'MAX',
        count: 3,
        sectionSize: 50,
        gutterSize: 10,
        offset: 5,
      },
      { pattern: 'GRID', sectionSize: 8, visible: false, color: 'rgba(0, 0, 255, 0.2)' },
    ],
  },
  { minWidth: 2000, grids: [] },
];

describe('1. fingerprint', () => {
  it('ignores field order', () => {
    const a = norm([{ minWidth: 0, grids: [{ pattern: 'COLUMNS', count: 4, gutterSize: 8 }] }]);
    const b = norm([{ grids: [{ gutterSize: 8, count: 4, pattern: 'COLUMNS' }], minWidth: 0 }]);
    expect(fingerprint(a)).toBe(fingerprint(b));
    expect(fingerprint(a)).toMatch(/^[0-9a-f]{8}$/);
  });

  it('changes on any value change', () => {
    const base = norm(ALL);
    const changed = norm([{ ...ALL[0], minWidth: 1 } as BreakpointInput, ...ALL.slice(1)]);
    const recolored = norm([
      ALL[0] as BreakpointInput,
      {
        ...(ALL[1] as BreakpointInput),
        grids: [{ pattern: 'GRID', sectionSize: 9 }],
      },
      ALL[2] as BreakpointInput,
    ]);
    expect(fingerprint(changed)).not.toBe(fingerprint(base));
    expect(fingerprint(recolored)).not.toBe(fingerprint(base));
  });
});

describe('2. snippet round trip', () => {
  it('reproduces every pattern and alignment exactly', () => {
    const bps = norm(ALL);
    const text = snippet(bps);
    let captured: { extendDefaults: boolean; breakpoints: BreakpointInput[] } | undefined;
    new Function('createGridOverlay', text)((o: typeof captured) => {
      captured = o;
    });
    expect(captured?.extendDefaults).toBe(false);
    const r = normalizeBreakpoints(captured?.breakpoints ?? []);
    expect(r.ok && r.warnings).toEqual([]);
    expect(r.ok && r.value).toEqual(bps);
    expect(text).toContain("name: 'Mo\\'bile'");
    expect(text).toContain('grids: [],');
  });

  it('toInputs drops fields that do not apply', () => {
    const [mobile] = toInputs(norm(ALL));
    expect(mobile?.grids[0]).not.toHaveProperty('sectionSize');
    expect(mobile?.grids[0]).not.toHaveProperty('visible');
  });
});

describe('3. parse', () => {
  const good = { version: 1, fingerprint: 'abc', breakpoints: ALL, panel: { x: 1, y: 2 } };

  it('accepts a valid entry, and one with only a position', () => {
    const p = parseStored(JSON.stringify(good));
    expect(p?.breakpoints).toEqual(norm(ALL));
    expect(p?.stored.panel).toEqual({ x: 1, y: 2 });
    const pos = parseStored(
      JSON.stringify({ version: 1, fingerprint: 'abc', panel: { x: 3, y: 4 } }),
    );
    expect(pos?.breakpoints).toBeUndefined();
    expect(pos?.stored.panel).toEqual({ x: 3, y: 4 });
  });

  it.each([
    ['nothing', null],
    ['invalid JSON', '{nope'],
    ['not an object', '42'],
    ['another version', JSON.stringify({ ...good, version: 2 })],
    ['no fingerprint', JSON.stringify({ ...good, fingerprint: 1 })],
    ['a bad position', JSON.stringify({ ...good, panel: { x: 'a' } })],
    ['breakpoints not an array', JSON.stringify({ ...good, breakpoints: {} })],
    ['a breakpoint without grids', JSON.stringify({ ...good, breakpoints: [{ minWidth: 0 }] })],
    [
      'an invalid grid',
      JSON.stringify({
        ...good,
        breakpoints: [{ minWidth: 0, grids: [{ pattern: 'COLUMNS', count: 0 }] }],
      }),
    ],
  ])('returns nothing for %s', (_, text) => {
    expect(parseStored(text)).toBeUndefined();
  });
});

describe('safe storage', () => {
  const memory = (): Storage => {
    const m = new Map<string, string>();
    return {
      getItem: (k) => m.get(k) ?? null,
      setItem: (k, v) => void m.set(k, v),
      removeItem: (k) => void m.delete(k),
      clear: () => m.clear(),
      key: () => null,
      get length() {
        return m.size;
      },
    };
  };

  it('writes, reads, removes bad data and clears', () => {
    const s = memory();
    const store = safeStorage(() => s, vi.fn());
    store.write({ version: 1, fingerprint: 'f', panel: { x: 0, y: 0 } });
    expect(store.read()?.stored.fingerprint).toBe('f');
    s.setItem(STORAGE_KEY, '{nope');
    expect(store.read()).toBeUndefined();
    expect(s.getItem(STORAGE_KEY)).toBeNull();
    store.write({ version: 1, fingerprint: 'f' });
    store.clear();
    expect(s.getItem(STORAGE_KEY)).toBeNull();
  });

  it('never throws when storage is missing or throws', () => {
    const onError = vi.fn();
    const missing = safeStorage(() => undefined, onError);
    expect(missing.read()).toBeUndefined();
    const throwing = safeStorage(() => {
      throw new Error('blocked');
    }, onError);
    expect(() => throwing.write({ version: 1, fingerprint: 'f' })).not.toThrow();
    expect(() => throwing.clear()).not.toThrow();
    expect(onError).toHaveBeenCalledTimes(3);
  });
});
