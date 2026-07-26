# Privacy

This initial release is intended for personal use.

The extension sends a Deshi Mula company slug, explicit searches, and explicit Ask questions to the configured Netlify API over HTTPS. Ask requests may include the raw question, retrieved Story excerpts, and generated response. The API stores complete AI request records indefinitely in MongoDB under a pseudonymous installation hash. It does not intentionally store IP addresses or the raw Installation Token.

Gemini or Groq receives the question and the minimum retrieved excerpts needed to produce a cited answer. Provider choice and credentials are controlled by the API operator.

Raw scraped HTML and private dataset release files are processed locally and are not served by the API.

This policy must be reviewed before distributing the extension publicly.
