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

## Options

| Option       | Description |
| ------------| ----------- |
| `--json`    | Output raw JSON (for scripts; no Matrix theme) |
| `--verbose`| Include full hardware details |
| `--no-color`| Disable colored output |

## Examples

```bash
npx llmfy
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

## License

MIT
