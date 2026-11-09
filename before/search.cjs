// Synthetic replacement for the create-vite React template's demo component.
const React = require('react');
const { createElement: h, useEffect, useState } = React;
function SearchResults({ query, fetchResults }) {
  const [state, setState] = useState({ status: 'idle', items: [] });
  useEffect(() => {
    let active = true;
    if (!query.trim()) {
      setState({ status: 'idle', items: [] });
      return () => { active = false; };
    }
    setState({ status: 'loading', items: [] });
    Promise.resolve().then(() => fetchResults(query)).then(
      items => { setState({ status: 'ready', items }); },
      () => { setState({ status: 'error', items: [] }); },
    );
    return () => { active = false; };
  }, [query, fetchResults]);
  if (state.status === 'idle') return h('p', { role: 'status' }, 'Enter a search');
  if (state.status === 'loading') return h('p', { role: 'status' }, 'Searching…');
  if (state.status === 'error') return h('p', { role: 'alert' }, 'Search failed. Try again.');
  return h('ul', { 'aria-label': 'Search results' }, state.items.map(item => h('li', { key: item.id }, item.title)));
}
module.exports = { SearchResults };
