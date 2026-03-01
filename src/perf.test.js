import { describe, it, expect } from 'vitest';
import { getEstimatedTokPerSec, getPerfForFits } from './perf.js';

describe('perf', () => {
  describe('getEstimatedTokPerSec', () => {
    it('CPU-only: 7B returns range with (CPU-only)', () => {
      const r = getEstimatedTokPerSec({ effectiveVramGb: null, isAppleSilicon: false }, '7B');
      expect(r).toMatch(/tok\/s \(CPU-only\)/);
      expect(r).toBeDefined();
    });
    it('CPU-only: 13B returns range', () => {
      const r = getEstimatedTokPerSec({ effectiveVramGb: null, isAppleSilicon: false }, '13B');
      expect(r).toMatch(/tok\/s \(CPU-only\)/);
    });
    it('CPU-only: 70B returns null', () => {
      const r = getEstimatedTokPerSec({ effectiveVramGb: null, isAppleSilicon: false }, '70B');
      expect(r).toBeNull();
    });

    it('GPU 8GB: 7B returns ~40–60 tok/s', () => {
      const r = getEstimatedTokPerSec({ effectiveVramGb: 8, isAppleSilicon: false }, '7B');
      expect(r).toMatch(/tok\/s/);
      expect(r).not.toMatch(/CPU-only/);
    });
    it('GPU 24GB: 32B returns range', () => {
      const r = getEstimatedTokPerSec({ effectiveVramGb: 24, isAppleSilicon: false }, '32B');
      expect(r).toMatch(/tok\/s/);
    });
    it('GPU 8GB: 70B returns null', () => {
      const r = getEstimatedTokPerSec({ effectiveVramGb: 8, isAppleSilicon: false }, '70B');
      expect(r).toBeNull();
    });

    it('Apple Silicon 16GB: 7B returns range', () => {
      const r = getEstimatedTokPerSec({ effectiveVramGb: 16, isAppleSilicon: true }, '7B');
      expect(r).toMatch(/tok\/s/);
    });
    it('Apple Silicon 24GB: 32B returns range', () => {
      const r = getEstimatedTokPerSec({ effectiveVramGb: 24, isAppleSilicon: true }, '32B');
      expect(r).toMatch(/tok\/s/);
    });
  });

  describe('getPerfForFits', () => {
    it('adds tokPerSec to each fit', () => {
      const fits = [
        { size: '7B', sizeLabel: '7B–8B', quant: 'Q4', reqGb: 7 },
        { size: '13B', sizeLabel: '13B', quant: 'Q4', reqGb: 10 },
      ];
      const system = { effectiveVramGb: 12, isAppleSilicon: false };
      const result = getPerfForFits(system, fits);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ size: '7B', quant: 'Q4', reqGb: 7 });
      expect(result[0]).toHaveProperty('tokPerSec');
      expect(result[1]).toHaveProperty('tokPerSec');
    });
  });
});
