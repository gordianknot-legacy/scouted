-- ScoutEd Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ======================
-- Table: opportunities
-- ======================
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  relevance_score INTEGER NOT NULL DEFAULT 0,
  deadline DATE,
  poc_email TEXT,
  tags TEXT[] DEFAULT '{}',
  organisation TEXT,
  amount TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_opportunities_score ON opportunities (relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON opportunities (deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_created ON opportunities (created_at DESC);

-- Decayed score function for server-side sorting
CREATE OR REPLACE FUNCTION decayed_score(opp opportunities)
RETURNS integer AS $$
  SELECT GREATEST(0, opp.relevance_score -
    (EXTRACT(EPOCH FROM (NOW() - opp.created_at)) / 604800)::int * 5
  )::integer;
$$ LANGUAGE SQL STABLE;

-- ======================
-- Table: user_actions
-- ======================
CREATE TABLE IF NOT EXISTS user_actions (
  user_id UUID NOT NULL,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  is_bookmarked BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_user_actions_user ON user_actions (user_id);

-- ======================
-- Table: subscribers
-- ======================
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  unsubscribe_token UUID DEFAULT uuid_generate_v4() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================
-- Row Level Security
-- ======================

-- Opportunities: anon can SELECT only. Scraper uses service_role (bypasses RLS).
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read opportunities" ON opportunities;
DROP POLICY IF EXISTS "Service role insert opportunities" ON opportunities;
DROP POLICY IF EXISTS "Service role update opportunities" ON opportunities;

CREATE POLICY "Anon read opportunities"
  ON opportunities FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies for anon — service_role bypasses RLS for scraper writes.

-- Subscribers: anon can INSERT only (subscribe). No SELECT for anon (prevents email harvesting).
-- Service_role reads for digest (bypasses RLS).
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe" ON subscribers;
DROP POLICY IF EXISTS "Service role read subscribers" ON subscribers;

CREATE POLICY "Anon insert subscribers"
  ON subscribers FOR INSERT
  WITH CHECK (true);

-- No SELECT/UPDATE/DELETE policies for anon.

-- User actions: open for now — TODO: lock to auth.uid() once Supabase Auth is added.
-- Currently managed via localStorage user_id on the client.
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own actions" ON user_actions;

CREATE POLICY "Users manage own actions"
  ON user_actions FOR ALL
  USING (true);

-- ======================
-- Table: csr_spending
-- ======================
CREATE TABLE IF NOT EXISTS csr_spending (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company TEXT NOT NULL,
  cin TEXT NOT NULL,
  field TEXT NOT NULL,
  spend_inr NUMERIC(15,2) NOT NULL DEFAULT 0,
  fiscal_year TEXT NOT NULL DEFAULT '2023-24',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (cin, field, fiscal_year)
);

CREATE INDEX IF NOT EXISTS idx_csr_company ON csr_spending (company);
CREATE INDEX IF NOT EXISTS idx_csr_fiscal_year ON csr_spending (fiscal_year);
CREATE INDEX IF NOT EXISTS idx_csr_spend ON csr_spending (spend_inr DESC);

-- CSR Spending: anon can SELECT only. Upload uses service_role (bypasses RLS).
ALTER TABLE csr_spending ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon read csr_spending"
  ON csr_spending FOR SELECT
  USING (true);
