import { describe, it, expect } from 'vitest';
import { getModelsThatFit, getRequirementsTable, MODEL_REQUIREMENTS } from './models.js';

describe('models', () => {
  describe('getRequirementsTable', () => {
    it('returns the same as MODEL_REQUIREMENTS', () => {
      expect(getRequirementsTable()).toEqual(MODEL_REQUIREMENTS);
    });
    it('has 4 model sizes', () => {
      expect(MODEL_REQUIREMENTS).toHaveLength(4);
      expect(MODEL_REQUIREMENTS.map((r) => r.size)).toEqual(['7B', '13B', '32B', '70B']);
    });
  });

  describe('getModelsThatFit', () => {
    it('CPU-only: uses RAM and labels source as RAM', () => {
      const r = getModelsThatFit({
        effectiveVramGb: null,
        memoryTotalGb: 16,
        isAppleSilicon: false,
      });
      expect(r.source).toBe('RAM (CPU-only; expect lower speed)');
      expect(r.effectiveGb).toBe(16);
      expect(r.fits.length).toBeGreaterThan(0);
      expect(r.fits.some((m) => m.size === '7B' && m.quant === 'Q4')).toBe(true);
    });

    it('Apple Silicon: uses unified memory label', () => {
      const r = getModelsThatFit({
        effectiveVramGb: 24,
        memoryTotalGb: 24,
        isAppleSilicon: true,
      });
      expect(r.source).toBe('unified memory (Apple Silicon)');
      expect(r.effectiveGb).toBe(24);
    });

    it('GPU with VRAM: uses VRAM label', () => {
      const r = getModelsThatFit({
        effectiveVramGb: 12,
        memoryTotalGb: 32,
        isAppleSilicon: false,
      });
      expect(r.source).toBe('VRAM');
      expect(r.effectiveGb).toBe(12);
    });

    it('8 GB: fits 7B Q4 only (Q8 needs 10 GB)', () => {
      const r = getModelsThatFit({
        effectiveVramGb: 8,
        memoryTotalGb: 16,
        isAppleSilicon: false,
      });
      expect(r.fits.every((m) => m.reqGb <= 8)).toBe(true);
      expect(r.fits.some((m) => m.size === '7B' && m.quant === 'Q4')).toBe(true);
    });

    it('7 GB: fits exactly 7B Q4', () => {
      const r = getModelsThatFit({
        effectiveVramGb: 7,
        memoryTotalGb: 16,
        isAppleSilicon: false,
      });
      expect(r.fits.some((m) => m.size === '7B' && m.quant === 'Q4')).toBe(true);
      expect(r.fits.filter((m) => m.size === '7B' && m.quant === 'Q4')).toHaveLength(1);
    });

    it('6 GB: fits nothing (7B Q4 needs 7 GB)', () => {
      const r = getModelsThatFit({
        effectiveVramGb: 6,
        memoryTotalGb: 16,
        isAppleSilicon: false,
      });
      expect(r.fits).toHaveLength(0);
    });

    it('0 GB: no fits', () => {
      const r = getModelsThatFit({
        effectiveVramGb: 0,
        memoryTotalGb: 0,
        isAppleSilicon: false,
      });
      expect(r.fits).toHaveLength(0);
    });

    it('each fit has size, sizeLabel, quant, reqGb', () => {
      const r = getModelsThatFit({
        effectiveVramGb: 24,
        memoryTotalGb: 32,
        isAppleSilicon: false,
      });
      for (const m of r.fits) {
        expect(m).toHaveProperty('size');
        expect(m).toHaveProperty('sizeLabel');
        expect(m).toHaveProperty('quant');
        expect(m).toHaveProperty('reqGb');
        expect(['Q4', 'Q8', 'FP16']).toContain(m.quant);
      }
    });
  });
});
