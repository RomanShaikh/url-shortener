const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const queue = require('./queue');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// ─── Request logger middleware ───────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[REQUEST] ${req.method} ${req.path} | IP: ${req.ip}`);
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[RESPONSE] ${req.method} ${req.path} | Status: ${res.statusCode} | ${ms}ms`);
  });
  next();
});

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  console.log('[HEALTH] Health check called');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── POST /shorten ───────────────────────────────────────────────────────────
app.post('/shorten', async (req, res) => {
  const { url } = req.body;
  console.log(`[SHORTEN] Received request to shorten: ${url}`);

  if (!url) {
    console.warn('[SHORTEN] Missing url in request body');
    return res.status(400).json({ error: 'url is required' });
  }

  const code = uuidv4().slice(0, 8);
  console.log(`[SHORTEN] Generated short code: ${code}`);

  try {
    console.log(`[DB] Inserting code=${code} into urls table`);
    await db.query(
      'INSERT INTO urls (code, original_url) VALUES ($1, $2)',
      [code, url]
    );
    console.log(`[DB] Insert successful for code=${code}`);

    const shortUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/${code}`;
    console.log(`[SHORTEN] Short URL created: ${shortUrl}`);

    res.json({
      short_code: code,
      short_url: shortUrl,
      original_url: url,
    });
  } catch (err) {
    console.error(`[DB ERROR] Failed to insert url. code=${code} error=${err.message}`);
    res.status(500).json({ error: 'Failed to create short URL' });
  }
});

// ─── GET /:code — redirect ───────────────────────────────────────────────────
app.get('/:code', async (req, res) => {
  const { code } = req.params;

  // Skip favicon requests
  if (code === 'favicon.ico') return res.status(204).end();

  console.log(`[REDIRECT] Lookup request for code=${code}`);

  try {
    console.log(`[DB] Querying original_url for code=${code}`);
    const [rows] = await db.query(
      'SELECT original_url FROM urls WHERE code = $1',
      [code]
    );

    if (!rows.length) {
      console.warn(`[REDIRECT] Code not found: ${code}`);
      return res.status(404).json({ error: 'URL not found' });
    }

    const originalUrl = rows[0].original_url;
    console.log(`[DB] Found URL for code=${code}: ${originalUrl}`);

    // Push click event to SQS — non-blocking
    console.log(`[SQS] Sending click event for code=${code}`);
    queue.sendClickEvent({
      code,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    }).then(() => {
      console.log(`[SQS] Click event sent successfully for code=${code}`);
    }).catch((err) => {
      console.error(`[SQS ERROR] Failed to send click event for code=${code}: ${err.message}`);
    });

    console.log(`[REDIRECT] Redirecting code=${code} → ${originalUrl}`);
    res.redirect(302, originalUrl);

  } catch (err) {
    console.error(`[REDIRECT ERROR] code=${code} error=${err.message}`);
    res.status(500).json({ error: 'Redirect failed' });
  }
});

// ─── GET /analytics/:code ────────────────────────────────────────────────────
app.get('/analytics/:code', async (req, res) => {
  const { code } = req.params;
  console.log(`[ANALYTICS] Fetching click count for code=${code}`);

  try {
    console.log(`[DB] Querying url_analytics for code=${code}`);
    const [rows] = await db.query(
      'SELECT click_count FROM url_analytics WHERE code = $1',
      [code]
    );

    const count = rows.length ? rows[0].click_count : 0;
    console.log(`[ANALYTICS] code=${code} click_count=${count}`);

    res.json({ code, click_count: count });
  } catch (err) {
    console.error(`[ANALYTICS ERROR] code=${code} error=${err.message}`);
    res.status(500).json({ error: 'Analytics fetch failed' });
  }
});

module.exports = app;