## What’s new in v3.0.3

- Reduced Deshi Mula Extended to its current browser-extension boundary and removed its obsolete duplicate Netlify, MongoDB, and AI backend.
- Removed the unused snapshot publisher, provider test, visual harness, backend environment template, Deno lockfile, stale ADRs, generated Netlify cache, and redundant assets.
- Removed dead client contract fields, an unused identity property, and unused CSS selectors.
- Reduced Chrome host permissions to the development b4join API used by the current extension.
- Stopped shipping JavaScript source maps in the Chrome archive, cutting the unpacked release ZIP approximately in half.
- Updated architecture, privacy, project structure, and domain documentation to describe b4join as the external API owner.
- Preserved the static prototype and the extension’s independent, account-free workflow.

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
