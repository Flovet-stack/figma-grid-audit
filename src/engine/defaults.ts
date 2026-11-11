import type { BreakpointInput, GridError, LayoutGridInput } from './types';

/** A breakpoint as users write it: a full breakpoint, or edits to a default (0010). */
export interface BreakpointEntry {
  readonly name?: string;
  readonly minWidth?: number;
  readonly grids?: readonly Partial<LayoutGridInput>[];
}

const stretch = (count: number, margin: number, gutter: number): LayoutGridInput =>
  Object.freeze({
    pattern: 'COLUMNS',
    alignment: 'STRETCH',
    count,
    offset: margin,
    gutterSize: gutter,
  });

const bp = (name: string, minWidth: number, grid: LayoutGridInput): BreakpointInput =>
  Object.freeze({ name, minWidth, grids: Object.freeze([grid]) });

/** The three default breakpoints (decision 0010). Frozen: copy them to change them. */
export const DEFAULT_BREAKPOINTS: readonly BreakpointInput[] = Object.freeze([
  bp('Mobile', 0, stretch(4, 16, 16)),
  bp('Tablet', 768, stretch(8, 24, 24)),
  bp('Desktop', 1200, stretch(12, 80, 24)),
]);

export type MergeResult =
  | { readonly ok: true; readonly value: readonly BreakpointInput[] }
  | { readonly ok: false; readonly errors: readonly GridError[] };

const label = (b: { name?: string }, i: number): string =>
  b.name === undefined ? `breakpoint ${i}` : `"${b.name}"`;

/**
 * Merges the user's entries into the defaults by `name` (0010). A matching name
 * edits that default (grids merge index by index); a new name adds a breakpoint.
 * With `extendDefaults: false` only the user's entries are used. Pure: inputs are
 * never mutated. The output is sorted by `minWidth`.
 */
export function mergeBreakpoints(
  defaults: readonly BreakpointInput[],
  input: readonly BreakpointEntry[] | undefined,
  extendDefaults = true,
): MergeResult {
  const errors: GridError[] = [];
  const out: BreakpointInput[] = extendDefaults ? defaults.map((d) => ({ ...d })) : [];

  (input ?? []).forEach((entry, i) => {
    const base = entry.name === undefined ? -1 : out.findIndex((d) => d.name === entry.name);
    const target = base >= 0 ? out[base] : undefined;
    if (target) {
      const grids = entry.grids
        ? [
            ...entry.grids.map((g, j) => ({ ...target.grids[j], ...g }) as LayoutGridInput),
            ...target.grids.slice(entry.grids.length),
          ]
        : target.grids;
      out[base] = {
        ...target,
        ...(entry.minWidth === undefined ? {} : { minWidth: entry.minWidth }),
        grids,
      };
      return;
    }
    if (entry.minWidth === undefined) {
      errors.push({
        field: `[${i}].minWidth`,
        received: undefined,
        message: `${label(entry, i)} is a new breakpoint, so give it a minWidth (px), or use the name of a default to edit it.`,
      });
    }
    if (entry.grids === undefined || entry.grids.length === 0) {
      errors.push({
        field: `[${i}].grids`,
        received: entry.grids,
        message: `${label(entry, i)} is a new breakpoint, so give it at least one grid.`,
      });
    }
    out.push(entry as BreakpointInput);
  });
  if (errors.length > 0) return { ok: false, errors };

  out.sort((a, b) => a.minWidth - b.minWidth);
  for (let i = 1; i < out.length; i++) {
    const a = out[i - 1] as BreakpointInput;
    const b = out[i] as BreakpointInput;
    if (a.minWidth === b.minWidth) {
      errors.push({
        field: `[${i}].minWidth`,
        received: b.minWidth,
        message: `${label(a, i - 1)} and ${label(b, i)} both use minWidth ${b.minWidth}. Give each breakpoint its own minWidth.`,
      });
    }
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: out };
}
