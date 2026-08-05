# Extension UI prototype

This is the standalone extension-interface concept for Deshi Mula Extended.

## Run

Open `index.html` directly in a browser. No build step or API key is required.

Useful direct states:

- `index.html?company=technonext`
- `index.html?company=optimizely&view=stories`
- `index.html?company=technonext&view=jobs`
- `index.html?company=therap&view=ask`
- `index.html?company=technonext&view=ask&answer=true`

## Simple workflow

1. Select **Research** beside a company.
2. Read the evidence brief.
3. Browse supporting stories, check sourced hiring, or ask one cited question.

## Design decisions

- The host page receives one compact Research trigger.
- The drawer uses four plain-language destinations: Brief, Stories, Jobs &
  salary, and Ask.
- A slim left rail identifies native and snapshot evidence.
- Official website, LinkedIn, hiring source, age, and salary disclosure are
  labeled separately.
- Jobs and compensation shown for TechnoNext are a sourced snapshot checked on
  July 24, 2026; generated salary ranges are intentionally excluded.
- AI remains an explicit action and every answer retains source citations.
- Company comparisons, watchlists, settings, and notifications are intentionally
  omitted from this prototype to keep the core workflow focused.

All content is static demonstration data based on the private dataset snapshot.
Generated answers are simulated.
