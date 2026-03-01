/**
 * Benchmark real: Ollama ou llama.cpp (llama-bench).
 * Ollama: detecta se está instalado; llama.cpp: requer llama-bench + GGUF e retorna tok/s.
 */

import { BENCHMARK_MSG, BENCHMARK_MSG_LLAMACPP } from './i18n.js';
import path from 'path';

/**
 * Verifica se Ollama está instalado (comando disponível).
 * @returns {Promise<boolean>}
 */
export async function isOllamaAvailable() {
  const { execSync } = await import('child_process');
  try {
    execSync('ollama --version', { stdio: 'ignore', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifica se llama-bench (llama.cpp) está disponível no PATH.
 * @returns {Promise<boolean>}
 */
export async function isLlamaCppAvailable() {
  const { execSync } = await import('child_process');
  try {
    execSync('llama-bench --help', { stdio: 'ignore', timeout: 3000 });
    return true;
  } catch {
    try {
      execSync('llama-bench -h', { stdio: 'ignore', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Extrai tok/s do stdout do llama-bench (JSON ou texto).
 * Aceita avg_ts em JSON ou linha com "t/s" / "tok/s".
 * @param {string} stdout
 * @returns {number|null}
 */
function parseLlamaBenchTokPerSec(stdout) {
  const trimmed = stdout.trim();
  // JSON: procurar "avg_ts": number ou "ts": number
  const avgTsMatch = trimmed.match(/"avg_ts"\s*:\s*([\d.]+)/);
  if (avgTsMatch) return parseFloat(avgTsMatch[1], 10);
  const tsMatch = trimmed.match(/"ts"\s*:\s*([\d.]+)/);
  if (tsMatch) return parseFloat(tsMatch[1], 10);
  // JSONL: primeira linha com avg_ts
  for (const line of trimmed.split('\n')) {
    const m = line.match(/"avg_ts"\s*:\s*([\d.]+)/);
    if (m) return parseFloat(m[1], 10);
  }
  // Texto: "XX.XX t/s" ou "XX.XX tok/s"
  const textMatch = trimmed.match(/([\d.]+)\s*(?:t\/s|tok\/s)/i);
  if (textMatch) return parseFloat(textMatch[1], 10);
  return null;
}

/**
 * Executa benchmark com llama-bench (llama.cpp).
 * @param {string} modelPath - caminho para ficheiro .gguf
 * @param {'pt'|'en'} [lang='en']
 * @returns {Promise<{ ok: boolean, message?: string, tokPerSec?: number, model?: string }>}
 */
export async function runLlamaCppBenchmark(modelPath, lang = 'en') {
  const { spawnSync } = await import('child_process');
  const available = await isLlamaCppAvailable();
  const t = BENCHMARK_MSG_LLAMACPP[lang] ?? BENCHMARK_MSG_LLAMACPP.en;
  if (!available) {
    return { ok: false, message: t.notAvailable };
  }
  if (!modelPath || typeof modelPath !== 'string' || !modelPath.trim()) {
    return { ok: false, message: t.missingModel };
  }
  const result = spawnSync('llama-bench', ['-m', modelPath.trim(), '-n', '128', '-o', 'json'], {
    encoding: 'utf8',
    timeout: 120000,
    maxBuffer: 1024 * 1024,
  });
  const out = (result.stdout || result.stderr || '').trim();
  if (result.error) {
    return { ok: false, message: t.modelNotFound };
  }
  if (result.status !== 0) {
    const t2 = BENCHMARK_MSG_LLAMACPP[lang] ?? BENCHMARK_MSG_LLAMACPP.en;
    const errOut = out + (result.stderr || '');
    const isNotFound = errOut.includes('No such file') || errOut.includes('not found');
    return { ok: false, message: isNotFound ? t2.modelNotFound : t2.parseError };
  }
  const tokPerSec = parseLlamaBenchTokPerSec(out);
  if (tokPerSec == null || Number.isNaN(tokPerSec)) {
    return { ok: false, message: t.parseError };
  }
  const modelName = path.basename(modelPath);
  return { ok: true, tokPerSec: Math.round(tokPerSec * 10) / 10, model: modelName };
}

/**
 * Executa o fluxo de benchmark (Ollama ou llama.cpp).
 * @param {'pt'|'en'} [lang='en']
 * @param {{ backend: 'ollama'|'llamacpp', modelPath?: string }} [options] - backend e, para llamacpp, caminho do modelo GGUF
 * @returns {Promise<{ ok: boolean, message?: string, tokPerSec?: number, model?: string }>}
 */
export async function runBenchmark(lang = 'en', options = {}) {
  const { backend = 'ollama', modelPath } = options;
  if (backend === 'llamacpp') {
    return runLlamaCppBenchmark(modelPath || '', lang);
  }
  const available = await isOllamaAvailable();
  const message = BENCHMARK_MSG[lang] ?? BENCHMARK_MSG.en;
  if (!available) {
    return { ok: false, message };
  }
  // TODO: rodar modelo pequeno via Ollama, medir tok/s
  return { ok: false, message };
}
