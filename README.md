# Floun - Crypto-Readiness Signal Scanner

![Floun Logo](floun/public/icons/floun.png)

Floun is a lightweight Chrome extension that scans the active website for cryptographic readiness signals, highlights migration review items and known weak crypto, and generates a redacted PDF report for quantum-safe cryptography planning.

Floun 3 uses the Kryv Labs `@kryv/teal` design system for its complete popup experience, from scan controls and readiness cards to accessible settings and evidence accordions.

## Features

- Scans active tabs for JavaScript cryptography patterns, session-token signals, TLS cipher suites, and certificate signature algorithms.
- Summarizes findings as safe, review, vulnerable, or informational.
- Generates PDF reports with redacted findings.
- Supports optional DeepSeek-drafted report sections through a user-owned API key and explicit in-product consent.

## Development

The extension app lives in `floun/`.

```bash
cd floun
npm install
npm run release:check
```

The built extension is emitted to `floun/build/`.

To package a local release candidate:

```bash
cd floun
npm run package:extension
```

The zip artifacts are emitted to `floun/release/floun-3.0.0.zip` and `floun/release/floun-3.0.zip`.

To verify release and Chrome Web Store prep together:

```bash
cd floun
npm run release:ready
```

For optional automated extension-load QA, use a browser that supports command-line unpacked extension loading:

```bash
cd floun
npm run qa:extension:load
```

If branded Google Chrome reports that extension-load flags are not allowed, point `FLOUN_CHROME_BIN` at Chrome for Testing or Chromium, or complete the manual `chrome://extensions` load.

To run the full Chrome for Testing popup-flow QA pass:

```bash
cd floun
npm run qa:chrome:flows
```

This drives the extension action on tab targets, scans the local fixture, scans a known HTTPS page, scans an HTTP page, checks unsupported-page handling, downloads a PDF report, and verifies raw fixture tokens are absent from the PDF bytes.

## Optional DeepSeek Report Text

PDF reports work without an AI key by using local fallback text. To enable DeepSeek-drafted sections, open **AI drafting** in the extension, enter your own DeepSeek API key once, review the disclosure, and explicitly consent. The key is saved in device-local extension storage across popup closes, browser restarts, and extension updates. It is not synced between devices and can be replaced or removed from the same dialog.

## Manual Installation

1. Run `npm run build` from `floun/`.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable Developer Mode.
4. Click Load unpacked and select `floun/build/`.

For release QA, serve the local fixture from `floun/`:

```bash
npm run fixture:server
```

Then scan `http://127.0.0.1:4174/crypto-readiness.html`.

## Privacy

Floun stores scan data locally in the browser extension flow. If the user enables DeepSeek drafting and consents, redacted report findings are sent to DeepSeek. Raw tokens are not included in generated prompts or report appendices.

## Roadmap

- Add more adapter-level tests around the TypeScript background service worker.
- Add deeper integration tests for Chrome message flows.
- Expand the cryptography rule catalogue as standards and browser support evolve.

## Contact

For questions, feedback, or support: [ngaoyu27@gmail.com](mailto:ngaoyu27@gmail.com)
