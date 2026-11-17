(() => {
  'use strict';

  const key = 'observatory-theme';
  const root = document.documentElement;
  const tint = document.querySelector('meta[name="theme-color"]');

  function applyTheme(value) {
    const theme = value === 'daylight' ? 'daylight' : 'abyss';
    root.dataset.theme = theme;
    tint.content = theme === 'daylight' ? '#ecf5f0' : '#07151b';
    for (const radio of document.querySelectorAll('.theme-picker input')) {
      radio.checked = radio.value === theme;
    }
  }

  // Apply the saved appearance before the first stylesheet paints.
  try {
    applyTheme(localStorage.getItem(key));
  } catch {
    applyTheme('abyss');
  }
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) applyTheme(event.newValue);
  });

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('.menu-toggle');
    const panel = document.getElementById('site-menu-panel');
    const picker = panel.querySelector('.theme-picker');
    const nativePopover = typeof panel.showPopover === 'function';

    function isOpen() {
      return nativePopover ? panel.matches(':popover-open') : !panel.hidden;
    }

    function updateButton() {
      button.setAttribute('aria-expanded', String(isOpen()));
    }

    function closeMenu() {
      if (!isOpen()) return;
      if (nativePopover) panel.hidePopover();
      else panel.hidden = true;
      updateButton();
    }

    if (nativePopover) {
      panel.addEventListener('toggle', updateButton);
    } else {
      panel.hidden = true;
      button.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        updateButton();
      });
      document.addEventListener('pointerdown', event => {
        if (!event.target.closest('.site-menu')) closeMenu();
      });
    }
    panel.querySelector('nav').addEventListener('click', event => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('focusin', event => {
      if (!event.target.closest('.site-menu')) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && isOpen()) {
        event.preventDefault();
        closeMenu();
        button.focus();
      }
    });

    applyTheme(root.dataset.theme);
    picker.hidden = false;
    picker.addEventListener('change', event => {
      const value = event.target.value;
      applyTheme(value);
      try {
        localStorage.setItem(key, value);
      } catch {
        // Storage can be unavailable in private browsing. The tab still updates.
      }
    });
  });
})();
