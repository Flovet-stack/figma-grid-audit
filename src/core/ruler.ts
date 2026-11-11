export class Ruler {
  private element: HTMLDivElement;
  private orientation: 'h' | 'v';

  constructor(orientation: 'h' | 'v', shadowRoot: ShadowRoot) {
    this.orientation = orientation;
    this.element = document.createElement('div');
    this.element.className = `ruler ruler-${this.orientation}`;
    this.element.textContent = this.orientation === 'v' ? 'V' : 'H';

    shadowRoot.appendChild(this.element);
    this.setupInteraction();
  }

  private setupInteraction() {
    this.element.addEventListener('mousedown', (e: MouseEvent) => {
      // This is the start of the guide creation flow
      const event = new CustomEvent('create-guide', {
        detail: {
          orientation: this.orientation,
          startX: e.clientX,
          startY: e.clientY,
        }
      });
      this.element.dispatchEvent(event);
    });
  }

  public updatePosition(x: number, y: number) {
    if (this.orientation === 'v') {
      this.element.style.left = `${x}px`;
    } else {
      this.element.style.top = `${y}px`;
    }
  }
}
