#!/usr/bin/env node

import { program } from 'commander';
import { detectSystem } from '../src/detect.js';
import { getModelsThatFit } from '../src/models.js';
import { getPerfForFits } from '../src/perf.js';
import { buildReport, formatMatrix, formatJson } from '../src/format.js';
import { runBenchmark } from '../src/benchmark.js';
import { getInstallSupport, runOllamaInstall } from '../src/ollama-install.js';
import { INSTALL, MENU } from '../src/i18n.js';
import { selectWithArrows } from '../src/prompt-select.js';

program
  .name('llmfy')
  .description('Check which LLMs you can run on your machine and expected performance.')
  .option('--json', 'output as raw JSON (no Matrix theme); useful for scripts')
  .option('--lang <lang>', 'output language: pt (Português) or en (English)', 'en')
  .option('--estimate', 'show estimate only, skip interactive menu (language/mode)')
  .option('--benchmark', 'run real benchmark (Ollama or llama.cpp)')
  .option('--benchmark-backend <backend>', 'benchmark backend: ollama or llamacpp (default: ollama)', 'ollama')
  .option('--model <path>', 'path to GGUF model for llama.cpp benchmark (or set LLAMACPP_MODEL)')
  .option('--verbose', 'include full hardware details and glossary (Q4/Q8, tok/s)')
  .option('--no-color', 'disable ANSI colors (e.g. for pipes or NO_COLOR)')
  .addHelpText('after', `
Examples:
  npx llmfy                    Interactive: language and mode (estimate / benchmark)
  npx llmfy --estimate         Show capacity estimate only
  npx llmfy --benchmark        Run benchmark with Ollama
  npx llmfy --benchmark --benchmark-backend llamacpp --model ./model.gguf   Benchmark with llama.cpp
  npx llmfy --json             Machine-readable report
  npx llmfy --lang pt          Use Portuguese
  npx llmfy --verbose          Full hardware and glossary
`);
program.parse(process.argv);

const opts = program.opts();
const lang = opts.lang === 'pt' ? 'pt' : 'en';

function askLanguage() {
  return selectWithArrows(MENU.languageTitle, MENU.languageOptions, 1);
}

function askMode() {
  return selectWithArrows(MENU.modeTitle, MENU.modeOptions, 0);
}

function getBenchmarkBackendFromMode(mode) {
  return mode === 'benchmark-llamacpp' ? 'llamacpp' : 'ollama';
}

function askInstallOllama(lang) {
  const t = INSTALL[lang] ?? INSTALL.en;
  return selectWithArrows(t.promptTitle, [
    { label: t.optionYes, value: true },
    { label: t.optionNo, value: false },
  ], 1);
}

async function runEstimateFlow() {
  const system = await detectSystem({ verbose: opts.verbose });
  const { memory, effectiveVramGb, isAppleSilicon } = system;
  const modelsResult = getModelsThatFit({
    effectiveVramGb,
    memoryTotalGb: memory.totalGb,
    isAppleSilicon,
  });
  const perfFits = getPerfForFits(
    { effectiveVramGb, isAppleSilicon },
    modelsResult.fits,
  );
  const report = buildReport(system, modelsResult, perfFits, opts.verbose);
  return report;
}

async function main() {
  let mode = 'estimate';
  let effectiveLang = lang;
  if (!opts.json && process.stdin.isTTY && opts.estimate !== true && opts.benchmark !== true) {
    effectiveLang = await askLanguage();
    mode = await askMode();
  } else if (opts.benchmark) {
    mode = opts.benchmarkBackend === 'llamacpp' ? 'benchmark-llamacpp' : 'benchmark';
  }

  const isBenchmark = mode === 'benchmark' || mode === 'benchmark-llamacpp';
  if (isBenchmark) {
    const backend = opts.benchmark ? (opts.benchmarkBackend === 'llamacpp' ? 'llamacpp' : 'ollama') : getBenchmarkBackendFromMode(mode);
    const modelPath = opts.model || process.env.LLAMACPP_MODEL || undefined;
    const result = await runBenchmark(effectiveLang, { backend, modelPath });
    if (result.ok) {
      const label = effectiveLang === 'pt' ? 'Benchmark real:' : 'Real benchmark:';
      const modelLabel = effectiveLang === 'pt' ? 'modelo' : 'model';
      console.log(`\n  ${label} ${result.tokPerSec} tok/s (${modelLabel} ${result.model})\n`);
    } else {
      console.log('\n  ' + result.message + '\n');
      if (backend === 'ollama') {
        const { supported } = getInstallSupport();
        if (process.stdin.isTTY && supported) {
          const install = await askInstallOllama(effectiveLang);
          const t = INSTALL[effectiveLang] ?? INSTALL.en;
          if (install) {
            console.log('\n  ' + t.installing + '\n');
            const installResult = await runOllamaInstall();
            console.log('\n  ' + (installResult.ok ? t.done : t.failed) + '\n');
          }
        } else if (process.stdin.isTTY && !supported) {
          const t = INSTALL[effectiveLang] ?? INSTALL.en;
          console.log('  ' + t.unsupported + '\n');
        }
      }
    }
    return;
  }

  const report = await runEstimateFlow();

  if (opts.json) {
    console.log(formatJson(report));
  } else {
    console.log(formatMatrix(report, { verbose: opts.verbose, lang: effectiveLang }));
  }
}

main().catch((err) => {
  console.error('llmfy:', err.message);
  process.exit(1);
});
