const { Pool } = require('pg');

// Pool reuses connections — important for performance
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME     || 'urlshortener',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Helper: matches the mysql2 query signature so app.js needs no changes
// mysql2 returns [rows, fields] — we mimic the same shape
const query = async (text, params) => {
  // Convert MySQL ? placeholders to PostgreSQL $1, $2 ...
  let i = 0;
  const pgText = text.replace(/\?/g, () => `$${++i}`);
  const result = await pool.query(pgText, params);
  return [result.rows, result.fields];
};

module.exports = { query };