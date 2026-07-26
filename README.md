# Deshi Mula Extended

A Manifest V3 research companion based on the production prototype in [`prototype/`](./prototype/). It decodes confirmed company names and opens one focused Research Panel with Brief, Stories, Jobs & salary, and Ask.

## Architecture

- Chrome extension: thin API client and accessible Research Panel
- API: Netlify Functions
- Persistence: MongoDB Atlas only
- AI: server-side Gemini and Groq adapters
- Data publication: manual, local, validated, and snapshot-based

Raw scraped data is never packaged with the extension or deployed to Netlify.

## Setup

```bash
pnpm install
cp .env.example .env
pnpm check
```

The extension has no setup screen or onboarding flow. Research and readable
company names are always enabled, and the local build uses the fixed b4join API
at `http://localhost:3001/api/v1/extension`.

## Publish a snapshot

```bash
pnpm snapshot:check -- --dataset "/absolute/path/to/github-dataset-release"
pnpm publish:snapshot -- --dataset "/absolute/path/to/github-dataset-release"
```

The publisher reads normalized data only, validates company/story relationships, writes a new snapshot, and changes the active pointer last.

## Build

```bash
pnpm build
```

Load `dist/extension/` as an unpacked extension. Netlify publishes `dist/site/` and bundles functions from `netlify/functions/`.

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md), [`CONTEXT.md`](./CONTEXT.md), and [`PRIVACY.md`](./PRIVACY.md).
