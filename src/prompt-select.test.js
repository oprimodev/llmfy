import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { selectWithArrows } from './prompt-select.js';

describe('prompt-select', () => {
  const options = [
    { label: 'A', value: 'a' },
    { label: 'B', value: 'b' },
  ];

  const originalStdin = process.stdin;
  const originalStdout = process.stdout;

  function makeFakeStdin(ttY = false) {
    const listeners = [];
    return {
      isTTY: ttY,
      setRawMode: vi.fn(),
      resume: vi.fn(),
      setEncoding: vi.fn(),
      on: vi.fn((ev, fn) => { if (ev === 'keypress') listeners.push(fn); }),
      removeListener: vi.fn(),
      pause: vi.fn(),
      listenerCount: vi.fn(() => listeners.length),
      emit: vi.fn(),
      _keypress: (str, key) => listeners.forEach((fn) => fn(str, key)),
    };
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('non-TTY', () => {
    beforeEach(() => {
      process.stdin.isTTY = false;
    });
    it('returns default option by index when !isTTY', async () => {
      const r = await selectWithArrows('Title', options, 1);
      expect(r).toBe('b');
    });
    it('returns first option when defaultIndex 0', async () => {
      const r = await selectWithArrows('Title', options, 0);
      expect(r).toBe('a');
    });
    it('clamps defaultIndex to last option', async () => {
      const r = await selectWithArrows('Title', options, 10);
      expect(r).toBe('b');
    });
    it('returns undefined when options empty', async () => {
      const r = await selectWithArrows('Title', [], 0);
      expect(r).toBeUndefined();
    });
  });

  describe('TTY with keypress', () => {
    it('returns value on Enter', async () => {
      const fakeStdin = makeFakeStdin(true);
      const fakeStdout = { write: vi.fn() };
      vi.stubGlobal('process', { ...process, stdin: fakeStdin, stdout: fakeStdout });

      const p = selectWithArrows('Title', options, 0);
      await Promise.resolve();
      fakeStdin._keypress('', { name: 'return' });
      await expect(p).resolves.toBe('a');
    });
    it('down then Enter selects second', async () => {
      const fakeStdin = makeFakeStdin(true);
      vi.stubGlobal('process', { ...process, stdin: fakeStdin, stdout: { write: vi.fn() } });

      const p = selectWithArrows('Title', options, 0);
      await Promise.resolve();
      fakeStdin._keypress('', { name: 'down' });
      fakeStdin._keypress('', { name: 'return' });
      await expect(p).resolves.toBe('b');
    });
    it('up wraps to last', async () => {
      const fakeStdin = makeFakeStdin(true);
      vi.stubGlobal('process', { ...process, stdin: fakeStdin, stdout: { write: vi.fn() } });

      const p = selectWithArrows('Title', options, 0);
      await Promise.resolve();
      fakeStdin._keypress('', { name: 'up' });
      fakeStdin._keypress('', { name: 'return' });
      await expect(p).resolves.toBe('b');
    });
    it('down from last wraps to first', async () => {
      const fakeStdin = makeFakeStdin(true);
      vi.stubGlobal('process', { ...process, stdin: fakeStdin, stdout: { write: vi.fn() } });

      const p = selectWithArrows('Title', options, 1);
      await Promise.resolve();
      fakeStdin._keypress('', { name: 'down' });
      fakeStdin._keypress('', { name: 'return' });
      await expect(p).resolves.toBe('a');
    });
    it('Ctrl+C exits with 130', async () => {
      const exit = vi.fn();
      const fakeStdin = makeFakeStdin(true);
      vi.stubGlobal('process', { ...process, stdin: fakeStdin, stdout: { write: vi.fn() }, exit });
      const p = selectWithArrows('Title', options, 0);
      await Promise.resolve();
      fakeStdin._keypress('', { sequence: '\u0003', name: 'c' });
      expect(exit).toHaveBeenCalledWith(130);
    });
  });
});
