import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCpu, getMemory, getGraphics, getOsInfo, detectSystem } from './detect.js';

vi.mock('systeminformation', () => ({
  default: {
    cpu: vi.fn(),
    mem: vi.fn(),
    graphics: vi.fn(),
    osInfo: vi.fn(),
  },
}));

const si = (await import('systeminformation')).default;

describe('detect', () => {
  beforeEach(() => {
    vi.mocked(si.cpu).mockResolvedValue({
      cores: 8,
      physicalCores: 4,
      processors: 2,
      brand: 'Test Brand',
      manufacturer: 'Test',
      architecture: 'x64',
    });
    vi.mocked(si.mem).mockResolvedValue({
      total: 16 * 1024 * 1024 * 1024,
      free: 8 * 1024 * 1024 * 1024,
    });
    vi.mocked(si.graphics).mockResolvedValue({
      controllers: [
        { vendor: 'NVIDIA', model: 'RTX 3080', vram: 10 * 1024, memoryTotal: null },
      ],
    });
    vi.mocked(si.osInfo).mockResolvedValue({
      platform: 'linux',
      distro: 'Ubuntu',
      release: '22.04',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getCpu', () => {
    it('returns cores, threads, arch, brand', async () => {
      const r = await getCpu();
      expect(r.cores).toBe(8);
      expect(r.threads).toBe(8);
      expect(r.arch).toBe('x64');
      expect(r.brand).toBe('Test Brand');
    });
  });

  describe('getMemory', () => {
    it('returns totalGb and freeGb', async () => {
      const r = await getMemory();
      expect(r.totalGb).toBe(16);
      expect(r.freeGb).toBe(8);
    });
  });

  describe('getGraphics', () => {
    it('returns gpus with vramGb and isAppleSilicon false', async () => {
      const r = await getGraphics();
      expect(r.gpus).toHaveLength(1);
      expect(r.gpus[0].vendor).toBe('NVIDIA');
      expect(r.gpus[0].model).toBe('RTX 3080');
      expect(r.gpus[0].vramGb).toBe(10);
      expect(r.isAppleSilicon).toBe(false);
    });
    it('uses memoryTotal when vram is missing', async () => {
      vi.mocked(si.graphics).mockResolvedValueOnce({
        controllers: [{ vendor: 'AMD', model: 'Integrated', vram: null, memoryTotal: 2 * 1024 }],
      });
      const r = await getGraphics();
      expect(r.gpus).toHaveLength(1);
      expect(r.gpus[0].vramGb).toBe(2);
    });
    it('Apple vendor sets isAppleSilicon true', async () => {
      vi.mocked(si.graphics).mockResolvedValueOnce({
        controllers: [{ vendor: 'Apple', model: 'M1', vram: null, memoryTotal: null }],
      });
      const r = await getGraphics();
      expect(r.isAppleSilicon).toBe(true);
    });
    it('empty controllers returns empty gpus', async () => {
      vi.mocked(si.graphics).mockResolvedValueOnce({ controllers: [] });
      const r = await getGraphics();
      expect(r.gpus).toHaveLength(0);
    });
  });

  describe('getOsInfo', () => {
    it('returns distro and release', async () => {
      const r = await getOsInfo();
      expect(r).toContain('Ubuntu');
      expect(r).toContain('22.04');
    });
  });

  describe('detectSystem', () => {
    it('aggregates cpu, memory, graphics, os and sets effectiveVramGb', async () => {
      const r = await detectSystem();
      expect(r.cpu.brand).toBe('Test Brand');
      expect(r.memory.totalGb).toBe(16);
      expect(r.graphics.gpus).toHaveLength(1);
      expect(r.os).toContain('Ubuntu');
      expect(r.effectiveVramGb).toBe(10);
      expect(r.isAppleSilicon).toBe(false);
    });
    it('Apple Silicon: effectiveVramGb is memory total', async () => {
      vi.mocked(si.graphics).mockResolvedValue({
        controllers: [{ vendor: 'Apple', model: 'M1', vram: null, memoryTotal: null }],
      });
      const r = await detectSystem();
      expect(r.isAppleSilicon).toBe(true);
      expect(r.effectiveVramGb).toBe(16);
    });
    it('no GPU with VRAM: effectiveVramGb is null', async () => {
      vi.mocked(si.graphics).mockResolvedValue({
        controllers: [{ vendor: 'Unknown', model: 'GPU', vram: null, memoryTotal: null }],
      });
      const r = await detectSystem();
      expect(r.effectiveVramGb).toBe(null);
    });
  });
});
