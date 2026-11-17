(() => {
  'use strict';

  // Older versions shared links to an open project, such as /#supportpilot.
  function openBookmarkedProject() {
    const project = document.getElementById(window.location.hash.slice(1));
    const link = project?.classList.contains('project') && project.querySelector('.project-link');
    if (link) window.location.replace(link.href);
  }
  openBookmarkedProject();
  window.addEventListener('hashchange', openBookmarkedProject);

  const header = document.querySelector('.site-header');
  const hero = document.querySelector('.hero');
  const descent = document.querySelector('.descent');
  const room = document.querySelector('.room');
  const particles = document.querySelector('.particles');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  let pending = false;

  const character = hero.querySelector('img[data-fallback]');
  function showFallback() {
    character.src = character.dataset.fallback;
  }
  if (character.complete && !character.naturalWidth) showFallback();
  else character.addEventListener('error', showFallback, {once: true});

  const specks = document.createDocumentFragment();
  for (let i = 0; i < 26; i += 1) {
    const speck = document.createElement('i');
    speck.className = 'particle';
    speck.style.setProperty('--size', (1 + Math.random() * 1.8).toFixed(1) + 'px');
    speck.style.setProperty('--left', (Math.random() * 100).toFixed(1) + '%');
    speck.style.setProperty('--duration', (13 + Math.random() * 17).toFixed(1) + 's');
    speck.style.setProperty('--delay', (-Math.random() * 34).toFixed(1) + 's');
    speck.style.setProperty('--drift', Math.round((Math.random() - .5) * 76) + 'px');
    speck.style.setProperty('--alpha', (.18 + Math.random() * .42).toFixed(2));
    specks.append(speck);
  }
  particles.append(specks);

  function draw() {
    pending = false;
    header.classList.toggle('scrolled', window.scrollY > 40);
    if (reduced.matches) return;
    const bounds = descent.getBoundingClientRect();
    const progress = clamp(-bounds.top / Math.max(1, bounds.height - hero.clientHeight), 0, 1);
    hero.style.setProperty('--descent', progress.toFixed(4));
    const visible = room.getBoundingClientRect();
    const offset = clamp((window.innerHeight * .55 - visible.top) * .018, -6, 6);
    room.style.setProperty('--room-y', offset.toFixed(2) + 'px');
  }
  function schedule() {
    if (!pending) {
      pending = true;
      requestAnimationFrame(draw);
    }
  }
  schedule();
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule, {passive: true});
  reduced.addEventListener('change', schedule);

  const links = [...document.querySelectorAll('.main-nav a')].filter(link => link.hash);
  if ('IntersectionObserver' in window) {
    const active = new Set();
    const observe = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) active.add(entry.target.id);
        else active.delete(entry.target.id);
      }
      const current = links.find(link => active.has(link.hash.slice(1)));
      for (const link of links) {
        if (link === current) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }, {rootMargin: '-12% 0px -40% 0px'});
    for (const link of links) observe.observe(document.getElementById(link.hash.slice(1)));
  }
})();
