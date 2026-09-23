import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Pages ticked "Hide this page from search engines" in Sanity get noindex AND stay out of the sitemap.
const PATH = { page: '/', tour: '/bhutan-tours/', category: '/bhutan-tours/', post: '/blog/', guide: '/travel-guide/', destination: '/destinations/' };
const query = '*[seo.noindex == true]{ _id, _type, "slug": slug.current }';
const res = await fetch(`https://234ghw8x.api.sanity.io/v2025-02-19/data/query/production?perspective=published&query=${encodeURIComponent(query)}`);
if (!res.ok) throw new Error(`Sanity query failed (${res.status})`);
const hidden = new Set((await res.json()).result.map((d) => (d._id === 'home' ? '/' : `${PATH[d._type]}${d.slug}/`)));

export default defineConfig({
  site: 'https://bhutanova-travels.pages.dev',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  integrations: [sitemap({ filter: (page) => !hidden.has(new URL(page).pathname) })],
  build: { inlineStylesheets: 'auto' },
});
