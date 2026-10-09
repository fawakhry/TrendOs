import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../trendos-ui01-mobile-tools.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../trendos-ui01-mobile-tools.css', import.meta.url), 'utf8');

function createHarness({ loading = false } = {}) {
  const watchers = [];
  const listeners = {};
  let desktopListener;
  function makeElement(tag = 'BUTTON') {
    const attrs = {};
    const classes = new Set();
    const events = {};
    const element = {
      tagName: tag, attrs, events, children: [], parentElement: null,
      classList: { add: x => classes.add(x), contains: x => classes.has(x) },
      getAttribute: x => attrs[x] ?? null,
      setAttribute: (x, y) => { attrs[x] = String(y); },
      addEventListener: (x, fn) => { (events[x] ||= []).push(fn); },
      insertBefore: (child) => { child.parentElement = element; element.children.unshift(child); },
      closest: selector => selector === 'button' && element.tagName === 'BUTTON' ? element : null,
      focus: () => { element.focused = true; }
    };
    return element;
  }
  const main = makeElement('SECTION');
  const toolbar = makeElement('DIV');
  toolbar.id = '';
  const existing = [makeElement('BUTTON'), makeElement('BUTTON'), makeElement('BUTTON')];
  for (const item of existing) { item.parentElement = toolbar; toolbar.children.push(item); }
  existing[1].classList.add('hidden'); // Existing permission visibility may be changed by TrendOS.
  main.querySelector = selector => selector === '.top-actions' ? toolbar : null;
  const document = {
    readyState: loading ? 'loading' : 'complete',
    getElementById: id => id === 'mainView' ? main : null,
    createElement: tag => makeElement(tag.toUpperCase()),
    addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn); }
  };
  const window = {
    matchMedia: () => ({ addEventListener: (_, fn) => { desktopListener = fn; } }),
    MutationObserver: class { constructor(fn) { watchers.push(fn); } observe() {} }
  };
  const run = () => runInNewContext(source, { window, document }, { filename: 'trendos-ui01-mobile-tools.js' });
  const dispatch = (target, type, payload = {}) => (target.events[type] || []).forEach(fn => fn(payload));
  return { run, main, toolbar, existing, listeners, watchers, getDesktopListener: () => desktopListener, dispatch };
}

test('UI-01 mounts only once and preserves all original button objects, their handlers, and hidden role classes', () => {
  const h = createHarness();
  const original = h.existing.slice();
  h.run(); h.run();
  assert.equal(h.toolbar.children.length, 4);
  assert.equal(h.toolbar.getAttribute('data-ui01-ready'), 'true');
  assert.equal(h.toolbar.getAttribute('data-ui01-open'), 'false');
  assert.equal(h.toolbar.children[0].getAttribute('aria-expanded'), 'false');
  assert.deepEqual(h.toolbar.children.slice(1), original);
  assert.ok(h.existing[1].classList.contains('hidden'));
  assert.ok(h.toolbar.classList.contains('tm-ui01-mobile-tools'));
});

test('UI-01 opens and closes via accessible button, Escape, desktop switch and logout', () => {
  const h = createHarness(); h.run();
  const toggle = h.toolbar.children[0];
  h.dispatch(toggle, 'click');
  assert.equal(h.toolbar.getAttribute('data-ui01-open'), 'true');
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  (h.listeners.keydown || []).forEach(fn => fn({ key: 'Escape' }));
  assert.equal(h.toolbar.getAttribute('data-ui01-open'), 'false');
  assert.equal(toggle.focused, true);
  h.dispatch(toggle, 'click');
  h.getDesktopListener()({ matches: true });
  assert.equal(h.toolbar.getAttribute('data-ui01-open'), 'false');
  h.dispatch(toggle, 'click');
  h.main.classList.add('hidden');
  h.watchers[0]();
  assert.equal(h.toolbar.getAttribute('data-ui01-open'), 'false');
});

test('UI-01 closes after choosing existing action without intercepting it', () => {
  const h = createHarness(); h.run();
  const toggle = h.toolbar.children[0], action = h.existing[0];
  let count = 0;
  action.addEventListener('click', () => { count++; });
  h.dispatch(toggle, 'click');
  h.dispatch(action, 'click');
  h.dispatch(h.toolbar, 'click', { target: action });
  assert.equal(count, 1);
  assert.equal(h.toolbar.getAttribute('data-ui01-open'), 'false');
});

test('UI-01 waits for the DOM when loaded early and does not touch customer-only surfaces', () => {
  const h = createHarness({ loading: true });
  h.run();
  assert.equal(h.toolbar.children.length, 3);
  h.listeners.DOMContentLoaded[0]();
  assert.equal(h.toolbar.children.length, 4);
});

test('UI-01 CSS has bounded mobile-only collapse, desktop-safe unhide, focus and hidden role preservation', () => {
  assert.match(css, /max-width:\s*720px/);
  assert.match(css, /min-width:\s*721px/);
  assert.match(css, /data-ui01-open="false"/);
  assert.match(css, /button\.hidden/);
  assert.match(css, /focus-visible/);
  assert.doesNotMatch(source, /(?:fetch|XMLHttpRequest|localStorage|sessionStorage|innerHTML|\.remove\()/);
});
