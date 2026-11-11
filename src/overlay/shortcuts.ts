/** Keyboard shortcuts (decision 0005 §8). */

export type ToggleShortcut = 'Shift+G' | 'Mod+G' | false;

const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

/** True when the key event comes from somewhere the user is typing, even inside a shadow root. */
export function isFromEditable(event: KeyboardEvent): boolean {
  const target = event.composedPath()[0];
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLElement && target.isContentEditable) return true;
  return target.closest(EDITABLE) !== null;
}

function isMac(): boolean {
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
}

/** Whether `event` is the configured toggle shortcut. */
export function matchesToggle(event: KeyboardEvent, shortcut: ToggleShortcut): boolean {
  if (shortcut === false || event.code !== 'KeyG' || event.repeat || event.isComposing) {
    return false;
  }
  if (shortcut === 'Shift+G') {
    return event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey;
  }
  const mod = isMac() ? event.metaKey : event.ctrlKey;
  const other = isMac() ? event.ctrlKey : event.metaKey;
  return mod && !other && !event.shiftKey && !event.altKey;
}

export type PanelShortcut = 'Mod+Shift+G' | false;

/** Whether `event` is the panel shortcut: Cmd+Shift+G on Mac, Ctrl+Shift+G elsewhere (0005 §8). */
export function matchesPanel(event: KeyboardEvent, shortcut: PanelShortcut): boolean {
  if (shortcut === false || event.code !== 'KeyG' || event.repeat || event.isComposing) {
    return false;
  }
  const mod = isMac() ? event.metaKey : event.ctrlKey;
  const other = isMac() ? event.ctrlKey : event.metaKey;
  return mod && !other && event.shiftKey && !event.altKey;
}
