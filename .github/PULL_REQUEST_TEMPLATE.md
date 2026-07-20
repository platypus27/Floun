## Summary

Describe the user-visible or contributor-visible change and why it is needed.

Closes #

## Verification

- [ ] I added or updated tests at an agreed public seam.
- [ ] `npm run release:check` passes from `floun/`.
- [ ] `npm run release:ready` passes when packaging or release behavior changed.
- [ ] `npm run qa:chrome:flows` passes when popup, scanning, reports, permissions, or storage changed.
- [ ] UI changes include current screenshots at the 400 px popup width.

## Safety and scope

- [ ] No secrets, API keys, credentials, raw user tokens, environment files, build output, or release ZIP files are included.
- [ ] Data handling, permissions, external services, and privacy documentation are updated where relevant.
- [ ] The change is focused and any known limitations are documented.
- [ ] I have read and followed `CONTRIBUTING.md` and the Code of Conduct.
