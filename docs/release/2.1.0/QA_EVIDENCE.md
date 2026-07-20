# Floun 2.1.0 QA Evidence

Status: release candidate verified locally on Linux on 2026-07-20. The candidate is ready for Chrome Web Store submission, but has not been tagged, uploaded, or published.

## Artifact Evidence

- Package path: `floun/release/floun-2.1.0.zip`
- Alias package path: `floun/release/floun-2.1.zip`
- Extension version: `2.1.0`
- SHA-256: `3495bdab2f8e0b5ff0ab45c4bcca63e40c573b819e9db9b7bf20da168b71da17`
- Alias SHA-256: `3495bdab2f8e0b5ff0ab45c4bcca63e40c573b819e9db9b7bf20da168b71da17`
- Size bytes: `323303`
- Two independent deterministic packaging runs produced matching SHA-256: `3495bdab2f8e0b5ff0ab45c4bcca63e40c573b819e9db9b7bf20da168b71da17`

Required archive entries:

- `assets/ai-handler-DJidJz4d.js`
- `assets/index-BbKA9AuB.css`
- `assets/index-BZkU2Dza.js`
- `assets/pdfService-DiXBXVWa.js`
- `assets/scanProtocol-ChyA6h0r.js`
- `background.js`
- `icons/favicon.ico`
- `icons/floun.png`
- `icons/icon_128.png`
- `icons/icon_16.png`
- `icons/icon_48.png`
- `index.html`
- `manifest.json`
- `robots.txt`

The artifact gate verified safe relative ZIP entries, an exact MV3 manifest schema, `activeTab` and `scripting` permissions, the SSL Labs and DeepSeek host allowlist, CSP, internal asset references, expected file types, and absence of source, fixtures, source maps, environment files, raw QA tokens, or API-key-like values.

## Scripted Verification

| Check | Result | Evidence |
| --- | --- | --- |
| `npm ci` | Pass | 293 packages installed from the lockfile; npm reported zero vulnerabilities. |
| `npm run release:check` | Pass | 32 test files and 117 tests passed; lint, production build, production dependency audit, typecheck, and worker syntax check passed. |
| `npm run release:artifact` | Pass | Canonical and alias archives matched the recorded version, entries, size, and SHA-256. |
| `npm run release:determinism` | Pass | Two clean package runs were byte-identical. |
| `npm run store:check` | Pass | Required store documents and 128x128, 1280x800, and 440x280 PNG assets passed. |
| `npm run qa:extension:load` | Pass | Floun 2.1.0 loaded unpacked in Chrome for Testing. |
| `npm run qa:chrome:flows` | Pass | Chrome 151.0.7922.34 completed all required popup flows. |
| `npm audit` | Pass | Full dependency audit reported zero vulnerabilities. |
| `git diff --check` | Pass | No whitespace errors. |

## Manual Chrome QA

These rows are backed by the Chrome DevTools Protocol QA run against the unpacked production build. External provider responses for BYOK were intercepted and mocked so no real API key or user content left the isolated QA profile.

| Scenario | Result | Evidence |
| --- | --- | --- |
| Load `floun/build/` in Chrome extensions | Pass | Chrome for Testing 151.0.7922.34 loaded Floun 2.1.0 as an unpacked MV3 extension. |
| Scan `http://127.0.0.1:4174/crypto-readiness.html` | Pass | Detected 20 occurrences and rendered all four result sections; external TLS and certificate lookups were reported unavailable for the loopback host. |
| Scan `https://www.cloudflare.com/` | Pass | Detected 95 occurrences, rendered TLS and certificate evidence from one SSL Labs assessment, and displayed page-data truncation as a partial warning. |
| Scan `http://example.com/` | Pass | Completed with explicit TLS and certificate unavailable warnings for the blacklisted host. |
| Attempt unsupported page such as `chrome://extensions/` | Pass | Displayed the expected HTTP/HTTPS-only error without crashing the popup. |
| Generate PDF report | Pass | Downloaded a 37,095-byte PDF; none of the five raw fixture token values appeared in the file. |
| Configure and clear DeepSeek BYOK with explicit consent | Pass | Saved the fake key only after consent, sent seven redacted authenticated requests to the intercepted endpoint, generated a leak-free PDF, and cleared settings in the isolated profile. |
| Store package built without AI key | Pass | Artifact secret scanning found no DeepSeek-style key, environment file, or build-time AI secret. |

## Publication Boundary

Local implementation and release evidence are complete. Chrome Web Store account submission, reviewer feedback, staged rollout, and production telemetry remain operational steps outside this repository.
