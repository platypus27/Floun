# Floun 2.1 Persistent API Key

Status: approved for implementation on July 20, 2026.

Baseline: `2208359`.

## Objective

Let a user save a DeepSeek API key once per Chrome installation and reuse it across popup closes, browser restarts, and extension updates without syncing the secret between devices.

## Requirements

- Store the key and consent in `chrome.storage.local` under a versioned record.
- Automatically migrate the existing v1 popup `localStorage` record, deleting it only after the extension-storage write succeeds.
- Show only saved status and the final four key characters after setup. Do not repopulate the complete key into the settings form.
- Replacing the key requires explicit consent again. Removing it clears both key and consent.
- Load the complete credential only when generating a report. Missing storage, consent, or provider availability continues to use the local redacted report.
- Add the narrow `storage` permission and keep storage device-local. Uninstalling the extension clears it.
- Preserve version `2.1.0` and regenerate all release artifacts and evidence.

## Acceptance Seams

- Persisted settings API: save, status, load for report generation, remove, and safe v1 migration.
- Popup flow: initial loading, saved masked status, replace with fresh consent, and remove.
- Chrome flow: save, close and reopen the popup, use the persisted key, and remove it through the UI.
