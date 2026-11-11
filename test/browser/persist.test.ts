import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { createGridOverlay, type GridOverlay, type GridOverlayOptions } from '../../src/index';
import { STORAGE_KEY } from '../../src/overlay/persist';

// Spec 04 browser tests: panel edits survive reloads (0013).

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const frames = async (n = 2) => {
  for (let i = 0; i < n; i++) await nextFrame();
};

const shadow = () =>
  (document.querySelector('grid-auditor') as HTMLElement).shadowRoot as ShadowRoot;
const q = <T extends Element = HTMLElement>(sel: string) => shadow().querySelector(sel) as T;
const field = (key: string) => q<HTMLInputElement>(`[data-key="${key}"]`);
const cols = () => Array.from(shadow().querySelectorAll<HTMLElement>('.section.col'));
const stored = () => localStorage.getItem(STORAGE_KEY);

const commit = (key: string, value: string) => {
  const input = field(key);
  input.focus();
  input.value = value;
  input.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }),
  );
};

/** Simulates a reload: destroy, then create again with the same options. */
const reload = async (options: GridOverlayOptions = {}) => {
  await frames(); // let the coalesced save run
  overlay?.destroy();
  overlay = createGridOverlay(options);
  await frames();
  return overlay;
};

let overlay: GridOverlay | undefined;
let style: HTMLStyleElement;

beforeEach(async () => {
  localStorage.clear();
  style = document.createElement('style');
  style.textContent = 'html, body { margin: 0; padding: 0; }';
  document.head.append(style);
  await page.viewport(1440, 900);
});

afterEach(() => {
  overlay?.destroy();
  overlay = undefined;
  style.remove();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('4. survives a reload', () => {
  it('reapplies edits while the code config is unchanged', async () => {
    overlay = createGridOverlay();
    overlay.openPanel();
    commit('g0-count', '16');
    const o = await reload();
    expect(cols()).toHaveLength(16);
    o.openPanel();
    expect(q('.badge').textContent).toBe('Desktop · 16 cols · 24 px gutter · Edited');
    expect(q('[data-key="reset"]').hidden).toBe(false);
  });
});

describe('5. code changed since the edits', () => {
  it('shows the code grid and offers Restore, which applies the edits', async () => {
    overlay = createGridOverlay();
    overlay.openPanel();
    commit('g0-count', '16');
    const o = await reload({ breakpoints: [{ name: 'Desktop', grids: [{ count: 10 }] }] });
    expect(cols()).toHaveLength(10);
    o.openPanel();
    expect(q('.notice').textContent).toContain("Your code's grid changed since your last edits.");
    await userEvent.click(q('[data-key="restore"]'));
    await frames();
    expect(cols()).toHaveLength(16);
    expect(q('.notice')).toBeNull();
    // Re-saved under the new code fingerprint: the next reload applies it directly.
    await reload({ breakpoints: [{ name: 'Desktop', grids: [{ count: 10 }] }] });
    expect(cols()).toHaveLength(16);
  });

  it('Discard removes the edits', async () => {
    overlay = createGridOverlay();
    overlay.openPanel();
    commit('g0-count', '16');
    const o = await reload({ breakpoints: [{ name: 'Desktop', grids: [{ count: 10 }] }] });
    o.openPanel();
    await userEvent.click(q('[data-key="discard"]'));
    await frames();
    expect(stored()).toBeNull();
    expect(cols()).toHaveLength(10);
    expect(q('.notice')).toBeNull();
  });
});

describe('6. reset to code', () => {
  it('clears the edits, shows the code grid and hides itself', async () => {
    overlay = createGridOverlay();
    overlay.openPanel();
    commit('g0-count', '16');
    await frames();
    await userEvent.click(q('[data-key="reset"]'));
    await frames();
    expect(cols()).toHaveLength(12);
    expect(stored()).toBeNull();
    expect(q('[data-key="reset"]').hidden).toBe(true);
    expect(shadow().activeElement?.id).toBe('ga-layout');
  });
});

describe('7. code calls win', () => {
  it('setBreakpoints removes the saved edits', async () => {
    overlay = createGridOverlay();
    overlay.openPanel();
    commit('g0-count', '16');
    await frames();
    expect(stored()).not.toBeNull();
    overlay.setBreakpoints([{ name: 'Desktop', grids: [{ count: 6 }] }]);
    await frames();
    expect(stored()).toBeNull();
  });
});

describe('8. persist: false', () => {
  it('never touches storage', async () => {
    const get = vi.spyOn(Storage.prototype, 'getItem');
    const set = vi.spyOn(Storage.prototype, 'setItem');
    const remove = vi.spyOn(Storage.prototype, 'removeItem');
    overlay = createGridOverlay({ persist: false });
    overlay.openPanel();
    commit('g0-count', '16');
    await frames();
    overlay.setBreakpoints([]);
    await frames();
    expect(get).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});

describe('9. storage throws', () => {
  it('keeps edits working, warns once and never throws', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    overlay = createGridOverlay();
    overlay.openPanel();
    commit('g0-count', '16');
    await frames();
    commit('g0-count', '14');
    await frames();
    expect(cols()).toHaveLength(14);
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe('10. copy config', () => {
  it('copies a snippet that reproduces the edited grid', async () => {
    let copied = '';
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(async (t: string) => {
      copied = t;
    });
    overlay = createGridOverlay();
    overlay.openPanel();
    commit('g0-count', '7');
    commit('g0-gutterSize', '30');
    await frames();
    const before = cols().map((c) => JSON.stringify(c.getBoundingClientRect()));
    await userEvent.click(q('[data-key="copy"]'));
    expect(q('[data-key="copy"]').textContent).toBe('Copied');
    overlay.destroy();
    localStorage.clear();
    let options: GridOverlayOptions | undefined;
    new Function('createGridOverlay', copied)((o: GridOverlayOptions) => {
      options = o;
    });
    overlay = createGridOverlay(options);
    await frames();
    expect(cols().map((c) => JSON.stringify(c.getBoundingClientRect()))).toEqual(before);
  });

  it('shows a selected text box when the clipboard fails', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new DOMException('no', 'NotAllowedError'),
    );
    overlay = createGridOverlay();
    overlay.openPanel();
    await userEvent.click(q('[data-key="copy"]'));
    await frames();
    const area = q<HTMLTextAreaElement>('.footer textarea');
    expect(area.value).toContain('createGridOverlay({');
    expect(shadow().activeElement).toBe(area);
    expect(area.selectionStart).toBe(0);
    expect(area.selectionEnd).toBe(area.value.length);
    expect(q('.note').textContent).toBe('Copy failed. Select and copy the text below.');
  });
});

describe('11. panel position', () => {
  it('is restored after a reload and clamped to a smaller viewport', async () => {
    overlay = createGridOverlay();
    overlay.openPanel();
    const head = q('.head');
    const r = head.getBoundingClientRect();
    const opts = { bubbles: true, composed: true, button: 0, pointerId: 1 };
    head.dispatchEvent(
      new PointerEvent('pointerdown', { ...opts, clientX: r.left + 20, clientY: r.top + 10 }),
    );
    head.dispatchEvent(new PointerEvent('pointermove', { ...opts, clientX: 900, clientY: 500 }));
    head.dispatchEvent(new PointerEvent('pointerup', opts));
    const moved = q('.panel').getBoundingClientRect();
    const o = await reload();
    o.openPanel();
    expect(q('.panel').getBoundingClientRect().left).toBe(moved.left);
    expect(q('.panel').getBoundingClientRect().top).toBe(moved.top);
    o.closePanel();
    await page.viewport(600, 400);
    const o2 = await reload();
    o2.openPanel();
    const p = q('.panel').getBoundingClientRect();
    expect(p.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
    expect(p.bottom).toBeLessThanOrEqual(document.documentElement.clientHeight);
  });
});

describe('12. accessibility', () => {
  it('has no axe violations with the notice and the text box showing', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('no'));
    overlay = createGridOverlay();
    overlay.openPanel();
    commit('g0-count', '16');
    const o = await reload({ breakpoints: [{ name: 'Desktop', grids: [{ count: 10 }] }] });
    o.openPanel();
    await userEvent.click(q('[data-key="copy"]'));
    await frames();
    expect(q('.notice')).not.toBeNull();
    expect(q('.footer textarea')).not.toBeNull();
    const result = await axe.run(document.querySelector('grid-auditor') as Element, {
      resultTypes: ['violations'],
    });
    expect(result.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
