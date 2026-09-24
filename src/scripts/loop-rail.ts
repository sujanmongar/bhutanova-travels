// Endless, self-advancing card row (the category slider), with no buttons.
// The real cards are in the HTML (for search engines and no-JS); copies are added on each side so the loop never
// runs out. Copies stay clickable but are hidden from screen readers and the Tab key.
// It moves one card every 4s while on screen; hovering or focusing it pauses it, and the first swipe or scroll hands
// control to the visitor for good. Nothing moves for people who ask for reduced motion.
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

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

  // Native smooth-scroll can't be slowed, so glide one card over ~1s; snapping waits until the glide ends.
  let gliding = false, playing = true, seen = false;
  const glide = () => {
    if (gliding) return;
    gliding = true;
    const from = track.scrollLeft, by = step(), start = performance.now();
    track.style.scrollSnapType = 'none';
    const frame = (now: number) => {
      const p = playing ? Math.min(1, (now - start) / 1000) : 1; // the visitor took over: stop where it is
      if (playing) track.scrollLeft = from + by * ease(p);
      if (p < 1) return requestAnimationFrame(frame);
      track.style.scrollSnapType = '';
      gliding = false;
    };
    requestAnimationFrame(frame);
  };

  // Once scrolling settles inside a copy, hop to the same card in the real set (invisible: identical cards).
  let settle: number | undefined;
  track.addEventListener('scroll', () => {
    clearTimeout(settle);
    settle = setTimeout(() => {
      if (gliding) return;
      const i = current();
      if (i < first) jump(track.scrollLeft + n * step());
      else if (i >= first + n) jump(track.scrollLeft - n * step());
    }, 150);
  }, { passive: true });

  if (still) { playing = false; return; }
  // A finger that moves the row sideways (not one scrolling the page past it), a sideways wheel or a key stops it.
  const stop = () => (playing = false);
  let touching = false;
  track.addEventListener('touchstart', () => { touching = true; if (gliding) stop(); }, { passive: true });
  addEventListener('touchend', () => (touching = false), { passive: true });
  track.addEventListener('scroll', () => { if (touching && !gliding) stop(); }, { passive: true });
  track.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) stop(); }, { passive: true });
  track.addEventListener('keydown', stop);
  new IntersectionObserver(([e]) => (seen = e.isIntersecting), { threshold: 0.5 }).observe(track);
  setInterval(() => {
    if (playing && seen && !document.hidden && !track.matches(':hover, :focus-within')) glide();
  }, 4000);
}
