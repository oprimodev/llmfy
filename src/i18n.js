/**
 * Strings for CLI output. lang: 'pt' | 'en'
 */

export const SIZE_MEANINGS = {
  pt: {
    '7B': 'Bom para conversa, resumos e tarefas simples.',
    '13B': 'Melhor para código, raciocínio e textos mais longos.',
    '32B': 'Ótimo para tarefas complexas e análise detalhada.',
    '70B': 'Nível avançado; exige máquina potente.',
  },
  en: {
    '7B': 'Good for chat, summaries, and simple tasks.',
    '13B': 'Better for code, reasoning, and longer text.',
    '32B': 'Great for complex tasks and detailed analysis.',
    '70B': 'Advanced; requires a powerful machine.',
  },
};

export const PORTE = {
  pt: { small: 'pequeno', medium: 'até médio', mediumLarge: 'até médio/grande', large: 'grande' },
  en: { small: 'small', medium: 'up to medium', mediumLarge: 'medium to large', large: 'large' },
};

export const SUMMARY = {
  pt: (porte) =>
    `Sua máquina consegue rodar modelos de IA de ${porte} porte. Os números abaixo indicam quantas palavras por segundo cada tipo de modelo consegue gerar.`,
  en: (porte) =>
    `Your machine can run ${porte}-scale AI models. The numbers below show roughly how many words per second each model size can generate.`,
};

export const NEXT_STEP = {
  pt: {
    with7B: 'Para começar: instale o Ollama (ollama.com) e rode por exemplo: ollama run llama3.2',
    no7B: 'Para começar: instale o Ollama (ollama.com) para rodar modelos locais.',
  },
  en: {
    with7B: 'To get started: install Ollama (ollama.com) and run for example: ollama run llama3.2',
    no7B: 'To get started: install Ollama (ollama.com) to run local models.',
  },
};

export const UI = {
  pt: {
    whatSizeMeans: 'O que cada tamanho significa:',
    noModelsFit: 'No models fit in available memory. Consider more RAM/VRAM or smaller models.',
    estimatesNote: 'Estimates are indicative. No benchmark was run.',
    nextStepLabel: 'Próximo passo:',
    glossarySpeed: 'Velocidade (tok/s) = aproximadamente quantas palavras por segundo o modelo gera.',
    glossaryQuant: 'Q4/Q8 são formatos que reduzem o uso de memória; Q4 é mais leve, Q8 um pouco mais preciso.',
    gpuNone: 'None detected (CPU-only)',
    gpuUnified: '(unified memory)',
    vramUnknown: 'VRAM unknown',
    free: 'free',
  },
  en: {
    whatSizeMeans: 'What each size means:',
    noModelsFit: 'No models fit in available memory. Consider more RAM/VRAM or smaller models.',
    estimatesNote: 'Estimates are indicative. No benchmark was run.',
    nextStepLabel: 'Next step:',
    glossarySpeed: 'Speed (tok/s) = roughly how many words per second the model generates.',
    glossaryQuant: 'Q4/Q8 are formats that reduce memory use; Q4 is lighter, Q8 a bit more accurate.',
    gpuNone: 'None detected (CPU-only)',
    gpuUnified: '(unified memory)',
    vramUnknown: 'VRAM unknown',
    free: 'free',
  },
};

export const BENCHMARK_MSG = {
  pt: 'Benchmark precisa do Ollama. Instale em https://ollama.com ou use a opção 1 para ver a estimativa.',
  en: 'Benchmark requires Ollama. Install from https://ollama.com or use option 1 to see the estimate.',
};

/** Mensagens para benchmark com llama.cpp (llama-bench). */
export const BENCHMARK_MSG_LLAMACPP = {
  pt: {
    notAvailable: 'Benchmark (llama.cpp) precisa do llama-bench no PATH. Build: https://github.com/ggerganov/llama.cpp',
    missingModel: 'Benchmark (llama.cpp) precisa de um modelo GGUF. Defina LLAMACPP_MODEL ou use --model /caminho/para/modelo.gguf',
    parseError: 'Não foi possível ler o resultado do llama-bench. Verifique se a saída é JSON com avg_ts.',
    modelNotFound: 'Modelo ou llama-bench não encontrado. Build: https://github.com/ggerganov/llama.cpp',
  },
  en: {
    notAvailable: 'Benchmark (llama.cpp) requires llama-bench in PATH. Build: https://github.com/ggerganov/llama.cpp',
    missingModel: 'Benchmark (llama.cpp) requires a GGUF model. Set LLAMACPP_MODEL or use --model /path/to/model.gguf',
    parseError: 'Could not parse llama-bench output. Ensure it outputs JSON with avg_ts.',
    modelNotFound: 'Model or llama-bench not found. Build: https://github.com/ggerganov/llama.cpp',
  },
};

export const MENU = {
  languageTitle: 'Idioma / Language (↑↓ setas, Enter)',
  modeTitle: 'Modo / Mode (↑↓ setas, Enter)',
  benchmarkBackendTitle: 'Backend do benchmark / Benchmark backend (↑↓ setas, Enter)',
  languageOptions: [
    { label: 'Português', value: 'pt' },
    { label: 'English', value: 'en' },
  ],
  modeOptions: [
    { label: 'Estimativa (rápido) / Estimate (quick)', value: 'estimate' },
    { label: 'Benchmark (Ollama)', value: 'benchmark' },
    { label: 'Benchmark (llama.cpp)', value: 'benchmark-llamacpp' },
  ],
  benchmarkBackendOptions: [
    { label: 'Ollama', value: 'ollama' },
    { label: 'llama.cpp (llama-bench + GGUF)', value: 'llamacpp' },
  ],
};

export const INSTALL = {
  pt: {
    prompt: 'Instalar o Ollama agora? Você verá o progresso no terminal.',
    promptTitle: 'Instalar Ollama? (↑↓ setas, Enter)',
    optionYes: 'Sim',
    optionNo: 'Não',
    installing: 'Iniciando instalação do Ollama...',
    done: 'Instalação concluída. Rode llmfy --benchmark novamente para medir.',
    failed: 'A instalação não foi concluída. Tente novamente ou instale em https://ollama.com',
    unsupported: 'Instalação automática não disponível neste sistema. Instale em https://ollama.com',
  },
  en: {
    prompt: 'Install Ollama now? You will see progress in the terminal.',
    promptTitle: 'Install Ollama? (↑↓ arrows, Enter)',
    optionYes: 'Yes',
    optionNo: 'No',
    installing: 'Starting Ollama installation...',
    done: 'Installation complete. Run llmfy --benchmark again to measure.',
    failed: 'Installation did not complete. Try again or install from https://ollama.com',
    unsupported: 'Automatic install not available on this system. Install from https://ollama.com',
  },
};
