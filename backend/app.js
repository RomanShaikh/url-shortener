const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const queue = require('./queue');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Health check — used by ALB/EKS health probes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST /shorten — create a short URL
// Body: { url: "https://..." }
app.post('/shorten', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  const code = uuidv4().slice(0, 8); // e.g. "a1b2c3d4"

  try {
    await db.query(
      'INSERT INTO urls (code, original_url, created_at) VALUES (?, ?, NOW())',
      [code, url]
    );
    res.json({
      short_code: code,
      short_url: `${process.env.BASE_URL || 'http://localhost:3000'}/${code}`,
      original_url: url,
    });
  } catch (err) {
    console.error('DB insert error:', err);
    res.status(500).json({ error: 'Failed to create short URL' });
  }
});

// GET /:code — redirect to original URL + log click via SQS
app.get('/:code', async (req, res) => {
  const { code } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT original_url FROM urls WHERE code = ?',
      [code]
    );
    if (!rows.length) return res.status(404).json({ error: 'URL not found' });

    const originalUrl = rows[0].original_url;

    // Fire-and-forget: push click event to SQS (Lambda will consume it)
    await queue.sendClickEvent({
      code,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    });

    res.redirect(302, originalUrl);
  } catch (err) {
    console.error('Redirect error:', err);
    res.status(500).json({ error: 'Redirect failed' });
  }
});

// GET /analytics/:code — view click count for a short URL
app.get('/analytics/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT click_count FROM url_analytics WHERE code = ?',
      [code]
    );
    res.json({
      code,
      click_count: rows.length ? rows[0].click_count : 0,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Analytics fetch failed' });
  }
});

module.exports = app;
