/* TrendOS UI-01: mobile employee tools. Presentation only; no source-of-truth or permission changes. */
(function (win, doc) {
  'use strict';
  function mountMobileTools() {
    var main = doc.getElementById('mainView');
    var actions = main && main.querySelector('.top-actions');
    if (!main || !actions || actions.getAttribute('data-ui01-ready') === 'true') return;

    // Keep every existing action node in place: original click handlers and role visibility survive.
    var toggle = doc.createElement('button');
    toggle.type = 'button';
    toggle.className = 'ghost tm-ui01-toggle';
    toggle.textContent = '☰ قائمة الأدوات';
    if (!actions.id) actions.id = 'tm-ui01-action-list';
    toggle.setAttribute('aria-controls', actions.id);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'فتح أو إغلاق قائمة أدوات الموظف');
    actions.insertBefore(toggle, actions.firstChild);
    actions.classList.add('tm-ui01-mobile-tools');
    actions.setAttribute('data-ui01-open', 'false');
    actions.setAttribute('data-ui01-ready', 'true');

    function setOpen(open) {
      actions.setAttribute('data-ui01-open', open ? 'true' : 'false');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    toggle.addEventListener('click', function () {
      setOpen(actions.getAttribute('data-ui01-open') !== 'true');
    });
    actions.addEventListener('click', function (event) {
      var button = event.target && event.target.closest && event.target.closest('button');
      if (button && button !== toggle && button.parentElement === actions) setOpen(false);
    });
    doc.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && actions.getAttribute('data-ui01-open') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    var desktop = win.matchMedia && win.matchMedia('(min-width: 721px)');
    if (desktop && desktop.addEventListener) {
      desktop.addEventListener('change', function (event) { if (event.matches) setOpen(false); });
    }
    if (win.MutationObserver) {
      var watcher = new win.MutationObserver(function () {
        if (main.classList.contains('hidden')) setOpen(false);
      });
      watcher.observe(main, { attributes: true, attributeFilter: ['class'] });
    }
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', mountMobileTools, { once: true });
  else mountMobileTools();
})(window, document);
