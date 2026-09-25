# Bhutanova Travels — project rules

Astro static site, content in Sanity (project `234ghw8x`, dataset `production`, Studio in `studio/`).
Live at https://bhutanova-travels.pages.dev, deployed by GitHub Actions on push and on every Sanity publish.

## Design system — follow it in every task

The single source of truth is `src/styles/global.css` (tokens + role classes). `/styleguide/` renders it live.
Never invent a size, line height, letter spacing, weight or spacing value in a component.

### Fonts
- **Fraunces** (serif, variable with optical sizes, used at 400; quotes 400 italic) — titles and headings only, nothing else.
- **Device sans** (system stack: SF Pro on Apple, Segoe UI on Windows, Roboto on Android; 400 / 500 / 600) — everything else: body text, captions, labels, buttons, links, chips, nav, prices.
- User's picks: Fraunces from Google Fonts (self-hosted via Fontsource), device font for the sans (fastest, SF Pro on iPhone/Mac). Stacks fall back like Perplexity's
  (`ui-serif, Georgia, Cambria` / `ui-sans-serif, system-ui, …`).

### Typography — Typescale: 18px base, Minor Third (1.200) — use a role, never raw values
The user's chosen scale (typescale.com, 18px, 1.200). Desktop ≥768px: h1–h6 = 18px × 2.986 · 2.488 · 2.074 · 1.728 · 1.44 · 1.2
(53.7 · 44.8 · 37.3 · 31.1 · 25.9 · 21.6px). Phones: same 18px base on Major Second (1.125): 32.4 · 28.8 · 25.6 · 22.8 · 20.3 · 18px.
h1–h6 tokens keep these default sizes — never shift them.
Tokens are written as `calc(var(--fs-base) * ratio)` so the scale stays exact. Headings: line height 1.15, tracking −0.022em,
serif 400. Body: 18px, line height 1.6. **Floor 16px**: UI controls and small text are 16 (the scale's 0.833 step = 15px is not used).
Headings run in strict order h1 > … > h6. A heading element uses its own level's style — never another LEVEL's class
(no `<h2 class="t-h1">`); `.t-card` / `.t-title` may go on any heading. Chrome titles that aren't content sections
(footer columns, sidebar widgets, dialog titles) are styled `<p>`, not `<h2>`, so they can't break the heading order.

| Role | Class | Phones | ≥768px | Use |
|---|---|---|---|---|
| H1 | `h1`, `.hero-title` | 32.4 | 53.7 | Hero headline and page titles |
| H2 | `.t-h2` | 28.8 | 44.8 | Scale default — kept for reference; section titles don't use it |
| Section title | `h2` | 25.6 | 37.3 | Every section title — an `<h2>` element rendered at the **H3** size (user's call) |
| Content title | `.prose h2`, tour sections | 22.8 (h4) | 25.9 (h5) | h2 inside a content column: tour page sections, guide / blog / destination / sight text. Their h3 = card size |
| H3 | `h3` | 25.6 | 37.3 | Sub-sections (outside content columns) |
| H4 | `h4` | 22.8 | 31.1 | Rare |
| Card title | `.t-card` | 20.3 (h5) | 21.6 (h6) | Tour, blog, category cards; section items (why-us reasons, booking steps, FAQ questions); dialog titles |
| H6 / Item title | `h6` / `.t-title` | 18 | 21.6 | Widgets (footer column titles are `.t-label .t-caps`) |
| Quote | `.t-quote` | 20.3 | 25.9 | Pull quotes (serif italic). Review text on the homepage is sans 400 at the H6 size (owner's call) |
| **Body** | `.t-body` | **18** | **18** | Reading text, every description and every checklist |
| Caption | `.t-caption` | 16 | 16 | Small print, secondary text |
| Label | `.t-label` | 16 | 16 | Nav, breadcrumbs, dates, tags, facts lines, form labels (500) |
| Button | `.t-button` | 16 | 16 | Button text (600). Button visuals keep their variants — only the text style is shared |
| Link | `.t-link` | 16 | 16 | "Learn more / see all" — same text style as buttons (600) |
| Price | `.t-price` | 20.3 | 25.9 | Tour page details bar and phone booking bar — sans 600, never serif. Tour cards: one Body line, "8 days · from $1,690 per person", price bold |

Section items (why us, how booking works, FAQ, blog cards and the homepage blog list) share one order: label 16 → 8px →
item title `.t-card` → 12px → `.t-body` in `.muted` (text-2). Icon/number → title 24px.
Uppercase variant: add `.t-caps` to a label/link (uppercase, +0.08em) — the only allowed tracking change.
Hierarchy inside a section: title → description and checklists (Body 18) → meta (16). Step secondary text down; never enlarge the
description. Checklists are always Body 18 (owner's call) — 16 is only for UI chrome, meta and small print. Apply a role with its class in markup; where impossible use the role's full `--fs/--lh/--ls/--fw` set together.
Colour is separate from type: `.muted` (text-2), `.subtle` (text-3). Icon sizing is exempt.
Icons: one library, Phosphor, as SVG files in `src/icons` via `<Icon name>` (no icon fonts, no CDN). Feature/contact/fact
icons are **Regular** (outline, one colour, no duotone fill, no orange fill, no tinted box or circle behind them). UI glyphs
(arrows, carets, close, menu, check, search) are **Bold**. Brand and social logos are the only exceptions.

### Spacing — 8-point scale only
Tokens `--space-1` 4 · `--space-2` 8 · `--space-3` 12 · `--space-4` 16 · `--space-6` 24 · `--space-8` 32 ·
`--space-10` 40 · `--space-12` 48 · `--space-16` 64 · `--space-20` 80 · `--space-24` 96 · `--space-32` 128.
Semantic (mobile / ≥768px): `--gutter` 16/32 page edge · `--stack` 32/48 section title → content ·
`--section` 64/96 between sections · `--card-pad` 24 · `--grid-gap` 24 (every width).
Every margin, padding, gap and spacing offset uses one of these. Only 1–2px borders/hairlines are exempt.

### Look
Text colour: two only — primary `--ink` for headings/titles (and key figures), secondary `--text-2` for every other
text (body, descriptions, checklists, answers, dates, captions). On navy: white and `--on-dark-2`. `--text`/`--text-3`
are aliases of `--text-2`.
Editorial, not template: left-aligned sentence-case headings, hairline rules instead of boxed cards, photography not
illustration.
Sections alternate white and light grey (`.section--grey`), set per block in Sanity.
Buttons: `.btn` variants only (primary navy, light, outline, soft, on-dark), pill, 16/600 text, **no arrow icons inside
buttons** (text links `.link-more` keep their small arrow). Mobile first: design at 375px, then 768, then 1024/1200.
Images: sharp but right-sized — `img(src, w, h)` / `srcset(src, widths, ratio)` make the CDN return exactly the frame
(centred crop) for fixed-aspect frames; accurate `sizes`; lazy except the LCP image; page banners use `BannerImg`.
Corners: every card and card image uses `--radius` (36px) + `corner-shape: squircle` (Apple-style; plain rounded
corners where unsupported). Small things keep small radii: inputs 12, thumbnails 12, badges 16, buttons full pill. Palette navy `--s-500` #162E44 + orange `--p-500` #FFA500 (orange is for fills/icons, never small text).
Copy: plain and specific, no "seamless / nestled / breathtaking / embark / curated", no exclamation marks, no Title Case.

## Workflow
- **Local first.** No `git commit` / `git push` without an explicit go-ahead.
- **Sanity content goes in as drafts** (`drafts.<id>`), never straight to the published doc — publishing triggers a live
  rebuild. `astro dev` shows drafts (read token in `.env`, gitignored); builds read published only. Go-live order: push
  code first, then publish the draft.
- `npx sanity deploy` (Studio schema only) is fine whenever a schema change needs it.
- New CMS fields get real drafted content, never left empty.
- One homepage section at a time; don't start the next until the user says so. The homepage order is the owner's
  (set in Sanity): hero (with a proof line), founder note, popular tours, themes, reviews, blog, FAQ, plan your trip
  (navy: steps + named planner), partners. No "why us" icon grid, no stepper rings, no photo CTA banner on the homepage.
- Motion is quiet and quick, the same few moves everywhere (tokens in global.css): content fades in and rises 12px once
  as it enters (`data-reveal`, cards in a row 60ms apart); banner/hero photos settle from a 3% zoom and their words fade
  up; pages cross-fade (header stays put); card photos ease in 2% on hover; buttons press to 98%. No bounces, no big
  zooms, no autoplaying rows or logo marquees (rows are swiped or moved with arrows; arrows hide when everything fits).
  Scroll-in is checked on every scroll frame: anything already scrolled past shows at once without animating (fast
  flicks, jumps and anchors never leave blank sections). Anything that moves on its own has a pause button. The tour gallery autoplay is the owner's call. Buttons darken one step on hover (primary → --s-800, light → --s-50,
  outline → navy border). Only a few key buttons (.btn--accent: the hero's two and the header's Enquire) fill with the
  primary orange on hover, navy text on it. WhatsApp buttons fill WhatsApp green on hover. Everything is off for reduced motion.
- Tour pages are one continuous page (no tabs): split cover (navy words, the tour's photos taking turns), a details bar
  pinned under the header (the header hides while reading down, returns on scroll up), overview (highlights + icon facts
  beside the tentative itinerary timeline, 5 days then "Show all"), what's included, every day in full (one entry per
  day, never "Day 2–3"), questions, more tours, contact card.
- Blog posts are one clean reading column (`--measure`): breadcrumbs, title, dek, one meta line (topic · date · author),
  a wide cover, the text, then share buttons (each network's logo in its colour + its name). Recent posts float beside
  the text from 1200px (after the share buttons below that). Then tours matched to the post, then the contact card.
- Article bodies (posts, guides, destinations, sights, page Text blocks) can hold photos (caption + automatic credit),
  2–3 photos side by side, a video or map (YouTube no-cookie, Vimeo, Google Maps), a tour card and a pull quote; pt.ts
  renders them. Every blog post uses them: real licensed photos with credits, and videos checked to play when embedded.
- Tours: the hub (/bhutan-tours/, the Tours menu item) shows the theme cards and popular tours. Each theme page
  (/bhutan-tours/<theme>/, the menu's theme links) is the tour finder: its banner, then one pinned bar with the theme
  tabs (links to the other themes, Cultural first), the count, Duration and Sort (Most popular from each tour's
  Popularity, price; festival themes also Festival date, the default there). Simple tour cards (all the same height; the
  festival date only drives the sort), and a last card "Want a different trip?" that opens the enquiry form. No "All tour packages" menu link.
- One enquiry form for the whole site (TripPlanner, in the layout): every Enquire / Plan / Customise button opens it
  (data-open-plan, or data-customise="<tour id>" to fill in that tour). The sheet shows the chosen tour, Chat on WhatsApp,
  then "Or send your details by email": Full name *, Email *, Phone (optional), Travellers *, Days *, When, Anything
  else. Tour pages: Send an enquiry + a round WhatsApp button. The contact page shows the same form inline (trip optional).
  Keep it short: the planner settles places, hotels and price in the conversation.
- Every page closes with the same contact section (WhatsAppCta; Sanity's Call to action and WhatsApp card blocks render
  it too): heading + line, the trip planner picked in the homepage's Plan your trip, WhatsApp + one button, phone, email.
  Filters are text tabs (orange underline), like the blog topics — no pill chips.
  Listing pages with sections or filters (travel guide topics, destination regions, blog topics) use one `<TabBar>` directly
  under the banner, pinned under the header; jump links mark the section in view.
- Verify in the browser at 1280 and 375 before reporting; restart the dev server after CSS or content changes (it caches).
