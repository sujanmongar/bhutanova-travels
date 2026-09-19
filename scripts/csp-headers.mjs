// Appends a Content-Security-Policy to dist/_headers, allow-listing every inline
// <script type="module"> Astro emitted (by exact-content hash) instead of using
// 'unsafe-inline' — so an injected <script> (e.g. stored XSS in CMS content)
// still gets blocked by the browser even if it slips past app-level escaping.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const hashes = new Set();

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.html')) scan(p);
  }
}

// script-src also gates type="speculationrules" (Chrome), unlike inert types such as ld+json.
function scan(file) {
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/<script type="(?:module|speculationrules)">([\s\S]*?)<\/script>/g)) {
    const hash = createHash('sha256').update(m[1]).digest('base64');
    hashes.add(`'sha256-${hash}'`);
  }
}

walk(DIST);

const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https://images.unsplash.com data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' mailto:", // add your form endpoint's origin here once SITE.formEndpoint is set
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const headersPath = join(DIST, '_headers');
const updated = readFileSync(headersPath, 'utf8').replace(
  /^\/\*\n/m,
  `/*\n  Content-Security-Policy: ${csp}\n`,
);
writeFileSync(headersPath, updated);
console.log(`csp-headers: allow-listed ${hashes.size} inline script hash(es)`);
