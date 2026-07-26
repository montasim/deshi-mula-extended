import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const dist = join(root, 'dist');
const extension = join(dist, 'extension');
const site = join(dist, 'site');

await rm(dist, { recursive: true, force: true });
await mkdir(extension, { recursive: true });
await mkdir(site, { recursive: true });

await Promise.all([
  build({
    entryPoints: [join(root, 'extension/content.ts')],
    outfile: join(extension, 'content.js'),
    bundle: true,
    format: 'iife',
    target: 'chrome120',
    minify: true,
    sourcemap: true,
  }),
  build({
    entryPoints: [join(root, 'extension/background.ts')],
    outfile: join(extension, 'background.js'),
    bundle: true,
    format: 'esm',
    target: 'chrome120',
    minify: true,
    sourcemap: true,
  }),
]);

await Promise.all(
  ['manifest.json', 'styles.css', 'media/logo-16.png', 'media/logo-32.png', 'media/logo-48.png', 'media/logo-128.png'].map((name) =>
    cp(join(root, 'extension', name), join(extension, name)),
  ),
);

const privacy = await readFile(join(root, 'PRIVACY.md'), 'utf8');
const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Deshi Mula Research API</title>
<style>body{max-width:720px;margin:8vh auto;padding:24px;color:#183149;background:#f7fafb;font:16px/1.65 system-ui}h1,h2{font-family:Georgia,serif}code{background:#e9eef2;padding:2px 5px;border-radius:4px}pre{white-space:pre-wrap}</style></head>
<body><h1>Deshi Mula Research API</h1><p>This Netlify service supplies curated company research to the private Deshi Mula Extended browser extension.</p>
<p>Health: <a href="/api/health"><code>/api/health</code></a></p><h2>Privacy</h2><pre>${privacy
  .replace(/^# Privacy\s*/, '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')}</pre></body></html>`;
await writeFile(join(site, 'index.html'), page);
console.log('Built dist/extension and dist/site.');
