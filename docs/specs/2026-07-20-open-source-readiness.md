# Floun Open-Source Readiness Specification

## Goal

Make Floun legally reusable, safe to contribute to, easy to evaluate, and maintainable as a public Kryv Labs project.

## Public repository contracts

1. The repository grants an OSI-compatible Apache-2.0 license for source code while reserving the Floun and Kryv Labs names and brand assets.
2. Contributors can find setup, test, commit, pull-request, conduct, support, governance, and security-reporting guidance from the repository root.
3. GitHub presents structured bug, feature, and cryptography-rule issue forms plus a pull-request checklist and ownership rules.
4. Pull requests run the existing release gate plus dependency review, secret scanning, and CodeQL with least-privilege workflow permissions.
5. Automated dependency updates cover npm and GitHub Actions.
6. The root README is the canonical public entry point with project status, screenshot, installation, architecture, limitations, contribution, security, and license links.
7. Obsolete public fixtures and completed agent-oriented planning material do not distract contributors from the supported fixture and current documentation.
8. The extension remains private on npm to prevent accidental publication, while package metadata identifies its license, repository, bugs, and supported Node version.

## Verification seams

- Repository contract tests read the same root files GitHub and contributors consume.
- `npm run release:check` remains the implementation quality gate.
- Workflow YAML is reviewed as source and validated by repository contracts.
- The final diff receives independent standards and specification reviews.
