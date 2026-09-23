import { toHTML } from '@portabletext/to-html';
import GithubSlugger from 'github-slugger';

// Typographic quotes, as Astro's markdown did: it's → it’s, "x" → “x”. `prev` carries context across spans.
// ponytail: no decade/abbreviation rules ('90s becomes ‘90s); swap in retext-smartypants if that ever matters.
const curl = (s: string, prev = ' ') =>
  s.replace(/['"]/g, (q, i: number) => {
    const open = /[\s([{–—-]/.test(i ? s[i - 1] : prev);
    return q === '"' ? (open ? '“' : '”') : open ? '‘' : '’';
  });

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Portable Text → HTML. h2/h3 get ids from the same slugger Astro's markdown used, so TOC anchors stay stable. */
export function ptHtml(blocks: any[] = [], slugger = new GithubSlugger()) {
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
    headings.push({ depth, slug, text });
    return `<h${depth} id="${slug}">${children}</h${depth}>`;
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

/** Paragraph-only rich text → one HTML string per paragraph (inner HTML, no <p>). */
export const ptParagraphs = (blocks: any[] = []) =>
  blocks.filter((b) => b._type === 'block').map((b) => ptHtml([{ ...b, style: 'normal', listItem: undefined }]).html.replace(/^<p>|<\/p>$/g, ''));
