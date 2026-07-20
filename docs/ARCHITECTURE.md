# Architecture

Floun is a Chrome Manifest V3 extension designed around explicit user action, bounded collection, typed messages, local analysis, and redacted reporting.

## Runtime flow

```text
Popup action
  -> scan client validates and minimizes the active-tab target
  -> background orchestrator runs page and transport adapters
  -> scan payload returns with adapter status and warnings
  -> analysis module registry produces explainable findings
  -> popup renders summaries and expandable evidence
  -> report generator redacts findings before PDF output
  -> optional DeepSeek drafting runs only with a saved key and consent
```

## Module boundaries

### Popup

- `floun/src/App.tsx` owns user-visible scan, results, report, and AI-drafting flows.
- `floun/src/App.css` applies the 400 px Teal-based extension layout and reduced-motion behavior.
- The popup does not scan automatically and does not receive a raw saved API key during status-only loading.

### Scan protocol

- `floun/src/extension/scanProtocol.ts` defines and validates minimized scan targets.
- `floun/src/extension/scanClient.ts` coordinates popup requests and typed responses.
- URLs sent to the background boundary exclude credentials, paths, queries, and fragments.

### Background service worker

- `floun/src/extension/background/index.ts` registers the Manifest V3 worker.
- `orchestrator.ts` coordinates independent page and transport adapters.
- `pageCollector.ts` collects bounded, browser-visible evidence after an explicit scan.
- `transportScanAdapter.ts` requests SSL Labs TLS and leaf-certificate metadata.
- Adapter failures are represented as status and warnings so partial results remain explainable.

### Analysis

- `analysisModules.ts` is the registry for JavaScript, token, TLS, and certificate analysis.
- Findings use a shared domain shape with severity, confidence, rationale, limitations, recommendations, references, and redaction metadata.
- Cryptography classifications should be supported by authoritative references and tested with synthetic fixtures.

### Reporting and optional AI drafting

- Report serializers provide a single redacted representation for local PDF and optional AI drafting.
- Raw browser token values are never included in report prompts or appendices.
- DeepSeek drafting is disabled unless a user supplies a key and explicitly consents.
- The key persists in `chrome.storage.local`, is not synced, and can be replaced or removed through the popup.

## Extension permissions

- `activeTab` grants temporary access only after user interaction.
- `scripting` injects the bounded collector after a requested scan.
- `storage` persists device-local report-drafting configuration.
- Host permissions are limited to SSL Labs and DeepSeek API endpoints.
- There is no broad `<all_urls>` permission and no always-on content script.

## Verification strategy

- Unit tests cover rules, redaction, protocols, adapters, persistence, reports, and manifest contracts.
- Repository contract tests cover public contributor and release surfaces.
- Packaging checks validate exact artifact contents, permissions, references, secrets, and determinism.
- Chrome QA drives the real popup against HTTP, HTTPS, unsupported-page, PDF, and BYOK flows.
