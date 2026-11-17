(() => {
  'use strict';

  const widget = document.querySelector('[data-guide]');
  if (!widget || !window.ObservatoryGuide) return;

  const launcher = widget.querySelector('.guide-launch');
  const panel = widget.querySelector('.guide-panel');
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
    return window.ObservatoryGuide.create(JSON.parse(source.textContent), widget.dataset.home, widget.dataset.project);
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

  function setOpen(open, restoreFocus = true) {
    panel.hidden = !open;
    widget.classList.toggle('is-open', open);
    launcher.setAttribute('aria-expanded', String(open));
    if (open) {
      viewportSpace();
      const focusTarget = onTouchScreen() ? close : input;
      focusTarget.focus({preventScroll: true});
    } else if (restoreFocus) {
      launcher.focus({preventScroll: true});
    }
  }

  function appendMessage(kind, text, links = []) {
    const message = document.createElement('div');
    message.className = 'guide-message guide-' + kind;
    const speaker = document.createElement('span');
    speaker.className = 'guide-sr';
    speaker.textContent = kind === 'question' ? 'You: ' : 'Portfolio guide: ';
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

  launcher.addEventListener('click', () => setOpen(true));
  close.addEventListener('click', () => setOpen(false));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    ask(input.value, false);
  });
  suggestions.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (button) ask(button.textContent, true);
  });
  log.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('pointerdown', (event) => {
    if (!panel.hidden && !widget.contains(event.target)) setOpen(false, false);
  });
  document.addEventListener('focusin', (event) => {
    if (!panel.hidden && event.target.closest('.menu-toggle')) setOpen(false, false);
  });
  document.addEventListener('keydown', (event) => {
    if (!panel.hidden && event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    }
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', viewportSpace);
    window.visualViewport.addEventListener('scroll', viewportSpace);
  }
  widget.hidden = false;
})();
