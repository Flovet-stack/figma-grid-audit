/**
 * The control panel: Layout guides section (decision 0012, spec 03; design brief §10–12).
 * It holds no grid state of its own: it reads the store and writes through `setGrids`.
 */
import {
  type Box,
  type Breakpoint,
  computeSections,
  type GridError,
  type LayoutGrid,
  type LayoutGridInput,
} from '../engine';
import { type Position, toInput } from './persist';

export interface PanelStore {
  breakpoints(): readonly Breakpoint[];
  /** Index of the active breakpoint in `breakpoints()`, or -1. */
  activeIndex(): number;
  /** Replaces one breakpoint's grids. Returns the errors (empty when applied). */
  setGrids(index: number, grids: readonly LayoutGridInput[]): readonly GridError[];
  isVisible(): boolean;
  setVisible(visible: boolean): void;
  close(): void;
  box(): Box;
  /** Panel edits are applied (0013). */
  isEdited(): boolean;
  /** Saved edits were set aside because the code config changed. */
  hasSetAside(): boolean;
  restore(): void;
  discard(): void;
  /** Drops the edits and shows the code config again. */
  reset(): void;
  /** The "Copy config" text. */
  snippet(): string;
  position(): Position | undefined;
  savePosition(position: Position): void;
}

/** Why the panel is re-syncing: code replaces everything; panel and resize keep in-progress fields. */
export type SyncSource = 'code' | 'panel' | 'resize';

export interface Panel {
  readonly element: HTMLElement;
  sync(source: SyncSource): void;
  setOpen(open: boolean): void;
  isOpen(): boolean;
  /** Keeps the panel inside the viewport after a resize. */
  clamp(): void;
  /** True when the event started inside the panel. */
  owns(event: Event): boolean;
  /**
   * Runs the panel's own key handling. The overlay calls this from its window capture
   * listener, then stops the event so the page's key listeners never see panel typing.
   */
  handleKey(event: KeyboardEvent): void;
}

export const PANEL_STYLES = `
.panel {
  --ga-bg: #1f1f1f; --ga-raised: #2a2a2a; --ga-border: #3a3a3a; --ga-field: #6b6b6b;
  --ga-text: #f2f2f2; --ga-muted: #b0b0b0; --ga-accent: #5b8cff; --ga-error: #ff8a8a;
  position: absolute; top: 12px; right: 12px; box-sizing: border-box;
  width: min(260px, calc(100vw - 24px)); max-height: calc(100vh - 24px);
  display: flex; flex-direction: column; pointer-events: auto;
  background: var(--ga-bg); color: var(--ga-text); border: 1px solid var(--ga-border);
  border-radius: 8px; box-shadow: 0 8px 24px rgb(0 0 0 / 0.35), 0 1px 3px rgb(0 0 0 / 0.3);
  font: 400 12px/16px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  text-align: left; letter-spacing: normal; opacity: 1; transition: opacity 120ms ease-out;
}
@starting-style { .panel { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .panel { transition: none; } }
.panel[hidden], .panel [hidden] { display: none !important; }
.panel *, .panel *::before, .panel *::after { box-sizing: border-box; }
.head { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 8px 0 12px;
  border-bottom: 1px solid var(--ga-border); cursor: grab; user-select: none; touch-action: none; }
.head.dragging { cursor: grabbing; }
.title { flex: 1; font-weight: 600; margin: 0; font-size: 12px; }
.body { overflow: auto; overscroll-behavior: contain; padding: 8px 0 12px; }
.badge { margin: 0 12px 8px; padding: 4px 8px; border-radius: 6px; background: var(--ga-raised);
  color: var(--ga-muted); font: 500 11px/16px ui-monospace, SFMono-Regular, Menlo, monospace;
  font-variant-numeric: tabular-nums; }
.section-head { display: flex; align-items: center; height: 32px; padding: 0 8px 0 12px; }
.section-head h3 { flex: 1; margin: 0; font-size: 12px; font-weight: 600; }
.grid { padding: 4px 8px 8px 12px; border-top: 1px solid var(--ga-border); }
.grid-head { display: flex; align-items: center; gap: 4px; height: 32px; }
.grid-head select { flex: 1; }
.fields { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 8px; }
.field { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.field.wide { grid-column: 1 / -1; }
.field > span { color: var(--ga-muted); font-size: 11px; line-height: 14px; }
.unit { display: flex; align-items: center; height: 24px; border: 1px solid var(--ga-field);
  border-radius: 6px; background: var(--ga-raised); padding: 0 6px; gap: 4px; }
.unit:focus-within { outline: 2px solid var(--ga-accent); outline-offset: 1px; }
.unit input { flex: 1; min-width: 0; height: 22px; border: 0; padding: 0; background: transparent;
  color: var(--ga-text); font: 400 11px/22px ui-monospace, SFMono-Regular, Menlo, monospace;
  font-variant-numeric: tabular-nums; outline: none; }
.unit small { color: var(--ga-muted); font: 400 11px ui-monospace, SFMono-Regular, Menlo, monospace; }
.unit input[type="color"] { flex: 0 0 18px; width: 18px; height: 18px; padding: 0; border-radius: 4px; }
.unit:has([aria-invalid="true"]) { border-color: var(--ga-error); }
.error { grid-column: 1 / -1; color: var(--ga-error); font-size: 11px; line-height: 14px; margin: 0; }
select { height: 24px; min-width: 0; border: 1px solid var(--ga-field); border-radius: 6px;
  background: var(--ga-raised); color: var(--ga-text); font: 400 12px system-ui, sans-serif; padding: 0 4px; }
button { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; height: 24px;
  padding: 0; border: 0; border-radius: 6px; background: transparent; color: var(--ga-text);
  font: inherit; cursor: pointer; }
button:hover { background: var(--ga-raised); }
button svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.5;
  stroke-linecap: round; stroke-linejoin: round; }
button[aria-pressed="false"] { color: var(--ga-muted); }
.title:focus-visible, select:focus-visible, button:focus-visible, .switch:focus-visible { outline: 2px solid var(--ga-accent); outline-offset: 1px; }
.switch { display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 4px;
  border-radius: 6px; color: var(--ga-muted); font-size: 11px; }
.switch .track { width: 24px; height: 14px; border-radius: 7px; background: var(--ga-field); position: relative; }
.switch .track::after { content: ""; position: absolute; top: 2px; left: 2px; width: 10px; height: 10px;
  border-radius: 50%; background: var(--ga-text); }
.switch[aria-checked="true"] .track { background: var(--ga-accent); }
.switch[aria-checked="true"] .track::after { left: 12px; }
kbd { font: 400 10px ui-monospace, monospace; color: var(--ga-muted); border: 1px solid var(--ga-border);
  border-radius: 4px; padding: 0 3px; }
.empty { margin: 4px 12px; color: var(--ga-muted); font-size: 11px; }
.section-head h3:focus-visible { outline: 2px solid var(--ga-accent); outline-offset: 1px; }
.text-btn { padding: 0 8px; font-size: 11px; color: var(--ga-text); border: 1px solid var(--ga-field); }
.notice { margin: 0 12px 8px; padding: 8px; border-radius: 6px; background: var(--ga-raised);
  border: 1px solid var(--ga-border); font-size: 11px; line-height: 14px; }
.notice p { margin: 0 0 6px; }
.notice .row, .footer { display: flex; gap: 6px; align-items: center; }
.footer { padding: 8px 12px 0; border-top: 1px solid var(--ga-border); flex-wrap: wrap; }
.footer .status { color: var(--ga-muted); font-size: 11px; }
.footer textarea { width: 100%; height: 120px; margin-top: 4px; resize: vertical; background: var(--ga-raised);
  color: var(--ga-text); border: 1px solid var(--ga-field); border-radius: 6px; padding: 6px;
  font: 400 10px/14px ui-monospace, SFMono-Regular, Menlo, monospace; }
.footer .note { width: 100%; margin: 4px 0 0; color: var(--ga-error); font-size: 11px; }
`;

const ICONS = {
  eye: '<path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z"/><circle cx="8" cy="8" r="2"/>',
  eyeOff:
    '<path d="M2 2l12 12M6.6 3.7A6 6 0 0 1 8 3.5c4 0 6.5 4.5 6.5 4.5a12 12 0 0 1-1.8 2.3M4.2 5A12 12 0 0 0 1.5 8S4 12.5 8 12.5a6 6 0 0 0 2.5-.5"/>',
  plus: '<path d="M8 3v10M3 8h10"/>',
  minus: '<path d="M3 8h10"/>',
  close: '<path d="M4 4l8 8M12 4l-8 8"/>',
};

/** Figma's default for a new column grid. */
const NEW_GRID: LayoutGridInput = {
  pattern: 'COLUMNS',
  alignment: 'STRETCH',
  count: 5,
  gutterSize: 20,
  offset: 0,
};

const isMac = (): boolean => /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

/** "Desktop · 12 cols · 24 px gutter" (design brief §10). */
export function badgeText(bp: Breakpoint | undefined): string {
  if (!bp) return 'No breakpoint';
  const name = bp.name ?? `From ${bp.minWidth} px`;
  const g = bp.grids[0];
  if (!g) return `${name} · no grids`;
  if (g.pattern === 'GRID') return `${name} · ${g.sectionSize} px grid`;
  const unit = g.pattern === 'COLUMNS' ? 'cols' : 'rows';
  return `${name} · ${g.count} ${unit} · ${g.gutterSize} px gutter`;
}

type Field = 'count' | 'sectionSize' | 'gutterSize' | 'offset' | 'opacity';

const MESSAGES: Record<string, string> = {
  count: 'Count must be a whole number, 1 or more.',
  countAuto: 'Count must be a whole number, 1 or more, or Auto.',
  sectionSize: 'Size must be above 0.',
  gutterSize: 'Gutter must be 0 or more.',
  offset: 'Must be 0 or more.',
  opacity: 'Opacity must be between 0 and 100.',
  number: 'Enter a number.',
};

/** Splits a CSS colour into a hex swatch and an opacity %. `probe` resolves any CSS colour. */
function splitColor(color: string, probe: HTMLElement): { hex: string; opacity: number } {
  probe.style.color = '';
  probe.style.color = color;
  const m = getComputedStyle(probe).color.match(
    /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/,
  );
  if (!m) return { hex: '#ff0000', opacity: 100 };
  const hex = `#${[m[1], m[2], m[3]]
    .map((v) => Math.round(Number(v)).toString(16).padStart(2, '0'))
    .join('')}`;
  const a =
    m[4] === undefined ? 1 : m[4].endsWith('%') ? Number.parseFloat(m[4]) / 100 : Number(m[4]);
  return { hex, opacity: Math.round(a * 100) };
}

const joinColor = (hex: string, opacity: number): string => {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.round(opacity) / 100})`;
};

export function createPanel(doc: Document, store: PanelStore, signal: AbortSignal): Panel {
  const el = (tag: string, props: Record<string, string> = {}, text?: string): HTMLElement => {
    const e = doc.createElement(tag);
    for (const [k, v] of Object.entries(props)) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const icon = (name: keyof typeof ICONS): string =>
    `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;

  const root = el('div', {
    class: 'panel',
    role: 'dialog',
    'aria-modal': 'false',
    'aria-labelledby': 'ga-title',
  });
  root.hidden = true;
  const head = el('div', { class: 'head' });
  const title = el('h2', { class: 'title', id: 'ga-title', tabindex: '-1' }, 'Grid Auditor');
  const visSwitch = el('button', {
    type: 'button',
    class: 'switch',
    role: 'switch',
    'aria-label': 'Show grid (Shift+G)',
  });
  visSwitch.innerHTML = '<span class="track"></span><kbd>⇧G</kbd>';
  const closeBtn = el('button', {
    type: 'button',
    'aria-label': `Close panel (${isMac() ? '⌘' : 'Ctrl'}+Shift+G)`,
    title: 'Close',
  });
  closeBtn.innerHTML = icon('close');
  head.append(title, visSwitch, closeBtn);
  const body = el('div', { class: 'body' });
  const probe = el('span', { hidden: '' });
  root.append(head, body, probe);

  // Events that start in the panel never reach the page (spec 03). Page events are untouched.
  for (const type of [
    'keydown',
    'keyup',
    'keypress',
    'click',
    'dblclick',
    'mousedown',
    'mouseup',
    'pointerdown',
    'pointerup',
    'contextmenu',
    'input',
    'change',
  ]) {
    root.addEventListener(type, (e) => e.stopPropagation(), { signal });
  }
  /** Per-field key handlers, run by `handleKey` (the event never reaches the field's own listeners). */
  const keyHandlers = new WeakMap<EventTarget, (e: KeyboardEvent) => void>();
  visSwitch.addEventListener('click', () => store.setVisible(!store.isVisible()), { signal });
  closeBtn.addEventListener('click', () => store.close(), { signal });

  // Dragging by the header, kept inside the viewport.
  let pos: { x: number; y: number } | undefined;
  const place = (): void => {
    if (!pos) return;
    const r = root.getBoundingClientRect();
    const vw = doc.documentElement.clientWidth;
    const vh = doc.documentElement.clientHeight;
    pos = {
      x: Math.min(Math.max(0, pos.x), Math.max(0, vw - r.width)),
      y: Math.min(Math.max(0, pos.y), Math.max(0, vh - r.height)),
    };
    root.style.left = `${pos.x}px`;
    root.style.top = `${pos.y}px`;
    root.style.right = 'auto';
  };
  head.addEventListener(
    'pointerdown',
    (e) => {
      if (e.button !== 0 || (e.target as Element).closest('button')) return;
      const r = root.getBoundingClientRect();
      const dx = e.clientX - r.left;
      const dy = e.clientY - r.top;
      try {
        head.setPointerCapture(e.pointerId);
      } catch {
        // Synthetic pointers can't be captured; dragging still works while over the header.
      }
      head.classList.add('dragging');
      const move = (m: PointerEvent): void => {
        pos = { x: m.clientX - dx, y: m.clientY - dy };
        place();
      };
      const up = (): void => {
        head.classList.remove('dragging');
        if (pos) store.savePosition(pos);
        head.removeEventListener('pointermove', move);
        head.removeEventListener('pointerup', up);
        head.removeEventListener('pointercancel', up);
      };
      head.addEventListener('pointermove', move, { signal });
      head.addEventListener('pointerup', up, { signal });
      head.addEventListener('pointercancel', up, { signal });
    },
    { signal },
  );

  // ----- rendering -----

  let shapeKey = '';
  let renderedIndex = -2;
  const fieldErrors = new Map<string, string>();

  const active = (): { index: number; bp: Breakpoint | undefined } => {
    const index = store.activeIndex();
    return { index, bp: store.breakpoints()[index] };
  };

  const shapeOf = (index: number, bp: Breakpoint | undefined): string =>
    `${index}|${store.hasSetAside()}|${(bp?.grids ?? [])
      .map((g) => (g.pattern === 'GRID' ? 'G' : `${g.pattern}:${g.alignment}`))
      .join(',')}`;

  /** Writes grid `j` with `patch` applied; reports errors on `key` (the field's data-key). */
  const commit = (j: number, patch: Partial<LayoutGridInput>, key?: string): boolean => {
    const { index, bp } = active();
    if (!bp) return false;
    const grids = bp.grids.map(toInput);
    const base = grids[j];
    if (!base) return false;
    let next = { ...base, ...patch } as LayoutGridInput;
    // Drop fields that the new pattern or alignment doesn't use.
    next = Object.fromEntries(
      Object.entries(next).filter(([, v]) => v !== undefined),
    ) as unknown as LayoutGridInput;
    if (next.pattern === 'GRID') {
      next = {
        pattern: 'GRID',
        sectionSize: next.sectionSize ?? 8,
        visible: next.visible ?? true,
        color: next.color ?? base.color ?? '',
      };
    } else {
      const { sectionSize, offset, ...rest } = next;
      next = {
        ...rest,
        ...(next.alignment === 'CENTER' ? {} : { offset: offset ?? 0 }),
        ...(next.alignment === 'STRETCH' ? {} : { sectionSize }),
      };
    }
    grids[j] = next;
    const errors = store.setGrids(index, grids);
    if (key) {
      const prefix = `grids[${j}].`;
      const err = errors.find((e) => e.field.includes(prefix));
      if (err) {
        const field = err.field.slice(err.field.indexOf(prefix) + prefix.length);
        const auto = field === 'count' && next.pattern !== 'GRID' && next.alignment !== 'STRETCH';
        setError(key, MESSAGES[auto ? 'countAuto' : field] ?? err.message);
        return false;
      }
      setError(key, undefined);
    }
    return errors.length === 0;
  };

  const setError = (key: string, message: string | undefined): void => {
    if (message === undefined) fieldErrors.delete(key);
    else fieldErrors.set(key, message);
    const input = body.querySelector<HTMLInputElement>(`[data-key="${key}"]`);
    if (!input) return;
    const errId = `${key}-error`;
    body.querySelector(`#${CSS.escape(errId)}`)?.remove();
    if (message === undefined) {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
      return;
    }
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', errId);
    const p = el('p', { class: 'error', id: errId }, message);
    input.closest('.field')?.after(p);
  };

  /** A number field with a unit: arrows step by 1 (Shift: 10), Enter or blur commits. */
  const numberField = (
    j: number,
    field: Field,
    label: string,
    value: string,
    unit: string,
    onCommit: (raw: string, key: string) => void,
    stepFrom: () => number,
    wide = false,
  ): HTMLElement => {
    const key = `g${j}-${field}`;
    const wrap = el('label', { class: wide ? 'field wide' : 'field' });
    const box = el('span', { class: 'unit' });
    const input = el('input', {
      type: 'text',
      inputmode: 'decimal',
      autocomplete: 'off',
      spellcheck: 'false',
      'data-key': key,
      'aria-label': `${label}, grid ${j + 1}`,
    }) as HTMLInputElement;
    input.value = value;
    box.append(input, el('small', {}, unit));
    wrap.append(el('span', {}, label), box);
    let committed = value;
    const run = (): void => {
      if (input.value === committed && !input.hasAttribute('aria-invalid')) return;
      committed = input.value;
      onCommit(input.value.trim(), key);
    };
    input.addEventListener('change', run, { signal });
    keyHandlers.set(input, (e) => {
      if (e.key === 'Enter') run();
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const step = (e.shiftKey ? 10 : 1) * (e.key === 'ArrowUp' ? 1 : -1);
        const n = Number.parseFloat(input.value);
        input.value = String(Math.max(0, (Number.isFinite(n) ? n : stepFrom()) + step));
        run();
      }
    });
    return wrap;
  };

  const parseNumber = (raw: string, key: string): number | undefined => {
    const n = Number(raw);
    if (raw === '' || !Number.isFinite(n)) {
      setError(key, MESSAGES.number);
      return undefined;
    }
    return n;
  };

  const renderGrid = (g: LayoutGrid, j: number): HTMLElement => {
    /** The grid as it is in the store now (handlers outlive in-place patches). */
    const now = (): LayoutGrid => active().bp?.grids[j] ?? g;
    const block = el('div', { class: 'grid', role: 'group', 'aria-label': `Grid ${j + 1}` });
    const gh = el('div', { class: 'grid-head' });
    const eye = el('button', {
      type: 'button',
      'aria-pressed': String(g.visible),
      'aria-label': `Show grid ${j + 1}`,
      'data-key': `g${j}-visible`,
    });
    eye.innerHTML = icon(g.visible ? 'eye' : 'eyeOff');
    eye.addEventListener('click', () => commit(j, { visible: !now().visible }), { signal });
    const pattern = el('select', {
      'aria-label': `Type, grid ${j + 1}`,
      'data-key': `g${j}-pattern`,
    }) as HTMLSelectElement;
    for (const [v, t] of [
      ['COLUMNS', 'Columns'],
      ['ROWS', 'Rows'],
      ['GRID', 'Grid'],
    ]) {
      pattern.append(el('option', { value: v as string }, t));
    }
    pattern.value = g.pattern;
    pattern.addEventListener(
      'change',
      () => {
        const p = pattern.value as LayoutGrid['pattern'];
        const g = now();
        if (p === 'GRID') commit(j, { pattern: 'GRID', sectionSize: 8 });
        else if (g.pattern === 'GRID')
          commit(j, { ...NEW_GRID, pattern: p, color: g.color, visible: g.visible });
        else commit(j, { pattern: p });
      },
      { signal },
    );
    const remove = el('button', {
      type: 'button',
      'aria-label': `Remove grid ${j + 1}`,
      title: 'Remove grid',
      'data-key': `g${j}-remove`,
    });
    remove.innerHTML = icon('minus');
    remove.addEventListener(
      'click',
      () => {
        const { index, bp } = active();
        if (!bp) return;
        store.setGrids(index, bp.grids.filter((_, k) => k !== j).map(toInput));
      },
      { signal },
    );
    gh.append(eye, pattern, remove);
    block.append(gh);

    const fields = el('div', { class: 'fields' });
    const box = store.box();

    if (g.pattern === 'GRID') {
      fields.append(
        numberField(
          j,
          'sectionSize',
          'Size',
          String(g.sectionSize),
          'px',
          (raw, key) => {
            const n = parseNumber(raw, key);
            if (n !== undefined) commit(j, { sectionSize: n }, key);
          },
          () => (now() as { sectionSize: number }).sectionSize,
        ),
      );
    } else {
      const isCols = g.pattern === 'COLUMNS';
      const stretch = g.alignment === 'STRETCH';
      fields.append(
        numberField(
          j,
          'count',
          'Count',
          String(g.count === 'auto' ? 'Auto' : g.count),
          '',
          (raw, key) => {
            if (raw.toLowerCase() === 'auto') {
              commit(j, { count: 'auto' }, key);
              return;
            }
            const n = parseNumber(raw, key);
            if (n !== undefined) commit(j, { count: n }, key);
          },
          () => {
            const c = (now() as { count?: number | 'auto' }).count;
            return typeof c === 'number' ? c : 1;
          },
        ),
      );
      const align = el('select', {
        'aria-label': `Type, alignment, grid ${j + 1}`,
        'data-key': `g${j}-alignment`,
      }) as HTMLSelectElement;
      const labels = isCols
        ? ([
            ['STRETCH', 'Stretch'],
            ['MIN', 'Left'],
            ['CENTER', 'Center'],
            ['MAX', 'Right'],
          ] as const)
        : ([
            ['STRETCH', 'Stretch'],
            ['MIN', 'Top'],
            ['CENTER', 'Center'],
            ['MAX', 'Bottom'],
          ] as const);
      for (const [v, t] of labels) align.append(el('option', { value: v }, t));
      align.value = g.alignment;
      align.addEventListener(
        'change',
        () => {
          const a = align.value as 'MIN' | 'MAX' | 'CENTER' | 'STRETCH';
          const g = now();
          if (g.pattern === 'GRID') return;
          if (a === 'STRETCH') {
            const count =
              g.count === 'auto' ? computeSections(g, box).sections.length || 1 : g.count;
            commit(j, { alignment: a, count });
          } else if (g.alignment === 'STRETCH') {
            // Keep the current section size, as Figma does when leaving Stretch.
            const size = computeSections(g, box).sections[0]?.size ?? 64;
            commit(j, { alignment: a, sectionSize: Math.max(1, Math.round(size)) });
          } else {
            commit(j, { alignment: a });
          }
        },
        { signal },
      );
      const alignWrap = el('label', { class: 'field' });
      alignWrap.append(el('span', {}, 'Type'), align);
      fields.append(alignWrap);
      if (!stretch) {
        fields.append(
          numberField(
            j,
            'sectionSize',
            isCols ? 'Width' : 'Height',
            String(g.sectionSize),
            'px',
            (raw, key) => {
              const n = parseNumber(raw, key);
              if (n !== undefined) commit(j, { sectionSize: n }, key);
            },
            () => (now() as { sectionSize?: number }).sectionSize ?? 0,
          ),
        );
      }
      fields.append(
        numberField(
          j,
          'gutterSize',
          'Gutter',
          String(g.gutterSize),
          'px',
          (raw, key) => {
            const n = parseNumber(raw, key);
            if (n !== undefined) commit(j, { gutterSize: n }, key);
          },
          () => (now() as { gutterSize?: number }).gutterSize ?? 0,
        ),
      );
      if (g.alignment !== 'CENTER') {
        fields.append(
          numberField(
            j,
            'offset',
            stretch ? 'Margin' : 'Offset',
            String(g.offset),
            'px',
            (raw, key) => {
              const n = parseNumber(raw, key);
              if (n !== undefined) commit(j, { offset: n }, key);
            },
            () => (now() as { offset?: number }).offset ?? 0,
          ),
        );
      }
    }

    // Colour swatch + opacity together write `color`.
    const { hex, opacity } = splitColor(g.color, probe);
    const colorWrap = el('label', { class: 'field' });
    const colorBox = el('span', { class: 'unit' });
    const swatch = el('input', {
      type: 'color',
      'aria-label': `Colour, grid ${j + 1}`,
      'data-key': `g${j}-color`,
    }) as HTMLInputElement;
    swatch.value = hex;
    const hexText = el('small', {}, hex.toUpperCase());
    colorBox.append(swatch, hexText);
    colorWrap.append(el('span', {}, 'Colour'), colorBox);
    swatch.addEventListener(
      'change',
      () => {
        const current = splitColor(now().color, probe);
        commit(j, { color: joinColor(swatch.value, current.opacity) });
      },
      { signal },
    );
    fields.append(
      colorWrap,
      numberField(
        j,
        'opacity',
        'Opacity',
        String(opacity),
        '%',
        (raw, key) => {
          const n = parseNumber(raw, key);
          if (n === undefined) return;
          if (n < 0 || n > 100) {
            setError(key, MESSAGES.opacity);
            return;
          }
          setError(key, undefined);
          commit(j, { color: joinColor(swatch.value, n) });
        },
        () => splitColor(now().color, probe).opacity,
      ),
    );
    block.append(fields);
    return block;
  };

  const fullBadge = (bp: Breakpoint | undefined): string =>
    `${badgeText(bp)}${store.isEdited() ? ' · Edited' : ''}`;

  /** "Copy config" (0013): clipboard first, a selected text box if that fails. */
  const footer = (): HTMLElement => {
    const f = el('div', { class: 'footer' });
    const copy = el(
      'button',
      { type: 'button', class: 'text-btn', 'data-key': 'copy' },
      'Copy config',
    );
    const status = el('span', { class: 'status', 'aria-live': 'polite' });
    let timer = 0;
    copy.addEventListener(
      'click',
      async () => {
        const text = store.snippet();
        f.querySelector('textarea')?.remove();
        f.querySelector('.note')?.remove();
        try {
          if (!navigator.clipboard?.writeText) throw new Error('no clipboard');
          await navigator.clipboard.writeText(text);
          copy.textContent = 'Copied';
          status.textContent = 'Config copied';
          clearTimeout(timer);
          timer = window.setTimeout(() => {
            copy.textContent = 'Copy config';
            status.textContent = '';
          }, 1500);
        } catch {
          const note = el(
            'p',
            { class: 'note', id: 'ga-copy-note' },
            'Copy failed. Select and copy the text below.',
          );
          const area = el('textarea', {
            readonly: '',
            'aria-label': 'Grid config',
            'aria-describedby': 'ga-copy-note',
            spellcheck: 'false',
          }) as HTMLTextAreaElement;
          area.value = text;
          f.append(note, area);
          area.focus({ preventScroll: true });
          area.select();
        }
      },
      { signal },
    );
    f.append(copy, status);
    return f;
  };

  const rebuild = (index: number, bp: Breakpoint | undefined): void => {
    const shadow = root.getRootNode() as ShadowRoot | Document;
    const focusedKey = (shadow.activeElement as HTMLElement | null)?.dataset?.key;
    const hadFocus = root.contains(shadow.activeElement);
    const indexChanged = index !== renderedIndex;

    const badge = el('p', { class: 'badge', 'aria-live': 'polite' }, fullBadge(bp));
    const parts: HTMLElement[] = [badge];
    if (store.hasSetAside()) {
      const notice = el('div', { class: 'notice', role: 'status' });
      notice.append(el('p', {}, "Your code's grid changed since your last edits."));
      const row = el('div', { class: 'row' });
      const restore = el(
        'button',
        { type: 'button', class: 'text-btn', 'data-key': 'restore' },
        'Restore edits',
      );
      const discard = el(
        'button',
        { type: 'button', class: 'text-btn', 'data-key': 'discard' },
        'Discard',
      );
      restore.addEventListener('click', () => store.restore(), { signal });
      discard.addEventListener('click', () => store.discard(), { signal });
      row.append(restore, discard);
      notice.append(row);
      parts.push(notice);
    }
    const sh = el('div', { class: 'section-head' });
    sh.append(el('h3', { id: 'ga-layout', tabindex: '-1' }, 'Layout guides'));
    {
      const reset = el(
        'button',
        { type: 'button', class: 'text-btn', 'data-key': 'reset' },
        'Reset to code',
      );
      reset.addEventListener(
        'click',
        () => {
          store.reset();
          body.querySelector<HTMLElement>('#ga-layout')?.focus({ preventScroll: true });
        },
        { signal },
      );
      // Always present, hidden until there are edits, so the first edit doesn't rebuild the panel.
      reset.hidden = !store.isEdited();
      sh.append(reset);
    }
    const add = el('button', {
      type: 'button',
      'aria-label': 'Add grid',
      title: 'Add grid',
      'data-key': 'add',
    });
    add.innerHTML = icon('plus');
    (add as HTMLButtonElement).disabled = !bp;
    add.addEventListener(
      'click',
      () => {
        const cur = active();
        if (!cur.bp) return;
        store.setGrids(cur.index, [...cur.bp.grids.map(toInput), NEW_GRID]);
      },
      { signal },
    );
    sh.append(add);
    const list = el('div', { role: 'group', 'aria-labelledby': 'ga-layout' });
    bp?.grids.forEach((g, j) => {
      list.append(renderGrid(g, j));
    });
    if (bp && bp.grids.length === 0)
      list.append(el('p', { class: 'empty' }, 'No grids. Add one with +.'));
    body.replaceChildren(...parts, sh, list, footer());
    fieldErrors.clear();

    if (hadFocus) {
      const again =
        focusedKey && !indexChanged
          ? body.querySelector<HTMLElement>(`[data-key="${focusedKey}"]`)
          : null;
      (again ?? title).focus({ preventScroll: true });
    }
    renderedIndex = index;
  };

  /** Updates values in place when the structure is the same, so focus and typing survive. */
  const patch = (bp: Breakpoint): void => {
    const shadow = root.getRootNode() as ShadowRoot | Document;
    const focused = shadow.activeElement;
    const badge = body.querySelector('.badge');
    if (badge) badge.textContent = fullBadge(bp);
    const reset = body.querySelector<HTMLElement>('[data-key="reset"]');
    if (reset) reset.hidden = !store.isEdited();
    bp.grids.forEach((g, j) => {
      const set = (field: string, value: string): void => {
        const input = body.querySelector<HTMLInputElement>(`[data-key="g${j}-${field}"]`);
        if (!input || input === focused || fieldErrors.has(`g${j}-${field}`)) return;
        input.value = value;
      };
      const eye = body.querySelector<HTMLElement>(`[data-key="g${j}-visible"]`);
      if (eye && eye.getAttribute('aria-pressed') !== String(g.visible)) {
        eye.setAttribute('aria-pressed', String(g.visible));
        eye.innerHTML = icon(g.visible ? 'eye' : 'eyeOff');
      }
      const { hex, opacity } = splitColor(g.color, probe);
      set('opacity', String(opacity));
      set('color', hex);
      if (g.pattern === 'GRID') {
        set('sectionSize', String(g.sectionSize));
        return;
      }
      set('count', String(g.count === 'auto' ? 'Auto' : g.count));
      set('gutterSize', String(g.gutterSize));
      set('offset', String(g.offset));
      if (g.sectionSize !== undefined) set('sectionSize', String(g.sectionSize));
    });
  };

  const sync = (source: SyncSource): void => {
    visSwitch.setAttribute('aria-checked', String(store.isVisible()));
    if (root.hidden) {
      shapeKey = '';
      return;
    }
    const { index, bp } = active();
    const key = shapeOf(index, bp);
    if (source === 'code' || key !== shapeKey || !bp) {
      shapeKey = key;
      rebuild(index, bp);
      return;
    }
    patch(bp);
  };

  return {
    element: root,
    sync,
    setOpen(open) {
      if (open === !root.hidden) return;
      root.hidden = !open;
      if (open) {
        sync('code');
        if (!pos) pos = store.position();
        place();
      } else {
        const shadow = root.getRootNode() as ShadowRoot | Document;
        if (root.contains(shadow.activeElement)) (shadow.activeElement as HTMLElement).blur();
      }
    },
    isOpen: () => !root.hidden,
    clamp: place,
    owns: (event) => event.composedPath().includes(root),
    handleKey(event) {
      if (event.type !== 'keydown') return;
      if (event.key === 'Escape') {
        store.close();
        return;
      }
      keyHandlers.get(event.composedPath()[0] as EventTarget)?.(event);
    },
  };
}
