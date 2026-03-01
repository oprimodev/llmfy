# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Nothing yet.

## [0.0.1] - 2026-03-01

### Added

- CLI `llmfy` (run with `npx llmfy`).
- Hardware detection: CPU, RAM, GPU/VRAM, Apple Silicon.
- Model fit logic: which sizes and quantizations (7B–70B, Q4/Q8/FP16) fit.
- Performance estimates (tokens/s by tier) without running a benchmark.
- Interactive mode: language (pt/en) and mode (estimate/benchmark) with arrow keys + Enter.
- Optional real benchmark via Ollama; offer to install Ollama (macOS/Linux curl script, Windows winget).
- Output: Matrix-style theme (green/cyan) or raw JSON (`--json`).
- Options: `--lang`, `--estimate`, `--benchmark`, `--verbose`, `--no-color`, `--help`.
- Full test suite (Vitest) with high coverage.

[Unreleased]: https://github.com/your-org/llmfy/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/your-org/llmfy/releases/tag/v0.0.1
