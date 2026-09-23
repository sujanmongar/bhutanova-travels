import { defineCollection, reference } from 'astro:content';
import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import { ptHtml } from './pt';

// Content lives in Sanity (studio/). The dataset is public and only published documents are
// readable without a token, so the build needs no secrets.
const API = 'https://234ghw8x.api.sanity.io/v2025-02-19/data/query/production';

// An editor's crop becomes the CDN's rect=left,top,width,height (pixels), and the focal point is
// re-expressed inside the cropped area so object-position still lands on the subject.
function applyCrop({ url, crop, dims, hotspot, ...rest }: any) {
  const [l, t] = [crop?.left ?? 0, crop?.top ?? 0];
  const [w, h] = [1 - l - (crop?.right ?? 0), 1 - t - (crop?.bottom ?? 0)];
  if (!dims || (w > 0.999 && h > 0.999)) return { ...rest, url, hotspot };
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  const rect = [l * dims.width, t * dims.height, w * dims.width, h * dims.height].map(Math.round).join(',');
  return { ...rest, url: `${url}?rect=${rect}`, hotspot: hotspot && { x: clamp((hotspot.x - l) / w), y: clamp((hotspot.y - t) / h) } };
}

async function groq(query: string) {
  const res = await fetch(`${API}?perspective=published&query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Sanity query failed (${res.status}): ${await res.text()}`);
  // Sanity returns null for empty fields; dropping them lets zod defaults/optional apply.
  return JSON.parse(await res.text(), (_, v) => (v === null ? undefined : v?.url && v.dims ? applyCrop(v) : v)).result;
}

function sanity(query: string): Loader {
  return {
    name: 'sanity',
    load: async ({ store, parseData, generateDigest }) => {
      store.clear();
      for (const item of await groq(query)) {
        const { id, body, ...rest } = item;
        store.set({ id, data: await parseData({ id, data: rest }), digest: generateDigest(item), rendered: ptHtml(body) });
      }
    },
  };
}

const IMG = 'asset->url';
const BLOCK_IMG = '{ "url": asset->url, alt, hotspot, crop, "dims": asset->metadata.dimensions }';
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
    loader: sanity(`*[_type == "guide"]{ "id": slug.current, title, excerpt, "image": image.${IMG}, group, order, inMenu, updated, body, ${SEO} }`),
    schema: z.object({
      title: z.string(),
      excerpt: z.string(),
      image: z.string(),
      group: z.enum(['Plan & Book', 'Entry & Visa', 'Money & Costs', 'On the Ground']),
      order: z.number().default(99),
      inMenu: z.boolean().default(false),
      updated: z.coerce.date(),
      seo,
    }),
  }),
  // Page-builder pages: "home" is the homepage, everything else is served at /<slug>/.
  // Block images come back as { url, alt, hotspot } so components can honour the editor's focal point.
  pages: defineCollection({
    loader: sanity(`*[_type == "page"]{
      "id": select(_id == "home" => "home", slug.current), title, ${SEO},
      sections[]{
        ...,
        "image": image${BLOCK_IMG},
        rows[]{ ..., "image": image${BLOCK_IMG} },
        logos[]{ ..., "image": image{ "url": asset->url, alt } },
        "tours": tours[]->slug.current
      } }`),
    schema: z.object({
      title: z.string(),
      sections: z.array(z.object({ _type: z.string(), _key: z.string() }).passthrough()).default([]),
      seo,
    }),
  }),
  faqs: defineCollection({
    loader: sanity(`*[_id == "faqs"]{ "id": _id, items[]{ q, a } }`),
    schema: z.object({ items: z.array(z.object({ q: z.string(), a: z.string() })).default([]) }),
  }),
  reviews: defineCollection({
    loader: sanity(`*[_id == "reviews"]{ "id": _id, sample, platforms[]{ name, rating, count, url }, items[]{ name, place, trip, source, rating, text, "photo": photo${BLOCK_IMG} } }`),
    schema: z.object({
      sample: z.boolean().default(true),
      platforms: z.array(z.object({ name: z.string(), rating: z.number(), count: z.number(), url: z.string() })).default([]),
      items: z
        .array(z.object({
          name: z.string(), place: z.string(), trip: z.string().optional(), source: z.string().optional(), rating: z.number(), text: z.string(),
          photo: z.object({ url: z.string(), hotspot: z.object({ x: z.number(), y: z.number() }).passthrough().optional() }).passthrough().optional(),
        }))
        .default([]),
    }),
  }),
};
