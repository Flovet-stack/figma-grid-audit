import { GeometryEngine, GridConfig } from './geometry';
import { Ruler } from './ruler';
import { Guide } from './guide';
import { GeometryInspector } from './inspector';
import { ControlPanel } from './panel';

export class ShadowOverlay {
  private hostElement: HTMLDivElement;
  private shadowRoot: ShadowRoot;
  private gridContainer: HTMLDivElement;
  private vRuler: Ruler;
  private hRuler: Ruler;
  private guides: Guide[] = [];
  private inspector: GeometryInspector;
  private panel: ControlPanel;
  private gridVisible: boolean = true;

  constructor() {
    this.hostElement = document.createElement('div');
    this.hostElement.id = 'figma-grid-audit-host';
    this.shadowRoot = this.hostElement.attachShadow({ mode: 'closed' });

    this.gridContainer = document.createElement('div');
    this.gridContainer.id = 'grid-overlay';

    this.injectStyles();
    this.shadowRoot.appendChild(this.gridContainer);
    document.body.appendChild(this.hostElement);

    this.vRuler = new Ruler('v', this.shadowRoot);
    this.hRuler = new Ruler('h', this.shadowRoot);
    this.inspector = new GeometryInspector(this.shadowRoot);

    this.panel = new ControlPanel(
      this.shadowRoot,
      { columns: 12, gutter: 24, margin: 80, color: '#ff0000' },
      {
        onSettingsChange: (s) => this.updateGridSettings(s),
        onToggleGrid: (v) => this.setGridVisibility(v),
        onToggleInspector: (e) => this.inspector.setEnabled(e),
      }
    );
    this.setupGuideCreation();
  }

  public setGridVisibility(visible: boolean) {
    this.gridVisible = visible;
    this.gridContainer.style.display = visible ? 'flex' : 'none';
  }

  private updateGridSettings(settings: any) {
    this.renderGrid({
      columns: settings.columns,
      gutter: settings.gutter,
      margin: settings.margin,
      color: settings.color,
    });
  }

  private setupGuideCreation() {
    this.shadowRoot.addEventListener('create-guide', (e: any) => {
      const { orientation, startX, startY } = e.detail;
      const position = orientation === 'v' ? startX : startY;
      const guide = new Guide(orientation, position, this.shadowRoot);
      this.guides.push(guide);
    });
  }

  private injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #grid-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 2147483647;
        display: flex;
        justify-content: center;
      }
      .grid-column {
        position: absolute;
        top: 0;
        bottom: 0;
        background-color: rgba(255, 0, 0, 0.1);
        border-left: 1px solid rgba(255, 0, 0, 0.2);
        border-right: 1px solid rgba(255, 0, 0, 0.2);
      }
      .ruler {
        position: absolute;
        background: #f0f0f0;
        color: #666;
        font-family: monospace;
        font-size: 10px;
        pointer-events: auto;
        user-select: none;
        border: 1px solid #ccc;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
      }
      .ruler-v {
        width: 20px;
        height: 100vh;
        left: 0;
        top: 0;
        flex-direction: column;
        border-left: none;
      }
      .ruler-h {
        height: 20px;
        width: 100vw;
        top: 0;
        left: 0;
        border-top: none;
      }
      .guide-line {
        position: absolute;
        background-color: #00aaff;
        pointer-events: auto;
        cursor: move;
      }
      .guide-line-v {
        width: 1px;
        height: 100vh;
        top: 0;
      }
      .guide-line-h {
        height: 1px;
        width: 100vw;
        left: 0;
      }
      .control-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 220px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: sans-serif;
        font-size: 13px;
        z-index: 2147483647;
        pointer-events: auto;
        padding: 12px;
        color: #333;
      }
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        border-bottom: 1px solid #eee;
        padding-bottom: 8px;
      }
      .panel-header strong {
        font-size: 14px;
      }
      .panel-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
      }
      .input-group {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
      }
      .input-group span {
        color: #666;
      }
      .input-group input {
        width: 60px;
        padding: 2px 4px;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
      .input-group input[type="color"] {
        width: 30px;
        height: 24px;
        padding: 0;
        border: none;
      }
    `;
    this.shadowRoot.appendChild(style);
  }

  public isVisible(): boolean {
    return this.gridContainer.style.display !== 'none';
  }

  public setGridVisibility(visible: boolean) {
    this.gridVisible = visible;
    this.gridContainer.style.display = visible ? 'flex' : 'none';
  }

  public renderGrid(config: GridConfig) {
    this.gridContainer.innerHTML = '';
    const viewportWidth = window.innerWidth;
    const colWidth = GeometryEngine.calculateColumnWidth(viewportWidth, config);

    for (let i = 0; i < config.columns; i++) {
      const col = document.createElement('div');
      col.className = 'grid-column';
      const startX = GeometryEngine.getColumnStarts(viewportWidth, config)[i];
      col.style.left = `${startX}px`;
      col.style.width = `${colWidth}px`;
      this.gridContainer.appendChild(col);
    }
  }

  public destroy() {
    if (this.hostElement && this.hostElement.parentNode) {
      this.hostElement.parentNode.removeChild(this.hostElement);
    }
  }
}
