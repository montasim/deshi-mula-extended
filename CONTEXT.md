# Deshi Mula Research Companion

This context defines the language for a browser extension that turns a Deshi Mula company reference into a concise, source-backed research workflow.

## Research

**Company Identity**:
The canonical company record anchored by a Deshi Mula company slug and enriched with verified destinations.
_Avoid_: Company name, employer result

**Research Panel**:
The single extension-owned drawer containing Brief, Stories, Jobs & salary, and Ask for the active Company Identity.
_Avoid_: Sidebar, popup, dashboard

**Published Snapshot**:
An immutable, locally validated release of curated records activated atomically for API reads.
_Avoid_: Dataset dump, cache version

**Research Source**:
A traceable origin supporting a company link, Story, Hiring Signal, Salary Evidence, or Generated Answer.
_Avoid_: Reference

## Evidence

**Story**:
A workplace experience published on Deshi Mula and associated with a Company Identity when resolvable.
_Avoid_: Review, post

**Hiring Signal**:
A sourced indication that a company is recruiting, carrying an observation date and availability state.
_Avoid_: Job guess, opening

**Salary Evidence**:
A sourced compensation disclosure or explicit absence of a numerical range.
_Avoid_: Salary estimate, salary fact

**Reported Work Arrangement**:
An unverified remote, onsite, hybrid, or flexible-work description derived from one or more Story or Comment excerpts.
_Avoid_: Work policy, company arrangement

**Reported Schedule**:
An unverified working-hours, workdays, overtime, or after-hours pattern derived from one or more Story or Comment excerpts.
_Avoid_: Office hours, official schedule

**Evidence Mention**:
A traceable Story or Comment excerpt that directly supports one derived work-arrangement or schedule signal.
_Avoid_: Proof, verified source

**Evidence Conflict**:
Two or more Evidence Mentions that report materially different arrangements or schedules for the same Company Identity.
_Avoid_: Incorrect data, extraction failure

**Evidence Confidence**:
A low, medium, or high measure based on the number, explicitness, recency, and agreement of Evidence Mentions; it never changes an unverified result into company policy.
_Avoid_: Accuracy, certainty

**Generated Answer**:
An AI-produced response grounded in retrieved Story excerpts and returned with citations.
_Avoid_: Search result, verified answer

## System

**Local Publishing Pipeline**:
The offline process that reads private dataset files, creates curated API documents, validates them, and publishes a Published Snapshot to MongoDB.
_Avoid_: Cloud scraper, sync job

**AI Provider Adapter**:
A server-side implementation of the provider-neutral generation contract.
_Avoid_: Gemini client, Groq helper

**Installation Token**:
An anonymous credential issued to one extension installation for quota enforcement.
_Avoid_: User account, API secret
