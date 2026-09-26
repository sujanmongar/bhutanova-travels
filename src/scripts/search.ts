// Shared by the header's live suggestions and the full /search/ page, so both group results the same way.
import { arrowIcon as arrow } from '../utils';

export type SearchItem = { t: string; k: string; u: string; x?: string };
type Group = { key: string; label: string; items: SearchItem[] };

const KIND: Record<string, string> = { Tour: 'Tours', Category: 'Tour themes', Destination: 'Destinations', Sight: 'Places to see', Guide: 'Travel guides', Article: 'Blog articles', Page: 'Pages' };
const ORDER = Object.keys(KIND);

const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Lower case, apostrophes and punctuation dropped ("Tiger's Nest" = "tigers nest"), so typing the way people do still finds it
const norm = (s: string) => s.toLowerCase().replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, ' ');
const COSTS = /\b(price|prices|cost|costs|budget|cheap|fee|fees)\b/;

/** Every word typed must appear in the title or the extra words (theme, days, region, a guide's summary); title hits first. */
export function matches(index: SearchItem[], q: string): SearchItem[] {
  const words = norm(q).split(' ').filter(Boolean).map((w) => (COSTS.test(w) ? 'cost' : w));
  if (!words.length) return [];
  const hay = (r: SearchItem) => norm(`${r.t} ${r.x ?? ''} ${COSTS.test(norm(`${r.t} ${r.x ?? ''}`)) ? 'cost' : ''}`);
  const found = index.filter((r) => words.every((w) => hay(r).includes(w)));
  return found.sort((a, b) => Number(!words.every((w) => norm(a.t).includes(w))) - Number(!words.every((w) => norm(b.t).includes(w))));
}

export function groupByKind(items: SearchItem[]): Group[] {
  return ORDER.map((k) => ({ key: k, label: KIND[k], items: items.filter((r) => r.k === k) })).filter((g) => g.items.length);
}

/** The compact, grouped list under the header search field — a few rows per section, plus a "see all" link once it's worth one. */
export function suggestionsHTML(groups: Group[], q: string, perGroup = 4): string {
  const shown = groups.reduce((n, g) => n + Math.min(g.items.length, perGroup), 0);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const rows = groups
    .map((g) => `<li class="search__group"><p class="search__group-h">${g.label}</p><ul>${g.items
      .slice(0, perGroup)
      .map((r) => `<li><a href="${r.u}">${escHtml(r.t)}</a></li>`)
      .join('')}</ul></li>`)
    .join('');
  const seeAll = total > 0 ? `<a class="search__see-all see-all" href="/search/?q=${encodeURIComponent(q)}"><span>${total > shown ? `See all ${total} results` : 'See full results'} for “${escHtml(q)}”</span>${arrow}</a>` : '';
  return rows + seeAll;
}

/** The full /search/ page — every match, grouped, no cap. */
export function resultsHTML(groups: Group[]): string {
  return groups
    .map((g) => `<li class="results__group"><p>${g.label}<span class="num">${g.items.length}</span></p><ul>${g.items
      .map((r) => `<li><a href="${r.u}">${escHtml(r.t)}</a></li>`)
      .join('')}</ul></li>`)
    .join('');
}
