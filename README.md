# Deshi Mula Extended Chrome Extension

This extension enhances the https://deshimula.com/ site by decoding leet-speak text, fetching company details, and adding interactive badges for website and social media links, as well as sentiment indicators based on user votes.

## Features

- **Leet-Speak Decoding**  
  Converts leet-speak text (e.g., `Techn0n3><T` to `Technonext`) in specified DOM elements using a predefined mapping of patterns.
- **Company Details Fetching**  
  Queries the Gemini Flash API to retrieve company details (website, LinkedIn, Facebook, GitHub, email) and adds corresponding links.
- **Interactive Badges**  
  Adds hover-activated badges for website and social media links, with a fallback DuckDuckGo search link if no website is found.
- **Sentiment Badges**  
  Displays Positive, Negative, or Mixed sentiment badges based on vote counts, initially hidden until hover.
- **Efficient DOM Traversal**  
  Recursively processes text nodes to preserve original styling while decoding leet-speak.

## Key Components

### Constants

- `LEET_CHARACTER_MAP`  
  A `Map<RegExp \| string, string>` to decode leet-speak characters (e.g., `8 → b`, `>< → x`).
- `SEARCH_ENGINE_URL`  
  Base URL for DuckDuckGo search (`https://duckduckgo.com/?q=`).
- `ICONS`  
  SVG icons for web, social media, email, search, and sentiment badges (Positive, Negative, Mixed).
- `SELECTORS_TO_DECODE`  
  CSS selectors targeting elements containing leet-speak text (e.g., `.company-name span`, `.post-title`).
- `GEMINI_FLASH_ENDPOINT`  
  Endpoint for Google Cloud’s Gemini Flash API to fetch company details.

### Functions

- `toSentenceCase(str: string): string`  
  Converts a string to sentence case.
- `toTitleCase(str: string): string`  
  Converts a string to title case.
- `decodeLeet(text: string, style: TCaseStyle): string`  
  Decodes leet-speak text and applies casing (`sentence`, `title`, `upper`).
- `walkTextNode(node: Node): void`  
  Recursively traverses DOM nodes, decoding text nodes in place.
- `decodeSelected(selectors: string | string[]): void`  
  Applies decoding to elements matching provided selectors.
- `getApiKey(): Promise<string>`  
  Retrieves the Gemini API key from Chrome storage.
- `fetchCompanyDetailsViaGemini(name: string): Promise<CompanyDetails>`  
  Fetches company details via Gemini API, returning a JSON object with website and social URLs.
- `isValidURL(string: string): boolean`  
  Validates whether a string is a well-formed URL.
- `addLinkElement(container: HTMLElement, url: string, iconSvg: string, label?: string, className?: string): void`  
  Appends a badge with an SVG icon and optional label to a container if the URL is valid.
- `insertCompanyWebsite(): void`  
  Decodes company names, fetches details, and adds hover-activated badges.
- `insertSentimentBadges(): void`  
  Adds sentiment badges based on vote counts.

## Usage

The script runs automatically on page load:

1. Decodes leet-speak in elements matching `SELECTORS_TO_DECODE`.
2. Enhances `.company-name` elements with decoded names and hover-activated badges for website and social links.
3. Adds sentiment badges to `.container.mt-5 > .row` elements based on vote counts.

### Example

- **Input:** `Techn0n3><T`
- **Output:** `Technonext` with badges linking to the company’s website, LinkedIn, etc., and a sentiment badge (e.g., Positive).

## Dependencies

- **Chrome Storage API**: For retrieving the Gemini API key.
- **Gemini Flash API**: For fetching company details.
- **Lucide Icons**: SVG icons used for badges.

## Notes

- Assumes a valid Gemini API key is stored in `chrome.storage.local`.
- Badges are hidden by default and shown on `mouseenter` events.
- If no company details are found, a DuckDuckGo search link or a “Research Manually” button is provided.
- Sentiment badges are computed from vote counts in `.fw-bold` elements within `.col-12` footers.  

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