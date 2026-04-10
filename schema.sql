-- Run this on your RDS MySQL instance after creating it

CREATE DATABASE IF NOT EXISTS urlshortener;
USE urlshortener;

-- Stores the URL mappings
CREATE TABLE IF NOT EXISTS urls (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  code         VARCHAR(16) NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  created_at   DATETIME NOT NULL,
  INDEX idx_code (code)
);

-- Stores analytics (synced from DynamoDB via Lambda or direct inserts)
-- This is a simple mirror table for the /analytics/:code API endpoint
CREATE TABLE IF NOT EXISTS url_analytics (
  code         VARCHAR(16) NOT NULL PRIMARY KEY,
  click_count  INT DEFAULT 0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Test data
INSERT INTO urls (code, original_url, created_at)
VALUES ('test1234', 'https://www.google.com', NOW())
ON DUPLICATE KEY UPDATE original_url = VALUES(original_url);
