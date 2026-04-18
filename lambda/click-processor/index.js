const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
});

exports.handler = async (event) => {
  for (const record of event.Records) {
    const data = JSON.parse(record.body);
    const { code } = data;

    try {
      await pool.query(`
        INSERT INTO url_analytics (code, click_count)
        VALUES ($1, 1)
        ON CONFLICT (code)
        DO UPDATE SET click_count = url_analytics.click_count + 1
      `, [code]);

      console.log(`Updated analytics for ${code}`);
    } catch (err) {
      console.error('DB error:', err);
    }
  }
};