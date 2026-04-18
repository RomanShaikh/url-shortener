const { Pool } = require('pg');

console.log('[DB] Initializing PostgreSQL connection pool...');
console.log(`[DB] Host: ${process.env.DB_HOST}`);
console.log(`[DB] Port: ${process.env.DB_PORT || 5432}`);
console.log(`[DB] Database: ${process.env.DB_NAME}`);
console.log(`[DB] User: ${process.env.DB_USER}`);

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME     || 'urlshortener',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Log when a new DB connection is acquired from the pool
pool.on('connect', () => {
  console.log('[DB] New connection acquired from pool');
});

pool.on('error', (err) => {
  console.error('[DB POOL ERROR]', err.message);
});

// Test the connection on startup
pool.query('SELECT NOW()').then(() => {
  console.log('[DB] Connection test successful — PostgreSQL is reachable');
}).catch((err) => {
  console.error('[DB] Connection test FAILED:', err.message);
});

const query = async (text, params) => {
  // Convert MySQL ? placeholders to PostgreSQL $1, $2 ...
  let i = 0;
  const pgText = text.replace(/\?/g, () => `$${++i}`);

  console.log(`[DB QUERY] ${pgText}`);
  if (params && params.length) {
    console.log(`[DB PARAMS] ${JSON.stringify(params)}`);
  }

  const start = Date.now();
  const result = await pool.query(pgText, params);
  const ms = Date.now() - start;

  console.log(`[DB RESULT] ${result.rowCount} row(s) returned in ${ms}ms`);
  return [result.rows, result.fields];
};

module.exports = { query };