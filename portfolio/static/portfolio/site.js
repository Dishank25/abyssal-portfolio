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

  // Older static exports embed an earlier education list in both the page and the guide.
  const educationTitle = document.querySelector('.education h3');
  if (educationTitle && educationTitle.textContent.trim() === 'Education & training') {
    const source = document.getElementById('guide-data');
    const guide = JSON.parse(source.textContent);
    const list = document.querySelector('.education ul');
    const educationUrl = new URL('education.json?v=exchange-1', document.currentScript.src);

    function displayEducation(items) {
      const rows = document.createDocumentFragment();
      for (const item of items) {
        const row = document.createElement('li');
        if (item.date) {
          const date = document.createElement('span');
          date.textContent = item.date;
          row.append(date);
        }
        const detail = document.createElement('div');
        detail.textContent = item.title;
        const institution = document.createElement('small');
        institution.textContent = item.institution;
        detail.append(institution);
        row.append(detail);
        rows.append(row);
      }
      list.textContent = '';
      list.append(rows);
      guide.education = items;
      source.textContent = JSON.stringify(guide);
    }

    educationTitle.textContent = 'Education';
    displayEducation(guide.education.filter(item => item.institution !== 'Euron'));
    fetch(educationUrl).then(response => {
      if (response.ok) return response.json();
      throw new Error('Education unavailable');
    }).then(displayEducation).catch(() => {
      // The remaining embedded records are also available when the visitor is offline.
    });
  }

  const header = document.querySelector('.site-header');
  // Upgrade older static homepages that still contain the wordmark and link ornaments.
  const wordmark = header.querySelector('.brand');
  if (wordmark) {
    wordmark.className = 'observatory-mark';
    wordmark.setAttribute('aria-hidden', 'true');
    wordmark.querySelector('span')?.remove();
    header.querySelector('.main-nav a[href$="#work"]').textContent = 'My works';
    const heading = document.getElementById('work-title');
    heading.firstChild.textContent = 'My ';
    heading.querySelector('em').textContent = 'works.';
    document.querySelector('.hero-role .slash')?.replaceWith('in');
    const ornaments = document.querySelectorAll(
      '.hero-base, .hero-role > span:empty, main .chapter, .room > figcaption, .main-nav a > span[aria-hidden], ' +
      '.action > span[aria-hidden], .project-action > span[aria-hidden], ' +
      '.contact-links a > span[aria-hidden], footer .return > span[aria-hidden]'
    );
    for (const ornament of ornaments) ornament.remove();
    if (!getComputedStyle(document.documentElement).getPropertyValue('--section-pin-top')) {
      const sheet = document.querySelector('link[href*="/site.css"]');
      if (sheet) {
        const url = new URL(sheet.href);
        url.searchParams.set('v', 'section-5');
        sheet.href = url.href;
      }
    }
  }
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
