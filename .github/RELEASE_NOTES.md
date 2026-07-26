## What’s new in v3.0.4

- Switched the extension API bridge from localhost to the production b4join API at `https://b4joinacompany.netlify.app/api/v1/extension`.
- Updated the extension’s b4join footer link to open the production application.
- Reduced Chrome host access to the production b4join Netlify domain.
- Replaced the localhost-specific connection error with a production-safe availability message.
- Updated project documentation to identify the deployed API endpoint.

The production health endpoint was verified before release and returned the active dataset snapshot.

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
