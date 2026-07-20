# Floun 3.0.0 Release Notes

Status: production release candidate under local verification. It has not been tagged, uploaded, or published.

## Release Theme

Floun 3 rebuilds the complete extension experience with the Kryv Labs Teal design system while preserving the hardened scan, privacy, report, and device-local BYOK behavior from 2.1.

## Highlights

- Replaced hand-built popup controls and surfaces with published `@kryv/teal@0.3.0` components.
- Introduced a compact 400 px scan workspace with a clearer primary action, readiness state, status badges, warnings, expandable evidence, and report action.
- Added a new Floun cryptography-scanning brand mark and regenerated the extension icons.
- Replaced the swimming loader with a branded radar animation that respects reduced-motion preferences.
- Moved AI drafting into an accessible Teal dialog with Teal fields, checkbox semantics, alerts, saved-key card, replacement flow, and removal action.
- Preserved on-demand active-tab scanning, SSL Labs transport evidence, redacted PDF generation, DeepSeek consent, device-local key persistence, and deletion hardening.

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

The canonical artifact is `floun/release/floun-3.0.0.zip`; `floun/release/floun-3.0.zip` is a byte-identical alias. Exact hashes, archive entries, and Chrome-flow evidence are recorded in `docs/release/3.0.0/QA_EVIDENCE.md`.

## Publication Boundary

Tagging, Chrome Web Store upload, reviewer approval, rollout, and post-release monitoring are separate operational actions.
