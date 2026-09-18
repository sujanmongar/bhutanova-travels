import { defineCollection, reference } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const md = (dir: string) => glob({ pattern: '**/*.md', base: `./src/content/${dir}` });

export const collections = {
  categories: defineCollection({
    loader: md('categories'),
    schema: z.object({
      title: z.string(),
      menuTitle: z.string(),
      image: z.string(),
      excerpt: z.string(),
      order: z.number().default(99),
    }),
  }),
  tours: defineCollection({
    loader: md('tours'),
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
    }),
  }),
  blog: defineCollection({
    loader: md('blog'),
    schema: z.object({
      title: z.string(),
      excerpt: z.string(),
      image: z.string(),
      date: z.coerce.date(),
      author: z.string().default('Bhutanova Travels'),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
    }),
  }),
  guides: defineCollection({
    loader: md('guides'),
    schema: z.object({
      title: z.string(),
      excerpt: z.string(),
      image: z.string(),
      group: z.enum(['Plan & Book', 'Entry & Visa', 'Money & Costs', 'On the Ground']),
      order: z.number().default(99),
      updated: z.coerce.date(),
    }),
  }),
};
