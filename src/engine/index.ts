// Pure grid maths (decision 0002). Internal: not re-exported from the package entry.
export { pickBreakpoint } from './breakpoints';
export {
  type BreakpointEntry,
  DEFAULT_BREAKPOINTS,
  type MergeResult,
  mergeBreakpoints,
} from './defaults';
export {
  clipSections,
  computeSections,
  computeSquares,
  type SectionsResult,
  snap,
} from './layout';
export * from './types';
export { normalizeBreakpoints, normalizeGrid } from './validate';
