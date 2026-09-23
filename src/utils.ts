export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Tours sit under their category, with the trip length in the slug:
// /bhutan-tours/cultural-tours/8-days-bhutan-cultural-extravaganza/
export const TOURS = '/bhutan-tours/';
export const catPath = (id: string) => `${TOURS}${id}/`;
export const tourPath = (t: { id: string; data: { days: number; category: { id: string } } }) =>
  `${catPath(t.data.category.id)}${t.data.days}-days-${t.id}/`;
// The hero block gets its tour from a Sanity projection, not a collection entry.
export const tourPathOf = (category: string, days: number, id: string) => `${catPath(category)}${days}-days-${id}/`;
