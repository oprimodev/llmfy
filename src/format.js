/**
 * Matrix theme and output formatting.
 * ANSI codes: green main, bright green/cyan for highlights; fallback when --no-color or no TTY.
 */

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
  if (noColor()) return str;
  return codes.reduce((acc, c) => c + acc, str) + ANSI.reset;
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

function banner() {
  const b = [
    '██╗     ██╗     ██╗███╗   ███╗███████╗██╗   ██╗',
    '██║     ██║     ██║████╗ ████║██╔════╝╚██╗ ██╔╝',
    '██║     ██║     ██║██╔████╔██║█████╗   ╚████╔╝ ',
    '██║     ██║     ██║██║╚██╔╝██║██╔══╝    ╚██╔╝  ',
    '███████╗███████╗██║██║ ╚═╝ ██║███████╗   ██║   ',
    '╚══════╝╚══════╝╚═╝╚═╝     ╚═╝╚══════╝   ╚═╝   ',
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
 */
export function formatMatrix(report) {
  const lines = [];
  const { cpu, memory, gpu, models } = report;

  lines.push('');
  lines.push(banner());
  lines.push('');
  lines.push(green(SEP.repeat(20) + ' SYSTEM ' + SEP.repeat(20)));
  lines.push('');
  lines.push(green('  OS      ') + highlight(report.os));
  lines.push(green('  CPU     ') + highlight(cpu.brand) + dim(` (${cpu.cores} cores, ${cpu.threads} threads, ${cpu.arch})`));
  lines.push(green('  RAM     ') + highlight(`${memory.totalGb} GB`) + dim(` (${memory.freeGb} GB free)`));
  if (gpu.isAppleSilicon) {
    lines.push(green('  GPU     ') + highlight('Apple Silicon') + dim(' (unified memory)'));
    lines.push(green('  Effective ') + highlight(`${models.effectiveGb} GB`) + dim(` (${models.source})`));
  } else if (gpu.gpus.length > 0) {
    gpu.gpus.forEach((g, i) => {
      const vram = g.vramGb != null ? `${g.vramGb} GB VRAM` : 'VRAM unknown';
      lines.push(green(`  GPU ${i + 1}   `) + highlight(`${g.vendor} ${g.model}`) + dim(` (${vram})`));
    });
    if (gpu.effectiveVramGb != null) {
      lines.push(green('  Effective ') + highlight(`${gpu.effectiveVramGb} GB VRAM`));
    }
  } else {
    lines.push(green('  GPU     ') + dim('None detected (CPU-only)'));
    lines.push(green('  Effective ') + highlight(`${models.effectiveGb} GB RAM`) + dim(` (${models.source})`));
  }

  lines.push('');
  lines.push(green(SEP.repeat(20) + ' MODELS YOU CAN RUN ' + SEP.repeat(12)));
  lines.push('');

  if (models.fits.length === 0) {
    lines.push(dim('  No models fit in available memory. Consider more RAM/VRAM or smaller models.'));
  } else {
    models.fits.forEach((m) => {
      const perf = m.tokPerSec ? dim(`  ${m.tokPerSec}`) : '';
      lines.push(green('  • ') + highlight(`${m.sizeLabel} ${m.quant}`) + dim(` (${m.reqGb} GB)`) + perf);
    });
  }

  lines.push('');
  lines.push(green(LINE.repeat(52)));
  lines.push(dim('  Estimates are indicative. No benchmark was run.'));
  lines.push('');
  return lines.join('\n');
}

/**
 * Format report as plain JSON (no theme).
 */
export function formatJson(report) {
  return JSON.stringify(report, null, 2);
}
