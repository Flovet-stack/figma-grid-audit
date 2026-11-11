import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import {
  clipSections,
  computeSections,
  type DirectionalGrid,
  normalizeGrid,
} from '../../src/engine';
import {
  createGridOverlay,
  DEFAULT_BREAKPOINTS,
  type GridOverlay,
  type GridOverlayOptions,
} from '../../src/index';

// Spec 02 browser tests. Each test builds its own fixture and destroys the overlay.

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const frames = async (n = 2) => {
  for (let i = 0; i < n; i++) await nextFrame();
};

const host = () => document.querySelector('grid-auditor');
const marks = (cls = 'section') =>
  Array.from(host()?.shadowRoot?.querySelectorAll<HTMLElement>(`.${cls}`) ?? []);
const layerHidden = () =>
  (host()?.shadowRoot?.querySelector('.layer') as HTMLElement | null)?.hidden;

// A custom config (not the defaults), for tests that don't care about the grid's shape.
const CUSTOM: GridOverlayOptions = {
  extendDefaults: false,
  breakpoints: [
    { minWidth: 0, grids: [{ pattern: 'COLUMNS', count: 12, offset: 24, gutterSize: 24 }] },
  ],
};

// The playground's CSS (playground/src/style.css), which matches the default breakpoints (0010).
const PLAYGROUND_CSS = `
  .container { padding: 48px 16px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  @media (min-width: 768px) { .container { padding: 48px 24px; grid-template-columns: repeat(8, 1fr); gap: 24px; } }
  @media (min-width: 1200px) { .container { padding: 48px 80px; grid-template-columns: repeat(12, 1fr); } }
  .item { min-height: 40px; }`;

let overlay: GridOverlay | undefined;
let fixture: HTMLElement;
let style: HTMLStyleElement;

beforeEach(() => {
  localStorage.clear();
  style = document.createElement('style');
  style.textContent = 'html, body { margin: 0; padding: 0; }';
  document.head.append(style);
  fixture = document.createElement('div');
  document.body.append(fixture);
});

afterEach(() => {
  overlay?.destroy();
  overlay = undefined;
  fixture.remove();
  style.remove();
  window.scrollTo(0, 0);
});

const keydown = (target: EventTarget, init: KeyboardEventInit) => {
  const event = new KeyboardEvent('keydown', {
    code: 'KeyG',
    key: 'G',
    bubbles: true,
    composed: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
};

describe('1 and 10. the default breakpoints, positioned exactly as the engine says', () => {
  it.each([
    [375, 812, 4],
    [1024, 768, 8],
    [1440, 900, 12],
  ])('at %i × %i: %i columns', async (w, h, count) => {
    await page.viewport(w, h);
    overlay = createGridOverlay();
    await frames();
    const L = document.documentElement.clientWidth;
    const bp = [...DEFAULT_BREAKPOINTS].reverse().find((b) => b.minWidth <= w);
    const r = normalizeGrid(bp?.grids[0] ?? { pattern: 'GRID' });
    if (!r.ok) throw new Error('default grid');
    const expected = clipSections(
      computeSections(r.value as DirectionalGrid, { width: L, height: h }).sections,
      L,
    );
    const actual = marks().map((el) => el.getBoundingClientRect());
    expect(actual).toHaveLength(count);
    expect(actual.map((r) => [r.left, r.right])).toEqual(
      expected.map((s) => [s.visibleStart, s.visibleEnd]),
    );
  });
});

describe('2 and 11. lines up with the playground CSS', () => {
  it.each([
    [375, 4],
    [1024, 8],
    [1440, 12],
  ])('at %i wide (%i columns), within 0.5 px', async (w, count) => {
    await page.viewport(w, 900);
    style.textContent += PLAYGROUND_CSS;
    fixture.innerHTML = `<div class="container">${'<div class="item"></div>'.repeat(count)}</div>`;
    overlay = createGridOverlay();
    await frames();
    const items = Array.from(fixture.querySelectorAll('.item')).map((el) =>
      el.getBoundingClientRect(),
    );
    const cols = marks().map((el) => el.getBoundingClientRect());
    expect(cols).toHaveLength(count);
    items.forEach((item, i) => {
      expect(Math.abs(item.left - (cols[i]?.left ?? Number.NaN))).toBeLessThanOrEqual(0.5);
      expect(Math.abs(item.right - (cols[i]?.right ?? Number.NaN))).toBeLessThanOrEqual(0.5);
    });
  });
});

describe('12. live edits with setBreakpoints', () => {
  it('redraws without a new host, and keeps the old grid when invalid', async () => {
    await page.viewport(1440, 900);
    overlay = createGridOverlay();
    await frames();
    const first = host();
    overlay.setBreakpoints([{ name: 'Desktop', grids: [{ count: 16 }] }]);
    await frames();
    expect(marks()).toHaveLength(16);
    expect(host()).toBe(first);
    expect(document.querySelectorAll('grid-auditor')).toHaveLength(1);
    expect(() =>
      overlay?.setBreakpoints([{ name: 'Wide', minWidth: 1200, grids: [{ pattern: 'GRID' }] }]),
    ).toThrow(/"Desktop" and "Wide" both use minWidth 1200/);
    await frames();
    expect(marks()).toHaveLength(16);
    overlay.setBreakpoints([{ minWidth: 0, grids: [{ pattern: 'COLUMNS', count: 2 }] }], {
      extendDefaults: false,
    });
    await frames();
    expect(marks()).toHaveLength(2);
  });
});

describe('3. non-invasive', () => {
  it('leaves scroll size, layout, focus and clicks alone', async () => {
    await page.viewport(1024, 768);
    fixture.innerHTML =
      '<div style="height: 2000px"><button id="b" style="margin: 100px">Press</button></div>';
    const button = fixture.querySelector('button') as HTMLButtonElement;
    button.focus();
    const before = {
      sw: document.documentElement.scrollWidth,
      sh: document.documentElement.scrollHeight,
      rect: JSON.stringify(button.getBoundingClientRect()),
    };
    overlay = createGridOverlay(CUSTOM);
    await frames();
    expect(document.documentElement.scrollWidth).toBe(before.sw);
    expect(document.documentElement.scrollHeight).toBe(before.sh);
    expect(JSON.stringify(button.getBoundingClientRect())).toBe(before.rect);
    expect(document.activeElement).toBe(button);
    const onClick = vi.fn();
    button.addEventListener('click', onClick);
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('4. style isolation', () => {
  it('page CSS cannot change the overlay, and the overlay cannot change the page', async () => {
    await page.viewport(1024, 768);
    style.textContent += 'div { background: blue !important; display: none !important; }';
    fixture.innerHTML = '<span id="probe">x</span>';
    overlay = createGridOverlay(CUSTOM);
    await frames();
    const col = marks()[0] as HTMLElement;
    expect(getComputedStyle(col).display).toBe('block');
    expect(getComputedStyle(col).backgroundColor).toBe('rgba(255, 0, 0, 0.1)');
    style.textContent = 'html, body { margin: 0; }';
    const plain = document.createElement('div');
    document.body.append(plain);
    expect(getComputedStyle(plain).position).toBe('static');
    expect(getComputedStyle(plain).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    plain.remove();
  });
});

describe('5. shortcuts', () => {
  beforeEach(async () => {
    await page.viewport(1024, 768);
  });

  it('Shift+G toggles, without preventing default', async () => {
    overlay = createGridOverlay(CUSTOM);
    const e = keydown(document.body, { shiftKey: true });
    expect(e.defaultPrevented).toBe(false);
    expect(overlay.isVisible()).toBe(false);
    await frames();
    expect(layerHidden()).toBe(true);
    keydown(document.body, { shiftKey: true });
    expect(overlay.isVisible()).toBe(true);
  });

  it('is ignored while typing, including inside shadow roots and during IME', () => {
    overlay = createGridOverlay(CUSTOM);
    const shadowHost = document.createElement('div');
    const inner = shadowHost.attachShadow({ mode: 'open' });
    inner.innerHTML = '<input />';
    fixture.innerHTML =
      '<input /><textarea></textarea><div contenteditable><b>rich</b></div><select></select>';
    fixture.append(shadowHost);
    const targets = [
      fixture.querySelector('input'),
      fixture.querySelector('textarea'),
      fixture.querySelector('b'),
      fixture.querySelector('select'),
      inner.querySelector('input'),
    ];
    for (const t of targets) keydown(t as Element, { shiftKey: true });
    keydown(document.body, { shiftKey: true, isComposing: true });
    keydown(document.body, { shiftKey: true, altKey: true });
    expect(overlay.isVisible()).toBe(true);
  });

  it('Cmd/Ctrl+G is left to the browser by default', () => {
    overlay = createGridOverlay(CUSTOM);
    const e = keydown(document.body, { ctrlKey: true, metaKey: true });
    expect(e.defaultPrevented).toBe(false);
    expect(overlay.isVisible()).toBe(true);
  });

  it("'Mod+G' opt-in toggles and prevents find-next; Shift+G then does nothing", () => {
    overlay = createGridOverlay({ ...CUSTOM, shortcuts: { toggle: 'Mod+G' } });
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
    const e = keydown(document.body, isMac ? { metaKey: true } : { ctrlKey: true });
    expect(e.defaultPrevented).toBe(true);
    expect(overlay.isVisible()).toBe(false);
    keydown(document.body, { shiftKey: true });
    expect(overlay.isVisible()).toBe(false);
  });

  it('can be turned off', () => {
    overlay = createGridOverlay({ ...CUSTOM, shortcuts: { toggle: false } });
    keydown(document.body, { shiftKey: true });
    expect(overlay.isVisible()).toBe(true);
  });
});

describe('6. breakpoints switch with the CSS (0007)', () => {
  it('at the same innerWidth as a min-width media query', async () => {
    style.textContent += `
      #probe { width: 1px; } @media (min-width: 768px) { #probe { width: 2px; } }
      body { overflow-y: scroll; }`;
    fixture.innerHTML = '<div id="probe"></div>';
    const probe = fixture.querySelector('#probe') as HTMLElement;
    for (const [w, cssWidth, cols] of [
      [767, 1, 4],
      [768, 2, 8],
    ] as const) {
      await page.viewport(w, 600);
      overlay?.destroy();
      overlay = createGridOverlay(); // defaults: 4 columns below 768, 8 from 768
      await frames();
      expect(probe.getBoundingClientRect().width).toBe(cssWidth);
      expect(marks()).toHaveLength(cols);
    }
  });

  it('re-renders when the window resizes', async () => {
    await page.viewport(1440, 900);
    overlay = createGridOverlay(CUSTOM);
    await frames();
    const wide = marks()[0]?.getBoundingClientRect().width;
    await page.viewport(800, 900);
    await frames(3);
    expect(marks()[0]?.getBoundingClientRect().width).not.toBe(wide);
  });
});

describe('7. document space', () => {
  it('rows stay attached to the content when scrolling', async () => {
    await page.viewport(800, 600);
    fixture.innerHTML = '<div style="height: 3000px"></div>';
    overlay = createGridOverlay({
      extendDefaults: false,
      breakpoints: [
        {
          minWidth: 0,
          grids: [
            { pattern: 'ROWS', alignment: 'MIN', count: 'auto', sectionSize: 24, gutterSize: 24 },
          ],
        },
      ],
    });
    await frames();
    expect(marks().length).toBeGreaterThan(60); // rows run the whole 3,000 px page
    window.scrollTo(0, 500);
    await frames(3);
    expect(marks()[0]?.getBoundingClientRect().top).toBe(-500);
  });

  it('square grids are one element, however tall the page', async () => {
    await page.viewport(800, 600);
    fixture.innerHTML = '<div style="height: 50000px"></div>';
    overlay = createGridOverlay({
      extendDefaults: false,
      breakpoints: [{ minWidth: 0, grids: [{ pattern: 'GRID', sectionSize: 8 }] }],
    });
    await frames();
    expect(marks('squares')).toHaveLength(1);
    expect(marks('squares')[0]?.getBoundingClientRect().height).toBeGreaterThanOrEqual(50000);
  });
});

describe('8. lifecycle', () => {
  it('reuses one instance and cleans up completely', async () => {
    await page.viewport(1024, 768);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    overlay = createGridOverlay(CUSTOM);
    expect(createGridOverlay(CUSTOM)).toBe(overlay);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('already exists'));
    expect(document.querySelectorAll('grid-auditor')).toHaveLength(1);
    overlay.destroy();
    expect(host()).toBeNull();
    expect(() => keydown(document.body, { shiftKey: true })).not.toThrow();
    expect(overlay.isVisible()).toBe(true); // the key did nothing after destroy
    overlay.destroy();
    const fresh = createGridOverlay(CUSTOM);
    expect(fresh).not.toBe(overlay);
    overlay = fresh;
    warn.mockRestore();
  });

  it('show, hide and update', async () => {
    await page.viewport(1024, 768);
    overlay = createGridOverlay({ ...CUSTOM, visible: false });
    expect(overlay.isVisible()).toBe(false);
    overlay.show();
    expect(overlay.isVisible()).toBe(true);
    overlay.hide();
    expect(overlay.isVisible()).toBe(false);
    overlay.update({
      extendDefaults: false,
      breakpoints: [{ minWidth: 0, grids: [{ pattern: 'COLUMNS', count: 3 }] }],
      visible: true,
    });
    await frames();
    expect(marks()).toHaveLength(3);
    expect(layerHidden()).toBe(false);
  });
});

describe('9. errors', () => {
  it('lists every field and its fix', () => {
    expect(() =>
      createGridOverlay({
        extendDefaults: false,
        breakpoints: [{ minWidth: 0, grids: [{ pattern: 'COLUMNS', count: 0 }] }],
      }),
    ).toThrow(/breakpoints\[0\]\.grids\[0\]\.count: Set count to a whole number/);
    expect(host()).toBeNull();
  });

  it('warns once about ignored fields', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    overlay = createGridOverlay({
      extendDefaults: false,
      breakpoints: [{ minWidth: 0, grids: [{ pattern: 'COLUMNS', count: 2, sectionSize: 10 }] }],
    });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('[grid-auditor] [0].grids[0].sectionSize'),
    );
    warn.mockRestore();
  });
});
