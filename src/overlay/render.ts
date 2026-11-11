/** Draws one breakpoint's grids into the overlay layer (decisions 0005 §9.1, 0006, 0007). */
import {
  type Box,
  type Breakpoint,
  clipSections,
  computeSections,
  type GridWarning,
} from '../engine';

export const STYLES = `
:host { all: initial; }
.layer { position: absolute; top: 0; left: 0; transform-origin: 0 0; }
.layer[hidden] { display: none; }
.section { position: absolute; box-sizing: border-box; }
.section.col { top: 0; box-shadow: inset 1px 0 0 var(--edge), inset -1px 0 0 var(--edge); }
.section.row { left: 0; box-shadow: inset 0 1px 0 var(--edge), inset 0 -1px 0 var(--edge); }
.squares { position: absolute; top: 0; left: 0; }
`;

/** The 1 px edge colour: the grid colour at 2.5× its alpha. Unsupported browsers draw no edge. */
const edgeColor = (color: string): string => `rgb(from ${color} r g b / calc(alpha * 2.5))`;

/** Replaces the layer's contents with the grids of `breakpoint` for a target of size `box`. */
export function renderBreakpoint(
  layer: HTMLElement,
  breakpoint: Breakpoint | undefined,
  box: Box,
): readonly GridWarning[] {
  const doc = layer.ownerDocument;
  const warnings: GridWarning[] = [];
  const fragment = doc.createDocumentFragment();
  layer.style.width = `${box.width}px`;
  layer.style.height = `${box.height}px`;

  for (const grid of breakpoint?.grids ?? []) {
    if (!grid.visible) continue;

    if (grid.pattern === 'GRID') {
      const s = grid.sectionSize;
      const el = doc.createElement('div');
      el.className = 'squares';
      el.style.width = `${box.width}px`;
      el.style.height = `${box.height}px`;
      el.style.backgroundImage = [
        `repeating-linear-gradient(to right, ${grid.color} 0 1px, transparent 1px ${s}px)`,
        `repeating-linear-gradient(to bottom, ${grid.color} 0 1px, transparent 1px ${s}px)`,
      ].join(', ');
      fragment.append(el);
      continue;
    }

    const isCols = grid.pattern === 'COLUMNS';
    const result = computeSections(grid, box);
    warnings.push(...result.warnings);
    for (const s of clipSections(result.sections, isCols ? box.width : box.height)) {
      const el = doc.createElement('div');
      el.className = `section ${isCols ? 'col' : 'row'}`;
      el.style.background = grid.color;
      el.style.setProperty('--edge', edgeColor(grid.color));
      const size = `${s.visibleEnd - s.visibleStart}px`;
      if (isCols) {
        el.style.left = `${s.visibleStart}px`;
        el.style.width = size;
        el.style.height = `${box.height}px`;
      } else {
        el.style.top = `${s.visibleStart}px`;
        el.style.height = size;
        el.style.width = `${box.width}px`;
      }
      fragment.append(el);
    }
  }

  layer.replaceChildren(fragment);
  return warnings;
}
