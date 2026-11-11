export interface GeometryInfo {
  width: number;
  height: number;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
  x: number;
  y: number;
}

export class GeometryEngine {
  /**
   * Calculates the width of a single column based on viewport width and Figma grid settings.
   */
  static calculateColumnWidth(viewportWidth: number, config: GridConfig): number {
    const totalMargin = config.margin * 2;
    const totalGutter = (config.columns - 1) * config.gutter;
    const availableWidth = viewportWidth - totalMargin - totalGutter;
    return availableWidth / config.columns;
  }

  /**
   * Returns an array of X coordinates for the start of each column.
   */
  static getColumnStarts(viewportWidth: number, config: GridConfig): number[] {
    const colWidth = this.calculateColumnWidth(viewportWidth, config);
    const starts: number[] = [];

    for (let i = 0; i < config.columns; i++) {
      const x = config.margin + i * (colWidth + config.gutter);
      starts.push(x);
    }

    return starts;
  }

  /**
   * Extracts precise geometry and padding from a DOM element.
   */
  static getElementGeometry(el: HTMLElement): GeometryInfo {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);

    return {
      width: rect.width,
      height: rect.height,
      x: rect.left,
      y: rect.top,
      paddingTop: parseFloat(style.paddingTop),
      paddingBottom: parseFloat(style.paddingBottom),
      paddingLeft: parseFloat(style.paddingLeft),
      paddingRight: parseFloat(style.paddingRight),
    };
  }

  /**
   * Calculates the distance between two elements.
   */
  static calculateDistance(elA: HTMLElement, elB: HTMLElement, orientation: 'h' | 'v') {
    const rectA = elA.getBoundingClientRect();
    const rectB = elB.getBoundingClientRect();

    if (orientation === 'h') {
      const gap = Math.abs(rectA.left - rectB.right);
      const overlap = Math.max(rectA.left, rectB.left) - Math.min(rectA.right, rectB.right);
      return overlap > 0 ? -overlap : gap;
    } else {
      const gap = Math.abs(rectA.top - rectB.bottom);
      const overlap = Math.max(rectA.top, rectB.top) - Math.min(rectA.bottom, rectB.bottom);
      return overlap > 0 ? -overlap : gap;
    }
  }
}

export interface GridConfig {
  columns: number;
  gutter: number;
  margin: number;
  color?: string;
}

export interface BreakpointConfig {
  width: number;
  columns: number;
  gutter: number;
  margin: number;
}
