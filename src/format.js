/**
 * Matrix theme and output formatting.
 * ANSI codes: green main, bright green/cyan for highlights; fallback when --no-color or no TTY.
 */

import { SIZE_MEANINGS as I18N_SIZE, PORTE, SUMMARY, NEXT_STEP, UI } from './i18n.js';

const ANSI = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  brightGreen: '\x1b[92m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function noColor() {
  return process.env.NO_COLOR !== undefined || process.argv.includes('--no-color') || !process.stdout.isTTY;
}

function style(str, ...codes) {
  return noColor() ? str : codes.reduce((acc, c) => c + acc, str) + ANSI.reset;
}

export function green(str) {
  return style(str, ANSI.green);
}

export function highlight(str) {
  return style(str, ANSI.brightGreen);
}

export function cyan(str) {
  return style(str, ANSI.cyan);
}

export function dim(str) {
  return style(str, ANSI.dim);
}

export const SEP = '═══';
export const LINE = '───';

/** Used by formatMatrix; exported for test coverage. */
export function formatGpuLine(gpu, index, t) {
  const vram = gpu.vramGb != null ? `${gpu.vramGb} GB VRAM` : t.vramUnknown;
  return green(`  GPU ${index + 1}   `) + highlight(`${gpu.vendor} ${gpu.model}`) + dim(` (${vram})`);
}

/** Used by formatMatrix; exported for test coverage. */
export function formatSizeMeaningsLine(size, sizeMeanings) {
  return dim(`    ${size}: ${sizeMeanings[size]}`);
}

/** Push GPU-none lines; used by formatMatrix when gpu.gpus.length === 0. Exported for test coverage. */
export function pushNoGpuLines(lines, gpu, models, t) {
  lines.push(green('  GPU     ') + dim(t.gpuNone));
  lines.push(green('  Effective ') + highlight(`${models.effectiveGb} GB RAM`) + dim(` (${models.source})`));
}

function summaryLine(report, lang = 'en') {
  const sizes = [...new Set(report.models.fits.map((m) => m.size))];
  let key = 'small';
  if (sizes.includes('70B')) key = 'large';
  else if (sizes.includes('32B')) key = 'mediumLarge';
  else if (sizes.includes('13B')) key = 'medium';
  else if (sizes.includes('7B')) key = 'small';
  const word = PORTE[lang]?.[key] ?? PORTE.en[key];
  return SUMMARY[lang]?.(word) ?? SUMMARY.en(word);
}

function nextStepLine(report, lang = 'en') {
  const has7B = report.models.fits.some((m) => m.size === '7B');
  const t = NEXT_STEP[lang] ?? NEXT_STEP.en;
  return has7B ? t.with7B : t.no7B;
}

function banner() {
  const b = [
    '██╗     ██╗     ███╗   ███╗███████╗██╗   ██╗',
    '██║     ██║     ████╗ ████║██╔════╝╚██╗ ██╔╝',
    '██║     ██║     ██╔████╔██║█████╗   ╚████╔╝ ',
    '██║     ██║     ██║╚██╔╝██║██╔══╝    ╚██╔╝  ',
    '███████╗███████╗██║ ╚═╝ ██║██║        ██║   ',
    '╚══════╝╚══════╝╚═╝     ╚═╝╚═╝        ╚═╝   ',
  ];
  return b.map((line) => cyan(line)).join('\n');
}

/**
 * Build the full report payload (for both text and JSON).
 * @param {object} system - from detectSystem()
 * @param {object} modelsResult - from getModelsThatFit()
 * @param {object[]} perfFits - from getPerfForFits()
 * @param {boolean} verbose
 */
export function buildReport(system, modelsResult, perfFits, verbose = false) {
  const { cpu, memory, graphics, os, effectiveVramGb, isAppleSilicon } = system;
  const report = {
    os,
    cpu: { brand: cpu.brand, cores: cpu.cores, threads: cpu.threads, arch: cpu.arch },
    memory: { totalGb: memory.totalGb, freeGb: memory.freeGb },
    gpu: {
      effectiveVramGb: effectiveVramGb ?? null,
      isAppleSilicon,
      gpus: graphics.gpus.map((g) => ({ vendor: g.vendor, model: g.model, vramGb: g.vramGb })),
    },
    models: {
      source: modelsResult.source,
      effectiveGb: modelsResult.effectiveGb,
      fits: perfFits,
    },
  };
  if (verbose) {
    report.verbose = { fullCpu: cpu, fullMemory: memory, fullGraphics: graphics };
  }
  return report;
}

/**
 * Format report as Matrix-styled text.
 * @param {object} report - from buildReport()
 * @param {{ verbose?: boolean, lang?: 'pt'|'en' }} options - verbose: show tok/s and Q4/Q8 glossary; lang: output language (default 'en')
 */
export function formatMatrix(report, options = {}) {
  const { verbose = false, lang = 'en' } = options;
  const t = UI[lang] ?? UI.en;
  const sizeMeanings = I18N_SIZE[lang] ?? I18N_SIZE.en;
  const lines = [];
  const { cpu, memory, gpu, models } = report;

  lines.push('');
  lines.push(banner());
  lines.push('');
  lines.push(green(SEP.repeat(20) + ' SYSTEM ' + SEP.repeat(20)));
  lines.push('');
  lines.push(green('  OS      ') + highlight(report.os));
  lines.push(green('  CPU     ') + highlight(cpu.brand) + dim(` (${cpu.cores} cores, ${cpu.threads} threads, ${cpu.arch})`));
  lines.push(green('  RAM     ') + highlight(`${memory.totalGb} GB`) + dim(` (${memory.freeGb} GB ${t.free})`));
  if (gpu.isAppleSilicon) {
    lines.push(green('  GPU     ') + highlight('Apple Silicon') + dim(' ' + t.gpuUnified));
    lines.push(green('  Effective ') + highlight(`${models.effectiveGb} GB`) + dim(` (${models.source})`));
  } else if (gpu.gpus.length > 0) {
    gpu.gpus.forEach((g, i) => lines.push(formatGpuLine(g, i, t)));
    if (gpu.effectiveVramGb != null) {
      lines.push(green('  Effective ') + highlight(`${gpu.effectiveVramGb} GB VRAM`));
    }
  } else {
    pushNoGpuLines(lines, gpu, models, t);
  }

  lines.push('');
  lines.push(dim('  ' + summaryLine(report, lang)));
  lines.push('');

  const uniqueSizes = [...new Set(models.fits.map((m) => m.size))].filter((s) => sizeMeanings[s]);
  if (uniqueSizes.length > 0) {
    lines.push(green('  ' + t.whatSizeMeans));
    uniqueSizes.forEach((size) => lines.push(formatSizeMeaningsLine(size, sizeMeanings)));
    lines.push('');
  }

  lines.push(green(SEP.repeat(20) + ' MODELS YOU CAN RUN ' + SEP.repeat(12)));
  lines.push('');

  if (models.fits.length === 0) {
    lines.push(dim('  ' + t.noModelsFit));
  } else {
    models.fits.forEach((m) => {
      const perf = m.tokPerSec ? dim(`  ${m.tokPerSec}`) : '';
      lines.push(green('  • ') + highlight(`${m.sizeLabel} ${m.quant}`) + dim(` (${m.reqGb} GB)`) + perf);
    });
  }

  if (verbose) {
    lines.push('');
    lines.push(dim('  ' + t.glossarySpeed));
    lines.push(dim('  ' + t.glossaryQuant));
  }

  lines.push('');
  lines.push(green(LINE.repeat(52)));
  lines.push(dim('  ' + t.estimatesNote));
  lines.push('');
  lines.push(highlight('  ' + t.nextStepLabel + ' ') + dim(nextStepLine(report, lang)));
  lines.push('');
  return lines.join('\n');
}

/**
 * Format report as plain JSON (no theme).
 */
export function formatJson(report) {
  return JSON.stringify(report, null, 2);
}
