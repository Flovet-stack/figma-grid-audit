import type {
  Box,
  DirectionalGrid,
  GridWarning,
  Section,
  SquareGrid,
  VisibleSection,
} from './types';

export interface SectionsResult {
  readonly sections: readonly Section[];
  readonly warnings: readonly GridWarning[];
}

/**
 * Figma's pixel snapping (decision 0006): nearest whole pixel, exact halves
 * round down. `Math.round` would round -2.5 to -2 and 97.5 to 98, which is wrong.
 */
export function snap(v: number): number {
  const r = Math.ceil(v - 0.5);
  return r === 0 ? 0 : r; // normalize -0
}

/** Number of fixed sections that fit in `available` px (Figma's "Auto" count). */
function autoCount(available: number, size: number, gutter: number): number {
  return Math.max(0, Math.floor((available + gutter) / (size + gutter)));
}

/**
 * Column or row rectangles along the grid's axis, as Figma draws them.
 * Exact values plus Figma-snapped edges; overflowing sections are returned as
 * they are. Use `clipSections` for what is visible.
 */
export function computeSections(grid: DirectionalGrid, box: Box): SectionsResult {
  const L = grid.pattern === 'COLUMNS' ? box.width : box.height;
  if (L <= 0) return { sections: [], warnings: [] };

  const { alignment, gutterSize: g, offset } = grid;
  const make = (n: number, size: number, first: number): Section[] =>
    Array.from({ length: n }, (_, i) => {
      const start = first + i * (size + g);
      return { index: i, start, size, snappedStart: snap(start), snappedEnd: snap(start + size) };
    });

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

/**
 * The visible parts of sections inside a container of length `L` (decision
 * 0006: guides are clipped like the frame's content). Fully hidden sections
 * are dropped; partly hidden ones are cut at the edge.
 */
export function clipSections(sections: readonly Section[], L: number): readonly VisibleSection[] {
  const out: VisibleSection[] = [];
  for (const s of sections) {
    const visibleStart = Math.max(s.snappedStart, 0);
    const visibleEnd = Math.min(s.snappedEnd, L);
    if (visibleEnd > visibleStart) out.push({ ...s, visibleStart, visibleEnd });
  }
  return out;
}

/** Line positions of a square grid, anchored at the container's top-left. */
export function computeSquares(
  grid: SquareGrid,
  box: Box,
): { readonly xs: readonly number[]; readonly ys: readonly number[] } {
  const lines = (L: number): number[] =>
    L <= 0
      ? []
      : Array.from({ length: Math.floor(L / grid.sectionSize) + 1 }, (_, i) =>
          snap(i * grid.sectionSize),
        );
  return { xs: lines(box.width), ys: lines(box.height) };
}
