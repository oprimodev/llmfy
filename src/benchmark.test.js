import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockExecSync = vi.fn();
const mockSpawnSync = vi.fn();
vi.mock('child_process', () => ({
  execSync: (...args) => mockExecSync(...args),
  spawnSync: (...args) => mockSpawnSync(...args),
}));

const { isOllamaAvailable, isLlamaCppAvailable, runLlamaCppBenchmark, runBenchmark } = await import('./benchmark.js');

describe('benchmark', () => {
  beforeEach(() => {
    mockExecSync.mockReset();
    mockSpawnSync.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('isOllamaAvailable', () => {
    it('returns true when ollama --version succeeds', async () => {
      mockExecSync.mockImplementation(() => {});
      expect(await isOllamaAvailable()).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith('ollama --version', { stdio: 'ignore', timeout: 3000 });
    });
    it('returns false when ollama --version throws', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('not found');
      });
      expect(await isOllamaAvailable()).toBe(false);
    });
  });

  describe('isLlamaCppAvailable', () => {
    it('returns true when llama-bench --help succeeds', async () => {
      mockExecSync.mockImplementation(() => {});
      expect(await isLlamaCppAvailable()).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith('llama-bench --help', { stdio: 'ignore', timeout: 3000 });
    });
    it('returns false when both --help and -h throw', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error();
      });
      expect(await isLlamaCppAvailable()).toBe(false);
    });
  });

  describe('runLlamaCppBenchmark', () => {
    it('returns notAvailable when llama-bench not in PATH', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error();
      });
      const r = await runLlamaCppBenchmark('/path/to/model.gguf', 'en');
      expect(r.ok).toBe(false);
      expect(r.message).toContain('llama-bench');
      expect(r.message).toContain('github.com');
    });
    it('returns missingModel when modelPath is empty', async () => {
      mockExecSync.mockImplementation(() => {});
      const r = await runLlamaCppBenchmark('', 'en');
      expect(r.ok).toBe(false);
      expect(r.message).toContain('GGUF');
      expect(r.message).toContain('LLAMACPP_MODEL');
    });
    it('returns ok and tokPerSec when spawnSync returns JSON with avg_ts', async () => {
      mockExecSync.mockImplementation(() => {});
      mockSpawnSync.mockReturnValue({
        status: 0,
        error: null,
        stdout: '{"avg_ts": 42.5}\n',
        stderr: '',
      });
      const r = await runLlamaCppBenchmark('/tmp/model.gguf', 'en');
      expect(r.ok).toBe(true);
      expect(r.tokPerSec).toBe(42.5);
      expect(r.model).toBe('model.gguf');
    });
    it('returns parseError when stdout has no avg_ts', async () => {
      mockExecSync.mockImplementation(() => {});
      mockSpawnSync.mockReturnValue({
        status: 0,
        error: null,
        stdout: '{}',
        stderr: '',
      });
      const r = await runLlamaCppBenchmark('/tmp/model.gguf', 'en');
      expect(r.ok).toBe(false);
      expect(r.message).toContain('parse');
    });
  });

  describe('runBenchmark', () => {
    it('returns message in en when Ollama not available', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error();
      });
      const r = await runBenchmark('en');
      expect(r.ok).toBe(false);
      expect(r.message).toContain('ollama.com');
      expect(r.message).toContain('Benchmark requires');
    });
    it('returns message in pt when lang is pt and Ollama not available', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error();
      });
      const r = await runBenchmark('pt');
      expect(r.ok).toBe(false);
      expect(r.message).toContain('Benchmark precisa');
    });
    it('falls back to en message for unknown lang', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error();
      });
      const r = await runBenchmark('xx');
      expect(r.ok).toBe(false);
      expect(r.message).toContain('Benchmark requires');
    });
    it('when Ollama available still returns stub (ok false, message)', async () => {
      mockExecSync.mockImplementation(() => {});
      const r = await runBenchmark('en');
      expect(r.ok).toBe(false);
      expect(r.message).toBeDefined();
    });
    it('with backend llamacpp and no model returns missingModel', async () => {
      mockExecSync.mockImplementation(() => {});
      const r = await runBenchmark('en', { backend: 'llamacpp' });
      expect(r.ok).toBe(false);
      expect(r.message).toContain('GGUF');
    });
    it('with backend llamacpp and modelPath runs runLlamaCppBenchmark', async () => {
      mockExecSync.mockImplementation(() => {});
      mockSpawnSync.mockReturnValue({
        status: 0,
        error: null,
        stdout: '{"avg_ts": 100}',
        stderr: '',
      });
      const r = await runBenchmark('en', { backend: 'llamacpp', modelPath: '/x.gguf' });
      expect(r.ok).toBe(true);
      expect(r.tokPerSec).toBe(100);
      expect(r.model).toBe('x.gguf');
    });
  });
});
