import { getEntry } from 'astro:content';
// The named trip planner: the Team member picked in the homepage's "Plan your trip" section. Every contact card shows them.
export type Planner = { name: string; role: string; photo?: { url: string; hotspot?: { x: number; y: number } }; placeholder?: boolean | null };

export async function getPlanner(): Promise<Planner | undefined> {
  const home = await getEntry('pages', 'home');
  return (home?.data.sections.find((s: any) => s._type === 'bookingSteps') as any)?.person as Planner | undefined;
}
