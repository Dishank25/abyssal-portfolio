(() => {
  'use strict';

  const widget = document.querySelector('[data-guide]');
  if (!widget || !window.ObservatoryGuide) return;

  const launcher = widget.querySelector('.guide-launch');
  const panel = widget.querySelector('.guide-panel');
  // Older exported homepages already have a working conversation and source
  // index. Reuse those nodes and add the same flight controls as current pages.
  const legacy = !widget.hasAttribute('data-state');
  if (!widget.querySelector('.guide-stage')) {
    const fragment = document.createElement('template');
    fragment.innerHTML = `<div class="guide-stage" hidden>
    <div class="abby-station">
      <button class="abby-craft" type="button" aria-label="Chat with Abby" aria-haspopup="dialog" aria-controls="guide-panel">
        <span class="abby-flight"><span class="abby-hover">
          <span class="abby-plume abby-plume--left" aria-hidden="true"></span>
          <span class="abby-plume abby-plume--right" aria-hidden="true"></span>
          <img class="abby-robot" alt="" width="610" height="570" decoding="async" draggable="false">
        </span></span>
      </button>
      <div class="abby-greeting" hidden>
        <button class="abby-talk" type="button" aria-haspopup="dialog" aria-controls="guide-panel">
          Hi, I’m Abby, Dishank’s robo assistant. <strong>Do you need any help?</strong>
        </button>
        <button class="abby-dismiss" type="button" aria-label="Dismiss Abby to the corner"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
      </div>
    </div>
  </div>`;
    const img = fragment.content.querySelector('.abby-robot');
    img.src = new URL('abby-flight.webp', launcher.querySelector('img').src).href;
    widget.insertBefore(fragment.content, panel);
  }
  if (legacy) {
    launcher.setAttribute('aria-label', 'Chat with Abby, Dishank’s robo assistant');
    launcher.querySelector('.guide-launch-text').textContent = 'Ask Abby';
    panel.querySelector('#guide-title').textContent = 'Abby';
    panel.querySelector('.guide-head p').textContent = 'Dishank’s robo assistant';
    panel.querySelector('.guide-close').setAttribute('aria-label', 'Close chat with Abby');
    panel.querySelector('.guide-send').textContent = 'Send';
    if (!widget.dataset.project) {
      panel.querySelector('.guide-welcome').textContent = 'Ask me about his projects, what he built them with, or his experience.';
    }
  }
  function legacyStylesReady() {
    if (!legacy || getComputedStyle(widget).getPropertyValue('--abby-size').trim()) return Promise.resolve();
    // A visitor can have the previous unversioned stylesheet in the Pages cache.
    const sheet = document.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = new URL('../assistant.css?v=abby-3', launcher.querySelector('img').src).href;
    const oldSheet = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find(link =>
      new URL(link.href).pathname === new URL(sheet.href).pathname
    );
    return new Promise(resolve => {
      sheet.onload = () => {
        if (oldSheet) oldSheet.disabled = true;
        resolve();
      };
      sheet.onerror = resolve;
      if (oldSheet) oldSheet.after(sheet);
      else document.head.append(sheet);
    });
  }

  function matchingEngine() {
    if (!legacy || window.ObservatoryGuide.name === 'Abby') return Promise.resolve(window.ObservatoryGuide);
    // Cached assets can arrive from different releases. Fetch the matching
    // local answer engine only when the visitor actually asks a question.
    const script = document.createElement('script');
    script.src = new URL('../concierge-engine.js?v=abby-3', launcher.querySelector('img').src).href;
    return new Promise((resolve, reject) => {
      script.onload = () => resolve(window.ObservatoryGuide);
      script.onerror = () => reject(new Error('Portfolio guide unavailable'));
      document.head.append(script);
    });
  }

  const stage = widget.querySelector('.guide-stage');
  const craft = widget.querySelector('.abby-craft');
  const flight = widget.querySelector('.abby-flight');
  const greeting = widget.querySelector('.abby-greeting');
  const talk = widget.querySelector('.abby-talk');
  const dismiss = widget.querySelector('.abby-dismiss');
  const portrait = widget.querySelector('.abby-robot');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let flightFrame;
  let flightVersion = 0;
  let flightTimeout;
  let restoreOnDock = false;
  const close = widget.querySelector('.guide-close');
  const scroll = widget.querySelector('.guide-scroll');
  const log = widget.querySelector('.guide-log');
  const suggestions = widget.querySelector('.guide-suggestions');
  const form = widget.querySelector('.guide-compose');
  const input = widget.querySelector('#guide-input');
  const send = widget.querySelector('.guide-send');
  const onTouchScreen = () => window.matchMedia('(pointer: coarse)').matches;
  let guidePromise;
  let pending = false;

  async function readGuide() {
    const home = new URL(widget.dataset.home, document.baseURI);
    if (home.origin !== location.origin) throw new Error('Invalid portfolio source');
    let source = document.querySelector('#guide-data');
    if (!source) {
      // Study pages load the public homepage once. Visitor questions stay in this tab.
      const response = await fetch(home, {credentials: 'same-origin'});
      if (!response.ok) throw new Error('Portfolio unavailable');
      const page = new DOMParser().parseFromString(await response.text(), 'text/html');
      source = page.querySelector('#guide-data');
    }
    if (!source) throw new Error('Missing portfolio source');
    const engine = await matchingEngine();
    return engine.create(JSON.parse(source.textContent), widget.dataset.home, widget.dataset.project);
  }

  function getGuide() {
    if (!guidePromise) {
      guidePromise = readGuide().catch((error) => {
        guidePromise = undefined;
        throw error;
      });
    }
    return guidePromise;
  }

  function viewportSpace() {
    if (panel.hidden || !window.visualViewport) return;
    const viewport = window.visualViewport;
    const keyboard = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
    widget.style.setProperty('--guide-keyboard', keyboard + 'px');
    widget.style.setProperty('--guide-space', viewport.height + 'px');
  }

  function setScene(state) {
    widget.dataset.state = state;
    panel.hidden = state !== 'chat';
    stage.hidden = !['entering', 'greeting', 'docking'].includes(state);
    greeting.hidden = state !== 'greeting';
    craft.tabIndex = state === 'greeting' ? 0 : -1;
    launcher.tabIndex = state === 'docked' ? 0 : -1;
    widget.classList.toggle('is-open', state === 'chat');
    launcher.setAttribute('aria-expanded', String(state === 'chat'));
  }

  function stopFlight() {
    flightVersion++;
    clearTimeout(flightTimeout);
    cancelAnimationFrame(flightFrame);
    flight.style.removeProperty('transform');
  }

  function keyframe(time, x, y, scale, bank, yaw, pitch = 0) {
    return {time, pose: [x, y, scale, bank, yaw, pitch]};
  }

  // Blend each pose continuously. At a turnaround, the pilot banks and
  // decelerates to zero before reversing direction instead of pivoting abruptly.
  function fly(stops, duration, done) {
    stopFlight();
    if (motion.matches) {
      done();
      return;
    }
    const version = flightVersion;
    const started = performance.now();
    const speeds = stops.map((stop, i) => stop.pose.map((value, axis) => {
      if (i === 0 || i === stops.length - 1) return 0;
      const before = stops[i - 1];
      const after = stops[i + 1];
      const incoming = (value - before.pose[axis]) / (stop.time - before.time);
      const outgoing = (after.pose[axis] - value) / (after.time - stop.time);
      return incoming * outgoing > 0 ? 2 * incoming * outgoing / (incoming + outgoing) : 0;
    }));

    function step() {
      if (version !== flightVersion) return;
      clearTimeout(flightTimeout);
      cancelAnimationFrame(flightFrame);
      const elapsed = (performance.now() - started) / duration;
      if (elapsed >= 1) {
        stopFlight();
        done();
        return;
      }
      const next = stops.findIndex(stop => stop.time > elapsed);
      const before = stops[next - 1], after = stops[next];
      const interval = after.time - before.time;
      const t = (elapsed - before.time) / interval;
      const blend = t*t*(3 - 2*t);
      const [x,y,scale,bank,yaw,pitch] = before.pose.map((a, axis) =>
        a + (after.pose[axis] - a) * blend +
        interval * (speeds[next-1][axis] * t*(1-t)*(1-t) - speeds[next][axis] * t*t*(1-t))
      );
      flight.style.transform = 'perspective(720px) translate3d('+x+'px,'+y+'px,0) ' +
        'scale('+scale+') rotateZ('+bank+'deg) rotateY('+yaw+'deg) rotateX('+pitch+'deg)';
      flightFrame = requestAnimationFrame(step);
      // Some embedded webviews pause the frame clock without hiding the page.
      flightTimeout = setTimeout(step, 55);
    }
    step();
  }

  function arrive() {
    if (widget.dataset.state !== 'preparing') return;
    setScene('entering');
    const rect = craft.getBoundingClientRect();
    const distance = rect.left + rect.width * 1.9;
    const lift = Math.min(window.innerHeight * .19, 145);
    fly([
      keyframe(0, -distance, lift, .22, -26, -53, 9),
      keyframe(.33, -distance * .61, lift * .12, .52, -17, -31, 5),
      keyframe(.66, rect.width * .21, -lift * .17, 1.07, 11, 13, -6),
      keyframe(.85, -rect.width * .025, 3, .99, -3, -2),
      keyframe(1, 0, 0, 1, 0, 0),
    ], 1820, () => setScene('greeting'));
  }

  function dock(restoreFocus = false) {
    const state = widget.dataset.state;
    if (state === 'docked' || state === 'docking') return;
    restoreOnDock = restoreFocus;
    const start = state === 'chat' ? panel.querySelector('.guide-emblem').getBoundingClientRect() :
      flight.getBoundingClientRect();
    function finish() {
      setScene('docked');
      if (restoreOnDock) launcher.focus({preventScroll: true});
      restoreOnDock = false;
    }
    stopFlight();
    if (state === 'preparing' || !start.width || motion.matches) {
      finish();
      return;
    }
    setScene('docking');
    const base = craft.getBoundingClientRect();
    const target = launcher.querySelector('img').getBoundingClientRect();
    const centerX = rect => rect.left + rect.width / 2;
    const centerY = rect => rect.top + rect.height / 2;
    const fromX = centerX(start) - centerX(base);
    const fromY = centerY(start) - centerY(base);
    const toX = centerX(target) - centerX(base);
    const toY = centerY(target) - centerY(base);
    const fromScale = start.width / base.width;
    const toScale = target.width / base.width;
    const arc = Math.min(65, Math.hypot(toX-fromX, toY-fromY) * .16);
    fly([
      keyframe(0, fromX, fromY, fromScale, 0, 0),
      keyframe(.24, fromX + (toX-fromX)*.14, fromY + (toY-fromY)*.055 - arc*.43, fromScale*.91, 13, -19, 4),
      keyframe(.78, fromX + (toX-fromX)*.91, fromY + (toY-fromY)*.84 - arc*.23, toScale*1.1, 10, -11),
      keyframe(1, toX, toY, toScale, 0, 0),
    ], state === 'chat' ? 580 : 880, finish);
  }

  function openChat() {
    if (widget.dataset.state === 'docking') return;
    stopFlight();
    setScene('chat');
    viewportSpace();
    (onTouchScreen() ? close : input).focus({preventScroll: true});
  }

  function appendMessage(kind, text, links = []) {
    const message = document.createElement('div');
    message.className = 'guide-message guide-' + kind;
    const speaker = document.createElement('span');
    speaker.className = 'guide-sr';
    speaker.textContent = kind === 'question' ? 'You: ' : 'Abby: ';
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    message.append(speaker, paragraph);
    if (links.length) {
      const nav = document.createElement('div');
      nav.className = 'guide-links';
      for (const item of links) {
        const target = new URL(item.url, document.baseURI);
        if (!['http:', 'https:'].includes(target.protocol)) continue;
        const link = document.createElement('a');
        link.href = target.href;
        link.textContent = item.label;
        nav.append(link);
      }
      message.append(nav);
    }
    log.append(message);
    return message;
  }

  function displaySuggestions(items) {
    suggestions.textContent = '';
    for (const title of items) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = title;
      suggestions.append(button);
    }
  }

  async function ask(question, fromSuggestion) {
    const value = question.trim();
    if (!value || pending) return;
    pending = true;
    send.disabled = true;
    input.value = '';
    appendMessage('question', value);
    displaySuggestions([]);
    scroll.scrollTop = scroll.scrollHeight;
    let answer;
    try {
      const guide = await getGuide();
      answer = guide.reply(value);
    } catch {
      input.value = value;
      answer = {
        text: 'I couldn’t load the portfolio notes. Try sending your question again, or open the portfolio directly.',
        links: [{label: 'Open the portfolio', url: widget.dataset.home}],
        prompts: []
      };
    } finally {
      pending = false;
      send.disabled = false;
    }
    const reply = appendMessage('reply', answer.text, answer.links);
    displaySuggestions(answer.prompts || []);
    scroll.scrollTop += reply.getBoundingClientRect().top - scroll.getBoundingClientRect().top - 12;
    if (!panel.hidden) {
      const target = onTouchScreen() && fromSuggestion ? scroll : input;
      target.focus({preventScroll: true});
    }
  }

  launcher.addEventListener('click', openChat);
  craft.addEventListener('click', openChat);
  talk.addEventListener('click', openChat);
  dismiss.addEventListener('click', () => dock(true));
  close.addEventListener('click', () => dock(true));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    ask(input.value, false);
  });
  suggestions.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (button) ask(button.textContent, true);
  });
  log.addEventListener('click', (event) => {
    if (event.target.closest('a')) dock(false);
  });
  document.addEventListener('pointerdown', (event) => {
    if (widget.contains(event.target)) return;
    // The stage never traps an outside gesture or covers the navigation.
    restoreOnDock = false;
    if (!panel.hidden || event.target.closest('a, button, input, select, textarea')) dock(false);
  });
  document.addEventListener('focusin', (event) => {
    if (event.target.closest('.site-menu')) {
      restoreOnDock = false;
      dock(false);
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !['docked','docking'].includes(widget.dataset.state)) {
      event.preventDefault();
      dock(widget.contains(document.activeElement));
    }
    if (event.key === 'Tab' && widget.dataset.state === 'docking') restoreOnDock = false;
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', viewportSpace);
    window.visualViewport.addEventListener('scroll', viewportSpace);
  }
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      stopFlight();
      setScene('docked');
    }
  });

  const visitKey = 'observatory-abby-arrival-v1';
  let firstVisit = true;
  try {
    firstVisit = !sessionStorage.getItem(visitKey);
    sessionStorage.setItem(visitKey, 'seen');
  } catch {
    // A same-site navigation and reload can still suppress a duplicate arrival
    // when browser settings disable session storage.
    const home = new URL(widget.dataset.home, document.baseURI);
    const previous = document.referrer && new URL(document.referrer);
    const withinPortfolio = previous && previous.origin === home.origin && previous.pathname.startsWith(home.pathname);
    firstVisit = !withinPortfolio && !(history.state && history.state.abbySeen);
    try { history.replaceState(Object.assign({}, history.state, {abbySeen: true}), ''); } catch {}
  }
  function start() {
    widget.hidden = false;
    setScene(firstVisit ? 'preparing' : 'docked');
    if (!firstVisit) return;
    if (portrait.complete) {
      if (portrait.naturalWidth) arrive();
      else setScene('docked');
    } else {
      portrait.addEventListener('load', arrive, {once: true});
      portrait.addEventListener('error', () => {
        if (widget.dataset.state === 'preparing') setScene('docked');
      }, {once: true});
    }
  }
  legacyStylesReady().then(start);
})();
