# ScoutEd Scraper — Data Flow Diagrams

## 1. Opportunity Scraper (Daily 8 AM IST)

```
                         GitHub Actions Cron (8 AM IST)
                                    |
                                    v
                      +---------------------------+
                      |   scraper/index.ts        |
                      |   (Orchestrator)          |
                      +---------------------------+
                                    |
                   +----------------+----------------+
                   |                |                 |
                   v                v                 v
            +-----------+   +-----------+     +-----------+
            |  NGOBox   |   |   IDR     |     |  Google   |
            | FundsFor  |   |  Devex    |     |   CSE     |
            |  NGOs     |   | Alliance  |     |  (API)    |
            +-----------+   +-----------+     +-----------+
                   |                |                 |
                   v                v                 v
            HTML / RSS        RSS / JSON-LD      JSON API
                   |                |                 |
                   +----------------+-----------------+
                                    |
                                    v
                      +---------------------------+
                      |   Source Classification    |
                      |                           |
                      |  India-focused sources:   |
                      |    → education filter     |
                      |  Education-focused:       |
                      |    → India filter         |
                      |  Pre-filtered:            |
                      |    → pass through         |
                      |  Negative keywords:       |
                      |    → reject               |
                      +---------------------------+
                                    |
                                    v
                      +---------------------------+
                      |   parsers/utils.ts        |
                      |                           |
                      |  extractTags()            |
                      |  extractLocation()        |
                      |  extractAmount()          |
                      |  parseDate()              |
                      |  dedup (by source_url)    |
                      +---------------------------+
                                    |
                                    v
                      +---------------------------+
                      |   detail-fetcher.ts       |
                      |                           |
                      |  Fetch source_url pages   |
                      |  3 concurrent, 1s delay   |
                      |  Extract description +    |
                      |  POC email                |
                      +---------------------------+
                                    |
                                    v
                      +---------------------------+
                      |   scoring.ts              |
                      |                           |
                      |  Sector match    (+30)    |
                      |  Geography match (+20)    |
                      |  Funding size    (+20)    |
                      |  Known donor     (+15)    |
                      |  Duration        (+15)    |
                      +---------------------------+
                                    |
                                    v
                      +---------------------------+
                      |   supabase.ts             |
                      |                           |
                      |  upsertOpportunities()    |
                      |  Dedup by source_url      |
                      +---------------------------+
                                    |
                                    v
                         Supabase: opportunities
                                    |
                                    v
                      +---------------------------+
                      |   send-digest.ts          |
                      |                           |
                      |  Query top opportunities  |
                      |  Format HTML email        |
                      |  Send via Resend API      |
                      +---------------------------+
                                    |
                                    v
                         Subscriber inboxes (8 AM)
```

## 2. CSR Spending Scraper (Manual / On-Demand)

```
                      +---------------------------+
                      |   csr-scraper.js          |
                      |   (Playwright browser)    |
                      +---------------------------+
                                    |
                     Phase 1: Discovery
                                    |
                                    v
             +--------------------------------------------+
             |         MCA Portal Live Search             |
             |                                            |
             |  For each of 20 prefixes:                  |
             |    1. Type prefix (e.g. "lim")             |
             |    2. keyup → AJAX populates table         |
             |    3. Wait for table to stabilise          |
             |    4. Click #show_all                      |
             |    5. Extract { name, cin } from rows      |
             |                                            |
             |  Deduplicate by CIN across all prefixes    |
             +--------------------------------------------+
                                    |
                      Saves: csr_companies.json
                                    |
                     Phase 2: API Fetch
                                    |
                                    v
             +--------------------------------------------+
             |   For each unique CIN:                     |
             |                                            |
             |   page.evaluate(                           |
             |     fetch(companyReportAPI?cin=X&fy=...)   |
             |   )                                        |
             |                                            |
             |   800ms delay between calls                |
             |   Save progress every 25 companies         |
             |   Stop after 10 consecutive errors         |
             |                                            |
             |   If 403 → CAPTCHA fallback:               |
             |     Screenshot → OpenRouter vision → solve |
             +--------------------------------------------+
                                    |
                      Saves: csr_progress.json
                      (raw API records with all fields:
                       cin, amnt_spent, sector, csr_prjct,
                       state, district, fncl_yr, mode, outlay)
                                    |
                     Phase 3: Transform
                                    |
                                    v
             +--------------------------------------------+
             |   transformAndSave()                       |
             |                                            |
             |   Group raw records by CIN                 |
             |                                            |
             |   For each record:                         |
             |   +--------------------------------------+ |
             |   | sector contains "education"?         | |
             |   |   YES → Education: <csr_prjct>       | |
             |   |   NO  → sector contains "vocational"?| |
             |   |          YES → Vocational Skills: ... | |
             |   |          NO  → add to otherSum       | |
             |   +--------------------------------------+ |
             |                                            |
             |   Per company: N education rows +          |
             |                N vocational rows +         |
             |                1 "Other CSR Fields" row    |
             +--------------------------------------------+
                                    |
                      Saves: csr_report_23_24.json
                      [{ Company, CIN, Field, Spend_INR }]
                                    |
                     Phase 4: Upsert
                                    |
                                    v
             +--------------------------------------------+
             |   csr-upsert.ts                            |
             |                                            |
             |   1. Validate (Company + CIN + Field)      |
             |   2. Dedup by cin|field|fiscal_year        |
             |      → SUM amounts for same key            |
             |      (geographic rows → project total)     |
             |   3. Upsert batches of 50                  |
             |      onConflict: cin,field,fiscal_year     |
             +--------------------------------------------+
                                    |
                                    v
                      Supabase: csr_spending
                      +---------------------------+
                      | company    | text          |
                      | cin        | text          |
                      | field      | text          |
                      | spend_inr  | numeric       |
                      | fiscal_year| text          |
                      +---------------------------+
                      Unique key: (cin, field, fiscal_year)
                                    |
                     Phase 5: Frontend
                                    |
                                    v
             +--------------------------------------------+
             |   useCsrData.ts (React Query)              |
             |     → SELECT * WHERE fiscal_year = '...'   |
             |     → ORDER BY spend_inr DESC              |
             +--------------------------------------------+
                                    |
                                    v
             +--------------------------------------------+
             |   CsrPage.tsx — Aggregation                |
             |                                            |
             |   Group records by CIN:                    |
             |                                            |
             |   field starts with    | Maps to           |
             |   ─────────────────────+────────────────── |
             |   "Education"          | eduSpend +        |
             |                        | eduProjects[]     |
             |   "Vocational"         | vocSpend +        |
             |                        | vocProjects[]     |
             |   Anything else        | totalSpend only   |
             |                                            |
             |   All fields → totalSpend                  |
             +--------------------------------------------+
                                    |
                                    v
             +--------------------------------------------+
             |   CsrCompanyTable.tsx — Display            |
             |                                            |
             |   Desktop columns:                         |
             |   Star | > | Company | Edu | Voc | Total | |
             |   Edu %                                    |
             |                                            |
             |   Expanded detail:                         |
             |   ┌─ Education (N) ────────────────────┐   |
             |   │  Smart School Project    26.46 Cr  │   |
             |   │  Scholarship Support     28.56 Cr  │   |
             |   └────────────────────────────────────┘   |
             |   ┌─ Vocational Skills (N) ────────────┐   |
             |   │  Skill Training Youth    12.26 Cr  │   |
             |   │  Farmers Training         11.15 Cr │   |
             |   └────────────────────────────────────┘   |
             +--------------------------------------------+
```

## 3. OpenClaw Integration (WhatsApp Bot)

```
     User (WhatsApp)
           |
           | "Find new education grants"
           v
     OpenClaw Gateway
           |
           v
     AI Agent (openrouter/free)
           |
           +--→ web_search (Gemini) ──→ Google results
           |
           +--→ web_fetch (promising URLs) ──→ page content
           |
           v
     LLM extracts structured JSON
     (title, source_url, description, deadline, amount, tags)
           |
           v
     exec: npx tsx openclaw-upsert.ts --file results.json
           |
           +--→ calculateScore() from scoring.ts
           +--→ upsertOpportunities() from supabase.ts
           |
           v
     Supabase: opportunities
           |
           v
     Agent reports summary → WhatsApp
```
