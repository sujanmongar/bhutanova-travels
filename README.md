# Bhutanova Travels

Bhutan tour operator website — Astro (static) + Sveltia CMS, hosted on Cloudflare Pages.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | [Astro](https://astro.build) (static output) | Pure HTML, near-zero JS → top Core Web Vitals and SEO |
| Styling | Plain CSS + design tokens (`src/styles/global.css`) | Tokens come straight from the Figma design guidelines |
| Content | Markdown/JSON in `src/content` and `src/data` | Versioned in git, no database |
| CMS | [Sveltia CMS](https://github.com/sveltia/sveltia-cms) at `/admin/` | Free, git-based, edits commit to GitHub |
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
src/content/tours/       tour packages (one .md per tour)
src/content/categories/  tour themes (Cultural, Festival, Trekking…)
src/content/blog/        blog posts
src/content/guides/      Travel Guide articles (visa, SDF, weather, packing…)
src/data/*.json          FAQs, news ticker, reviews
public/admin/config.yml  CMS fields
```

Images: any field accepts an Unsplash id (`photo-…`), a full image URL, or an upload (`/images/uploads/…`).

## CMS (`/admin/`)

Content editors log in at `https://<site>/admin/`. Every save is a git commit → Cloudflare rebuilds in ~1 minute.

**Quick login (no setup):** choose *Sign in with Token* and paste a GitHub fine-grained personal access token with *Contents: read & write* on this repo.

**"Sign in with GitHub" button (for non-technical editors):** deploy the free
[sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) Cloudflare Worker, create a GitHub OAuth app pointing to it,
then uncomment `base_url` in `public/admin/config.yml`.

## Forms

Forms currently open the visitor's email app. To receive submissions in your inbox without that step, create a free
[Formspree](https://formspree.io) / [Web3Forms](https://web3forms.com) endpoint and paste it into `SITE.formEndpoint` in `src/config.ts`.

## Deploy

Cloudflare Pages → *Create project* → *Connect to Git* → this repo.
Build command `npm run build`, output directory `dist`. Update `site` in `astro.config.mjs` and `public/robots.txt` when you add a custom domain.

## Credits

Photos: [Unsplash](https://unsplash.com). Illustrations: [Storyset](https://storyset.com). Icons exported from the Figma design.
