# Floun 2.1 Production Readiness

Status: approved for implementation on July 20, 2026.

Baseline: `d1d7a21fef6d11c1cef4e4b4fe2be4a8e311f91d`.

## Objective

Produce a Chrome Web Store-ready Floun 2.1 release candidate whose advertised capabilities work in the shipped extension, whose user-data behavior is explicit and consented, and whose release evidence is reproducible from a clean checkout.

## Public seams

### Chrome popup end-to-end flow

- A user can scan supported HTTP and HTTPS tabs.
- A known HTTPS target must return usable TLS and certificate findings. Rendering empty sections or accepting an unavailable certificate provider is not sufficient.
- Unsupported pages fail clearly.
- PDF generation works without an AI key and excludes raw token evidence.

### DeepSeek bring-your-own-key flow

- A user can configure and remove their own DeepSeek API key from the extension UI.
- Floun obtains explicit consent before sending redacted report content to DeepSeek.
- No developer or user API key is embedded in the store artifact.
- Without a configured key and consent, report generation uses local fallback content and makes no DeepSeek request.

### Cross-platform release CLI

- Tests, build, typecheck, lint, dependency audit, worker validation, packaging, artifact validation, determinism checks, store checks, and publish-readiness checks run on supported development and CI hosts without requiring Windows PowerShell.
- Artifact names and evidence paths derive from the current manifest version.
- A clean checkout can reproduce the release candidate artifact.

### Chrome Web Store contract

- Manifest permissions are the narrowest required by shipped functionality.
- Listing, privacy disclosures, screenshots, reviewer instructions, release notes, and QA evidence describe the shipped 2.1 behavior and artifact names accurately.
- Chrome Web Store Limited Use language and user-data disclosures are present.
- Publication remains blocked until all required automated and manual evidence rows pass with concrete evidence.

## Release boundary

This work creates and verifies a local release candidate and commit. It does not tag, upload, or publish the extension to the Chrome Web Store.
