/** A price in US dollars: 1690 → "$1,690". */
export const usd = (n: number) => '$' + n.toLocaleString('en-US');
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Guide topics are stored as 'Plan & Book' etc.; shown in sentence case: 'Plan and book', 'On the ground'
export const topicName = (g: string) => g[0] + g.slice(1).toLowerCase().replace(' & ', ' and ');

// Tours sit under their category, with the trip length in the slug:
// /bhutan-tours/cultural-tours/8-days-bhutan-cultural-extravaganza/
export const TOURS = '/bhutan-tours/';
export const DESTINATIONS = '/destinations/';
export const catPath = (id: string) => `${TOURS}${id}/`;
export const tourPath = (t: { id: string; data: { days: number; category: { id: string } } }) =>
  `${catPath(t.data.category.id)}${t.data.days}-days-${t.id}/`;
// The hero block gets its tour from a Sanity projection, not a collection entry.
export const tourPathOf = (category: string, days: number, id: string) => `${catPath(category)}${days}-days-${id}/`;

// A festival tour's next festival: the festivals in its list still to come, taken as one span (e.g. Punakha Drubchen
// and Punakha Tshechu, 13–18 February 2027). Dates are "YYYY-MM-DD"; `today` is the build date.
export function nextFestival(dates: { name?: string; start: string; end: string }[], today = new Date().toISOString().slice(0, 10)) {
  const ahead = dates.filter((d) => d.end >= today).sort((a, b) => a.start.localeCompare(b.start));
  if (!ahead.length) return undefined;
  const year = ahead[0].start.slice(0, 4);
  const same = ahead.filter((d) => d.start.slice(0, 4) === year);
  const start = same[0].start, end = same.map((d) => d.end).sort().at(-1)!;
  const day = (s: string, opts: Intl.DateTimeFormatOptions) => new Date(`${s}T00:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', ...opts });
  const label = start === end ? day(start, { day: 'numeric', month: 'long', year: 'numeric' })
    : start.slice(0, 7) === end.slice(0, 7) ? `${day(start, { day: 'numeric' })}–${day(end, { day: 'numeric', month: 'long', year: 'numeric' })}`
    : `${day(start, { day: 'numeric', month: 'long' })} – ${day(end, { day: 'numeric', month: 'long', year: 'numeric' })}`;
  const name = new Intl.ListFormat('en-GB').format([...new Set(same.flatMap((d) => d.name || []))]);
  return { start, end, label, name };
}

// Short text editors type in plain boxes (tour days, FAQ answers): a blank line starts a paragraph, lines starting "- "
// make a list, **words** are bold and [words](https://… or /page/) is a link (other sites open in a new tab).
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const inline = (s: string) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(((?:https:\/\/|\/)[^)\s]+)\)/g, (_, text, href) =>
      href.startsWith('/') ? `<a href="${href}">${text}</a>` : `<a href="${href}" target="_blank" rel="noopener">${text}<span class="sr-only"> (opens in a new tab)</span></a>`);
export const md = (s: string) =>
  s.trim().split(/\n\s*\n/).map((b) => {
    const lines = b.split('\n').map((l) => l.trim());
    return lines.every((l) => l.startsWith('- ')) ? `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>` : `<p>${inline(lines.join(' '))}</p>`;
  }).join('');
/** The same text without its marks, for Google's structured data. */
export const plainMd = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

// Long articles and guides: one quiet "ask us" line where a reader is deep in (before the third section heading, or
// after the sixth paragraph when there are few headings). It opens the enquiry sheet. Short pieces are left alone.
import arrowSvg from './icons/arrow-up-right.svg?raw';
/** The .link-more / .see-all arrow for HTML built as strings (LinkMore.astro draws it in components). */
export const arrowIcon = arrowSvg.replace('<svg', '<svg class="icon" aria-hidden="true" focusable="false"');
const ASK = `<p class="mid-ask"><button type="button" class="link-more" data-open-plan data-plan-title="Plan your trip"><span>Planning a trip? Ask us about your dates</span>${arrowIcon}</button></p>`;
export function withAsk(html = '') {
  const h2 = [...html.matchAll(/<h2[\s>]/g)];
  if (h2.length >= 3) return html.slice(0, h2[2].index) + ASK + html.slice(h2[2].index);
  const p = [...html.matchAll(/<\/p>/g)];
  if (p.length >= 8) { const at = p[5].index! + 4; return html.slice(0, at) + ASK + html.slice(at); }
  return html;
}
