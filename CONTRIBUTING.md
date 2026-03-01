# Contributing to llmfy

Thank you for considering contributing to llmfy. This document explains how to get set up, the workflow we use, and what we expect from contributions.

## Code of conduct

By participating, you agree to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to contribute

- **Bug reports & feature requests**: open a [GitHub Issue](https://github.com/your-org/llmfy/issues) (replace `your-org` with the actual repo owner if different).
- **Code or docs**: open a Pull Request (PR). For large changes, open an issue first to discuss.

## Development setup

1. **Clone and install**

   ```bash
   git clone https://github.com/your-org/llmfy.git   # replace your-org with actual owner
   cd llmfy
   npm install
   ```

2. **Run the CLI locally**

   ```bash
   npm start
   # or
   node bin/cli.js
   ```

3. **Run tests**

   ```bash
   npm test              # run tests once
   npm run test:watch    # watch mode
   npm run coverage      # coverage report (we aim for high coverage)
   ```

## Pull request process

1. **Branch**: create a branch from `main` (e.g. `fix/typo` or `feat/new-flag`).
2. **Code**:
   - Follow the existing style (ES modules, Node 18+).
   - Add or update tests for new or changed behavior.
   - Run `npm test` and `npm run coverage` before pushing.
3. **Commit**: use clear messages (e.g. `fix: correct --help description`, `feat: add --quiet flag`).
4. **Push** and open a PR. Describe what changed and why; link any related issue.
5. **Review**: address feedback. Once approved, a maintainer will merge.

## Project structure

- `bin/cli.js` — CLI entry (Commander, flow).
- `src/` — core logic: `detect.js`, `models.js`, `perf.js`, `format.js`, `benchmark.js`, `ollama-install.js`, `prompt-select.js`, `i18n.js`.
- `src/*.test.js` — Vitest tests (mocks for OS/hardware where needed).

## Guidelines

- **i18n**: user-facing strings live in `src/i18n.js` (English and Portuguese). Add or extend keys there for new copy.
- **Tests**: we use [Vitest](https://vitest.dev/). Mock `systeminformation`, `child_process`, and `process.stdin`/TTY as in existing tests.
- **No new runtime dependencies** without discussion (prefer Node built-ins or existing deps).

## Questions?

Open an issue with the `question` label or start a Discussion if the repo has them enabled.

Thanks for contributing.
