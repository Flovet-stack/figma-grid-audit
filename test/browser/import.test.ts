import { expect, it } from 'vitest';

it('imports in a real browser without touching the page', async () => {
  const before = document.body.innerHTML;
  const childCount = document.documentElement.childElementCount;

  const mod = await import('../../src/index');

  expect(mod.version).toBeTypeOf('string');
  expect(document.body.innerHTML).toBe(before);
  expect(document.documentElement.childElementCount).toBe(childCount);
});
