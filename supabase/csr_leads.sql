-- CSR Lead Pipeline table
-- Run in Supabase SQL Editor to create table + indexes + RLS

CREATE TABLE IF NOT EXISTS csr_leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cin TEXT NOT NULL,
  company TEXT NOT NULL,
  pipeline_stage TEXT NOT NULL DEFAULT 'prospect'
    CHECK (pipeline_stage IN ('prospect','researching','outreach','proposal_sent','won','lost','paused')),
  ishmeet_connected BOOLEAN,
  saurabh_connected BOOLEAN,
  connection_notes TEXT DEFAULT '',
  prior_association TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  assigned_to TEXT DEFAULT '',
  fiscal_year TEXT NOT NULL DEFAULT '2023-24',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (cin, fiscal_year)
);

CREATE INDEX IF NOT EXISTS idx_csr_leads_stage ON csr_leads (pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_csr_leads_cin ON csr_leads (cin);

-- RLS: Allow anon role for all operations (3-user app with domain-restricted OAuth)
ALTER TABLE csr_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for anon" ON csr_leads
  FOR ALL
  USING (true)
  WITH CHECK (true);
