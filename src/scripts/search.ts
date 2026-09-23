// Shared by the header's live suggestions and the full /search/ page, so both group results the same way.
export type SearchItem = { t: string; k: string; u: string };
export type Group = { key: string; label: string; items: SearchItem[] };

const KIND: Record<string, string> = { Tour: 'Tours', Category: 'Tour themes', Destination: 'Destinations', Guide: 'Travel guides', Article: 'Blog articles', Page: 'Pages' };
const ORDER = Object.keys(KIND);

export const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function matches(index: SearchItem[], q: string): SearchItem[] {
  const needle = q.trim().toLowerCase();
  return needle ? index.filter((r) => r.t.toLowerCase().includes(needle)) : [];
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
  const seeAll = total > 0 ? `<a class="search__see-all" href="/search/?q=${encodeURIComponent(q)}">${total > shown ? `See all ${total} results` : 'See full results'} for “${escHtml(q)}”<span aria-hidden="true">→</span></a>` : '';
  return rows + seeAll;
}

/** The full /search/ page — every match, grouped, no cap. */
export function resultsHTML(groups: Group[]): string {
  return groups
    .map((g) => `<li class="results__group"><h2>${g.label}<span class="num">${g.items.length}</span></h2><ul>${g.items
      .map((r) => `<li><a href="${r.u}">${escHtml(r.t)}</a></li>`)
      .join('')}</ul></li>`)
    .join('');
}
