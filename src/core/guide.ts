export class Guide {
  private element: HTMLDivElement;
  private orientation: 'h' | 'v';
  private position: number = 0;
  private isDragging: boolean = false;
  private offset: number = 0;

  constructor(orientation: 'h' | 'v', position: number, shadowRoot: ShadowRoot) {
    this.orientation = orientation;
    this.position = position;
    this.element = document.createElement('div');
    this.element.className = `guide-line guide-line-${this.orientation}`;

    this.updatePosition(position);

    shadowRoot.appendChild(this.element);
    this.setupInteraction();
  }

  private setupInteraction() {
    this.element.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      this.isDragging = true;
      this.offset = this.orientation === 'v' ? e.clientX - this.position : e.clientY - this.position;
      document.addEventListener('mousemove', this.handleMouseMove);
      document.addEventListener('mouseup', this.handleMouseUp);
    });
  }

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) return;

    const newPos = this.orientation === 'v'
      ? e.clientX - this.offset
      : e.clientY - this.offset;

    this.updatePosition(newPos);
  };

  private handleMouseUp = () => {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  };

  private updatePosition(pos: number) {
    this.position = pos;
    if (this.orientation === 'v') {
      this.element.style.left = `${pos}px`;
    } else {
      this.element.style.top = `${pos}px`;
    }
  }

  public getPosition() {
    return this.position;
  }
}
