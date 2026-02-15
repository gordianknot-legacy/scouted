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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================
-- Row Level Security
-- ======================

-- Opportunities: public read, service_role insert/update
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read opportunities"
  ON opportunities FOR SELECT
  USING (true);

CREATE POLICY "Service role insert opportunities"
  ON opportunities FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role update opportunities"
  ON opportunities FOR UPDATE
  USING (true);

-- Subscribers: service_role manages, anon can insert (subscribe)
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role read subscribers"
  ON subscribers FOR SELECT
  USING (true);

-- User actions: users manage their own
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own actions"
  ON user_actions FOR ALL
  USING (true);
