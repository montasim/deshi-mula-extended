# Deshi Mula Extended Chrome Extension

---

## Table of Contents

- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Usage](#usage)
- [Example](#example)
- [Dependencies](#dependencies)
- [Notes](#notes)
- [License](#license)

**Deshi Mula Extended** is a lightweight Chrome extension built exclusively for [deshimula.com](https://deshimula.com/). It enriches your browsing experience with AI-driven insights, decoded text, and quick-access metadata—right where you need it.

## Key Features

- **Leet-Speak Decoder**
  Detects and converts “leet” or stylized company names into plain text for easy reading.

- **Company Contact Badges**
  On hover, reveals icons linking to a company’s:

    - Official website
    - LinkedIn page
    - GitHub profile
    - Facebook page
    - Email address

- **AI-Powered Summaries & Sentiment**
  Gathers user comments and reviews, then presents concise English summaries alongside a sentiment score.

- **Multilingual Translation**
  Instantly translates summaries or reviews into your preferred language.

- **Salary Range Lookup**
  Displays current salary ranges for common roles at each company via a “Salary” badge.

- **Job Openings Snapshot**
  Aggregates live job postings (careers/jobs pages) into an easy-to-view modal.

- **Non-Intrusive & Secure**

    - Runs only on deshimula.com
    - Stores only minimal settings in Chrome’s local storage
    - No personal data is collected or shared

## How It Works

1. **Install & Activate**
   Add the extension to Chrome—scripts and styles inject automatically on deshimula.com.

2. **Hover & Explore**
   Move your cursor over a decoded company name to reveal contact and salary badges.

## Usage

The script runs automatically on page load:

1. Decodes leet-speak in elements matching `SELECTORS_TO_DECODE`.
2. Enhances `.company-name` elements with decoded names and hover-activated badges for website and social links.
3. Adds sentiment badges to `.container.mt-5 > .row` elements based on vote counts.
4. Analyzes comments under `#comments-section`, displaying a summary, sentiment, and translation (English or Bangla) above the section.

## Example

- **Input:** `Techn0n3><T`
- **Output:** `Technonext` with badges linking to the company’s website, LinkedIn, etc., and a sentiment badge (e.g., Positive).
- **Comment Analysis:** Summarizes comments, detects sentiment (e.g., Mixed), and translates the summary (e.g., from Bangla to English).

## Dependencies

- **Chrome Storage API**: For retrieving the Gemini API key.
- **Gemini Flash API**: For fetching company details, summarizing comments, classifying sentiment, and translating text.
- **Lucide Icons**: SVG icons used for badges.

## Notes

- Assumes a valid Gemini API key is stored in `chrome.storage.local`.
- Badges are hidden by default and shown on `mouseenter` events.
- If no company details are found, a DuckDuckGo search link button is provided.
- Comment and summary analysis detects the source language (English or Bangla) and translates to the opposite language.

## License

[![by-nc-nd/4.0](https://licensebuttons.net/l/by-nc-nd/4.0/88x31.png)](https://creativecommons.org/licenses/by-nc-nd/4.0/)

This project is licensed under the **Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)**.

### You are free to:

- **Share** — Copy and redistribute the material in any medium or format.

### Under the following terms:

- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
- **NonCommercial** — You may not use the material for commercial purposes.
- **NoDerivatives** — If you remix, transform, or build upon the material, you may not distribute the modified material.

For more details, please visit the [Creative Commons License Page](https://creativecommons.org/licenses/by-nc-nd/4.0/).
