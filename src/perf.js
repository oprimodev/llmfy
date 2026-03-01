/**
 * Estimated tokens/s by hardware tier and model size.
 * Values are indicative; no real benchmark is run.
 */

const GPU_TIERS = [
  { minGb: 0, maxGb: 6, label: '6GB',  '7B': '~15–30', '13B': null, '32B': null, '70B': null },
  { minGb: 6, maxGb: 8, label: '8GB',  '7B': '~40–60', '13B': null, '32B': null, '70B': null },
  { minGb: 8, maxGb: 12, label: '12GB', '7B': '~50–70', '13B': '~25–40', '32B': null, '70B': null },
  { minGb: 12, maxGb: 16, label: '16GB', '7B': '~55–75', '13B': '~30–45', '32B': '~8–15', '70B': null },
  { minGb: 16, maxGb: 24, label: '24GB', '7B': '~60–80', '13B': '~35–50', '32B': '~35–55', '70B': null },
  { minGb: 24, maxGb: 32, label: '32GB', '7B': '~80+', '13B': '~50+', '32B': '~45–65', '70B': '~15–25' },
  { minGb: 32, maxGb: 200, label: '48GB+', '7B': '~100+', '13B': '~60+', '32B': '~55+', '70B': '~25–40' },
];

const APPLE_RAM_TIERS = [
  { minGb: 0, maxGb: 12, label: '8GB', '7B': '~8–15', '13B': null, '32B': null, '70B': null },
  { minGb: 12, maxGb: 24, label: '16GB', '7B': '~15–25', '13B': '~8–15', '32B': null, '70B': null },
  { minGb: 24, maxGb: 64, label: '32GB+', '7B': '~20–35', '13B': '~12–22', '32B': '~5–12', '70B': null },
];

const CPU_ONLY = { '7B': '~2–5', '13B': '~1–3', '32B': null, '70B': null };

/**
 * Get estimated tok/s for a model size given system context.
 * @param {{ effectiveVramGb: number | null, isAppleSilicon: boolean }} system
 * @param {string} size - '7B' | '13B' | '32B' | '70B'
 * @returns {string | null} e.g. "~40–60 tok/s" or null if not applicable
 */
export function getEstimatedTokPerSec(system, size) {
  const { effectiveVramGb, isAppleSilicon } = system;

  if (isAppleSilicon && effectiveVramGb != null) {
    const tier = APPLE_RAM_TIERS.find((t) => effectiveVramGb >= t.minGb && effectiveVramGb < t.maxGb);
    if (tier && tier[size]) return `${tier[size]} tok/s`;
  }

  if (effectiveVramGb != null && effectiveVramGb > 0) {
    const tier = GPU_TIERS.find((t) => effectiveVramGb >= t.minGb && effectiveVramGb < t.maxGb);
    if (tier && tier[size]) return `${tier[size]} tok/s`;
  }

  if (CPU_ONLY[size]) return `${CPU_ONLY[size]} tok/s (CPU-only)`;
  return null;
}

/**
 * Get performance notes for all models that fit (for report).
 * @param {object} system - system snapshot from detect
 * @param {Array<{ size: string, quant: string }>} fits - from getModelsThatFit
 * @returns {Array<{ size: string, sizeLabel: string, quant: string, reqGb: number, tokPerSec: string | null }>}
 */
export function getPerfForFits(system, fits) {
  return fits.map((m) => ({
    ...m,
    tokPerSec: getEstimatedTokPerSec(system, m.size),
  }));
}
