/**
 * VRAM/RAM requirements by model size and quantization.
 * Margins included for KV cache (e.g. +2–4 GB for 32k context).
 * Based on InsiderLLM VRAM guide and similar references.
 */
export const MODEL_REQUIREMENTS = [
  { size: '7B', sizeLabel: '7B–8B', q4: 7, q8: 10, fp16: 18 },
  { size: '13B', sizeLabel: '13B', q4: 10, q8: 16, fp16: 28 },
  { size: '32B', sizeLabel: '32B–34B', q4: 22, q8: 36, fp16: 72 },
  { size: '70B', sizeLabel: '70B+', q4: 42, q8: 76, fp16: 150 },
];

/**
 * Which models fit in the given VRAM/RAM (in GB).
 * For CPU-only we use RAM and recommend only smaller models with a note about low perf.
 * @param {{ effectiveVramGb: number | null, memoryTotalGb: number, isAppleSilicon: boolean }} system
 * @returns {{ fits: Array<{ size: string, sizeLabel: string, quant: string, reqGb: number }>, effectiveGb: number, source: string }}
 */
export function getModelsThatFit(system) {
  const { effectiveVramGb, memoryTotalGb, isAppleSilicon } = system;
  const effectiveGb = effectiveVramGb != null ? effectiveVramGb : memoryTotalGb;
  const source = isAppleSilicon
    ? 'unified memory (Apple Silicon)'
    : effectiveVramGb != null
      ? 'VRAM'
      : 'RAM (CPU-only; expect lower speed)';

  const fits = [];
  for (const row of MODEL_REQUIREMENTS) {
    if (row.q4 <= effectiveGb) fits.push({ size: row.size, sizeLabel: row.sizeLabel, quant: 'Q4', reqGb: row.q4 });
    if (row.q8 <= effectiveGb) fits.push({ size: row.size, sizeLabel: row.sizeLabel, quant: 'Q8', reqGb: row.q8 });
    if (row.fp16 <= effectiveGb) fits.push({ size: row.size, sizeLabel: row.sizeLabel, quant: 'FP16', reqGb: row.fp16 });
  }

  return { fits, effectiveGb, source };
}

/**
 * Full requirements table for reference (e.g. llmfy list later).
 * @returns {typeof MODEL_REQUIREMENTS}
 */
export function getRequirementsTable() {
  return MODEL_REQUIREMENTS;
}
