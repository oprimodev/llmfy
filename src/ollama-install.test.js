import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockPlatform = vi.fn();
const mockSpawn = vi.fn();
const mockExecSync = vi.fn();

vi.mock('os', () => ({
  platform: () => mockPlatform(),
}));
vi.mock('child_process', () => ({
  spawn: (...args) => mockSpawn(...args),
  execSync: (...args) => mockExecSync(...args),
}));

const { getInstallSupport, runOllamaInstall } = await import('./ollama-install.js');

describe('ollama-install', () => {
  beforeEach(() => {
    mockPlatform.mockReturnValue('darwin');
    mockSpawn.mockReset();
    mockExecSync.mockReset();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getInstallSupport', () => {
    it('darwin: supported true', () => {
      mockPlatform.mockReturnValue('darwin');
      expect(getInstallSupport()).toEqual({ supported: true, platform: 'darwin' });
    });
    it('linux: supported true', () => {
      mockPlatform.mockReturnValue('linux');
      expect(getInstallSupport()).toEqual({ supported: true, platform: 'linux' });
    });
    it('win32 without winget: supported false', () => {
      mockPlatform.mockReturnValue('win32');
      mockExecSync.mockImplementation(() => {
        throw new Error();
      });
      expect(getInstallSupport()).toEqual({ supported: false, platform: 'win32' });
    });
    it('win32 with winget: supported true', () => {
      mockPlatform.mockReturnValue('win32');
      mockExecSync.mockImplementation(() => {});
      expect(getInstallSupport()).toEqual({ supported: true, platform: 'win32' });
    });
  });

  describe('runOllamaInstall', () => {
    it('darwin: spawns sh -c curl script, resolves ok on code 0', async () => {
      mockPlatform.mockReturnValue('darwin');
      let onClose;
      mockSpawn.mockImplementation(() => ({
        on: (ev, fn) => { if (ev === 'close') onClose = fn; },
      }));
      const p = runOllamaInstall();
      expect(mockSpawn).toHaveBeenCalledWith('sh', ['-c', expect.stringContaining('curl')], expect.any(Object));
      onClose(0);
      await expect(p).resolves.toEqual({ ok: true, code: 0 });
    });
    it('darwin: resolves ok false on non-zero exit', async () => {
      mockPlatform.mockReturnValue('darwin');
      let onClose;
      mockSpawn.mockImplementation(() => ({
        on: (ev, fn) => { if (ev === 'close') onClose = fn; },
      }));
      const p = runOllamaInstall();
      onClose(1);
      await expect(p).resolves.toEqual({ ok: false, code: 1 });
    });
    it('darwin: resolves ok false on spawn error', async () => {
      mockPlatform.mockReturnValue('darwin');
      let onError;
      mockSpawn.mockImplementation(() => ({
        on: (ev, fn) => { if (ev === 'error') onError = fn; },
      }));
      const p = runOllamaInstall();
      onError(new Error());
      await expect(p).resolves.toEqual({ ok: false });
    });
    it('linux: spawns sh -c curl script', async () => {
      mockPlatform.mockReturnValue('linux');
      let onClose;
      mockSpawn.mockImplementation(() => ({
        on: (ev, fn) => { if (ev === 'close') onClose = fn; },
      }));
      const p = runOllamaInstall();
      expect(mockSpawn).toHaveBeenCalledWith('sh', ['-c', expect.stringContaining('curl')], expect.any(Object));
      onClose(0);
      await expect(p).resolves.toEqual({ ok: true, code: 0 });
    });
    it('win32: spawns winget install', async () => {
      mockPlatform.mockReturnValue('win32');
      let onClose;
      mockSpawn.mockImplementation(() => ({
        on: (ev, fn) => { if (ev === 'close') onClose = fn; },
      }));
      const p = runOllamaInstall();
      expect(mockSpawn).toHaveBeenCalledWith('winget', expect.arrayContaining(['install', 'Ollama.Ollama']), expect.any(Object));
      onClose(0);
      await expect(p).resolves.toEqual({ ok: true, code: 0 });
    });
    it('win32: resolves ok false on spawn error', async () => {
      mockPlatform.mockReturnValue('win32');
      let onError;
      mockSpawn.mockImplementation(() => ({
        on: (ev, fn) => { if (ev === 'error') onError = fn; },
      }));
      const p = runOllamaInstall();
      onError(new Error());
      await expect(p).resolves.toEqual({ ok: false });
    });
    it('unknown platform: resolves ok false', async () => {
      mockPlatform.mockReturnValue('sunos');
      const p = runOllamaInstall();
      await expect(p).resolves.toEqual({ ok: false });
      expect(mockSpawn).not.toHaveBeenCalled();
    });
  });
});
