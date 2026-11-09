// Synthetic adaptation of Express's MIT-licensed web-service example.
const express = require('express');
function createApp() {
  const app = express();
  const projects = [
    { id: 'p1', owner: 'alice', title: 'Alpha' },
    { id: 'p2', owner: 'bob', title: 'Beta' },
  ];
  app.use(express.json({ limit: '16kb' }));
  app.post('/api/quotes', (req, res) => {
    const body = req.body;
    if (!body || typeof body.sku !== 'string') {
      return res.status(400).json({ error: 'Supply sku and integer quantity from 1 to 100' });
    }
    const prices = { starter: 1900, pro: 4900 };
    if (!Object.hasOwn(prices, body.sku)) return res.status(404).json({ error: 'Unknown SKU' });
    return res.json({ sku: body.sku, quantity: body.quantity, totalCents: prices[body.sku] * body.quantity });
  });
  // TEST FIXTURE ONLY: a real app must obtain identity from verified server-side auth.
  // This demo header intentionally substitutes for that upstream dependency.
  app.use('/api/projects', (req, res, next) => {
    const user = req.get('x-demo-user');
    if (!['alice', 'bob'].includes(user)) return res.status(401).json({ error: 'Sign in' });
    req.user = { id: user };
    next();
  });
  app.get('/api/projects', (req, res) => res.json(projects));
  app.get('/api/projects/:id', (req, res) => {
    const project = projects.find(p => p.id === req.params.id);
    return project ? res.json(project) : res.status(404).json({ error: 'Not found' });
  });
  app.patch('/api/projects/:id', (req, res) => {
    const project = projects.find(p => p.id === req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    if (typeof req.body?.title !== 'string' || req.body.title.trim().length < 1 || req.body.title.length > 80)
      return res.status(400).json({ error: 'Title must contain 1–80 characters' });
    project.title = req.body.title.trim();
    return res.json(project);
  });
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' });
    return res.status(500).json({ error: 'Unexpected error' });
  });
  return app;
}
module.exports = { createApp };
