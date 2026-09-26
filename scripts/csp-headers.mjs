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

// Inline scripts the browser runs need their hash in script-src. script-src also gates type="speculationrules"
// (Chrome); the JSON types are inert data. Any other inline script (e.g. an is:inline or define:vars one, which has
// no type) would run under astro dev, which sends no CSP, and be blocked on the live site, so the build stops instead.
const HASHED = new Set(['module', 'speculationrules']);
const INERT = new Set(['application/ld+json', 'application/json']);
const unhashable = [];

function scan(file) {
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/(?:^|\s)src=/.test(m[1])) continue;
    const type = (m[1].match(/(?:^|\s)type=["']?([^"'\s>]+)/)?.[1] ?? '').toLowerCase();
    if (HASHED.has(type)) hashes.add(`'sha256-${createHash('sha256').update(m[2]).digest('base64')}'`);
    else if (!INERT.has(type)) unhashable.push(`${file}: <script${m[1]}>`);
  }
}

walk(DIST);
if (unhashable.length) {
  console.error(`csp-headers: ${unhashable.length} inline script(s) the CSP would block in production. Use a plain <script> (Astro bundles it as a module) or type="module":\n  ${unhashable.slice(0, 10).join('\n  ')}`);
  process.exit(1);
}

const csp = [
  "default-src 'self'",
  `script-src 'self' https://static.cloudflareinsights.com ${[...hashes].join(' ')}`, // + Cloudflare Web Analytics beacon
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https://images.unsplash.com https://cdn.sanity.io data:",
  "font-src 'self'",
  "connect-src 'self' https://api.web3forms.com https://cloudflareinsights.com", // enquiry form (Form.astro); Web Analytics
  "frame-src https://www.google.com https://maps.google.com https://www.youtube-nocookie.com https://player.vimeo.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' mailto: https://api.web3forms.com https://web3forms.com", // no-JS post redirects to web3forms.com
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

// Cloudflare Pages rejects a header value over 2,000 characters; each distinct inline script adds ~53.
if (csp.length > 2000) {
  console.error(`csp-headers: the Content-Security-Policy is ${csp.length} characters (${hashes.size} hashes); Cloudflare Pages allows 2,000. Move some inline scripts into bundled ones.`);
  process.exit(1);
}

const headersPath = join(DIST, '_headers');
const updated = readFileSync(headersPath, 'utf8').replace(
  /^\/\*\n/m,
  `/*\n  Content-Security-Policy: ${csp}\n`,
);
writeFileSync(headersPath, updated);
console.log(`csp-headers: allow-listed ${hashes.size} inline script hash(es)`);
