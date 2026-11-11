import type { Box, DirectionalGrid, GridWarning, Section, SquareGrid } from './types';

export interface SectionsResult {
  readonly sections: readonly Section[];
  readonly warnings: readonly GridWarning[];
}

/** Number of fixed sections that fit in `available` px (Figma's "Auto" count). */
function autoCount(available: number, size: number, gutter: number): number {
  return Math.max(0, Math.floor((available + gutter) / (size + gutter)));
}

/**
 * Column or row rectangles along the grid's axis, as Figma draws them.
 * Values are not rounded; overflowing fixed sections are returned as they are.
 */
export function computeSections(grid: DirectionalGrid, box: Box): SectionsResult {
  const L = grid.pattern === 'COLUMNS' ? box.width : box.height;
  if (L <= 0) return { sections: [], warnings: [] };

  const { alignment, gutterSize: g, offset } = grid;
  const make = (n: number, size: number, first: number): Section[] =>
    Array.from({ length: n }, (_, i) => ({ index: i, start: first + i * (size + g), size }));

  if (alignment === 'STRETCH') {
    // Validation guarantees a numeric count for STRETCH.
    const n = grid.count as number;
    const size = (L - 2 * offset - (n - 1) * g) / n;
    if (size <= 0) {
      return {
        sections: [],
        warnings: [
          {
            field: 'count',
            message: `${n} sections with these margins and gutters don't fit in ${L} px, so none are drawn.`,
          },
        ],
      };
    }
    return { sections: make(n, size, offset), warnings: [] };
  }

  // Validation guarantees sectionSize for fixed alignments.
  const s = grid.sectionSize as number;
  const available = alignment === 'CENTER' ? L : L - offset;
  const n = grid.count === 'auto' ? autoCount(available, s, g) : grid.count;
  const total = n * s + (n - 1) * g;

  if (alignment === 'MIN') return { sections: make(n, s, offset), warnings: [] };
  if (alignment === 'MAX') return { sections: make(n, s, L - offset - total), warnings: [] };
  return { sections: make(n, s, (L - total) / 2), warnings: [] };
}

/** Line positions of a square grid, anchored at the container's top-left. */
export function computeSquares(
  grid: SquareGrid,
  box: Box,
): { readonly xs: readonly number[]; readonly ys: readonly number[] } {
  const lines = (L: number): number[] =>
    L <= 0
      ? []
      : Array.from(
          { length: Math.floor(L / grid.sectionSize) + 1 },
          (_, i) => i * grid.sectionSize,
        );
  return { xs: lines(box.width), ys: lines(box.height) };
}
