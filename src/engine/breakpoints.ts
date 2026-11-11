import type { Breakpoint } from './types';

/**
 * The breakpoint with the largest `minWidth` that is ≤ `width`. Below every
 * breakpoint, the smallest one is used so a grid always shows. Order-independent.
 */
export function pickBreakpoint(
  width: number,
  breakpoints: readonly Breakpoint[],
): Breakpoint | undefined {
  let match: Breakpoint | undefined;
  let smallest: Breakpoint | undefined;
  for (const bp of breakpoints) {
    if (smallest === undefined || bp.minWidth < smallest.minWidth) smallest = bp;
    if (bp.minWidth <= width && (match === undefined || bp.minWidth > match.minWidth)) match = bp;
  }
  return match ?? smallest;
}
