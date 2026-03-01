# llmfy

Check which LLMs you can run on your machine and see expected performance (tokens/s).

```bash
npx llmfy
```

No install required — runs with Node.js 18+ on Windows, macOS, and Linux.

## What it does

- Detects your **CPU**, **RAM**, and **GPU/VRAM** (or Apple Silicon unified memory)
- Tells you which **model sizes and quantizations** fit (7B, 13B, 32B, 70B × Q4, Q8, FP16)
- Gives **estimated tokens/s** by hardware tier (no real benchmark is run)

## Interactive mode

When you run `npx llmfy` in a terminal (without flags), you'll see menus:

- **Language**: choose Português or English with **arrow keys (↑↓)** and **Enter**. No typing numbers; default is English.
- **Mode**: choose **Estimate** (quick), **Benchmark (Ollama)**, or **Benchmark (llama.cpp)** with **arrow keys** and **Enter**. Benchmark measures real speed: Ollama uses its own runtime; [llama.cpp](https://github.com/ggerganov/llama.cpp) uses `llama-bench` and a GGUF model you provide.

If you choose benchmark with Ollama and it is not installed, the CLI can install it for you (macOS/Linux: curl script; Windows: winget). For llama.cpp you need `llama-bench` in your PATH and a GGUF model; use `--model /path/to/model.gguf` or set `LLAMACPP_MODEL`.

Use flags to skip prompts: `--estimate`, `--benchmark`, `--benchmark-backend ollama|llamacpp`, `--model <path>` (for llama.cpp), and `--lang pt` or `--lang en` (default: en).

## Options

| Option        | Description |
| -------------| ----------- |
| `--lang pt` or `--lang en` | Output language (default: en). Use `pt` for Português. |
| `--estimate` | Show estimate only (no prompt) |
| `--benchmark`| Run real benchmark (Ollama or llama.cpp) |
| `--benchmark-backend <ollama\|llamacpp>` | Which backend to use (default: ollama) |
| `--model <path>` | Path to GGUF model for llama.cpp (or set `LLAMACPP_MODEL`) |
| `--json`     | Output raw JSON (for scripts; no Matrix theme) |
| `--verbose`  | Include full hardware details and glossary (tok/s, Q4/Q8) |
| `--no-color` | Disable colored output |

## Examples

```bash
npx llmfy
npx llmfy --estimate
npx llmfy --benchmark
npx llmfy --benchmark --benchmark-backend llamacpp --model ./model.gguf
npx llmfy --json
npx llmfy --verbose --no-color
```

## Requirements

- **Node.js** 18 or later
- No GPU required; works with CPU-only (lower estimated speed)

## Development & testing

```bash
npm install
npm test          # run tests
npm run coverage  # run tests with coverage report (text + html in ./coverage)
npm run test:watch # watch mode
```

Tests use [Vitest](https://vitest.dev/) and cover `src/` (models, perf, format, detect with mocked hardware). Coverage is reported as statements, branches, and functions.

## References

- [VRAM Requirements for Local LLMs (InsiderLLM)](https://insiderllm.com/guides/vram-requirements-local-llms/)
- [systeminformation](https://www.npmjs.com/package/systeminformation) for hardware detection

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for how to set up the project, run tests, and submit pull requests. By participating, you agree to our [Code of Conduct](CODE_OF_CONDUCT.md).

- [CONTRIBUTING.md](CONTRIBUTING.md) — how to contribute
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — community standards
- [CHANGELOG.md](CHANGELOG.md) — version history
- [SECURITY.md](SECURITY.md) — how to report security issues

## License

[MIT](LICENSE)
