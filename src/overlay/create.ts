/** `createGridOverlay`: the public overlay (decisions 0002, 0005, 0006, 0007; spec 02). */
import {
  type Box,
  type Breakpoint,
  type BreakpointInput,
  type GridWarning,
  normalizeBreakpoints,
  pickBreakpoint,
} from '../engine';
import { renderBreakpoint, STYLES } from './render';
import { isFromEditable, matchesToggle, type ToggleShortcut } from './shortcuts';

export interface GridOverlayOptions {
  readonly breakpoints: readonly BreakpointInput[];
  /** Show the grid straight away. Default `true`. */
  readonly visible?: boolean;
  readonly shortcuts?: {
    /** Default `'Shift+G'` (Figma's shortcut). `'Mod+G'` is Cmd/Ctrl+G; `false` turns it off. */
    readonly toggle?: ToggleShortcut;
  };
}

export interface GridOverlay {
  show(): void;
  hide(): void;
  toggle(): void;
  isVisible(): boolean;
  update(options: GridOverlayOptions): void;
  destroy(): void;
}

const PREFIX = '[grid-auditor]';
const HOST_TAG = 'grid-auditor';

let current: GridOverlay | undefined;

interface State {
  breakpoints: readonly Breakpoint[];
  toggle: ToggleShortcut;
  visible: boolean;
}

function parse(options: GridOverlayOptions): { breakpoints: readonly Breakpoint[] } {
  const r = normalizeBreakpoints(options.breakpoints);
  reportWarnings(r.warnings);
  if (!r.ok) {
    const lines = r.errors.map((e) => `- breakpoints${e.field}: ${e.message}`);
    throw new Error(`${PREFIX} The options need a few fixes:\n${lines.join('\n')}`);
  }
  return { breakpoints: r.value };
}

function reportWarnings(warnings: readonly GridWarning[]): void {
  for (const w of warnings) console.warn(`${PREFIX} ${w.field}: ${w.message}`);
}

const noop: GridOverlay = {
  show() {},
  hide() {},
  toggle() {},
  isVisible: () => false,
  update() {},
  destroy() {},
};

/** The page target (0007): viewport width without the scrollbar, full document height. */
function measurePage(doc: Document): Box {
  const root = doc.documentElement;
  return { width: root.clientWidth, height: root.scrollHeight };
}

/**
 * Draws the expected Figma layout grid over the page. Calling it again while
 * an overlay exists updates and returns that same overlay.
 */
export function createGridOverlay(options: GridOverlayOptions): GridOverlay {
  if (typeof window === 'undefined' || typeof document === 'undefined') return noop;
  if (current) {
    console.warn(`${PREFIX} An overlay already exists; updating it instead of creating another.`);
    current.update(options);
    return current;
  }

  const state: State = {
    ...parse(options),
    toggle: options.shortcuts?.toggle ?? 'Shift+G',
    visible: options.visible ?? true,
  };

  const host = document.createElement(HOST_TAG);
  host.setAttribute('aria-hidden', 'true');
  for (const [prop, value] of [
    ['position', 'fixed'],
    ['inset', '0'],
    ['pointer-events', 'none'],
    ['overflow', 'hidden'],
    ['z-index', '2147483646'],
    ['contain', 'strict'],
    ['display', 'block'],
  ] as const) {
    host.style.setProperty(prop, value, 'important');
  }
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = STYLES;
  const layer = document.createElement('div');
  layer.className = 'layer';
  shadow.append(style, layer);
  document.documentElement.append(host);

  const controller = new AbortController();
  const { signal } = controller;
  let frame = 0;
  let needsRender = true;
  let lastWarnings = '';

  const flush = (): void => {
    frame = 0;
    if (needsRender) {
      needsRender = false;
      const bp = pickBreakpoint(window.innerWidth, state.breakpoints);
      const warnings = renderBreakpoint(layer, bp, measurePage(document));
      const key = JSON.stringify(warnings);
      if (key !== lastWarnings) {
        lastWarnings = key;
        reportWarnings(warnings);
      }
    }
    layer.style.transform = `translate(${-window.scrollX}px, ${-window.scrollY}px)`;
    layer.hidden = !state.visible;
  };
  const schedule = (render: boolean): void => {
    if (render) needsRender = true;
    if (frame === 0) frame = requestAnimationFrame(flush);
  };

  window.addEventListener('resize', () => schedule(true), { signal });
  window.addEventListener('scroll', () => schedule(false), { signal, passive: true });
  window.addEventListener(
    'keydown',
    (event) => {
      if (!matchesToggle(event, state.toggle) || isFromEditable(event)) return;
      if (state.toggle === 'Mod+G') event.preventDefault();
      overlay.toggle();
    },
    { signal, capture: true },
  );

  const observer = new ResizeObserver(() => schedule(true));
  observer.observe(document.documentElement);
  if (document.body) observer.observe(document.body);

  let destroyed = false;
  const overlay: GridOverlay = {
    show() {
      state.visible = true;
      schedule(false);
    },
    hide() {
      state.visible = false;
      schedule(false);
    },
    toggle() {
      state.visible = !state.visible;
      schedule(false);
    },
    isVisible: () => state.visible,
    update(next) {
      if (destroyed) return;
      state.breakpoints = parse(next).breakpoints;
      state.toggle = next.shortcuts?.toggle ?? 'Shift+G';
      if (next.visible !== undefined) state.visible = next.visible;
      schedule(true);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      controller.abort();
      observer.disconnect();
      if (frame !== 0) cancelAnimationFrame(frame);
      host.remove();
      if (current === overlay) current = undefined;
    },
  };

  current = overlay;
  flush(); // first paint synchronously so the grid is there straight away
  return overlay;
}
