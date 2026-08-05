## What’s new in v3.0.6

- Reworked the company panel around three self-explanatory views: **Insights**, **Pay & roles**, and **Stories**.
- Put company-specific culture signals, reported work setup, salary evidence, and personalized research questions in a clearer evidence-first hierarchy.
- Removed repeated summary content and moved cited Ask into the relevant question flow.
- Added compact sentiment and salary visualizations without hiding the underlying story counts or source boundaries.
- Improved keyboard and screen-reader behavior for tabs, questions, source links, and panel controls.
- Fixed masked company-name decoding for names such as `Expre$s Le@ther Products Ltd`, including ambiguous masks resolved from the canonical company slug.
- Refined the extension description, action title, loading states, and production evidence status language.

The release keeps the existing minimal permissions: Chrome storage and access only to the production b4join API host.

## Install in Chrome

1. Download the Chrome ZIP and `SHA256SUMS.txt` attached to this release.
2. Place both files in the same folder and verify the archive:

   ```bash
   sha256sum --check SHA256SUMS.txt
   ```

3. Extract the ZIP to a permanent folder.
4. Open `chrome://extensions` in Chrome 120 or later.
5. Enable **Developer mode**.
6. Select **Load unpacked** and choose the extracted folder containing `manifest.json`.
7. Reload any deshimula.com tabs that were already open.

Chrome loads MulaLens from the extracted folder, so do not delete that folder while the extension is installed. GitHub installations do not update automatically; download, verify, and load each newer release when one becomes available.
