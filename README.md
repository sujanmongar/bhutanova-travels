# Bhutanova Travels

Bhutan tour operator website: Astro (static) + Sanity CMS, hosted on Cloudflare Pages.
Live at https://bhutanova-travels.pages.dev. Project rules (design system, copy, workflow) are in `CLAUDE.md`.

## Stack

| Layer | Choice |
|---|---|
| Framework | [Astro](https://astro.build), static output: plain HTML, little JavaScript |
| Styling | Plain CSS with design tokens and type roles in `src/styles/global.css`, shown live at `/styleguide/` |
| Content | [Sanity](https://www.sanity.io), project `234ghw8x`, dataset `production`; the Studio lives in `studio/` |
| Hosting | Cloudflare Pages, deployed by GitHub Actions (below) |

## Develop

```bash
npm install
npm run dev -- --port 4390   # http://localhost:4390 (the port the project's preview uses)
npm run build                # astro build, then scripts/csp-headers.mjs and scripts/redirects.mjs → dist/
```

`astro dev` also shows Sanity drafts when `.env` (gitignored) holds `SANITY_READ_TOKEN`; builds read published content only.

## Where things live

```
src/config.ts               site defaults (contact, licence, social, formKey, ownMailer); Studio's Site settings override them
src/styles/global.css       tokens, type roles, buttons, links, motion
src/content.config.ts       loads tours, themes, destinations, sights, guides, blog, FAQs, reviews from Sanity at build time
src/pages/robots.txt.ts     robots.txt, built from `site` in astro.config.mjs
functions/api/enquiry.js    the site's own enquiry sender (Cloudflare Pages Function), email template in src/emails/
scripts/                    build steps (CSP header, redirects) and test-enquiry.mjs
studio/                     Sanity Studio: schemas in studio/schemaTypes/
```

## CMS: Sanity Studio

Editors sign in at **https://bhutanova.sanity.studio** (only people invited to the project). Each page type has a
**Content** tab and an **SEO** tab (meta title, description with live checks and a Google preview, share image,
hide from search). Anything left empty in SEO falls back to the page's own title, excerpt and photo.

The dataset is public-read (published content only; drafts stay private), so the build needs no token.

Change the Studio itself (fields, menu), then publish it:

```bash
cd studio
npm install
npm run dev      # http://localhost:3333
npm run deploy   # same as npx sanity deploy: publishes the Studio to bhutanova.sanity.studio
```

**Plan:** Sanity's Free plan covers this site: public dataset, 2 webhooks (1 used), 20 seats. Free only has
Administrator and Viewer roles, so anyone who edits content must be an Administrator.

## Deploy

`.github/workflows/deploy.yml` runs `npm ci`, `npm run build` and `wrangler pages deploy dist --project-name=bhutanova-travels --branch=main`:

- on every push to `main`;
- on every Sanity publish (the webhook below starts the workflow);
- once a day at 00:30 UTC (06:30 in Bhutan), so build-date content (next festivals, the form's months, the copyright year) stays current.

Runs queue one at a time, so the live site always ends on the newest content. The repo needs two secrets:
`CLOUDFLARE_API_TOKEN` (template "Cloudflare Pages: Edit") and `CLOUDFLARE_ACCOUNT_ID`.

**Rebuild on publish:** a Sanity webhook ("Rebuild website on publish") starts the `Deploy` workflow. It uses a GitHub
fine-grained token limited to this repo with **Actions: Read and write** only (it can start a deploy, not read or change
code). When that token expires, publishing stops updating the site; create a new one and run this from `studio/`,
pasting the token once:

```bash
read -rs 'GH_DEPLOY_TOKEN?GitHub token: ' && GH_DEPLOY_TOKEN="$GH_DEPLOY_TOKEN" npx sanity exec scripts/set-deploy-hook.ts --with-user-token
```

## Enquiry form

One form for the whole site (`TripPlanner.astro` → `Form.astro`). How it sends:

1. `SITE.ownMailer` (in `src/config.ts`) is **off**. When turned on, the form first posts to `/api/enquiry`
   (`functions/api/enquiry.js`), which sends a branded email through Resend with the guest as Reply-to. It needs
   Cloudflare → Pages → bhutanova-travels → Settings → Variables and secrets: `RESEND_API_KEY` (secret), `ENQUIRY_TO`
   and, once the domain is verified in Resend, `ENQUIRY_FROM`. `node scripts/test-enquiry.mjs` checks the function
   without sending anything.
2. [Web3Forms](https://web3forms.com) with the access key in `SITE.formKey` (public by design, not a secret).
3. If sending fails, the visitor's email app opens with the details written out, so an enquiry is never lost.

## Custom domain checklist

1. Add the domain to the Cloudflare Pages project.
2. Change `site` in `astro.config.mjs`. Canonical links, `og:url`, structured data, the sitemap and `robots.txt` all follow it.
3. Change `SITE` in `studio/schemaTypes/seo.tsx` (the Google preview) and the address hint on the page slug in
   `studio/schemaTypes/page.ts`, then `npx sanity deploy` from `studio/`.
4. If `ownMailer` is on: verify the domain in Resend and set `ENQUIRY_FROM`.
5. Add the Search Console / Bing verification codes in Studio → Site settings.

## Credits

Photos are stored in Sanity with a credit line each. Icons: [Phosphor](https://phosphoricons.com) (MIT), as SVG files
in `src/icons`. Headings: [Fraunces](https://fonts.google.com/specimen/Fraunces) (SIL Open Font License, `src/fonts/OFL.txt`).
