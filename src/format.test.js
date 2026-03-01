import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildReport, formatMatrix, formatJson, SEP, LINE, green, highlight, formatGpuLine, formatSizeMeaningsLine, pushNoGpuLines } from './format.js';

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
    it('lang pt: includes summary and Próximo passo', () => {
      const report = buildReport(stubSystem, stubModelsResult, stubPerfFits, false);
      const out = formatMatrix(report, { lang: 'pt' });
      expect(out).toContain('Sua máquina consegue rodar modelos de IA');
      expect(out).toContain('Próximo passo:');
      expect(out).toContain('ollama.com');
    });
    it('lang en (default): includes summary and Next step', () => {
      const report = buildReport(stubSystem, stubModelsResult, stubPerfFits, false);
      const out = formatMatrix(report);
      expect(out).toContain('Your machine can run');
      expect(out).toContain('Next step:');
      expect(out).toContain('ollama.com');
    });
    it('verbose pt includes tok/s and Q4/Q8 glossary', () => {
      const report = buildReport(stubSystem, stubModelsResult, stubPerfFits, false);
      const out = formatMatrix(report, { verbose: true, lang: 'pt' });
      expect(out).toContain('Velocidade (tok/s)');
      expect(out).toContain('Q4/Q8');
    });
  });

  describe('formatGpuLine / formatSizeMeaningsLine', () => {
    const t = { vramUnknown: 'VRAM unknown' };
    it('formatGpuLine with vramGb returns VRAM text', () => {
      const line = formatGpuLine({ vendor: 'N', model: 'M', vramGb: 8 }, 0, t);
      expect(line).toContain('N M');
      expect(line).toContain('8');
      expect(line).toContain('VRAM');
    });
    it('formatGpuLine with vramGb null uses vramUnknown', () => {
      const line = formatGpuLine({ vendor: 'U', model: 'G', vramGb: null }, 0, t);
      expect(line).toContain('U G');
      expect(line).toContain('VRAM unknown');
    });
    it('formatSizeMeaningsLine returns size description', () => {
      const line = formatSizeMeaningsLine('7B', { '7B': 'small' });
      expect(line).toContain('7B');
      expect(line).toContain('small');
    });
    it('pushNoGpuLines appends GPU none and Effective RAM', () => {
      const lines = [];
      const t = { gpuNone: 'No dedicated GPU' };
      pushNoGpuLines(lines, { gpus: [] }, { effectiveGb: 16, source: 'RAM' }, t);
      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain('No dedicated GPU');
      expect(lines[1]).toContain('16');
      expect(lines[1]).toContain('RAM');
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

  describe('noColor', () => {
    const origArgv = process.argv;
    const origIsTTY = process.stdout.isTTY;

    afterEach(() => {
      vi.unstubAllEnvs();
      process.argv = origArgv;
      Object.defineProperty(process.stdout, 'isTTY', { value: origIsTTY, writable: true });
    });

    it('when NO_COLOR set, style returns plain string', () => {
      vi.stubEnv('NO_COLOR', '1');
      expect(green('x')).toBe('x');
      expect(highlight('y')).toBe('y');
    });
    it('when --no-color in argv, style returns plain string', () => {
      process.argv = ['node', 'script.js', '--no-color'];
      expect(green('x')).toBe('x');
    });
    it('when stdout not TTY, style returns plain string', () => {
      Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true });
      expect(green('x')).toBe('x');
    });
    it('formatMatrix with NO_COLOR has no ANSI escape codes', () => {
      vi.stubEnv('NO_COLOR', '1');
      const report = buildReport(stubSystem, stubModelsResult, stubPerfFits, false);
      const out = formatMatrix(report);
      expect(out).not.toMatch(/\x1b\[/);
    });
  });

  describe('formatMatrix GPU and sizes', () => {
    it('report with gpus and effectiveVramGb shows Effective VRAM line', () => {
      const report = buildReport(stubSystem, stubModelsResult, stubPerfFits, false);
      const out = formatMatrix(report);
      expect(out).toContain('Effective');
      expect(out).toContain('VRAM');
    });
    it('report with GPU with vramGb null shows VRAM unknown text', () => {
      const sys = {
        ...stubSystem,
        graphics: { ...stubSystem.graphics, gpus: [{ vendor: 'Unknown', model: 'GPU', vramGb: null }] },
      };
      const report = buildReport(sys, stubModelsResult, stubPerfFits, false);
      const out = formatMatrix(report, { lang: 'en' });
      expect(out).toMatch(/Unknown|unknown|VRAM/);
    });
    it('report with gpus but no effectiveVramGb does not show Effective VRAM line', () => {
      const sys = { ...stubSystem, effectiveVramGb: null };
      const report = buildReport(sys, stubModelsResult, stubPerfFits, false);
      expect(report.gpu.effectiveVramGb).toBeNull();
      const out = formatMatrix(report);
      expect(out).not.toMatch(/Effective\s+.*\d+ GB VRAM/);
    });
    it('report with multiple fit sizes shows whatSizeMeans for each', () => {
      const fits = [
        { size: '7B', sizeLabel: '7B–8B', quant: 'Q4', reqGb: 7, tokPerSec: '~40' },
        { size: '13B', sizeLabel: '13B', quant: 'Q4', reqGb: 12, tokPerSec: '~25' },
      ];
      const report = buildReport(stubSystem, stubModelsResult, fits, false);
      const out = formatMatrix(report, { lang: 'en' });
      expect(out).toContain('What each size means');
      expect(out).toMatch(/7B|13B/);
    });
    it('report with Apple Silicon shows unified memory', () => {
      const report = {
        os: 'OS',
        cpu: { brand: 'Apple M1', cores: 8, threads: 8, arch: 'arm64' },
        memory: { totalGb: 16, freeGb: 8 },
        gpu: { gpus: [], effectiveVramGb: null, isAppleSilicon: true },
        models: { source: 'Unified', effectiveGb: 16, fits: [] },
      };
      const out = formatMatrix(report, { lang: 'en' });
      expect(out).toContain('Apple Silicon');
      expect(out).toContain('Effective');
    });
    it('report with no GPUs shows gpuNone and Effective RAM', () => {
      const report = {
        os: 'OS',
        cpu: { brand: 'CPU', cores: 4, threads: 8, arch: 'x64' },
        memory: { totalGb: 16, freeGb: 8 },
        gpu: { gpus: [], effectiveVramGb: null, isAppleSilicon: false },
        models: { source: 'RAM', effectiveGb: 16, fits: [] },
      };
      const out = formatMatrix(report, { lang: 'en' });
      expect(out).toContain('Effective');
      expect(out).toContain('RAM');
    });
    it('covers GPU forEach with vramGb null and uniqueSizes block', () => {
      const report = {
        os: 'OS',
        cpu: { brand: 'CPU', cores: 4, threads: 8, arch: 'x64' },
        memory: { totalGb: 16, freeGb: 8 },
        gpu: {
          gpus: [{ vendor: 'V', model: 'M', vramGb: null }],
          effectiveVramGb: 4,
          isAppleSilicon: false,
        },
        models: {
          source: 'VRAM',
          effectiveGb: 4,
          fits: [
            { size: '7B', sizeLabel: '7B', quant: 'Q4', reqGb: 4, tokPerSec: '~50' },
          ],
        },
      };
      const out = formatMatrix(report, { lang: 'en' });
      expect(out).toContain('V M');
      expect(out).toContain('What each size means');
      expect(out).toContain('7B:');
    });
  });
});
