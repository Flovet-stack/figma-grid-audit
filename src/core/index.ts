import { ShadowOverlay } from './overlay';
import { GridConfig, BreakpointConfig } from './geometry';

export interface AuditOptions {
  breakpoints: BreakpointConfig[];
  color?: string;
}

export class FigmaGridAudit {
  private overlay: ShadowOverlay;
  private options: AuditOptions;
  private currentBreakpointIndex: number = -1;

  constructor(options: AuditOptions) {
    this.options = options;
    this.overlay = new ShadowOverlay();
    this.setupResizeListener();
    this.setupKeyboardShortcuts();
    this.updateGrid();
  }

  private setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.shiftKey && e.code === 'KeyG') {
        e.preventDefault();
        this.toggleGrid();
      }
    });
  }

  private toggleGrid() {
    this.overlay.setGridVisibility(!this.overlay.isVisible());
  }

  private setupResizeListener() {
    window.addEventListener('resize', () => this.updateGrid());
  }

  private updateGrid() {
    const viewportWidth = window.innerWidth;

    // Find the best matching breakpoint (largest width that is <= current viewport)
    const sortedBreakpoints = [...this.options.breakpoints].sort((a, b) => b.width - a.width);
    const matched = sortedBreakpoints.find(bp => viewportWidth >= bp.width);

    if (matched) {
      const config: GridConfig = {
        columns: matched.columns,
        gutter: matched.gutter,
        margin: matched.margin,
        color: this.options.color
      };
      this.overlay.renderGrid(config);
    }
  }

  public destroy() {
    this.overlay.destroy();
  }

  // Static init for easy access
  static init(options: AuditOptions) {
    return new FigmaGridAudit(options);
  }
}
