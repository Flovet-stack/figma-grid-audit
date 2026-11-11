/**
 * Saving panel edits across reloads (decision 0013, spec 04). Pure where possible:
 * storage is passed in, so the node unit tests cover everything but the DOM.
 */
import {
  type Breakpoint,
  type BreakpointInput,
  type LayoutGrid,
  type LayoutGridInput,
  normalizeBreakpoints,
} from '../engine';

export const STORAGE_KEY = 'grid-auditor:v1';

export interface Position {
  readonly x: number;
  readonly y: number;
}

/** The stored entry. `breakpoints` is present only when the user has edited grids. */
export interface Stored {
  readonly version: 1;
  readonly fingerprint: string;
  readonly breakpoints?: readonly BreakpointInput[];
  readonly panel?: Position;
}

/** A grid as input, with only the fields that apply, so re-validating adds no warnings. */
export function toInput(g: LayoutGrid): LayoutGridInput {
  if (g.pattern === 'GRID') {
    return {
      pattern: 'GRID',
      sectionSize: g.sectionSize,
      ...(g.visible ? {} : { visible: false }),
      color: g.color,
    };
  }
  return {
    pattern: g.pattern,
    alignment: g.alignment,
    count: g.count,
    ...(g.alignment === 'STRETCH' ? {} : { sectionSize: g.sectionSize }),
    gutterSize: g.gutterSize,
    ...(g.alignment === 'CENTER' ? {} : { offset: g.offset }),
    ...(g.visible ? {} : { visible: false }),
    color: g.color,
  };
}

export function toInputs(breakpoints: readonly Breakpoint[]): BreakpointInput[] {
  return breakpoints.map((bp) => ({
    ...(bp.name === undefined ? {} : { name: bp.name }),
    minWidth: bp.minWidth,
    grids: bp.grids.map(toInput),
  }));
}

/** JSON with object keys sorted, so field order never changes the result. */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

/** FNV-1a (32-bit) of the normalized code config, as 8 hex digits. Not cryptographic. */
export function fingerprint(breakpoints: readonly Breakpoint[]): string {
  const text = stableStringify(breakpoints);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export interface Parsed {
  readonly stored: Stored;
  /** The stored edits, normalized; absent when only a position was saved. */
  readonly breakpoints?: readonly Breakpoint[];
}

const isPosition = (v: unknown): v is Position =>
  typeof v === 'object' &&
  v !== null &&
  Number.isFinite((v as Position).x) &&
  Number.isFinite((v as Position).y);

/** Parses a stored entry. Anything malformed, from another version or invalid gives `undefined`. */
export function parseStored(text: string | null): Parsed | undefined {
  if (text === null) return undefined;
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (typeof data !== 'object' || data === null) return undefined;
  const d = data as Record<string, unknown>;
  if (d.version !== 1 || typeof d.fingerprint !== 'string') return undefined;
  if (d.panel !== undefined && !isPosition(d.panel)) return undefined;
  const panel = d.panel as Position | undefined;
  if (d.breakpoints === undefined) {
    return { stored: { version: 1, fingerprint: d.fingerprint, ...(panel ? { panel } : {}) } };
  }
  if (!Array.isArray(d.breakpoints)) return undefined;
  const bps = d.breakpoints as BreakpointInput[];
  if (!bps.every((b) => typeof b === 'object' && b !== null && Array.isArray(b.grids))) {
    return undefined;
  }
  const r = normalizeBreakpoints(bps);
  if (!r.ok) return undefined;
  return {
    stored: {
      version: 1,
      fingerprint: d.fingerprint,
      breakpoints: bps,
      ...(panel ? { panel } : {}),
    },
    breakpoints: r.value,
  };
}

const quote = (s: string): string => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

function literal(value: unknown): string {
  if (typeof value === 'string') return quote(value);
  return String(value);
}

/** The "Copy config" snippet: reproduces `breakpoints` exactly with `extendDefaults: false`. */
export function snippet(breakpoints: readonly Breakpoint[]): string {
  const lines = ['createGridOverlay({', '  extendDefaults: false,', '  breakpoints: ['];
  for (const bp of toInputs(breakpoints)) {
    lines.push('    {');
    if (bp.name !== undefined) lines.push(`      name: ${quote(bp.name)},`);
    lines.push(`      minWidth: ${bp.minWidth},`);
    if (bp.grids.length === 0) {
      lines.push('      grids: [],');
    } else {
      lines.push('      grids: [');
      for (const g of bp.grids) {
        const fields = Object.entries(g).map(([k, v]) => `${k}: ${literal(v)}`);
        lines.push(`        { ${fields.join(', ')} },`);
      }
      lines.push('      ],');
    }
    lines.push('    },');
  }
  lines.push('  ],', '});');
  return lines.join('\n');
}

/** Storage with every access guarded (0013): failures call `onError` and never throw. */
export interface SafeStorage {
  read(): Parsed | undefined;
  write(entry: Stored): void;
  clear(): void;
}

export function safeStorage(
  get: () => Storage | undefined,
  onError: (error: unknown) => void,
): SafeStorage {
  const run = <T>(fn: (s: Storage) => T): T | undefined => {
    try {
      const s = get();
      if (!s) throw new Error('localStorage is not available');
      return fn(s);
    } catch (error) {
      onError(error);
      return undefined;
    }
  };
  return {
    read() {
      return run((s) => {
        const text = s.getItem(STORAGE_KEY);
        const parsed = parseStored(text);
        if (text !== null && !parsed) s.removeItem(STORAGE_KEY);
        return parsed;
      });
    },
    write(entry) {
      run((s) => s.setItem(STORAGE_KEY, JSON.stringify(entry)));
    },
    clear() {
      run((s) => s.removeItem(STORAGE_KEY));
    },
  };
}
