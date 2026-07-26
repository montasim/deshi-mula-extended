## What’s new in v3.0.2

- Rebuilt Deshi Mula Extended as a clean, source-backed company research companion for deshimula.com.
- Added a focused panel with Brief, Stories, Jobs & salary, and cited Ask views.
- Added readable company-name decoding and dataset-backed matching for company aliases, websites, and LinkedIn destinations.
- Added published-experience filters for positive, mixed, and negative stories.
- Added unverified derived work-setup evidence for reported work mode and schedules, with clear confidence and verification boundaries.
- Added live job and salary context supplied through the b4join research API.
- Added direct SupportKori support and b4join handoff links.
- Removed extension settings, onboarding, account requirements, and packaged raw data; the extension works independently as an API client.
- Unified the panel and Chrome toolbar branding with the b4join app logo.

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

Chrome loads Deshi Mula Extended from the extracted folder, so do not delete that folder while the extension is installed. GitHub installations do not update automatically; download, verify, and load each newer release when one becomes available.
