# MulaLens

## Core language

**Company Identity**

The canonical company record anchored by a Deshi Mula company slug and enriched with official destinations.

**Research Panel**

The extension-owned drawer containing Brief, Stories, Jobs & salary, and Ask for the active Company Identity.

**Published Snapshot**

The dated dataset release represented by the b4join API.

**Story**

An unverified workplace experience published on Deshi Mula and associated with a Company Identity.

**Hiring Signal**

A sourced indication that a company is recruiting, including its observation date and availability state.

**Salary Evidence**

A sourced compensation disclosure or an explicit absence of a numerical range.

**Reported Work Setup**

An unverified work-mode or schedule description derived from Story or Comment excerpts. It is never presented as official company policy.

**Evidence Mention**

A traceable Story or Comment excerpt supporting a derived work-setup signal.

**Generated Answer**

An AI-produced response grounded in retrieved Story excerpts and returned with citations.

## System boundary

**b4join API**

The external service that owns search, company research, jobs, salary evidence, work-setup derivation, generated answers, storage, and provider configuration.

**Extension API Bridge**

The background service worker that sends typed requests to the b4join API so the page content script does not own backend credentials or configuration.
