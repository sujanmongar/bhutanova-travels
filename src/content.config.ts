import { defineCollection, reference } from 'astro:content';
import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import { toHTML } from '@portabletext/to-html';
import GithubSlugger from 'github-slugger';

// Content lives in Sanity (studio/). The dataset is public and only published documents are
// readable without a token, so the build needs no secrets.
const API = 'https://234ghw8x.api.sanity.io/v2025-02-19/data/query/production';

async function groq(query: string) {
  const res = await fetch(`${API}?perspective=published&query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Sanity query failed (${res.status}): ${await res.text()}`);
  // Sanity returns null for empty fields; dropping them lets zod defaults/optional apply.
  return JSON.parse(await res.text(), (_, v) => (v === null ? undefined : v)).result;
}

// Typographic quotes, as Astro's markdown did: it's → it’s, "x" → “x”. `prev` carries context across spans.
// ponytail: no decade/abbreviation rules ('90s becomes ‘90s); swap in retext-smartypants if that ever matters.
const curl = (s: string, prev = ' ') =>
  s.replace(/['"]/g, (q, i: number) => {
    const open = /[\s([{–—-]/.test(i ? s[i - 1] : prev);
    return q === '"' ? (open ? '“' : '”') : open ? '‘' : '’';
  });

// Portable Text → HTML, with h2/h3 ids from the same slugger Astro's markdown used, so TOC anchors don't change.
function renderBody(blocks: any[] = []) {
  for (const b of blocks) {
    let prev = ' ';
    for (const span of b.children ?? []) {
      span.text = curl(span.text ?? '', prev);
      prev = span.text.slice(-1) || prev;
    }
    for (const row of b.rows ?? []) row.cells = (row.cells ?? []).map((c: string) => curl(c ?? ''));
  }
  const slugger = new GithubSlugger();
  const headings: { depth: number; slug: string; text: string }[] = [];
  const heading = (depth: 2 | 3) => ({ children, value }: any) => {
    const text = value.children.map((c: any) => c.text).join('');
    const slug = slugger.slug(text);
    headings.push({ depth, slug, text });
    return `<h${depth} id="${slug}">${children}</h${depth}>`;
  };
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = toHTML(blocks, {
    components: {
      block: { h2: heading(2), h3: heading(3) },
      types: {
        table: ({ value }: any) => {
          const [head, ...rows] = value.rows ?? [];
          const tr = (r: any, tag: string) => `<tr>${(r.cells ?? []).map((c: string) => `<${tag}>${esc(c ?? '')}</${tag}>`).join('')}</tr>`;
          return `<table>${head ? `<thead>${tr(head, 'th')}</thead>` : ''}<tbody>${rows.map((r: any) => tr(r, 'td')).join('')}</tbody></table>`;
        },
      },
    },
  });
  return { html, metadata: { headings } };
}

function sanity(query: string): Loader {
  return {
    name: 'sanity',
    load: async ({ store, parseData, generateDigest }) => {
      store.clear();
      for (const item of await groq(query)) {
        const { id, body, ...rest } = item;
        store.set({ id, data: await parseData({ id, data: rest }), digest: generateDigest(item), rendered: renderBody(body) });
      }
    },
  };
}

const IMG = 'asset->url';
const SEO = `"seo": seo{ title, description, "image": image.${IMG}, noindex }`;
const seo = z.object({ title: z.string().optional(), description: z.string().optional(), image: z.string().optional(), noindex: z.boolean().optional() }).default({});

export const collections = {
  categories: defineCollection({
    loader: sanity(`*[_type == "category"]{ "id": slug.current, title, menuTitle, "image": image.${IMG}, excerpt, order, ${SEO} }`),
    schema: z.object({
      title: z.string(),
      menuTitle: z.string(),
      image: z.string(),
      excerpt: z.string(),
      order: z.number().default(99),
      seo,
    }),
  }),
  tours: defineCollection({
    loader: sanity(`*[_type == "tour"]{
      "id": slug.current, title, "category": category->slug.current, nights, days, route, price, priceNotes, summary,
      "image": image.${IMG}, "gallery": gallery[defined(asset)].${IMG}, highlights,
      itinerary[]{ title, body, overnight, "image": image.${IMG} },
      inclusions, exclusions, "map": map.${IMG}, featured, ${SEO} }`),
    schema: z.object({
      title: z.string(),
      category: reference('categories'),
      nights: z.number(),
      days: z.number(),
      route: z.array(z.string()),
      price: z.number(),
      priceNotes: z.array(z.string()).default([]),
      summary: z.string(),
      image: z.string(),
      gallery: z.array(z.string()).default([]),
      highlights: z.array(z.string()).default([]),
      itinerary: z
        .array(z.object({ title: z.string(), image: z.string().optional(), body: z.string(), overnight: z.string().optional() }))
        .default([]),
      inclusions: z.array(z.string()).default([]),
      exclusions: z.array(z.string()).default([]),
      map: z.string().optional(),
      featured: z.boolean().default(false),
      seo,
    }),
  }),
  blog: defineCollection({
    loader: sanity(`*[_type == "post"]{ "id": slug.current, title, excerpt, "image": image.${IMG}, date, author, tags, body, ${SEO} }`),
    schema: z.object({
      title: z.string(),
      excerpt: z.string(),
      image: z.string(),
      date: z.coerce.date(),
      author: z.string().default('Bhutanova Travels'),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      seo,
    }),
  }),
  guides: defineCollection({
    loader: sanity(`*[_type == "guide"]{ "id": slug.current, title, excerpt, "image": image.${IMG}, group, order, updated, body, ${SEO} }`),
    schema: z.object({
      title: z.string(),
      excerpt: z.string(),
      image: z.string(),
      group: z.enum(['Plan & Book', 'Entry & Visa', 'Money & Costs', 'On the Ground']),
      order: z.number().default(99),
      updated: z.coerce.date(),
      seo,
    }),
  }),
  faqs: defineCollection({
    loader: sanity(`*[_id == "faqs"]{ "id": _id, items[]{ q, a } }`),
    schema: z.object({ items: z.array(z.object({ q: z.string(), a: z.string() })).default([]) }),
  }),
  reviews: defineCollection({
    loader: sanity(`*[_id == "reviews"]{ "id": _id, sample, platforms[]{ name, rating, count, url }, items[]{ name, place, trip, source, rating, text } }`),
    schema: z.object({
      sample: z.boolean().default(true),
      platforms: z.array(z.object({ name: z.string(), rating: z.number(), count: z.number(), url: z.string() })).default([]),
      items: z
        .array(z.object({ name: z.string(), place: z.string(), trip: z.string().optional(), source: z.string().optional(), rating: z.number(), text: z.string() }))
        .default([]),
    }),
  }),
};
