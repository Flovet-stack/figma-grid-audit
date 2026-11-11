/**
 * Marker present in every build of the library. The production-exclusion
 * check (scripts/check-prod-exclusion.mjs) fails if it shows up in a
 * consumer's production bundle.
 */
export const MARKER: string = '__FIGMA_GRID_AUDIT__';

export const version: string = '0.0.0';

export type {
  Alignment,
  BreakpointInput,
  Count,
  LayoutGridInput,
  Pattern,
} from './engine/types';
export { createGridOverlay, type GridOverlay, type GridOverlayOptions } from './overlay/create';
export type { ToggleShortcut } from './overlay/shortcuts';
