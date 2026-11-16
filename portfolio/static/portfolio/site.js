(() => {
  'use strict';
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const hero = document.querySelector('.hero');
  const descent = document.querySelector('.descent');
  const room = document.querySelector('.room');
  const particles = document.querySelector('.particles');
  const motionButton = document.querySelector('[data-motion]');
  const character = hero.querySelector('[data-character-motion]');
  const stillSource = character.getAttribute('src');
  let motionSource = character.dataset.characterMotion;
  character.addEventListener('error', () => {
    if (character.getAttribute('src') === motionSource) {
      motionSource = stillSource;
      character.setAttribute('src', stillSource);
    }
  }, {once: true});
  const motionLabel = motionButton.querySelector('[data-motion-label]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (x, min, max) => Math.min(Math.max(x, min), max);
  let saved = null;
  try { saved = localStorage.getItem('dishank-motion'); } catch { /* Storage is optional. */ }
  let paused = saved === null ? reduced.matches : saved === 'paused';
  let pending = false;
  let x = 0;
  let y = 0;

  const specks = document.createDocumentFragment();
  for (let i = 0; i < 26; i += 1) {
    const speck = document.createElement('i');
    speck.className = 'particle';
    const random = () => Math.random();
    speck.style.setProperty('--size', (1 + random() * 1.8).toFixed(1) + 'px');
    speck.style.setProperty('--left', (random() * 100).toFixed(1) + '%');
    speck.style.setProperty('--duration', (13 + random() * 17).toFixed(1) + 's');
    speck.style.setProperty('--delay', (-random() * 34).toFixed(1) + 's');
    speck.style.setProperty('--drift', Math.round((random() - .5) * 76) + 'px');
    speck.style.setProperty('--alpha', (.18 + random() * .42).toFixed(2));
    specks.append(speck);
  }
  particles.append(specks);

  function draw() {
    pending = false;
    header.classList.toggle('scrolled', window.scrollY > 40);
    if (paused) return;
    const bounds = descent.getBoundingClientRect();
    const progress = clamp(-bounds.top / Math.max(1, bounds.height - hero.clientHeight), 0, 1);
    hero.style.setProperty('--descent', progress.toFixed(4));
    hero.style.setProperty('--horizontal', x.toFixed(2) + 'px');
    hero.style.setProperty('--vertical', y.toFixed(2) + 'px');
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
  function applyMotion() {
    character.setAttribute('src', paused ? stillSource : motionSource);
    root.classList.toggle('motion-off', paused);
    root.classList.toggle('motion-allowed', !paused && saved === 'play');
    motionButton.setAttribute('aria-pressed', String(paused));
    motionLabel.textContent = paused ? 'Play motion' : 'Pause motion';
    schedule();
  }
  motionButton.hidden = false;
  motionButton.addEventListener('click', () => {
    paused = !paused;
    saved = paused ? 'paused' : 'play';
    try { localStorage.setItem('dishank-motion', saved); } catch { /* Still applies here. */ }
    applyMotion();
  });
  reduced.addEventListener('change', () => {
    if (saved === null) { paused = reduced.matches; applyMotion(); }
  });
  applyMotion();
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule, {passive: true});
  hero.addEventListener('pointermove', event => {
    if (paused || !pointer.matches) return;
    const box = hero.getBoundingClientRect();
    x = ((event.clientX - box.left) / box.width - .5) * -9;
    y = ((event.clientY - box.top) / box.height - .5) * -6;
    schedule();
  }, {passive:true});
  hero.addEventListener('pointerleave', () => { x = 0; y = 0; schedule(); });

  const projects = [...document.querySelectorAll('details.project')];
  function showLinkedProject() {
    const project = projects.find(item => '#' + item.id === window.location.hash);
    if (!project) return;
    project.open = true;
    requestAnimationFrame(() => {
      project.scrollIntoView({block:'start', behavior:'instant'});
    });
  }
  window.addEventListener('hashchange', showLinkedProject);
  showLinkedProject();

  const links = [...document.querySelectorAll('.main-nav a')];
  if ('IntersectionObserver' in window) {
    const active = new Set();
    const observe = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) active.add(entry.target.id);
        else active.delete(entry.target.id);
      }
      const current = links.find(link => active.has(link.hash.slice(1)));
      for (const link of links) {
        if (link === current) link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      }
    }, {rootMargin:'-12% 0px -40% 0px'});
    for (const link of links) observe.observe(document.getElementById(link.hash.slice(1)));
  }

})();
