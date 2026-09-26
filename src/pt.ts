import { toHTML } from '@portabletext/to-html';
import GithubSlugger from 'github-slugger';
import { img, srcset } from './config';
import { tourPathOf, usd } from './utils';

// Typographic quotes, as Astro's markdown did: it's → it’s, "x" → “x”. `prev` carries context across spans.
// ponytail: no decade/abbreviation rules ('90s becomes ‘90s); swap in retext-smartypants if that ever matters.
const curl = (s: string, prev = ' ') =>
  s.replace(/['"]/g, (q, i: number) => {
    const open = /[\s([{–—-]/.test(i ? s[i - 1] : prev);
    return q === '"' ? (open ? '“' : '”') : open ? '‘' : '’';
  });

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const attr = (s: string) => esc(s).replace(/"/g, '&quot;');

// Rich blocks in articles. Photos keep their own shape at the column width; side-by-side photos are cropped to 4:3
// around the editor's focal point. Credits come from the image's credit line (Wikimedia licences need one).
type Photo = { url?: string; alt?: string; caption?: string; ratio?: number; hotspot?: { x: number; y: number }; credit?: { text?: string; url?: string } };
const credit = (c?: Photo['credit']) => (c?.text ? (c.url ? `<a href="${attr(c.url)}" target="_blank" rel="noopener">${esc(c.text)}<span class="sr-only"> (opens in a new tab)</span></a>` : esc(c.text)) : '');
const caption = (text?: string, credits: string[] = []) => {
  const who = credits.filter(Boolean);
  if (!text && !who.length) return '';
  return `<figcaption>${text ? esc(curl(text)) : ''}${who.length ? `${text ? ' ' : ''}<span class="credit">${who.length > 1 ? 'Photos' : 'Photo'}: ${who.join('; ')}</span>` : ''}</figcaption>`;
};
const photoImg = (p: Photo, sizes: string, ratio?: number) => {
  const h = ratio ? Math.round(1200 / ratio) : Math.round(1200 / (p.ratio ?? 1.5));
  return `<img src="${attr(img(p.url!, 1200, ratio && h, p.hotspot))}" srcset="${attr(srcset(p.url!, [480, 800, 1200, 1600], ratio, p.hotspot) ?? '')}" sizes="${sizes}" alt="${attr(p.alt ?? '')}" width="1200" height="${h}" loading="lazy" decoding="async">`;
};
const COLUMN = '(min-width: 700px) 724px, calc(100vw - 32px)';  // the widest prose column (guides); blog is 612
// Every article photo is a button that opens the site's photo viewer (Lightbox.astro), which shows it full size and
// uncropped (a gallery tile is cropped to 4:3 here), with the figure's caption and credit
const openable = (p: Photo, inner: string) =>
  `<button type="button" class="lb-open" data-lb-item data-src="${attr(img(p.url!, 1600))}" data-srcset="${attr(srcset(p.url!, [800, 1200, 1600, 2400]) ?? '')}" aria-label="${attr(`View photo${p.alt ? `: ${p.alt}` : ''}`)}">${inner}</button>`;

// A YouTube or Vimeo link (video or playlist) plays in place, YouTube in its no-cookie player. A Google map needs its
// embed address, so a maps link with a query, a place, a search or coordinates is turned into one. Google's short share
// links (maps.app.goo.gl) can't be framed or resolved here, so they become a plain link. Any other https page is framed
// sandboxed. Throws on a malformed link (the renderer skips it).
function embedSrc(link: string): { src: string; kind: 'video' | 'map' | 'page' | 'link' } {
  const u = new URL(link);
  const host = u.hostname.replace(/^(www|m)\./, '');
  if (/(^|\.)youtube(-nocookie)?\.com$/.test(host) && u.pathname === '/playlist' && u.searchParams.get('list'))
    return { src: `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(u.searchParams.get('list')!)}`, kind: 'video' };
  const yt = host === 'youtu.be' ? u.pathname.slice(1) : /(^|\.)youtube(-nocookie)?\.com$/.test(host) ? u.searchParams.get('v') ?? u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]+)/)?.[1] : undefined;
  if (yt) return { src: `https://www.youtube-nocookie.com/embed/${yt}`, kind: 'video' };
  // vimeo.com/123, /channels/x/123, /showcase/9/video/123, and unlisted vimeo.com/123/abcdef (the hash must travel along)
  const vm = /(^|\.)vimeo\.com$/.test(host) && (u.pathname.match(/\/video\/(\d+)/) ?? u.pathname.match(/^\/(?:channels\/[^/]+\/)?(\d+)(?:\/([\da-f]+))?/));
  if (vm) return { src: `https://player.vimeo.com/video/${vm[1]}?dnt=1${vm[2] ? `&h=${vm[2]}` : ''}`, kind: 'video' };
  if (host === 'maps.app.goo.gl' || (host === 'goo.gl' && u.pathname.startsWith('/maps'))) return { src: link, kind: 'link' };
  if (/(^|\.)google\.[a-z.]+$/.test(host) && u.pathname.startsWith('/maps')) {
    if (u.pathname.startsWith('/maps/embed') || u.searchParams.get('output') === 'embed') return { src: link, kind: 'map' };
    const q = u.searchParams.get('q') ?? (decodeURIComponent(u.pathname.match(/\/maps\/(?:place|search)\/([^/]+)/)?.[1] ?? '').replace(/\+/g, ' ') || u.pathname.match(/\/@(-?[\d.]+,-?[\d.]+)/)?.[1]);
    if (q) return { src: `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`, kind: 'map' };
    return { src: link, kind: 'link' };
  }
  return { src: link, kind: 'page' };
}

/** Portable Text → HTML. h2/h3 get ids from the same slugger Astro's markdown used, so TOC anchors stay stable.
 *  `shift` pushes those headings a level down (h2 → h3) when the block already carries its own heading. */
export function ptHtml(blocks: any[] = [], slugger = new GithubSlugger(), shift = 0) {
  blocks = structuredClone(blocks);
  for (const b of blocks) {
    let prev = ' ';
    for (const span of b.children ?? []) {
      span.text = curl(span.text ?? '', prev);
      prev = span.text.slice(-1) || prev;
    }
    for (const row of b.rows ?? []) row.cells = (row.cells ?? []).map((c: string) => curl(c ?? ''));
  }
  const headings: { depth: number; slug: string; text: string }[] = [];
  const heading = (depth: 2 | 3) => ({ children, value }: any) => {
    const text = value.children.map((c: any) => c.text).join('');
    const slug = slugger.slug(text);
    const level = Math.min(6, depth + shift);
    headings.push({ depth, slug, text });
    return `<h${level} id="${slug}">${children}</h${level}>`;
  };
  const html = toHTML(blocks, {
    components: {
      block: { h2: heading(2), h3: heading(3) },
      marks: {
        // Links out to official sources open in a new tab, so the reader keeps their place in the guide.
        link: ({ children, value }: any) => {
          const href = value?.href ?? '';
          const away = /^https?:\/\//.test(href);
          return `<a href="${esc(href).replace(/"/g, '&quot;')}"${away ? ' target="_blank" rel="noopener"' : ''}>${children}${
            away ? '<span class="sr-only"> (opens in a new tab)</span>' : ''
          }</a>`;
        },
      },
      types: {
        photo: ({ value }: { value: Photo }) =>
          value.url ? `<figure class="photo">${openable(value, photoImg(value, COLUMN))}${caption(value.caption, [credit(value.credit)])}</figure>` : '',
        gallery: ({ value }: { value: { images?: Photo[]; caption?: string } }) => {
          const shots = (value.images ?? []).filter((p) => p.url);
          if (!shots.length) return '';
          // With three, the first runs the full width above the other two
          const tiles = shots.map((p, i) => openable(p, photoImg(p, shots.length === 3 && i === 0 ? COLUMN : '(min-width: 700px) 356px, 50vw', 4 / 3))).join('');
          return `<figure class="gallery gallery--${shots.length}"><div>${tiles}</div>${caption(value.caption, shots.map((p) => credit(p.credit)))}</figure>`;
        },
        embed: ({ value }: any) => {
          // https only (Studio enforces it too, but content can arrive through the API); a malformed link is skipped
          // rather than failing the build
          if (!/^https:\/\//i.test(value?.url ?? '')) return '';
          let e: ReturnType<typeof embedSrc>;
          try { e = embedSrc(value.url); } catch { return ''; }
          const { src, kind } = e;
          if (kind === 'link') return `<p><a href="${attr(src)}" target="_blank" rel="noopener">${esc(value.title ?? src)}<span class="sr-only"> (opens in a new tab)</span></a></p>`;
          const extra = kind === 'page' ? ' sandbox="allow-scripts allow-same-origin allow-popups"' : ' allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen';
          // The frame waits for cookie consent (CookieNotice.astro); until then a panel says who it's from, with a Show button
          const from = kind === 'map' ? ['Google Maps', 'map'] : /vimeo/.test(src) ? ['Vimeo', 'video'] : kind === 'video' ? ['YouTube', 'video'] : [new URL(src).hostname.replace(/^www\./, ''), 'content'];
          const gate = `<div class="frame__gate"><p>This ${from[1]} is from ${esc(from[0])}, which may set cookies when it loads.</p><button type="button" class="btn btn--outline" data-consent-load>Show the ${from[1]}</button></div>`;
          return `<figure class="embed embed--${kind}"><div class="frame"><iframe data-src="${attr(src)}" tabindex="-1" title="${attr(value.title ?? 'Embedded content')}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"${extra}></iframe>${gate}</div>${caption(value.caption)}</figure>`;
        },
        tourCard: ({ value }: any) => {
          const t = value?.tour;
          if (!t?.id) return '';
          return `<div class="tc"><img src="${attr(img(t.image, 192, 192))}" srcset="${attr(srcset(t.image, [96, 192, 288], 1) ?? '')}" sizes="96px" alt="" width="96" height="96" loading="lazy" decoding="async"><div><p class="t-label">Tour</p><p class="t-card"><a href="${attr(tourPathOf(t.category, t.days, t.id))}">${esc(t.title)}</a></p><p class="t-body">${t.days} days · from <b class="num">${usd(Number(t.price))}</b> per person</p></div></div>`;
        },
        pullQuote: ({ value }: any) =>
          value?.text ? `<figure class="pq"><blockquote><p>${esc(curl(value.text))}</p></blockquote>${value.attribution ? `<figcaption>${esc(curl(value.attribution))}</figcaption>` : ''}</figure>` : '',
        table: ({ value }: any) => {
          const [head, ...rows] = value.rows ?? [];
          // Short cells (codes, places, days, times) stay on one line so a wide table scrolls instead of stacking words;
          // long cells still wrap.
          // **bold** in a cell (e.g. a Total row) renders bold instead of showing the asterisks
          const cell = (c: string, tag: string) => `<${tag}${(c ?? '').length <= 24 ? ' class="nw"' : ''}>${esc(c ?? '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</${tag}>`;
          const tr = (r: any, tag: string) => `<tr>${(r.cells ?? []).map((c: string) => cell(c, tag)).join('')}</tr>`;
          return `<div class="table-wrap"><table>${head ? `<thead>${tr(head, 'th')}</thead>` : ''}<tbody>${rows.map((r: any) => tr(r, 'td')).join('')}</tbody></table></div>`;
        },
      },
    },
  });
  return { html, metadata: { headings } };
}

/** Paragraph-only rich text → one HTML string per paragraph (inner HTML, no <p>). */
export const ptParagraphs = (blocks: any[] = []) =>
  blocks.filter((b) => b._type === 'block').map((b) => ptHtml([{ ...b, style: 'normal', listItem: undefined }]).html.replace(/^<p>|<\/p>$/g, ''));
