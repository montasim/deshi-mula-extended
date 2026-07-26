# Deshi Mula Extended

A Manifest V3 research companion for [deshimula.com](https://deshimula.com/). It decodes confirmed company names and opens one focused panel with Brief, Stories, Jobs & salary, and cited Ask views.

## Boundary

- The extension discovers company identities and renders research beside Deshi Mula.
- The b4join API supplies company records, stories, jobs, salary evidence, work-setup signals, and generated answers.
- No account, settings page, onboarding flow, API key, or dataset is packaged with the extension.
- The current development build uses `http://localhost:3001/api/v1/extension`.

## Develop

```bash
pnpm install
pnpm check
```

Load `dist/extension/` as an unpacked Chrome extension, then reload any open deshimula.com tabs.

## Project structure

- `extension/` — content script, background API bridge, styles, manifest, and shipped icons
- `src/` — browser-side contracts and text helpers
- `tests/` — unit tests for browser-side helpers
- `prototype/` — retained static design reference
- `docs/` — current extension/API boundary

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md), [`CONTEXT.md`](./CONTEXT.md), and [`PRIVACY.md`](./PRIVACY.md).
