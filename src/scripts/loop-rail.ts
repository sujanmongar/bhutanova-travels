// Endless, self-advancing card row, shared by the category and review sliders.
// The real cards are in the HTML (for search engines and no-JS); copies are added on each side so the loop never
// runs out. Copies stay clickable but are hidden from screen readers and the Tab key.
// Markup: <ul data-loop [data-focus]> in a <section> that has [data-prev], [data-next] and [data-play] buttons.
// data-focus: cards get --d (0 at the centre → 1 one card away) and --o (the side facing the centre) so CSS can
// make the centred card the prominent one.
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

export function loopRail(track: HTMLElement) {
  const section = track.closest('section')!;
  const real = [...track.children] as HTMLElement[];
  const n = real.length;
  if (n < 2) return;
  const step = () => real[1].offsetLeft - real[0].offsetLeft;
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

  const focus = track.hasAttribute('data-focus');
  let queued = false;
  const emphasise = () => {
    queued = false;
    const mid = track.scrollLeft + track.clientWidth / 2, s = step();
    for (const li of items) {
      const c = li.offsetLeft + li.offsetWidth / 2;
      li.style.setProperty('--d', Math.min(1, Math.abs(c - mid) / s).toFixed(3));
      li.style.setProperty('--o', c < mid ? '100%' : '0%');
    }
  };
  const refocus = () => { if (focus && !queued) { queued = true; requestAnimationFrame(emphasise); } };

  jump(centre(items[first]));
  if (focus) emphasise();
  // Only a real width change re-centres (mobile browsers fire resize while the URL bar hides), and it keeps the card.
  let width = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === width) return;
    width = innerWidth;
    jump(centre(items[Math.min(Math.max(current(), 0), items.length - 1)]));
    refocus();
  });

  // Native smooth-scroll is quick and its speed can't be set, so move one card over ~1s with an ease-in-out curve.
  // Snapping is paused during the glide (it would fight each frame) and restored at the end.
  let gliding = false;
  const glide = (dir: 1 | -1) => {
    if (gliding) return;
    if (still) return track.scrollBy({ left: dir * step(), behavior: 'instant' });
    gliding = true;
    const from = track.scrollLeft, by = dir * step(), start = performance.now();
    track.style.scrollSnapType = 'none';
    const frame = (now: number) => {
      const p = Math.min(1, (now - start) / 1000);
      track.scrollLeft = from + by * ease(p);
      if (p < 1) return requestAnimationFrame(frame);
      track.style.scrollSnapType = '';
      gliding = false;
    };
    requestAnimationFrame(frame);
  };

  // Once scrolling settles inside a copy, hop to the same card in the real set (invisible: identical cards).
  let settle: number | undefined;
  track.addEventListener('scroll', () => {
    refocus();
    clearTimeout(settle);
    settle = setTimeout(() => {
      if (gliding) return;
      const i = current();
      if (i < first) jump(track.scrollLeft + n * step());
      else if (i >= first + n) jump(track.scrollLeft - n * step());
    }, 150);
  }, { passive: true });

  // Auto-advance, with a pause/play button (WCAG 2.2.2). Using the arrows or swiping hands control to the
  // visitor and stops it for good; it also waits while the row is hovered, focused or off screen.
  const toggle = section.querySelector<HTMLButtonElement>('[data-play]')!;
  let playing = !still, seen = false;
  const setPlaying = (on: boolean) => {
    playing = on;
    toggle.setAttribute('aria-pressed', String(!on));
    toggle.setAttribute('aria-label', on ? 'Pause the slideshow' : 'Play the slideshow');
  };
  setPlaying(playing);
  toggle.addEventListener('click', () => setPlaying(!playing));
  const takeOver = () => setPlaying(false);
  section.querySelector('[data-prev]')!.addEventListener('click', () => { takeOver(); glide(-1); });
  section.querySelector('[data-next]')!.addEventListener('click', () => { takeOver(); glide(1); });
  track.addEventListener('pointerdown', takeOver);
  track.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) takeOver(); }, { passive: true });
  new IntersectionObserver(([e]) => (seen = e.isIntersecting)).observe(track);
  setInterval(() => {
    if (playing && seen && !document.hidden && !track.matches(':hover, :focus-within')) glide(1);
  }, 5000);
}
