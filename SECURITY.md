# Security Policy

## Supported versions

Security reports are accepted for the current `main` branch and every version explicitly marked as supported below. Before 3.0.0 is published, fixes target `main` and the current 3.0.0 release candidate.

| Version                 | Supported           |
| ----------------------- | ------------------- |
| 3.0.0 release candidate | Pre-release support |
| 2.x                     | No                  |
| 1.x                     | No                  |

## Reporting a vulnerability

Please do not report security vulnerabilities through a public issue, discussion, or pull request.

Send a private report to [ngaoyu27@gmail.com](mailto:ngaoyu27@gmail.com) with the subject `Floun security report`. Include:

- A description of the issue and its potential impact.
- Reproduction steps or a minimal proof of concept.
- Affected Floun and Chrome versions.
- Whether page data, token evidence, extension storage, permissions, reports, or API-key handling are involved.
- Any suggested mitigation or disclosure constraints.

Do not include real API keys, credentials, raw user tokens, or data from systems you are not authorized to test.

Maintainers will acknowledge a complete report within five business days, provide an initial assessment within ten business days, and coordinate remediation and disclosure in good faith. Timelines may change based on severity and complexity, but reporters will receive status updates.

## Safe harbor

Kryv Labs supports good-faith security research performed within applicable law and this policy. Avoid privacy violations, service disruption, destructive testing, social engineering, and accessing more data than necessary to demonstrate the issue. Give maintainers a reasonable opportunity to remediate before public disclosure.
