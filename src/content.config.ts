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

// Local review: under `astro dev` with a read token in .env, unpublished drafts show on localhost, so
// content can be checked before it goes live. Builds (CI has no token, and a build is never DEV) always
// read published content, so a draft can't reach the live site by accident.
const TOKEN = import.meta.env.DEV ? import.meta.env.SANITY_READ_TOKEN : undefined;

async function groq(query: string) {
  const res = await fetch(`${API}?perspective=${TOKEN ? 'drafts' : 'published'}&query=${encodeURIComponent(query)}`,
    TOKEN ? { headers: { Authorization: `Bearer ${TOKEN}` } } : undefined);
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
// Photo credit for licences that need one (Wikimedia CC BY-SA); Unsplash photos have none.
const CREDIT = '"credit": select(defined(image.asset->creditLine) => image.asset->{ "text": creditLine, "url": source.url })';
const credit = z.object({ text: z.string(), url: z.string().optional() }).optional();
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
      "image": image.${IMG}, "gallery": gallery[defined(asset)].${IMG}, highlights, groupSize, guideLanguages, maxAltitude, bestSeason,
      itinerary[]{ title, body, overnight, "image": image.${IMG},
        "places": (places[]->{ _type, title, excerpt, "slug": slug.current, "dest": destination->slug.current, "page": coalesce(page, false),
          "image": coalesce(image.${IMG}, destination->image.${IMG}) })[defined(slug)] },
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
      groupSize: z.string().optional(),
      guideLanguages: z.string().optional(),
      maxAltitude: z.string().optional(),
      bestSeason: z.string().optional(),
      itinerary: z
        .array(z.object({
          title: z.string(), image: z.string().optional(), body: z.string(), overnight: z.string().optional(),
          places: z.array(z.object({ _type: z.string(), title: z.string(), excerpt: z.string().optional(), slug: z.string(), dest: z.string().optional(), page: z.boolean(), image: z.string().optional() })).default([]),
        }))
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
    loader: sanity(`*[_type == "guide"]{ "id": slug.current, title, menuTitle, excerpt, "image": image.${IMG}, group, order, menu, updated, body, ${SEO} }`),
    schema: z.object({
      title: z.string(),
      menuTitle: z.string().nullish(),
      excerpt: z.string(),
      image: z.string(),
      group: z.enum(['Plan & Book', 'Entry & Visa', 'Money & Costs', 'On the Ground']),
      order: z.number().default(99),
      menu: z.enum(['bhutan', 'guide']).optional(),
      updated: z.coerce.date(),
      seo,
    }),
  }),
  destinations: defineCollection({
    loader: sanity(`*[_type == "destination"]{
      "id": slug.current, title, excerpt, "image": image.${IMG}, ${CREDIT}, body, highlights, region, altitude, bestTime, gettingThere, order,
      "tours": tours[]->slug.current, "nearby": nearby[]->slug.current, ${SEO} }`),
    schema: z.object({
      title: z.string(),
      excerpt: z.string(),
      image: z.string(),
      highlights: z.array(z.string()).default([]),
      credit,
      region: z.string().optional(),
      altitude: z.string().optional(),
      bestTime: z.string().optional(),
      gettingThere: z.string().optional(),
      order: z.number().default(99),
      tours: z.array(z.string()).default([]),
      nearby: z.array(z.string()).default([]),
      seo,
    }),
  }),
  // Sights inside a destination; id is "<destination>/<sight>", the page path under /destinations/.
  sights: defineCollection({
    loader: sanity(`*[_type == "sight" && defined(destination->slug.current)]{
      "id": destination->slug.current + "/" + slug.current, "destination": destination->slug.current, title, excerpt,
      "page": coalesce(page, false), "image": image.${IMG}, ${CREDIT}, body, altitude, timeNeeded, difficulty, bestTime, updated, order, ${SEO} }`),
    schema: z.object({
      destination: z.string(),
      title: z.string(),
      excerpt: z.string(),
      page: z.boolean(),
      image: z.string().optional(),
      credit,
      altitude: z.string().optional(),
      timeNeeded: z.string().optional(),
      difficulty: z.string().optional(),
      bestTime: z.string().optional(),
      updated: z.coerce.date().optional(),
      order: z.number().default(99),
      seo,
    }),
  }),
  // Team members for the About page.
  team: defineCollection({
    loader: sanity(`*[_type == "teamMember"]{ "id": _id, name, group, role, "photo": photo${BLOCK_IMG}, bio, languages, years, order }`),
    schema: z.object({
      name: z.string(),
      group: z.enum(['office', 'guide', 'driver']),
      role: z.string(),
      photo: z.object({ url: z.string(), hotspot: z.object({ x: z.number(), y: z.number() }).optional() }).passthrough().optional(),
      bio: z.string().optional(),
      languages: z.string().optional(),
      years: z.number().optional(),
      order: z.number().default(99),
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
        "tours": tours[]->slug.current,
        "person": person->{ name, role, "photo": photo${BLOCK_IMG} }
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
