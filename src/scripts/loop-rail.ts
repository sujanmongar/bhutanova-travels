// Endless card row (the category slider): swipe or scroll only, no buttons and no auto-advance.
// The real cards are in the HTML (for search engines and no-JS); copies are added on each side so the loop never
// runs out. Copies stay clickable but are hidden from screen readers and the Tab key.

export function loopRail(track: HTMLElement) {
  const real = [...track.children] as HTMLElement[];
  const n = real.length;
  if (n < 2) return;
  const step = () => real[1].offsetLeft - real[0].offsetLeft;
  // Not laid out yet (hidden tab or section): a zero step would make the copy count below infinite and hang the page.
  if (!(step() > 0)) return;
  // Enough copies per side to fill even a very wide (or later widened) screen around any centred card.
  const sets = Math.max(1, Math.ceil((Math.max(screen.width, innerWidth) / 2 + step()) / (n * step())));
  const copies = () =>
    real.map((li) => {
      const c = li.cloneNode(true) as HTMLElement;
      c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('a, button').forEach((a) => ((a as HTMLElement).tabIndex = -1));
      return c;
    });
  for (let k = 0; k < sets; k++) { track.prepend(...copies()); track.append(...copies()); }
  const items = [...track.children] as HTMLElement[];
  const first = sets * n; // index of the first real card
  const centre = (el: HTMLElement) => el.offsetLeft + el.offsetWidth / 2 - track.clientWidth / 2;
  const current = () => Math.round((track.scrollLeft - centre(items[0])) / step());
  const jump = (left: number) => track.scrollTo({ left, behavior: 'instant' });

  jump(centre(items[first]));
  // Only a real width change re-centres (mobile browsers fire resize while the URL bar hides), and it keeps the card.
  let width = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === width) return;
    width = innerWidth;
    jump(centre(items[Math.min(Math.max(current(), 0), items.length - 1)]));
  });

  // Once scrolling settles inside a copy, hop to the same card in the real set (invisible: identical cards).
  let settle: number | undefined;
  track.addEventListener('scroll', () => {
    clearTimeout(settle);
    settle = setTimeout(() => {
      const i = current();
      if (i < first) jump(track.scrollLeft + n * step());
      else if (i >= first + n) jump(track.scrollLeft - n * step());
    }, 150);
  }, { passive: true });
}
