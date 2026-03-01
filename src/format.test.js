import { describe, it, expect } from 'vitest';
import { buildReport, formatMatrix, formatJson, SEP, LINE, green, highlight } from './format.js';

const stubSystem = {
  cpu: { brand: 'Test CPU', cores: 4, threads: 8, arch: 'x64' },
  memory: { totalGb: 16, freeGb: 8 },
  graphics: {
    gpus: [{ vendor: 'NVIDIA', model: 'Test GPU', vramGb: 8 }],
    isAppleSilicon: false,
  },
  os: 'TestOS 1.0',
  effectiveVramGb: 8,
  isAppleSilicon: false,
};

const stubModelsResult = {
  source: 'VRAM',
  effectiveGb: 8,
  fits: [],
};

const stubPerfFits = [
  { size: '7B', sizeLabel: '7B–8B', quant: 'Q4', reqGb: 7, tokPerSec: '~40–60 tok/s' },
];

describe('format', () => {
  describe('buildReport', () => {
    it('builds report with os, cpu, memory, gpu, models', () => {
      const report = buildReport(stubSystem, stubModelsResult, stubPerfFits, false);
      expect(report).toHaveProperty('os', 'TestOS 1.0');
      expect(report.cpu).toEqual({ brand: 'Test CPU', cores: 4, threads: 8, arch: 'x64' });
      expect(report.memory).toEqual({ totalGb: 16, freeGb: 8 });
      expect(report.gpu.effectiveVramGb).toBe(8);
      expect(report.gpu.isAppleSilicon).toBe(false);
      expect(report.gpu.gpus).toHaveLength(1);
      expect(report.models.source).toBe('VRAM');
      expect(report.models.effectiveGb).toBe(8);
      expect(report.models.fits).toEqual(stubPerfFits);
    });
    it('verbose adds fullCpu, fullMemory, fullGraphics', () => {
      const report = buildReport(stubSystem, stubModelsResult, stubPerfFits, true);
      expect(report.verbose).toBeDefined();
      expect(report.verbose.fullCpu).toEqual(stubSystem.cpu);
      expect(report.verbose.fullMemory).toEqual(stubSystem.memory);
      expect(report.verbose.fullGraphics).toEqual(stubSystem.graphics);
    });
    it('without verbose has no verbose key', () => {
      const report = buildReport(stubSystem, stubModelsResult, stubPerfFits, false);
      expect(report).not.toHaveProperty('verbose');
    });
  });

  describe('formatJson', () => {
    it('returns parseable JSON with same data', () => {
      const report = buildReport(stubSystem, stubModelsResult, stubPerfFits, false);
      const json = formatJson(report);
      const parsed = JSON.parse(json);
      expect(parsed.os).toBe(report.os);
      expect(parsed.models.fits).toHaveLength(1);
    });
  });

  describe('formatMatrix', () => {
    it('includes SYSTEM section and report os', () => {
      const report = buildReport(stubSystem, stubModelsResult, stubPerfFits, false);
      const out = formatMatrix(report);
      expect(out).toContain('SYSTEM');
      expect(out).toContain('TestOS 1.0');
      expect(out).toContain('Test CPU');
      expect(out).toContain('16 GB');
    });
    it('includes MODELS YOU CAN RUN and fit lines', () => {
      const report = buildReport(stubSystem, stubModelsResult, stubPerfFits, false);
      const out = formatMatrix(report);
      expect(out).toContain('MODELS YOU CAN RUN');
      expect(out).toContain('7B–8B Q4');
      expect(out).toContain('7 GB');
    });
    it('no fits: shows message about no models', () => {
      const report = buildReport(stubSystem, { ...stubModelsResult, fits: [] }, [], false);
      const out = formatMatrix(report);
      expect(out).toContain('No models fit');
    });
  });

  describe('theme constants', () => {
    it('green returns string', () => {
      expect(green('x')).toBeDefined();
      expect(typeof green('x')).toBe('string');
    });
    it('highlight returns string', () => {
      expect(highlight('x')).toBeDefined();
    });
    it('SEP and LINE are strings', () => {
      expect(SEP).toBe('═══');
      expect(LINE).toBe('───');
    });
  });
});
