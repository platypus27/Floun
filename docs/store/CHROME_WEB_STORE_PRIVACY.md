# Chrome Web Store Privacy Field Copy

## Single Purpose

Floun provides lightweight, on-demand crypto-readiness and migration signal scanning for the active HTTP or HTTPS tab.

## Permission Justifications

`activeTab`: Used only after the user clicks Scan so Floun can inspect the currently active HTTP or HTTPS tab.

`scripting`: Used to inject the page collector into the active tab after a user-initiated scan. There is no always-on content script.

`storage`: Used for device-local extension storage of a user-owned DeepSeek API key and consent choice. The credential is not stored in Chrome Sync.

`https://api.ssllabs.com/*`: Used by the background service worker to request TLS and leaf-certificate signature metadata for the scanned hostname.

`https://api.deepseek.com/*`: Used by optional AI report drafting. It is contacted only after the user supplies their own DeepSeek API key and explicitly consents in AI Settings. The store package contains no API key.

## Data Use Disclosure

Floun processes the active tab URL locally to build scan target metadata, minimizing it to the tab origin before it is sent to the background worker. This removes paths, credentials, query strings, and fragments. Floun also processes the active tab hostname, visible page metadata, bounded same-origin script text, sanitized same-origin script locations, and bounded browser-visible token candidates that match local heuristics. Token evidence is redacted before display and omitted from AI prompts.

Floun sends the scanned hostname to SSL Labs for TLS and certificate metadata. If the user supplies a DeepSeek API key and explicitly consents, Floun sends redacted report findings to DeepSeek when the user generates a report. It does not sell user data, use it for advertising, or transfer raw token values to either service.

The user-owned DeepSeek API key is stored in device-local extension storage and can be replaced or removed from AI Settings. It persists across popup closes, browser restarts, and extension updates, but is cleared when Floun is uninstalled. Without both a key and consent, Floun uses local fallback report text and makes no DeepSeek request.

## Remote Code Declaration

Select: No, Floun does not execute remotely hosted code.

Explanation: Floun runs bundled extension code only. TLS and certificate services return data used by the scanner; those responses are not executed as code.

## Privacy Policy URL

Use the GitHub-hosted policy after this release-prep material is pushed:

`https://github.com/platypus27/Floun/blob/main/docs/store/PRIVACY_POLICY.md`
