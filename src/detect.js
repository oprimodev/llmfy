import si from 'systeminformation';

/**
 * Detect CPU info: cores, threads, architecture (x64/arm64 for Apple Silicon).
 * @returns {{ cores: number, threads: number, arch: string, brand: string }}
 */
export async function getCpu() {
  const cpu = await si.cpu();
  return {
    cores: cpu.cores,
    threads: cpu.physicalCores ? cpu.physicalCores * (cpu.processors || 1) : cpu.cores,
    arch: cpu.architecture || process.arch,
    brand: cpu.brand || cpu.manufacturer || 'Unknown',
  };
}

/**
 * Detect total and free RAM in GB.
 * @returns {{ totalGb: number, freeGb: number }}
 */
export async function getMemory() {
  const mem = await si.mem();
  const totalGb = Math.round((mem.total / 1024 / 1024 / 1024) * 10) / 10;
  const freeGb = Math.round((mem.free / 1024 / 1024 / 1024) * 10) / 10;
  return { totalGb, freeGb };
}

/**
 * Detect GPU(s) and VRAM. On Apple Silicon, dedicated VRAM is not reported; use null and treat RAM as unified.
 * @returns {{ gpus: Array<{ vendor: string, model: string, vramGb: number | null }>, isAppleSilicon: boolean }}
 */
export async function getGraphics() {
  const graphics = await si.graphics();
  const gpus = [];
  let isAppleSilicon = false;

  for (const controller of graphics.controllers || []) {
    const vendor = controller.vendor || 'Unknown';
    const model = controller.model || controller.name || 'Unknown';
    let vramGb = null;

    if (controller.vram) {
      vramGb = Math.round((controller.vram / 1024) * 10) / 10;
    } else if (controller.memoryTotal) {
      vramGb = Math.round((controller.memoryTotal / 1024) * 10) / 10;
    }

    if (vendor.toLowerCase().includes('apple') || controller.vendor?.toLowerCase().includes('apple')) {
      isAppleSilicon = true;
    }

    gpus.push({ vendor, model, vramGb });
  }

  return { gpus, isAppleSilicon };
}

/**
 * Get OS platform for display.
 * @returns {string}
 */
export async function getOsInfo() {
  const os = await si.osInfo();
  return `${os.distro || os.platform} ${os.release || ''}`.trim();
}

/**
 * Full system snapshot for the CLI report.
 * @param {{ verbose?: boolean }} options
 * @returns {Promise<{ cpu: object, memory: object, graphics: object, os: string, effectiveVramGb: number | null, isAppleSilicon: boolean }>}
 */
export async function detectSystem(options = {}) {
  const [cpu, memory, graphics, os] = await Promise.all([
    getCpu(),
    getMemory(),
    getGraphics(),
    getOsInfo(),
  ]);

  let effectiveVramGb = null;
  const { gpus, isAppleSilicon } = graphics;

  if (isAppleSilicon) {
    effectiveVramGb = memory.totalGb;
  } else {
    const withVram = gpus.filter((g) => g.vramGb != null && g.vramGb > 0);
    if (withVram.length > 0) {
      effectiveVramGb = Math.max(...withVram.map((g) => g.vramGb));
    }
  }

  return {
    cpu,
    memory,
    graphics: { gpus, isAppleSilicon },
    os,
    effectiveVramGb,
    isAppleSilicon,
  };
}
