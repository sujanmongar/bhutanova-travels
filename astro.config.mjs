import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Pages ticked "Hide this page from search engines" in Sanity get noindex AND stay out of the sitemap.
// Same addresses as the site builds (tours: /bhutan-tours/<theme>/<days>-days-<slug>/, sights: /destinations/<place>/<slug>/)
const path = (d) => ({
  page: `/${d.slug}/`, category: `/bhutan-tours/${d.slug}/`, post: `/blog/${d.slug}/`, guide: `/travel-guide/${d.slug}/`,
  destination: `/destinations/${d.slug}/`, tour: `/bhutan-tours/${d.cat}/${d.days}-days-${d.slug}/`, sight: `/destinations/${d.dest}/${d.slug}/`,
})[d._type];
const query = '*[seo.noindex == true || (_type == "sight" && count(coalesce(body, [])) == 0)]{ _id, _type, "slug": slug.current, days, "cat": category->slug.current, "dest": destination->slug.current }';
const res = await fetch(`https://234ghw8x.api.sanity.io/v2025-02-19/data/query/production?perspective=published&query=${encodeURIComponent(query)}`);
if (!res.ok) throw new Error(`Sanity query failed (${res.status})`);
const hidden = new Set([
  ...(await res.json()).result.map((d) => (d._id === 'home' ? '/' : path(d))),
  // Pages that set noindex in code (the integration already leaves 404 out)
  '/search/', '/styleguide/', '/cancellation-policy/',
]);

export default defineConfig({
  site: 'https://bhutanova-travels.pages.dev',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  integrations: [sitemap({ filter: (page) => !hidden.has(new URL(page).pathname) })],
  build: { inlineStylesheets: 'auto' },
});
