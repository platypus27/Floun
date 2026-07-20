# Floun 2.1.0 Release Notes

Status: production release candidate verified locally and ready for Chrome Web Store submission. It has not been tagged, uploaded, or published.

## Release Theme

Floun 2.1 makes the optional AI report workflow safe for production, consolidates transport scanning, and replaces host-specific release scripts with deterministic cross-platform tooling.

## Highlights

- Added user-managed DeepSeek API-key settings with explicit consent. Floun stores the key locally in the extension profile and makes no DeepSeek request unless both a key and consent are present.
- Removed the embedded/build-time AI-key path and its `.env.example` contract. Release artifacts are checked for environment files and API-key-like values.
- Kept raw detected tokens out of AI prompts and generated PDFs. Browser QA verifies seven redacted AI requests and scans the resulting PDF for raw fixture values.
- Consolidated TLS and leaf-certificate collection into one cached SSL Labs assessment, removing the second certificate provider and host permission.
- Added a combined page-script collection budget so large pages return explicit partial results instead of exceeding extension message limits.
- Replaced PowerShell-only packaging and publication gates with deterministic Node.js scripts that run on Linux and Windows.
- Added ESLint, artifact integrity checks, publish-evidence checks, store-document contracts, package determinism verification, and cross-platform GitHub Actions release checks.
- Replaced the store screenshot with artwork that embeds a real Chrome popup scan rather than a mock interface.

## Verification

From `floun/`:

```bash
npm ci
npm run release:check
npm run qa:extension:load
npm run qa:chrome:flows
npm run release:ready
npm run release:publish:check
```

The canonical artifact is `floun/release/floun-2.1.0.zip`; `floun/release/floun-2.1.zip` is a byte-identical alias. Exact hashes, archive entries, and Chrome-flow evidence are recorded in `docs/release/2.1.0/QA_EVIDENCE.md`.

## Publication Boundary

The repository-level release candidate is complete. Tagging, Chrome Web Store upload, reviewer approval, rollout, and post-release monitoring are intentionally separate operational actions.
