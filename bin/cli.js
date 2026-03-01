#!/usr/bin/env node

import { program } from 'commander';
import { detectSystem } from '../src/detect.js';
import { getModelsThatFit } from '../src/models.js';
import { getPerfForFits } from '../src/perf.js';
import { buildReport, formatMatrix, formatJson } from '../src/format.js';

program
  .name('llmfy')
  .description('Check which LLMs you can run on your machine and expected performance')
  .option('--json', 'output raw JSON (no Matrix theme)')
  .option('--verbose', 'include full hardware details in output')
  .option('--no-color', 'disable colors')
  .parse(process.argv);

const opts = program.opts();

async function main() {
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

  if (opts.json) {
    console.log(formatJson(report));
  } else {
    console.log(formatMatrix(report));
  }
}

main().catch((err) => {
  console.error('llmfy:', err.message);
  process.exit(1);
});
