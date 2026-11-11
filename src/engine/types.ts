/** Figma layout-grid model (Plugin API `LayoutGrid`). See specs/01-grid-engine.md. */

export type Pattern = 'COLUMNS' | 'ROWS' | 'GRID';
export type Alignment = 'MIN' | 'MAX' | 'CENTER' | 'STRETCH';
export type Count = number | 'auto';

/** Grid as the user writes it. Optional fields get defaults. */
export interface LayoutGridInput {
  readonly pattern: Pattern;
  readonly alignment?: Alignment;
  readonly count?: Count;
  readonly sectionSize?: number;
  readonly gutterSize?: number;
  readonly offset?: number;
  readonly visible?: boolean;
  readonly color?: string;
}

/** A normalized column or row grid. `sectionSize` is absent for STRETCH. */
export interface DirectionalGrid {
  readonly pattern: 'COLUMNS' | 'ROWS';
  readonly alignment: Alignment;
  readonly count: Count;
  readonly sectionSize?: number;
  readonly gutterSize: number;
  readonly offset: number;
  readonly visible: boolean;
  readonly color: string;
}

/** A normalized uniform (square) grid. */
export interface SquareGrid {
  readonly pattern: 'GRID';
  readonly sectionSize: number;
  readonly visible: boolean;
  readonly color: string;
}

export type LayoutGrid = DirectionalGrid | SquareGrid;

export interface Box {
  readonly width: number;
  readonly height: number;
}

export interface Section {
  readonly index: number;
  /** Position along the grid's axis, in px from the container's start edge. */
  readonly start: number;
  readonly size: number;
}

export interface Breakpoint {
  readonly minWidth: number;
  readonly grids: readonly LayoutGrid[];
  readonly name?: string;
}

export interface BreakpointInput {
  readonly minWidth: number;
  readonly grids: readonly LayoutGridInput[];
  readonly name?: string;
}

export interface GridError {
  readonly field: string;
  readonly received: unknown;
  readonly message: string;
}

export interface GridWarning {
  readonly field: string;
  readonly message: string;
}

export type Result<T> =
  | { readonly ok: true; readonly value: T; readonly warnings: readonly GridWarning[] }
  | {
      readonly ok: false;
      readonly errors: readonly GridError[];
      readonly warnings: readonly GridWarning[];
    };

/** Figma's default layout-guide colour: red at 10% opacity. */
export const DEFAULT_GRID_COLOR = 'rgba(255, 0, 0, 0.1)';
/** Counts above this produce a performance warning. */
export const LARGE_COUNT = 1000;
