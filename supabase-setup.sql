-- ─────────────────────────────────────────────────────────────────
-- Mastr Buildr — Supabase Database Setup
-- Run this entire file in your Supabase SQL Editor:
-- supabase.com → Your Project → SQL Editor → New Query → Paste → Run
-- ─────────────────────────────────────────────────────────────────


-- ── 1. Newsletter Subscribers Table ──────────────────────────────

CREATE TABLE IF NOT EXISTS subscribers (
  id          BIGSERIAL PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  source      TEXT DEFAULT 'website_newsletter',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  active      BOOLEAN DEFAULT TRUE
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers (email);

-- Row-level security: allow anon insert (for API), deny reads
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon insert"
  ON subscribers FOR INSERT
  TO anon
  WITH CHECK (true);

-- Block anon reads (subscribers list is private)
CREATE POLICY "Block anon select"
  ON subscribers FOR SELECT
  TO anon
  USING (false);


-- ── 2. Live Project Counter Table ────────────────────────────────

CREATE TABLE IF NOT EXISTS project_counter (
  id          INT PRIMARY KEY DEFAULT 1,   -- single-row table
  count       INT NOT NULL DEFAULT 7,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)     -- enforce only 1 row
);

-- Insert the initial row
INSERT INTO project_counter (id, count)
VALUES (1, 7)
ON CONFLICT (id) DO NOTHING;

-- RLS: allow anon reads (counter is public), block anon writes
ALTER TABLE project_counter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read counter"
  ON project_counter FOR SELECT
  TO anon
  USING (true);

-- Writes are done via service_role key in the Netlify function
-- so no anon write policy is needed here


-- ── 3. Verify setup ──────────────────────────────────────────────

SELECT 'subscribers' AS table_name, COUNT(*) AS rows FROM subscribers
UNION ALL
SELECT 'project_counter', COUNT(*) FROM project_counter;

-- Expected output:
-- subscribers    | 0
-- project_counter| 1
