# Architecture

```text
private dataset + web enrichment
          │
          ▼
Local Publishing Pipeline ──validate──► MongoDB Published Snapshot
                                             ▲
                                             │
Deshi Mula page ◄── Manifest V3 extension ──► Netlify Functions
                                             │
                                      AI Provider Registry
                                      ├─ Gemini adapter
                                      └─ Groq adapter
```

The browser extension discovers company slugs from Deshi Mula links and delegates all research data to the API. Netlify Functions resolve the active snapshot, query MongoDB, enforce anonymous installation quotas, retrieve private Story excerpts, and call the configured AI adapters.

## MongoDB collections

- `snapshot_metadata`: active snapshot pointer and validated counts
- `companies`: curated company metrics, links, themes, and search aliases
- `stories_public`: user-facing Story metadata and excerpts
- `stories_private`: complete normalized Story text for server retrieval
- `hiring_signals`: sourced jobs and salary disclosures
- `installations`: hashed Installation Tokens and status
- `ai_usage`: per-installation daily request counters
- `ai_requests`: complete, indefinitely retained AI execution records

Every dataset-owned document includes `snapshotVersion`. Publishing writes a new version first, validates it, then updates the active pointer.
