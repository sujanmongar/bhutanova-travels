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
// then Punakha Tshechu, 13–18 Feb 2027). Dates are "YYYY-MM-DD"; `today` is the build date.
export function nextFestival(dates: { start: string; end: string }[], today = new Date().toISOString().slice(0, 10)) {
  const ahead = dates.filter((d) => d.end >= today).sort((a, b) => a.start.localeCompare(b.start));
  if (!ahead.length) return undefined;
  const year = ahead[0].start.slice(0, 4);
  const same = ahead.filter((d) => d.start.slice(0, 4) === year);
  const start = same[0].start, end = same.map((d) => d.end).sort().at(-1)!;
  const day = (s: string, opts: Intl.DateTimeFormatOptions) => new Date(`${s}T00:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', ...opts });
  const label = start === end ? day(start, { day: 'numeric', month: 'short', year: 'numeric' })
    : start.slice(0, 7) === end.slice(0, 7) ? `${day(start, { day: 'numeric' })}–${day(end, { day: 'numeric', month: 'short', year: 'numeric' })}`
    : `${day(start, { day: 'numeric', month: 'short' })} – ${day(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  return { start, end, label };
}
