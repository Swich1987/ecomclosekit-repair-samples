const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const { SearchResults } = require(`../${process.env.DEMO_VARIANT || 'after'}/search.cjs`);
global.IS_REACT_ACT_ENVIRONMENT = true;
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
async function scenario(run) {
  const dom = new JSDOM('<main id="root"></main>');
  global.window = dom.window; global.document = dom.window.document;
  const root = createRoot(document.getElementById('root'));
  const requests = {};
  const fetchResults = query => (requests[query] = deferred()).promise;
  const render = query => act(async () => root.render(React.createElement(SearchResults, { query, fetchResults })));
  const text = () => document.body.textContent;
  try { await run({ requests, render, text }); }
  finally { await act(async () => root.unmount()); dom.window.close(); delete global.window; delete global.document; }
}
test('async UI: a slow previous result cannot overwrite the latest result', () => scenario(async ({ requests, render, text }) => {
  await render('alpha'); await render('beta');
  await act(async () => requests.beta.resolve([{ id: 'b', title: 'Beta result' }]));
  assert.equal(text(), 'Beta result');
  await act(async () => requests.alpha.resolve([{ id: 'a', title: 'Alpha stale result' }]));
  assert.equal(text(), 'Beta result');
}));
test('async UI: a previous error cannot replace current success', () => scenario(async ({ requests, render, text }) => {
  await render('alpha'); await render('beta');
  await act(async () => requests.beta.resolve([{ id: 'b', title: 'Beta result' }]));
  await act(async () => requests.alpha.reject(new Error('Synthetic failure')));
  assert.equal(text(), 'Beta result');
}));
test('async UI: clearing the search cancels stale work; new errors remain visible', () => scenario(async ({ requests, render, text }) => {
  await render('alpha'); await render('');
  await act(async () => requests.alpha.resolve([{ id: 'a', title: 'Stale result' }]));
  assert.equal(text(), 'Enter a search');
  await render('gamma');
  await act(async () => requests.gamma.reject(new Error('Current failure')));
  assert.equal(text(), 'Search failed. Try again.');
}));
