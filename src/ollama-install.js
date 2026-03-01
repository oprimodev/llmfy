/**
 * Offer to install Ollama via official script (macOS/Linux) or winget (Windows).
 * Runs with stdio inherit so the user sees progress and can enter sudo password if needed.
 */

import { spawn, execSync } from 'child_process';
import { platform } from 'os';

const OLLAMA_INSTALL_SH = 'curl -fsSL https://ollama.com/install.sh | sh';

/**
 * Whether we can run an install command on this platform.
 * @returns {{ supported: boolean, platform: string }}
 */
export function getInstallSupport() {
  const pl = platform();
  const supported = pl === 'darwin' || pl === 'linux' || (pl === 'win32' && hasWinget());
  return { supported, platform: pl };
}

function hasWinget() {
  try {
    execSync('winget --version', { stdio: 'ignore', timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Run the Ollama installer. Output streams to the current terminal (stdio inherit).
 * @returns {Promise<{ ok: boolean, code?: number }>}
 */
export function runOllamaInstall() {
  return new Promise((resolve) => {
    const pl = platform();

    if (pl === 'darwin' || pl === 'linux') {
      const child = spawn('sh', ['-c', OLLAMA_INSTALL_SH], {
        stdio: 'inherit',
        shell: false,
      });
      child.on('close', (code) => resolve({ ok: code === 0, code: code ?? undefined }));
      child.on('error', () => resolve({ ok: false }));
      return;
    }

    if (pl === 'win32') {
      const child = spawn('winget', ['install', 'Ollama.Ollama', '--accept-source-agreements', '--accept-package-agreements'], {
        stdio: 'inherit',
        shell: true,
      });
      child.on('close', (code) => resolve({ ok: code === 0, code: code ?? undefined }));
      child.on('error', () => resolve({ ok: false }));
      return;
    }

    resolve({ ok: false });
  });
}
