# Contributing to Floun

Thank you for helping improve Floun. Contributions of code, tests, documentation, cryptography research, accessibility improvements, and reproducible bug reports are welcome.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md). Security vulnerabilities must follow the private process in [SECURITY.md](SECURITY.md), not a public issue.

## Development setup

Requirements:

- Node.js 22 or newer
- npm 10 or newer
- Chrome for Testing, Chromium, or a compatible Chrome installation for extension QA

```bash
git clone https://github.com/platypus27/floun.git
cd floun/floun
npm ci
npm run release:check
```

The extension source is under `floun/`. Production output is written to `floun/build/` and is not committed.

## Working on a change

1. Search existing issues before opening a new one.
2. For substantial changes, open an issue first so maintainers and contributors can agree on behavior and verification seams.
3. Create a focused branch from `main`.
4. Add a failing test at a user-visible or repository contract seam before implementation when the change supports automated testing.
5. Keep changes focused and update documentation with behavior changes.
6. Run the required checks before opening a pull request.

Commit messages use this format:

```text
<action>: <description>
```

Examples include `feat: add certificate rule`, `fix: redact token evidence`, and `docs: clarify local installation`.

## Required checks

From `floun/`:

```bash
npm run release:check
npm run release:ready
```

Changes to popup flows, scanning, reports, permissions, storage, or release behavior should also run:

```bash
npm run qa:chrome:flows
```

Pull requests must not include build output, release ZIP files, environment files, source maps, API keys, secrets, or raw user tokens.

## Cryptography rule contributions

Use the cryptography-rule issue form before implementing a new or materially changed rule. Include:

- An authoritative standard, specification, or primary source.
- The affected algorithm and context.
- Proposed severity, confidence, rationale, and limitations.
- Expected false positives and false negatives.
- Safe, synthetic fixtures.
- A recommendation that does not overstate browser-visible evidence.

Rules must distinguish known weak cryptography from migration-planning signals. Floun is not a definitive vulnerability scanner.

## Pull requests

Pull requests should explain the user impact, link the originating issue, document verification, and include screenshots for UI changes. Maintainers may request changes for security, privacy, accessibility, maintainability, or scope before merge.

Contributions are licensed under Apache-2.0 according to section 5 of the [license](LICENSE), unless explicitly stated otherwise before submission.
