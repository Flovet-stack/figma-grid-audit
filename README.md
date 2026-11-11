# Figma Grid Audit 📐

The ultimate Design Engineering tool for verifying rendered DOM alignment against Figma Layout Grids. 

Figma Grid Audit combines **declarative grid visualization** (the "Reference") with **interactive geometry inspection** (the "Audit"), providing a full-loop workflow for frontend developers to eliminate the "translation gap" between design and code.

## ✨ Core Features

### 1. The Reference (Figma-Parity)
- **Declarative Configuration:** Define columns, gutters, and margins in code.
- **Responsive Breakpoints:** Automatic grid transitions based on viewport width.
- **Baseline Grids:** Horizontal rhythm lines for vertical alignment.
- **Zero Production Footprint:** Designed to be stripped from production builds.

### 2. The Audit (Inspection Engine)
- **Interactive Rulers:** Figma-style rulers with draggable guides.
- **Smart Snapping:** Guides that snap to both DOM element edges and the defined Figma Grid.
- **Geometry Inspector:** Pin-and-compare distance measuring between elements.
- **Shadow Root Isolation:** Encapsulated styles that never clash with the host application.

## 🚀 Getting Started

```typescript
import { FigmaGridAudit } from 'figma-grid-audit';

if (process.env.NODE_ENV === 'development') {
  FigmaGridAudit.init({
    breakpoints: [
      { width: 1200, columns: 12, gutter: 24, margin: 80 },
      { width: 768, columns: 8, gutter: 16, margin: 40 },
      { width: 480, columns: 4, gutter: 12, margin: 20 }
    ],
    color: 'rgba(255, 0, 0, 0.1)'
  });
}
```

## ⌨️ Interaction Reference
- `Ctrl + G`: Toggle Grid Overlay
- `Shift + M`: Toggle Geometry Inspector
- `Option/Alt + Hover`: Visual distance lines
- `Drag from Ruler`: Create a guide
