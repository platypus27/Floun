# Floun 3 Teal Redesign

## Goal

Ship Floun `3.0.0` as a complete visual and interaction redesign built with the published `@kryv/teal` design system while preserving the production-hardened scan, report, privacy, and persistent BYOK behavior from 2.1.

## Product requirements

- Replace every applicable hand-built popup control and surface with `@kryv/teal` components, including buttons, settings, fields, checkbox, alerts, cards, loading state, and result accordions.
- Establish a compact 400 px popup information hierarchy: brand and release identity, primary scan action, readiness summary, expandable evidence, warnings/errors, and report action.
- Replace the Floun logo and derived extension icons with a new cryptography-scanning brand mark.
- Replace the swimming loader with a polished scanning animation that respects reduced-motion preferences and uses the new mark with Teal loading semantics.
- Keep all scan, redaction, report-generation, saved-key, replacement-consent, removal, and failure behavior intact.
- Preserve semantic headings, visible focus, keyboard operation, status/alert announcements, and readable narrow-width layouts.
- Use published `@kryv/teal@0.3.0` so production installs are reproducible.

## Release requirements

- Set the package and manifest version to `3.0.0`.
- Generate canonical `floun-3.0.0.zip` and byte-identical `floun-3.0.zip` artifacts.
- Update active README, release checklist, store listing/reviewer guidance, release notes, QA evidence, scripts, and release-contract tests for v3.
- Preserve historical 2.x release records as historical documents.
- Verify the popup seam, packaged MV3 seam, and real Chrome scan/BYOK/report/removal seam.

## Out of scope

- Changing scan rules, transport providers, DeepSeek request contents, privacy boundaries, or extension permissions.
- Publishing or uploading the release.
