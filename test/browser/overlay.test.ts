import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import {
  clipSections,
  computeSections,
  type DirectionalGrid,
  normalizeGrid,
} from '../../src/engine';
import { createGridOverlay, type GridOverlay, type GridOverlayOptions } from '../../src/index';

// Spec 02 browser tests. Each test builds its own fixture and destroys the overlay.

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const frames = async (n = 2) => {
  for (let i = 0; i < n; i++) await nextFrame();
};

const host = () => document.querySelector('figma-grid-audit');
const marks = (cls = 'section') =>
  Array.from(host()?.shadowRoot?.querySelectorAll<HTMLElement>(`.${cls}`) ?? []);
const layerHidden = () =>
  (host()?.shadowRoot?.querySelector('.layer') as HTMLElement | null)?.hidden;

// The playground's CSS: a 1200 px container, 24 px padding, 12 columns with a 24 px gap.
const PLAYGROUND: GridOverlayOptions = {
  breakpoints: [
    { minWidth: 0, grids: [{ pattern: 'COLUMNS', count: 12, offset: 24, gutterSize: 24 }] },
    {
      minWidth: 1200,
      grids: [
        { pattern: 'COLUMNS', alignment: 'CENTER', count: 12, sectionSize: 74, gutterSize: 24 },
      ],
    },
  ],
};

let overlay: GridOverlay | undefined;
let fixture: HTMLElement;
let style: HTMLStyleElement;

beforeEach(() => {
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

describe('1. position matches the engine', () => {
  it.each([
    [1440, 900],
    [375, 812],
  ])('at %i × %i', async (w, h) => {
    await page.viewport(w, h);
    overlay = createGridOverlay(PLAYGROUND);
    await frames();
    const L = document.documentElement.clientWidth;
    const input =
      w >= 1200
        ? {
            pattern: 'COLUMNS' as const,
            alignment: 'CENTER' as const,
            count: 12,
            sectionSize: 74,
            gutterSize: 24,
          }
        : { pattern: 'COLUMNS' as const, count: 12, offset: 24, gutterSize: 24 };
    const r = normalizeGrid(input);
    if (!r.ok) throw new Error('fixture grid');
    const expected = clipSections(
      computeSections(r.value as DirectionalGrid, { width: L, height: h }).sections,
      L,
    );
    const actual = marks().map((el) => el.getBoundingClientRect());
    expect(actual.map((r) => [r.left, r.right])).toEqual(
      expected.map((s) => [s.visibleStart, s.visibleEnd]),
    );
  });
});

describe('2. lines up with a real CSS grid', () => {
  it.each([1440, 1000])('at %i wide, within 0.5 px', async (w) => {
    await page.viewport(w, 900);
    style.textContent += `
      .container { max-width: 1200px; margin: 0 auto; padding: 48px 24px; box-sizing: border-box;
        display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; }
      .item { min-height: 40px; }`;
    fixture.innerHTML = `<div class="container">${'<div class="item"></div>'.repeat(12)}</div>`;
    overlay = createGridOverlay(PLAYGROUND);
    await frames();
    const items = Array.from(fixture.querySelectorAll('.item')).map((el) =>
      el.getBoundingClientRect(),
    );
    const cols = marks().map((el) => el.getBoundingClientRect());
    expect(cols).toHaveLength(12);
    items.forEach((item, i) => {
      expect(Math.abs(item.left - (cols[i]?.left ?? Number.NaN))).toBeLessThanOrEqual(0.5);
      expect(Math.abs(item.right - (cols[i]?.right ?? Number.NaN))).toBeLessThanOrEqual(0.5);
    });
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
    overlay = createGridOverlay(PLAYGROUND);
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
    overlay = createGridOverlay(PLAYGROUND);
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
    overlay = createGridOverlay(PLAYGROUND);
    const e = keydown(document.body, { shiftKey: true });
    expect(e.defaultPrevented).toBe(false);
    expect(overlay.isVisible()).toBe(false);
    await frames();
    expect(layerHidden()).toBe(true);
    keydown(document.body, { shiftKey: true });
    expect(overlay.isVisible()).toBe(true);
  });

  it('is ignored while typing, including inside shadow roots and during IME', () => {
    overlay = createGridOverlay(PLAYGROUND);
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
    overlay = createGridOverlay(PLAYGROUND);
    const e = keydown(document.body, { ctrlKey: true, metaKey: true });
    expect(e.defaultPrevented).toBe(false);
    expect(overlay.isVisible()).toBe(true);
  });

  it("'Mod+G' opt-in toggles and prevents find-next; Shift+G then does nothing", () => {
    overlay = createGridOverlay({ ...PLAYGROUND, shortcuts: { toggle: 'Mod+G' } });
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
    const e = keydown(document.body, isMac ? { metaKey: true } : { ctrlKey: true });
    expect(e.defaultPrevented).toBe(true);
    expect(overlay.isVisible()).toBe(false);
    keydown(document.body, { shiftKey: true });
    expect(overlay.isVisible()).toBe(false);
  });

  it('can be turned off', () => {
    overlay = createGridOverlay({ ...PLAYGROUND, shortcuts: { toggle: false } });
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
    const options: GridOverlayOptions = {
      breakpoints: [
        { minWidth: 0, grids: [{ pattern: 'COLUMNS', count: 4 }] },
        { minWidth: 768, grids: [{ pattern: 'COLUMNS', count: 8 }] },
      ],
    };
    for (const [w, cssWidth, cols] of [
      [767, 1, 4],
      [768, 2, 8],
    ] as const) {
      await page.viewport(w, 600);
      overlay?.destroy();
      overlay = createGridOverlay(options);
      await frames();
      expect(probe.getBoundingClientRect().width).toBe(cssWidth);
      expect(marks()).toHaveLength(cols);
    }
  });

  it('re-renders when the window resizes', async () => {
    await page.viewport(1440, 900);
    overlay = createGridOverlay(PLAYGROUND);
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
    overlay = createGridOverlay(PLAYGROUND);
    expect(createGridOverlay(PLAYGROUND)).toBe(overlay);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('already exists'));
    expect(document.querySelectorAll('figma-grid-audit')).toHaveLength(1);
    overlay.destroy();
    expect(host()).toBeNull();
    expect(() => keydown(document.body, { shiftKey: true })).not.toThrow();
    expect(overlay.isVisible()).toBe(true); // the key did nothing after destroy
    overlay.destroy();
    const fresh = createGridOverlay(PLAYGROUND);
    expect(fresh).not.toBe(overlay);
    overlay = fresh;
    warn.mockRestore();
  });

  it('show, hide and update', async () => {
    await page.viewport(1024, 768);
    overlay = createGridOverlay({ ...PLAYGROUND, visible: false });
    expect(overlay.isVisible()).toBe(false);
    overlay.show();
    expect(overlay.isVisible()).toBe(true);
    overlay.hide();
    expect(overlay.isVisible()).toBe(false);
    overlay.update({
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
        breakpoints: [{ minWidth: 0, grids: [{ pattern: 'COLUMNS', count: 0 }] }],
      }),
    ).toThrow(/breakpoints\[0\]\.grids\[0\]\.count: Set count to a whole number/);
    expect(host()).toBeNull();
  });

  it('warns once about ignored fields', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    overlay = createGridOverlay({
      breakpoints: [{ minWidth: 0, grids: [{ pattern: 'COLUMNS', count: 2, sectionSize: 10 }] }],
    });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('[figma-grid-audit] [0].grids[0].sectionSize'),
    );
    warn.mockRestore();
  });
});
