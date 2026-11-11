export class ControlPanel {
  private container: HTMLDivElement;
  private shadowRoot: ShadowRoot;
  private onSettingsChange: (settings: any) => void;
  private onToggleGrid: (visible: boolean) => void;
  private onToggleInspector: (enabled: boolean) => void;

  constructor(
    shadowRoot: ShadowRoot,
    initialSettings: any,
    callbacks: {
      onSettingsChange: (s: any) => void,
      onToggleGrid: (v: boolean) => void,
      onToggleInspector: (e: boolean) => void
    }
  ) {
    this.shadowRoot = shadowRoot;
    this.onSettingsChange = callbacks.onSettingsChange;
    this.onToggleGrid = callbacks.onToggleGrid;
    this.onToggleInspector = callbacks.onToggleInspector;

    this.container = document.createElement('div');
    this.container.className = 'control-panel';

    this.render(initialSettings);
    this.shadowRoot.appendChild(this.container);
  }

  private render(settings: any) {
    this.container.innerHTML = `
      <div class="panel-header">
        <strong>Figma Grid Audit</strong>
        <button id="close-panel">×</button>
      </div>
      <div class="panel-section">
        <label><input type="checkbox" id="toggle-grid" checked> Show Grid</label>
        <label><input type="checkbox" id="toggle-inspector"> Inspector</label>
      </div>
      <div class="panel-section">
        <div class="input-group">
          <span>Columns</span>
          <input type="number" id="grid-cols" value="${settings.columns || 12}">
        </div>
        <div class="input-group">
          <span>Gutter</span>
          <input type="number" id="grid-gutter" value="${settings.gutter || 24}">
        </div>
        <div class="input-group">
          <span>Margin</span>
          <input type="number" id="grid-margin" value="${settings.margin || 80}">
        </div>
        <div class="input-group">
          <span>Color</span>
          <input type="color" id="grid-color" value="${settings.color || '#ff0000'}">
        </div>
      </div>
    `;

    this.setupListeners();
  }

  private setupListeners() {
    this.container.querySelector('#toggle-grid')?.addEventListener('change', (e: any) => {
      this.onToggleGrid(e.target.checked);
    });

    this.container.querySelector('#toggle-inspector')?.addEventListener('change', (e: any) => {
      this.onToggleInspector(e.target.checked);
    });

    const inputs = ['grid-cols', 'grid-gutter', 'grid-margin', 'grid-color'];
    inputs.forEach(id => {
      this.container.querySelector(`#${id}`)?.addEventListener('input', () => {
        this.onSettingsChange({
          columns: parseInt(this.container.querySelector('#grid-cols')?.value as string || '12'),
          gutter: parseInt(this.container.querySelector('#grid-gutter')?.value as string || '24'),
          margin: parseInt(this.container.querySelector('#grid-margin')?.value as string || '80'),
          color: this.container.querySelector('#grid-color')?.value as string,
        });
      });
    });
  }
}
