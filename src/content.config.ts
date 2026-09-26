import { defineCollection, reference } from 'astro:content';
import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import { ptHtml } from './pt';
import { applyCrop, photoUrl, TOKEN } from './config';

// Content lives in Sanity (studio/). The dataset is public and only published documents are
// readable without a token, so the build needs no secrets.
const API = 'https://234ghw8x.api.sanity.io/v2025-02-19/data/query/production';

async function groq(query: string) {
  const res = await fetch(`${API}?perspective=${TOKEN ? 'drafts' : 'published'}&query=${encodeURIComponent(query)}`,
    TOKEN ? { headers: { Authorization: `Bearer ${TOKEN}` } } : undefined);
  if (!res.ok) throw new Error(`Sanity query failed (${res.status}): ${await res.text()}`);
  // Sanity returns null for empty fields; dropping them lets zod defaults/optional apply.
  return JSON.parse(await res.text(), (_, v) => (v === null ? undefined : v?._s ? photoUrl(v) : v?.url && v.dims ? applyCrop(v) : v)).result;
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

// Document photos (covers, cards, galleries) come back as one address string that carries the editor's crop (rect=) and
// focal point (fp-x/fp-y), so every img()/srcset() call keeps the subject in frame without knowing about Sanity.
const IMG = '{ "_s": true, "url": asset->url, hotspot, crop, "dims": asset->metadata.dimensions }';
const BLOCK_IMG = '{ "url": asset->url, alt, hotspot, crop, "dims": asset->metadata.dimensions }';
// Photo credit for licences that need one (Wikimedia CC BY-SA); Unsplash photos have none.
const CREDIT = '"credit": select(defined(image.credit) => { "text": image.credit }, defined(image.asset->creditLine) => image.asset->{ "text": creditLine, "url": source.url })';
const credit = z.object({ text: z.string(), url: z.string().optional() }).optional();
// Article bodies: resolve the rich blocks (photos with their credit line, side-by-side photos, tour cards) for pt.ts.
const PHOTO = '{ ..., "url": asset->url, "dims": asset->metadata.dimensions, "credit": select(defined(credit) => { "text": credit }, asset->{ "text": creditLine, "url": source.url }) }';
const BODY = `"body": body[]{ ...,
  _type == "photo" => ${PHOTO},
  _type == "gallery" => { ..., "images": images[]${PHOTO} },
  _type == "tourCard" => { "tour": tour->{ "id": slug.current, title, days, price, "category": category->slug.current, "image": image.asset->url } } }`;
const SEO = `"seo": seo{ title, description, "image": image${IMG}, noindex }`;
const seo = z.object({ title: z.string().optional(), description: z.string().optional(), image: z.string().optional(), noindex: z.boolean().optional() }).default({});

export const collections = {
  categories: defineCollection({
    loader: sanity(`*[_type == "category"]{ "id": slug.current, title, menuTitle, "image": image${IMG}, "alt": image.alt, excerpt, order, ${SEO} }`),
    schema: z.object({
      title: z.string(),
      menuTitle: z.string(),
      image: z.string(),
      alt: z.string().optional(),
      excerpt: z.string(),
      order: z.number().default(99),
      seo,
    }),
  }),
  tours: defineCollection({
    loader: sanity(`*[_type == "tour" && defined(category->slug.current)]{
      "id": slug.current, title, "category": category->slug.current, nights, days, route, price, priceNotes, summary,
      "image": image${IMG}, "alt": image.alt, "gallery": gallery[defined(asset)]${IMG}, "galleryAlt": gallery[defined(asset)].alt, highlights, groupSize, guideLanguages, maxAltitude, bestSeason, difficulty, faqs[]{ q, a },
      itinerary[]{ title, body, distance, overnight, "image": image${IMG}, "alt": image.alt,
        "places": (places[]->{ _type, title, excerpt, "slug": slug.current, "dest": destination->slug.current,
          "image": coalesce(image${IMG}, destination->image${IMG}) })[defined(slug)] },
      inclusions, exclusions, "map": map${IMG}, featured, popularity, festivalDates[]{ name, start, end }, ${SEO} }`),
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
      alt: z.string().optional(),
      gallery: z.array(z.string()).default([]),
      galleryAlt: z.array(z.string().optional()).default([]),
      highlights: z.array(z.string()).default([]),
      groupSize: z.string().optional(),
      guideLanguages: z.string().optional(),
      maxAltitude: z.string().optional(),
      bestSeason: z.string().optional(),
      difficulty: z.string().optional(),
      faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
      itinerary: z
        .array(z.object({
          title: z.string(), image: z.string().optional(), alt: z.string().optional(), body: z.string(), distance: z.string().optional(), overnight: z.string().optional(),
          places: z.array(z.object({ _type: z.string(), title: z.string(), excerpt: z.string().optional(), slug: z.string(), dest: z.string().optional(), image: z.string().optional() })).default([]),
        }))
        .default([]),
      inclusions: z.array(z.string()).default([]),
      exclusions: z.array(z.string()).default([]),
      map: z.string().optional(),
      featured: z.boolean().default(false),
      popularity: z.number().default(99),
      festivalDates: z.array(z.object({ name: z.string(), start: z.string(), end: z.string() })).default([]),
      seo,
    }),
  }),
  blog: defineCollection({
    loader: sanity(`*[_type == "post"]{ "id": slug.current, title, excerpt, "image": image${IMG}, "alt": image.alt, date, author, tags, ${BODY}, ${SEO} }`),
    schema: z.object({
      title: z.string(),
      excerpt: z.string(),
      image: z.string(),
      alt: z.string().optional(),
      date: z.coerce.date(),
      author: z.string().default('Bhutanova Travels'),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      seo,
    }),
  }),
  guides: defineCollection({
    loader: sanity(`*[_type == "guide"]{ "id": slug.current, title, menuTitle, excerpt, "image": image${IMG}, "alt": image.alt, group, order, menu, updated, ${BODY}, ${SEO} }`),
    schema: z.object({
      title: z.string(),
      menuTitle: z.string().nullish(),
      excerpt: z.string(),
      image: z.string(),
      alt: z.string().optional(),
      group: z.enum(['Plan & Book', 'Entry & Visa', 'Money & Costs', 'On the Ground']),
      order: z.number().default(99),
      menu: z.enum(['bhutan', 'guide']).optional(),
      updated: z.coerce.date(),
      seo,
    }),
  }),
  destinations: defineCollection({
    loader: sanity(`*[_type == "destination"]{
      "id": slug.current, title, excerpt, "image": image${IMG}, "alt": image.alt, ${CREDIT}, ${BODY}, highlights, region, altitude, bestTime, gettingThere, order,
      "tours": tours[defined(@->slug.current)]->slug.current, "nearby": nearby[defined(@->slug.current)]->slug.current, ${SEO} }`),
    schema: z.object({
      title: z.string(),
      excerpt: z.string(),
      image: z.string(),
      alt: z.string().optional(),
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
      "image": image${IMG}, "alt": coalesce(image.alt, destination->image.alt), ${CREDIT}, ${BODY}, altitude, timeNeeded, openingHours, entryFee, difficulty, bestTime, highlights, updated, order, ${SEO} }`),
    schema: z.object({
      destination: z.string(),
      title: z.string(),
      excerpt: z.string(),
      image: z.string().optional(),
      alt: z.string().optional(),
      credit,
      altitude: z.string().optional(),
      timeNeeded: z.string().optional(),
      openingHours: z.string().optional(),
      entryFee: z.string().optional(),
      highlights: z.array(z.string()).default([]),
      difficulty: z.string().optional(),
      bestTime: z.string().optional(),
      updated: z.coerce.date().optional(),
      order: z.number().default(99),
      seo,
    }),
  }),
  // Team members for the About page.
  team: defineCollection({
    loader: sanity(`*[_type == "teamMember"]{ "id": _id, name, group, role, "photo": photo${BLOCK_IMG}, bio, languages, years, order, placeholder }`),
    schema: z.object({
      name: z.string(),
      group: z.enum(['office', 'guide', 'driver']),
      role: z.string(),
      photo: z.object({ url: z.string(), hotspot: z.object({ x: z.number(), y: z.number() }).optional() }).passthrough().optional(),
      bio: z.string().optional(),
      languages: z.string().optional(),
      years: z.number().optional(),
      order: z.number().default(99),
      placeholder: z.boolean().nullish(),  // a sample profile (see Team.astro)
    }),
  }),
  // Page-builder pages: "home" is the homepage, everything else is served at /<slug>/.
  // Block images come back as { url, alt, hotspot } so components can honour the editor's focal point.
  pages: defineCollection({
    loader: sanity(`*[_type == "page"]{
      "id": select(_id == "home" => "home", slug.current), title, ${SEO},
      sections[]{
        ...,
        _type == "richText" => { ${BODY} },
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
