/**
 * @license MIT
 * corporate-client.js — Progressive Enhancement for corporate.raggiesoft.com
 * Implements Modern Web Guidance dark-mode-toggle (Frutiger Aero Light vs. Dark Aero)
 * and synchronizes Bootstrap 5.3.8 data-bs-theme.
 */
(function () {
  var meta = document.querySelector('meta[name="color-scheme"]');
  var toggleBtn = document.getElementById('theme-toggle');
  var toggleLabel = document.getElementById('theme-toggle-label');

  function getSystemScheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function getRenderedScheme() {
    var stored = null;
    try {
      stored = localStorage.getItem('color-scheme');
    } catch (e) {}
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return getSystemScheme();
  }

  function updateThemeState() {
    var current = getRenderedScheme();
    document.documentElement.setAttribute('data-bs-theme', current);
    if (!toggleLabel) return;
    var stored = null;
    try {
      stored = localStorage.getItem('color-scheme');
    } catch (e) {}
    if (stored === 'light' || stored === 'dark') {
      toggleLabel.textContent = current === 'dark' ? '🌙 Dark Aero (Pinned)' : '☀️ Frutiger Aero (Pinned)';
    } else {
      toggleLabel.textContent = current === 'dark' ? '🌙 System (Dark Aero)' : '☀️ System (Frutiger Aero)';
    }
  }

  if (toggleBtn && meta) {
    updateThemeState();
    toggleBtn.addEventListener('click', function () {
      var current = getRenderedScheme();
      var target = current === 'dark' ? 'light' : 'dark';
      var sys = getSystemScheme();
      try {
        if (target === sys) {
          localStorage.removeItem('color-scheme');
          meta.content = 'light dark';
        } else {
          localStorage.setItem('color-scheme', target);
          meta.content = target;
        }
      } catch (e) {
        meta.content = target;
      }
      updateThemeState();
    });

    window.addEventListener('storage', function (e) {
      if (e.key === 'color-scheme') {
        meta.content = e.newValue || 'light dark';
        updateThemeState();
      }
    });
  }

  /* Mobile Hamburger Menu Toggle (michaelpragsdale.com pattern) */
  var menuBtn = document.getElementById('mobile-menu-toggle');
  var primaryNav = document.getElementById('primary-navigation');
  if (menuBtn && primaryNav) {
    menuBtn.addEventListener('click', function () {
      var isOpen = primaryNav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }
})();
