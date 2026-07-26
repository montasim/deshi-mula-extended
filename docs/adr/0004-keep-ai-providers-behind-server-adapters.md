---
status: accepted
date: 2026-07-24
---

# Keep AI providers behind server adapters

Generated Answers use a provider-neutral server contract and configurable registry. Gemini and Groq are the initial adapters; keys, models, order, timeouts, and fallback remain server-side so the extension and public API contract do not change when a provider changes.
