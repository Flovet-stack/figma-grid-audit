export class GeometryInspector {
  private shadowRoot: ShadowRoot;
  private tooltip: HTMLDivElement;
  private pinnedElement: HTMLElement | null = null;
  private isEnabled: boolean = false;

  constructor(shadowRoot: ShadowRoot) {
    this.shadowRoot = shadowRoot;
    this.createTooltip();
    this.setupListeners();
  }

  private createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'geo-tooltip';
    this.tooltip.style.position = 'fixed';
    this.tooltip.style.zIndex = '2147483647';
    this.tooltip.style.pointerEvents = 'none';
    this.tooltip.style.backgroundColor = '#333';
    this.tooltip.style.color = '#fff';
    this.tooltip.style.padding = '4px 8px';
    this.tooltip.style.borderRadius = '4px';
    this.tooltip.style.fontSize = '11px';
    this.tooltip.style.fontFamily = 'monospace';
    this.tooltip.style.display = 'none';

    this.shadowRoot.appendChild(this.tooltip);
  }

  private setupListeners() {
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('click', this.handleElementClick);
  }

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isEnabled) return;

    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!(target instanceof HTMLElement)) return;

    if (this.pinnedElement) {
      this.renderDistance(this.pinnedElement, target, e);
    } else {
      this.renderGeometry(target, e);
    }
  };

  private renderGeometry(el: HTMLElement, e: MouseEvent) {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);

    this.tooltip.style.display = 'block';
    this.tooltip.style.left = `${e.clientX + 10}px`;
    this.tooltip.style.top = `${e.clientY + 10}px`;
    this.tooltip.innerHTML = `
      W: ${Math.round(rect.width)}px | H: ${Math.round(rect.height)}px<br/>
      PT: ${style.paddingTop} | PB: ${style.paddingBottom}<br/>
      PL: ${style.paddingLeft} | PR: ${style.paddingRight}
    `;
  }

  private renderDistance(elA: HTMLElement, elB: HTMLElement, e: MouseEvent) {
    const rectA = elA.getBoundingClientRect();
    const rectB = elB.getBoundingClientRect();

    const hDist = Math.abs(rectA.right - rectB.left);
    const vDist = Math.abs(rectA.bottom - rectB.top);

    this.tooltip.style.display = 'block';
    this.tooltip.style.left = `${e.clientX + 10}px`;
    this.tooltip.style.top = `${e.clientY + 10}px`;
    this.tooltip.innerHTML = `
      Distance to Pinned:<br/>
      Horizontal: ${Math.round(hDist)}px<br/>
      Vertical: ${Math.round(vDist)}px
    `;
  }

  private handleElementClick = (e: MouseEvent) => {
    if (!this.isEnabled) return;

    // Only pin if Shift is held (to avoid interfering with normal app clicks)
    if (e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;
      this.pinnedElement = this.pinnedElement === target ? null : target;

      if (this.pinnedElement) {
        console.log('Pinned element for distance measurement');
      } else {
        console.log('Cleared pinned element');
      }
    }
  };

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.tooltip.style.display = 'none';
      this.pinnedElement = null;
    }
  }
}
