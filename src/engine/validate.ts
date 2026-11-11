import {
  type Alignment,
  type Breakpoint,
  type BreakpointInput,
  type Count,
  DEFAULT_GRID_COLOR,
  type GridError,
  type GridWarning,
  LARGE_COUNT,
  type LayoutGrid,
  type LayoutGridInput,
  type Result,
} from './types';

const PATTERNS: readonly unknown[] = ['COLUMNS', 'ROWS', 'GRID'];
const ALIGNMENTS: readonly unknown[] = ['MIN', 'MAX', 'CENTER', 'STRETCH'];

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Validates one grid and fills in defaults. Never throws. */
export function normalizeGrid(input: LayoutGridInput): Result<LayoutGrid> {
  const errors: GridError[] = [];
  const warnings: GridWarning[] = [];
  const err = (field: string, received: unknown, message: string): void => {
    errors.push({ field, received, message });
  };
  const ignored = (field: string, where: string): void => {
    warnings.push({ field, message: `${field} has no effect on ${where} and is ignored.` });
  };

  const visible: unknown = input.visible ?? true;
  if (typeof visible !== 'boolean') err('visible', visible, 'Set visible to true or false.');
  const color: unknown = input.color ?? DEFAULT_GRID_COLOR;
  if (typeof color !== 'string' || color.trim() === '') {
    err('color', color, 'Set color to a CSS colour, for example "rgba(255, 0, 0, 0.1)".');
  }

  if (!PATTERNS.includes(input.pattern)) {
    err('pattern', input.pattern, 'Set pattern to "COLUMNS", "ROWS" or "GRID".');
    return { ok: false, errors, warnings };
  }

  if (input.pattern === 'GRID') {
    const { sectionSize } = input;
    if (!isFiniteNumber(sectionSize) || sectionSize <= 0) {
      err('sectionSize', sectionSize, 'A GRID needs sectionSize: the square size in px, above 0.');
    }
    for (const field of ['alignment', 'count', 'gutterSize', 'offset'] as const) {
      if (input[field] !== undefined) ignored(field, 'a GRID');
    }
    if (errors.length > 0) return { ok: false, errors, warnings };
    return {
      ok: true,
      value: {
        pattern: 'GRID',
        sectionSize: sectionSize as number,
        visible: visible as boolean,
        color: color as string,
      },
      warnings,
    };
  }

  const alignment: unknown = input.alignment ?? 'STRETCH';
  if (!ALIGNMENTS.includes(alignment)) {
    err('alignment', alignment, 'Set alignment to "MIN", "MAX", "CENTER" or "STRETCH".');
  }

  const count: unknown = input.count;
  if (count === 'auto') {
    if (alignment === 'STRETCH') {
      err(
        'count',
        count,
        'count "auto" needs a fixed section size. Use a number, or set alignment to MIN, MAX or CENTER.',
      );
    }
  } else if (!isFiniteNumber(count) || !Number.isInteger(count) || count < 1) {
    err('count', count, 'Set count to a whole number of 1 or more, or to "auto".');
  } else if (count > LARGE_COUNT) {
    warnings.push({
      field: 'count',
      message: `count ${count} is above ${LARGE_COUNT} and may slow the overlay.`,
    });
  }

  const gutterSize: unknown = input.gutterSize ?? 0;
  if (!isFiniteNumber(gutterSize) || gutterSize < 0) {
    err('gutterSize', gutterSize, 'Set gutterSize to a number of px, 0 or more.');
  }

  const offset: unknown = input.offset ?? 0;
  if (!isFiniteNumber(offset) || offset < 0) {
    err('offset', offset, 'Set offset to a number of px, 0 or more.');
  }
  if (alignment === 'CENTER' && input.offset !== undefined) ignored('offset', 'CENTER');

  const { sectionSize } = input;
  if (alignment === 'STRETCH') {
    if (sectionSize !== undefined) ignored('sectionSize', 'STRETCH (sections fill the space)');
  } else if (!isFiniteNumber(sectionSize) || sectionSize <= 0) {
    err(
      'sectionSize',
      sectionSize,
      `${String(alignment)} needs sectionSize: the column width or row height in px, above 0.`,
    );
  }

  if (errors.length > 0) return { ok: false, errors, warnings };
  return {
    ok: true,
    value: {
      pattern: input.pattern,
      alignment: alignment as Alignment,
      count: count as Count,
      ...(alignment === 'STRETCH' ? {} : { sectionSize: sectionSize as number }),
      gutterSize: gutterSize as number,
      offset: offset as number,
      visible: visible as boolean,
      color: color as string,
    },
    warnings,
  };
}

/** Validates a breakpoint list. Field paths look like `[1].grids[0].count`. */
export function normalizeBreakpoints(
  input: readonly BreakpointInput[],
): Result<readonly Breakpoint[]> {
  const errors: GridError[] = [];
  const warnings: GridWarning[] = [];
  const seen = new Set<number>();
  const out: Breakpoint[] = [];

  input.forEach((bp, i) => {
    const field = `[${i}].minWidth`;
    if (!isFiniteNumber(bp.minWidth) || bp.minWidth < 0) {
      errors.push({
        field,
        received: bp.minWidth,
        message: 'Set minWidth to a number of px, 0 or more.',
      });
    } else if (seen.has(bp.minWidth)) {
      errors.push({
        field,
        received: bp.minWidth,
        message: `Another breakpoint already uses minWidth ${bp.minWidth}. Give each breakpoint its own minWidth.`,
      });
    } else {
      seen.add(bp.minWidth);
    }

    const grids: LayoutGrid[] = [];
    bp.grids.forEach((g, j) => {
      const prefix = `[${i}].grids[${j}].`;
      const r = normalizeGrid(g);
      for (const w of r.warnings) warnings.push({ ...w, field: prefix + w.field });
      if (r.ok) grids.push(r.value);
      else for (const e of r.errors) errors.push({ ...e, field: prefix + e.field });
    });
    out.push({ minWidth: bp.minWidth, grids, ...(bp.name === undefined ? {} : { name: bp.name }) });
  });

  if (errors.length > 0) return { ok: false, errors, warnings };
  return { ok: true, value: out, warnings };
}
