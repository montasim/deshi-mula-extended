# Architecture

```text
deshimula.com
    │ company links
    ▼
Content script ──typed message──► Background API bridge
    │                                  │
    │ Research Panel                   │ HTTP
    ▼                                  ▼
Browser UI                         b4join API
```

The content script discovers canonical Deshi Mula company links, decodes confirmed names, and renders the Research Panel. The background service worker is the only extension component that calls the b4join API.

The b4join application owns company search, published snapshots, jobs, salary evidence, work-setup derivation, AI providers, persistence, and quotas. None of its backend implementation or raw dataset is duplicated in this repository.

The extension keeps one local preference: acceptance of the Ask retention disclosure. It has no account, setup, onboarding, or configurable API endpoint.
