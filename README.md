# Bhutanova Travels

Bhutan tour operator website — Astro (static) + Sanity CMS, hosted on Cloudflare Pages.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | [Astro](https://astro.build) (static output) | Pure HTML, near-zero JS → top Core Web Vitals and SEO |
| Styling | Plain CSS + design tokens (`src/styles/global.css`) | Tokens come straight from the Figma design guidelines |
| Content + CMS | [Sanity](https://www.sanity.io) (project `234ghw8x`, dataset `production`) | Structured content, live SEO preview, free plan covers this site many times over |
| Hosting | Cloudflare Pages (connected to GitHub) | Free, global CDN, auto-deploy on every push |

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs dist/
```

## Where things live

```
src/config.ts            site name, phone, email, social links, form endpoint
src/styles/global.css    colours, responsive type scale (mobile / tablet / desktop)
src/content.config.ts    loads tours, categories, blog, guides, FAQs, reviews from Sanity at build time
studio/                  the Sanity Studio (editor app): schemas in studio/schemaTypes/
```

## CMS — Sanity Studio

Editors log in at **https://bhutanova.sanity.studio** (only people invited to the project can sign in).
Each page type has a **Content** tab and an **SEO** tab (meta title, meta description with live character
counts and a Google preview, share image, hide-from-search). Anything left empty in SEO falls back to the
page's own title, excerpt and image.

The dataset is public-read (published content only — drafts stay private), so the site build needs no
API token. Publishing triggers a rebuild through a Sanity webhook → GitHub Actions (see below).

Change the editor itself (fields, menu):

```bash
cd studio
npm install
npm run dev      # http://localhost:3333
npm run deploy   # publishes to bhutanova.sanity.studio
```

**Rebuild on publish:** Sanity → Manage → API → Webhooks calls
`POST https://api.github.com/repos/sujanmongar/bhutanova-travels/actions/workflows/deploy.yml/dispatches`
with body `{"ref": "main"}` and an `Authorization: Bearer <token>` header, where the token is a GitHub
fine-grained token limited to this repo with **Actions: Read and write** only (it can start a deploy, not change code).

## Forms

Forms currently open the visitor's email app. To receive submissions in your inbox without that step, create a free
[Formspree](https://formspree.io) / [Web3Forms](https://web3forms.com) endpoint and paste it into `SITE.formEndpoint` in `src/config.ts`.

## Deploy

Cloudflare Pages → *Create project* → *Connect to Git* → this repo.
Build command `npm run build`, output directory `dist`. Update `site` in `astro.config.mjs` and `public/robots.txt` when you add a custom domain.

## Credits

Photos: [Unsplash](https://unsplash.com). Illustrations: [Storyset](https://storyset.com). Icons exported from the Figma design.
