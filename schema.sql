-- Run this on your RDS PostgreSQL instance after creating it
-- Connect using: psql -h YOUR_RDS_ENDPOINT -U postgres -d urlshortener

-- Stores the URL mappings
CREATE TABLE IF NOT EXISTS urls (
  id           SERIAL PRIMARY KEY,
  code         VARCHAR(16) NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_code ON urls(code);

-- Stores analytics (updated by Lambda via DynamoDB sync)
CREATE TABLE IF NOT EXISTS url_analytics (
  code         VARCHAR(16) NOT NULL PRIMARY KEY,
  click_count  INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Test data
INSERT INTO urls (code, original_url)
VALUES ('test1234', 'https://www.google.com')
ON CONFLICT (code) DO NOTHING;