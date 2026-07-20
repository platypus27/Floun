# Floun extension package

This directory contains the Floun Manifest V3 extension application. Start with the repository [README](../README.md) for product, installation, privacy, contribution, and governance information. See [Architecture](../docs/ARCHITECTURE.md) for runtime boundaries and data flow.

## Setup

Use Node.js 22 or newer.

```bash
npm ci
npm run release:check
```

The production extension is built into `build/`. Build output, local environment files, and release ZIPs are intentionally ignored.

## Commands

| Command                         | Purpose                                                                     |
| ------------------------------- | --------------------------------------------------------------------------- |
| `npm run start`                 | Run Vite for local UI development.                                          |
| `npm run test`                  | Run the Vitest suite once.                                                  |
| `npm run lint`                  | Run ESLint.                                                                 |
| `npm run typecheck`             | Run TypeScript without emitting files.                                      |
| `npm run build`                 | Build the production extension.                                             |
| `npm run release:check`         | Run tests, lint, build, production audit, typecheck, and worker validation. |
| `npm run release:ready`         | Build, package, validate, reproduce, and check store assets.                |
| `npm run qa:chrome:flows`       | Drive real Chrome popup, scan, PDF, error, and BYOK flows.                  |
| `npm run release:publish:check` | Run the complete local publication gate.                                    |

## Safe fixture

```bash
npm run fixture:server
```

Scan `http://127.0.0.1:4174/crypto-readiness.html`. The fixture contains synthetic signals only. Do not add real credentials, API keys, raw user tokens, or private browsing data.

## Package boundaries

- `src/extension/` contains typed extension protocols, the background worker, QA contracts, and packaging contracts.
- `src/components/` contains analysis, redaction, report, and token-heuristic modules.
- `src/App.tsx` is the Teal popup composition.
- `public/manifest.json` is the source Manifest V3 contract.
- `scripts/` contains release, store, artifact, determinism, and real-Chrome verifiers.

Read [CONTRIBUTING.md](../CONTRIBUTING.md) before submitting a change and report vulnerabilities according to [SECURITY.md](../SECURITY.md).
