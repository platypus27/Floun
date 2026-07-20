# Floun Privacy Policy

Effective date: July 20, 2026

Floun is a lightweight Chrome extension for crypto-readiness and migration signal scanning. It runs on demand when the user clicks Scan.

## Data Floun Processes

Floun may process the active tab URL locally to build scan target metadata. Target URL metadata is minimized to the tab origin before it is sent to the background worker, removing paths, credentials, query strings, and fragments. Floun may also process the active tab hostname, page metadata, bounded same-origin JavaScript text, sanitized same-origin script locations, TLS metadata, certificate metadata, and bounded browser-visible token candidates that match local session-token heuristics.

Token findings are redacted before being displayed in reports. Floun does not intentionally collect passwords, payment information, personal communications, browsing history, or files from the user's device.

## Network Requests

Floun sends the scanned hostname to SSL Labs to retrieve TLS and leaf-certificate signature metadata. These requests are limited to the explicit host permission in the extension manifest.

If the user supplies their own DeepSeek API key and explicitly consents in AI Settings, Floun sends redacted report findings to DeepSeek V4 Flash at `https://api.deepseek.com` when the user generates a report. Raw token evidence is omitted from those requests.

The Chrome Web Store package contains no API key. Without both a user-owned key and consent, Floun uses local fallback report text and makes no request to DeepSeek.

## Storage and Retention

Floun keeps scan results in the extension popup flow while the user is using it. Generated PDF reports are saved only when the user chooses to create them. A user-owned DeepSeek API key and consent choice are stored in the extension's local browser storage until the user removes them in AI Settings or clears the extension's data.

Floun does not sell user data, use it for advertising, or share raw token values with third parties.

## Permissions

Floun uses `activeTab` and `scripting` for user-initiated scans of the active tab. It uses explicit host permissions for SSL Labs transport metadata lookups and optional, consented DeepSeek report drafting.

Floun does not request `<all_urls>`, `file://`, cookies, browsing history, or always-on content-script permissions.

## Chrome Web Store Limited Use

Floun's use and transfer of user data complies with the Chrome Web Store User Data Policy, including its Limited Use requirements.

Floun uses user data only to provide its disclosed crypto-readiness scan and optional report-drafting features. It does not use or transfer user data for advertising, credit decisions, data brokerage, or unrelated purposes, and it does not permit humans to read the data except where required by law or security obligations.

## Contact

Questions or privacy requests can be sent to `ngaoyu27@gmail.com`.
