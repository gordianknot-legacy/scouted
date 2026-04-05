# Project Context: ScoutEd

## 1. Project Overview
**Role:** Senior Full Stack Developer & UI/UX Designer.
**Tool Name:** ScoutEd.
**Goal:** Build a web-based dashboard for the Partnerships and Strategic Initiatives team at Central Square Foundation (CSF).
**Purpose:** To scout, aggregate, score, and display funding/grant opportunities from the web daily at 8 AM IST.
**Constraints:** - Zero infrastructure costs (Free tier Vercel/Supabase).
- 3 User limit (Internal team).
- Strict adherence to CSF Brand Guidelines.

## 2. Brand Guidelines (Strict Enforcement)
**Primary Colors:**
- [cite_start]**CSF Blue:** `#00316B` (Backgrounds, Headers, Primary Buttons) [cite: 57]
- [cite_start]**CSF Yellow:** `#FFD400` (Accents, Highlights, Call-to-Action) [cite: 68]

**Secondary Colors (For Tags/Charts/Relevance Scores):**
- [cite_start]Light Blue: `#8FBAFF` [cite: 102]
- [cite_start]Burnt Orange: `#C93F13` [cite: 111]
- [cite_start]Lime Green: `#87FF38` [cite: 120]
- [cite_start]Purple: `#7030A0` [cite: 129]

**Typography:**
- **Headings:** "Gill Sans MT" (Fallback: Gill Sans, sans-serif). [cite_start]Use for H1, H2, Card Titles[cite: 161].
- **Body:** "Cambria" (Fallback: Georgia, serif). [cite_start]Use for descriptions and summaries[cite: 161].
- [cite_start]**Formatting Rules:** - Capitalize subjects (e.g., Math, Science)[cite: 200].
  - [cite_start]Use British English spelling (e.g., Programme, Colour)[cite: 205].
  - [cite_start]Use Indian numbering format (Lakh, Crore) unless the grant is international[cite: 228].

**Logo Usage:**
- [cite_start]Always maintain clear space (1/2 logo height) around the CSF logo[cite: 24, 27].
- Place logo on white or neutral backgrounds. [cite_start]If placing on color, use a high-contrast neutral band[cite: 35].

## 3. Tech Stack
- **Frontend:** React (Vite), TypeScript, Tailwind CSS, Headless UI (for accessible components).
- **Drag & Drop:** `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` (Kanban pipeline).
- **Backend/DB:** Supabase (PostgreSQL) - Free Tier.
- **Automation:** GitHub Actions (Cron job for daily scraping).
- **Hosting:** Vercel (Custom subdomain).
- **Icons:** HeroIcons (Clean, outline style).

## 4. Architecture & Data Flow
1.  **ScoutEd Scraper (Node.js):** Runs daily at 8 AM IST via GitHub Actions. Fetches listings from defined URLs, calculates `RelevanceScore`, and pushes new rows to Supabase.
2.  **Database (Supabase):** Stores `opportunities`, `bookmarks`, `hidden_items`, and `subscribers`.
3.  **Frontend:** Connects directly to Supabase to read/write data (using Row Level Security).

## 5. Functional Requirements

### A. Relevance Scoring Algorithm
Each opportunity gets a score (0-100).
* **Base Score:** 0
* **Sector Match (+30pts):** If description contains: "FLN", "Foundational Literacy", "School Governance", "EdTech", "Early Childhood", "Classroom Instruction", "High Potential Students".
* **Geography Match (+20pts):** If location matches CSF Priority States (e.g., Uttar Pradesh, Madhya Pradesh, Haryana, Gujarat).
* **Funding Size (+20pts):** > ₹1 Crore or equivalent.
* **Duration (+15pts):** > 2 Years.
* **Decay:** Score decreases by 5 points for every week since posting.

### B. User Interface
1.  **Welcome Hub (Home):** Default landing page with 4 tool cards: Grant Opportunities, CSR Prospects, Creator's Guide, Donor Newsletter (disabled/coming soon). Grid: `sm:grid-cols-2 lg:grid-cols-4`.
2.  **Navigation:**
    - **Tab persistence:** Active tab stored in `sessionStorage` (key: `scouted_active_tab`), restored on refresh. Validated against known `Tab` values.
    - **Logo navigation:** ScoutEd logo in header is a clickable button that returns to Welcome Hub (`'home'` tab).
    - **Mobile nav:** Bottom navigation bar with Home, Grants, Bookmarks, Subscribe, CSR Data, Guide tabs.
3.  **Onboarding Flow:** - A 3-step modal tour for first-time visitors explaining **ScoutEd**.
    - "Welcome to ScoutEd -> How Scoring Works -> How to Subscribe".
4.  **Dashboard (Grants View):**
    - **Filter Sidebar:** Filter by Score (High/Med/Low), Sector, State, Deadline.
    - **Feed:** Card-based layout (Masonry or Grid).
3.  **Opportunity Card:**
    - **Header:** Title + Organization Logo (if avail).
    - **Badges:** Sector, State, Amount, Deadline.
    - **Relevance Score:** A visual circle indicator (Green > 75, Yellow > 50, Red < 50).
    - **Actions:** - [Bookmark Icon] (Saves to user list).
        - [Hide/Irrelevant Icon] (Removes from feed).
        - [External Link] (Goes to source).
    - **Summary:** Brief summary using Cambria font.
    - **Footer:** POC Email (mailto link) if available.

### C. Subscription
- Input field: "Get Daily 8 AM ScoutEd Digest".
- Logic: Adds email to `subscribers` table in Supabase.

## 6. Data Schema (Supabase)
**Table: opportunities**
- id (uuid)
- title (text)
- source_url (text)
- description (text)
- relevance_score (int)
- deadline (date)
- poc_email (text)
- tags (array)
- created_at (timestamp)

**Table: user_actions**
- user_id (uuid)
- opportunity_id (uuid)
- is_bookmarked (bool)
- is_hidden (bool)

## 7. Implementation Guidelines for Claude Code
- **Styling:** Use `tailwind.config.js` to extend the theme with CSF colors (`colors: { csf: { blue: '#00316B', yellow: '#FFD400' } }`).
- **Font Loading:** Import fonts via CSS or standard web-safe fallbacks as per brand guidelines.
- **Mock Data:** When building the UI initially, generate realistic mock JSON data representing Indian education grants (e.g., "FLN Grant for Haryana Schools", "EdTech Innovation Fund").
- **Cost Efficiency:** Do not suggest backend servers (Node/Express/Python) that require hosting fees. Stick to Client-Side + BaaS (Supabase).

## 8. Definition of "Done"
The project is ready when:
1.  A user can view a list of opportunities styled in CSF Blue/Yellow.
2.  The list is sorted by "Relevance Score".
3.  A user can click a "Bookmark" icon and see it persist after refresh.
4.  The "Onboarding" modal appears on the first visit only.

## 9. Scraper Architecture

> **Data flow diagrams** for all three scraper pipelines (Opportunity, CSR, OpenClaw) are in [`scraper/DATA_FLOW.md`](scraper/DATA_FLOW.md).

### Shared Utilities (`scraper/parsers/utils.ts`)
All parsers share canonical implementations of:
- `stripTags()` — HTML to plain text
- `extractTags()` — maps text to CSF sector tags (emits `"FLN / Foundational Literacy"` to match frontend)
- `extractLocation()` — matches all 28 Indian states + Delhi
- `parseDate()` — handles `DD Mon YYYY`, `DD-Mon-YYYY`, and fallback formats
- `extractAmount()` — Indian numbering (Crore/Lakh) + international currencies
- `dedup()` — deduplicate by `source_url`
- `isEducationRelevant()` — keyword check for education content

### Detail Page Scraping (`scraper/parsers/detail-fetcher.ts`)
- `enrichWithDetails()` fetches each opportunity's `source_url` for full content
- Batches 3 concurrent requests with 1s delay between batches
- 10s timeout per page, falls back to original data on failure
- Limits to first 30 items per source to control scrape time
- Extracts description from content divs, POC email from mailto links

### Source Classification (`scraper/index.ts`)
Each source is classified for filtering:
- **India-focused** (NGOBox, `/tag/india/`, CSRBox, IDR): education filter only
- **Education-focused** (`/education/`, `/edtech/`): India filter only
- **Pre-filtered** (Google CSE, Devex, Alliance): already filtered in parser, pass through
- Negative keywords (`veterinary`, `petroleum`, `mining`, `military`) reject non-education noise

### Active Sources
| Source | Parser | Type | Expected Yield |
|--------|--------|------|---------------|
| NGOBox (3 URLs) | `ngobox`, `ngobox-rfp` | Grant aggregator | 5-20/run |
| FundsForNGOs (2 URLs) | `fundsforngos` | Grant aggregator | 3-10/run |
| CSRBox | `csrbox` | CSR data scraper | 10-30 companies |
| IDR (idronline.org) | `idr` | RSS (education + philanthropy feeds) | 5-10/run |
| Devex | `devex` | RSS + JSON-LD from article pages | 2-5/run |
| Alliance Magazine | `alliance` | RSS + search page scraping | 2-5/run |
| Google Custom Search | `google-cse` | API (8 queries, 50-domain CSE) | 5-20/run |

### Scoring Algorithm
- **Sector match (+30)**: Title/description/tags contain CSF sector keywords
- **Geography match (+20)**: Location or text mentions CSF priority state
- **Funding size (+20)**: Amount >= ₹1 Crore or equivalent international currency
- **Known donor (+15)**: Organisation matches `KNOWN_EDUCATION_FUNDERS` list in config.ts
- **Duration (+15)**: Project >= 2 years
- **Decay**: Frontend applies -5 per week since creation

### Known Education Funders (`config.ts`)
The `KNOWN_EDUCATION_FUNDERS` array contains ~80 organisations including:
- CSF's current donors (Bajaj, Gates Foundation, Dell Foundation, Reliance, etc.)
- Major Indian CSR spenders (Tata, Wipro, Infosys, Mahindra, etc.)
- International education philanthropies (Hewlett, CIFF, LEGO Foundation, etc.)
- When a new donor is identified, add their name (lowercase) to this array.

### Rate Limiting
- Detail page fetching: 3 concurrent, 1s delay, 10s timeout
- Pagination: up to 5 pages per NGOBox source, sequential
- Devex: 10s crawl delay between article page fetches (per robots.txt)
- Google CSE: 0.5s delay between queries, stops on rate limit (429)

### Environment Variables (Scraper)
| Variable | Required | Purpose |
|----------|----------|---------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (bypasses RLS) |
| `GOOGLE_CSE_API_KEY` | No | Google Custom Search API key (100 free queries/day) |
| `GOOGLE_CSE_ID` | No | Programmable Search Engine ID (50-domain limit) |
| `RESEND_API_KEY` | Yes (digest) | Resend email API key |
| `OPENROUTER_API_KEY` | No (CSR fallback) | OpenRouter API key — only needed if MCA API returns 403 and CAPTCHA fallback triggers |

Note: Google Custom Search JSON API sunsets **1 Jan 2027**. The scraper gracefully skips if env vars are not set.

## 10. Security: RLS Policy Rationale
- **opportunities**: anon can `SELECT` only. No `INSERT`/`UPDATE` for anon. Scraper uses `service_role` key which bypasses RLS.
- **subscribers**: anon can `INSERT` only (to subscribe). No `SELECT` for anon (prevents email harvesting). `service_role` reads for digest.
- **user_actions**: open `USING(true)` — uses localStorage `user_id`. Auth is now handled at the app level via Supabase Auth + Google OAuth (see Section 15).

## 11. Email Compliance: Unsubscribe Mechanism
- Each subscriber gets a unique `unsubscribe_token` (UUID) on creation
- Daily digest emails include a personalised unsubscribe link in the footer
- `GET /api/unsubscribe?token=<uuid>` deletes the subscriber and shows confirmation HTML
- Uses `service_role` key for the delete operation (bypasses RLS)

## 12. How to Add New Sources
1. **Create parser**: `scraper/parsers/<name>.ts` — export an `async function parse...(url: string): Promise<RawOpportunity[]>`
2. **Use shared utils**: import from `./utils.js` for tags, location, dates, amounts, dedup
3. **Add to config**: add entry to `SOURCES` array in `scraper/config.ts` with name, URL, parser key
4. **Register parser**: add to `PARSERS` map in `scraper/index.ts`
5. **Classify filtering**: set `isIndiaSource` / `isEducationSource` logic in the filter block

### Recommended Future Sources
- **NITI Aayog** — Government of India policy think tank
- **MyGov.in** — Government citizen engagement platform
- **Give2Asia** — Asia-focused philanthropy grants
- ~~**data.gov.in**~~ — Investigated and ruled out: no working CSR APIs, datasets stop at 2020-21 (see Section 14 "Other Sources Investigated")
- ~~**csr.gov.in**~~ — Investigated and ruled out: same MCA portal with Akamai + CAPTCHA (see Section 14)

## 13. OpenClaw Integration (AI-Powered Grant Discovery)

### Overview
OpenClaw is a self-hosted AI agent platform that adds on-demand, semantic grant discovery via WhatsApp. It complements the daily scraper (which uses fixed sources + rule-based parsing) by searching the entire web with LLM understanding. The existing scraper runs unchanged.

### Architecture
```
User sends WhatsApp message → OpenClaw Gateway → AI Agent
  → web_search (Gemini-powered Google Search)
  → web_fetch (promising pages)
  → LLM reasoning (filter for India K-12, extract structured data)
  → exec: npx tsx openclaw-upsert.ts --file openclaw-results.json
  → Results appear in ScoutEd dashboard
  → Agent reports summary back to user on WhatsApp
```

### New Files
| File | Purpose |
|------|---------|
| `scraper/openclaw-upsert.ts` | CLI script — reads JSON from OpenClaw, validates, deduplicates, scores via `calculateScore()`, upserts to Supabase |
| `scraper/openclaw-digest.ts` | CLI script — queries Supabase for opportunities, outputs WhatsApp-formatted text |
| `~/.openclaw/workspace/skills/scouted-scout/SKILL.md` | OpenClaw skill definition — search strategy, extraction rules, output format |
| `~/.openclaw/workspace/SOUL.md` | Agent identity — configured as "ScoutEd Bot" |
| `~/.openclaw/workspace/TOOLS.md` | Agent commands — digest and scout triggers |

### OpenClaw Upsert Script (`scraper/openclaw-upsert.ts`)
- Reads JSON from `--file <path>` or stdin
- Validates each item (requires `title` + valid `source_url`)
- Deduplicates by `source_url`
- Scores using `calculateScore()` from `scoring.ts` (reuses existing code)
- Upserts using `upsertOpportunities()` from `supabase.ts` (reuses existing code)
- Loads `.env` via dynamic `import()` after `dotenv.config()` to handle ESM import hoisting

### OpenClaw Digest Script (`scraper/openclaw-digest.ts`)
- Queries Supabase `opportunities` table sorted by `relevance_score` DESC
- Flags: `--days N` (default 2), `--limit N` (default 10), `--all`
- Outputs WhatsApp-formatted text (bold headings, no tables)

### OpenClaw Skill (`scouted-scout`)
Two modes:
1. **Scout** — Searches web for India K-12 education grants (8+ queries across 4 tiers), extracts structured JSON, upserts to DB
2. **Digest** — Pulls existing opportunities from Supabase, sends formatted list

**Strict filters:**
- India only — every opportunity must mention India, an Indian state, or an Indian city
- K-12 school education only — Classes 1-12, primary, secondary
- Actionable funding only — grants, RFPs, EOIs, CSR commitments, government schemes
- Max 30 items per scout run

### WhatsApp Bot Commands
| User Message | What Happens |
|---|---|
| "Find new education grants" | Agent searches web, discovers grants, upserts to DB |
| "What grants are in ScoutEd?" | Agent runs digest script, sends formatted list |
| "Show me recent grants" | Same as above |
| `/scouted-scout` | Triggers full scout mode |

### Environment & Setup
| Component | Detail |
|-----------|--------|
| OpenClaw | `npm i -g openclaw`, then `openclaw onboard` |
| Search provider | Gemini (free via Google AI Studio) — configured via `openclaw config set tools.web.search.provider gemini` |
| LLM provider | OpenRouter (`openrouter/auto`) |
| WhatsApp | Linked via `openclaw channels login` (uses WhatsApp Web, self-chat mode) |
| Gateway | Must be running: `openclaw gateway` |

### Cost Per Run
**Both modes are completely free.** The default model is `openrouter/free`, which automatically routes to free LLMs with tool-calling support (e.g. GPT-OSS-20B, Gemma 3, Trinity Mini).

| Component | Cost |
|-----------|------|
| Digest (view existing grants) | Free |
| Scout (web discovery) | Free (`openrouter/free` router) |
| OpenClaw | Free (self-hosted) |
| Gemini Search | Free tier |
| Supabase | No additional cost |

To switch to a paid model for better quality: `openclaw models set openrouter/auto`

### OpenClaw Workspace Files
The agent's identity and behaviour are defined in `~/.openclaw/workspace/`:
- **SOUL.md** — Identifies as "ScoutEd Bot", enforces India-only K-12 focus
- **TOOLS.md** — Maps user messages to exec commands (digest/scout)
- **IDENTITY.md** — Name, emoji, vibe
- **skills/scouted-scout/SKILL.md** — Full skill definition with search queries, extraction rules, filters

**Important:** After editing workspace files, you must:
1. Clear sessions: delete entries from `~/.openclaw/agents/main/sessions/sessions.json`
2. Restart gateway: kill the process, then `openclaw gateway`
3. The next WhatsApp message will start a fresh session with updated files

## 14. CSR Spending Data Pipeline

### Overview
The CSR Data page (`/csr-data`) shows company-wise Corporate Social Responsibility spending from MCA filings. Data is stored in the `csr_spending` Supabase table with columns: `company`, `cin`, `field`, `spend_inr`, `fiscal_year`.

### Data Source: MCA Portal via Live Search (Primary)
The scraper uses Playwright with persistent browser context. It exploits the MCA portal's **live search** feature: typing >= 3 characters triggers a keyup-driven AJAX call that populates the company table — **no CAPTCHA needed**. Multiple search prefixes are used to maximise company coverage, with CIN deduplication. Then fetches the CSR detail API for each unique CIN via `page.evaluate(fetch())`.

### Pipeline
1. `cd scraper && node csr-scraper.js` — opens browser, harvests CINs via live search, calls API for each
2. `npx tsx csr-upsert.ts --file csr_report_23_24.json --fy 2023-24` — upserts to Supabase
3. Supports `--resume` (reuse saved CINs + progress) and `--prefixes lim,ind,tat` (custom prefix list)
4. `--resume --source companies` resumes using the full 5,667 discovered companies (not just 99 target companies)
5. If API returns 403, falls back to CAPTCHA solving via Groq audio transcription → Google → local Whisper cascade
6. Typical session processes 200-600 companies before Akamai session expires; multiple `--resume` cycles needed to cover all companies

### Alternative Data Source: Dataful.in
If MCA scraping fails, Dataful.in has pre-compiled CSR datasets:
- **Dataset 1614**: Company + CIN + total amount. No sector breakdown. Reported as free but may require payment.
- **Dataset 1612** (₹999): Full detail with sector, project, state, district. — upserts to Supabase

### Sector Classification in `transformAndSave()` (`csr-scraper.js`)
The MCA API returns a `sector` field per record. The scraper classifies into three categories:
- `sector.includes('education')` → `"Education: <csr_prjct>"` — core education projects
- `sector.includes('vocational')` → `"Vocational Skills: <csr_prjct>"` — vocational/skills training
- Everything else → summed into one `"Other CSR Fields (Cumulative)"` row per company

**Important:** MCA's "Education" and "Vocational Skills" are distinct Schedule VII sectors. They must NOT be merged — the frontend displays and filters them separately. The `--rank` mode also tracks `education_spend` and `vocational_spend` as separate fields in `csr_top500.json`.

### MCA API Geographic Granularity
The API endpoint (`companyReportAPI.html`) returns data at **state/district** level. A single project (e.g., "Skill Training For Youth") running in 11 states yields 11 separate records with different `amnt_spent` values. These are **additive** — each represents actual spend in that geography. Some records also use `state: "Pan India"` for nationally-scoped spend.

### Upsert Script (`scraper/csr-upsert.ts`)
- Reads JSON array of `{ Company, CIN, Field, Spend_INR }`
- Validates (requires Company + CIN + Field)
- **Deduplicates by `cin|field|fiscal_year` — SUMS amounts** for duplicate keys (not discards). This is critical because the MCA API returns per-state/district rows that share the same project name but have different spend amounts. Summing gives the correct total per project.
- Upserts in batches of 50 to Supabase `csr_spending` table
- Conflict resolution on `(cin, field, fiscal_year)` composite key — `ignoreDuplicates: false` ensures re-runs update existing rows with corrected totals

### MCA Portal Research (Feb 2026) — Why Direct Scraping Failed
The MCA portal at `mca.gov.in/content/csr/global/master/home/ExploreCsrData/company-wise.html`:
- **Akamai CDN** blocks all direct HTTP requests (403)
- **CAPTCHA** required for every search; uses AES-GCM encryption (hardcoded passphrase: `d6163f0659cfe4196dc03c2c29aab06f10cb0a79cdfc74a45da2d72358712e80`)
- **Company name is mandatory** — blank search rejected with "Kindly enter company Name to proceed"
- **Each company click** triggers `companyNameClickHandler()` which regenerates the CAPTCHA — NOT a one-captcha-for-all flow
- The actual data API is at: `/content/csr/global/master/home/home/csr-expenditure--geographical-distribution/state/district/company.companyReportAPI.html?cin={CIN}&fy=FY%202023-24`
- Response shape: `{ cmpny_csr_detail: { data: { cmpny_csr_detail_data: [...] } } }`
- Each record has: `cin`, `amnt_spent`, `sector`, `csr_prjct`, `state`, `district`, `fncl_yr`, `mode`, `outlay`
- JS files: `clientlib-all.min.js` (main), `clientlibs-gcmencrypt.min.js` (crypto), `companyWiseDynamicReport/clientlibs.min.js` (business logic)

### Other Sources Investigated and Ruled Out
| Source | Status | Why |
|--------|--------|-----|
| **csrxchange.gov.in** | Not viable | Project marketplace only, no company-wise spending data. Has public JSON API at `/Frontend/home_project_list` for CSR projects but no spending amounts in list view |
| **data.gov.in** | Not viable | CSR dataset pages exist but NO working APIs. MCA explicitly refuses to publish CSR data on OGD platform. Datasets stop at 2020-21 |
| **csr.gov.in** | Same as MCA | Same portal different URL, same Akamai + CAPTCHA protection |
| **mcacdm.nic.in** | **Promising — Phase 2** | MCA CDM portal at `mcacdm.nic.in/cdm/` reportedly offers CSV/XLSX download with filters (FY, state, sector, PSU/Non-PSU). Could yield all 27,188 CSR-filing companies for FY 2023-24 without CAPTCHA. **Plan:** after exhausting current 5,667 discovered CINs, scrape CDM for complete company list → feed into existing CAPTCHA+API pipeline. See "Phase 2: CDM Company Discovery" below |
| **GitHub scrapers** | All abandoned | 6+ repos (spfrantz/MCA-CSR-Scraper, sushantMoon/Captcha-Solver, etc.), all target old V2 portal, none work with current V3 |
| **Commercial APIs** | No CSR data | SurePass, Sandbox, CompData.in — all offer CIN/DIN lookup only, none expose CSR spending |
| **Kaggle** | Nothing | No India CSR spending dataset exists |

### Scraper Implementation Details (`scraper/csr-scraper.js`)
- Uses `chromium.launchPersistentContext()` at `./mca-browser-profile/` for session persistence
- **Live search harvesting**: types 20 strategic prefixes (e.g. `lim`, `ind`, `pri`, `cor`, `tat`, `rel`) via `pressSequentially()` to trigger keyup → AJAX
- Waits for table to stabilise (4+ seconds of no row count change), clicks `#show_all` for full results
- Extracts `{ name, cin }` from `#myTable #geoTBody tr` (data-company, data-cin attributes)
- Deduplicates by CIN across all prefix searches
- `page.evaluate(fetch(API_PATH + '?cin=X&fy=FY 2023-24'))` for each CIN — stays within Akamai session
- 800ms delay between API calls; saves progress every 5 companies
- Stops after 10 consecutive errors (session likely expired)
- `--source companies` flag: use with `--resume` to process the full discovered company list instead of just the 99 target companies
- **`transformAndSave()`**: Classifies MCA `sector` into Education / Vocational Skills / Other (see Sector Classification above)
- **CAPTCHA solving**: Uses audio CAPTCHA with a cascade of transcription engines: Groq (fastest) → Google Speech → local Whisper (base.en fallback). No 2Captcha dependency
- `--resume` flag: skips live search, loads `csr_companies.json`, continues API calls from progress file
- `--prefixes` flag: override default prefix list (e.g. `--prefixes lim,tat,rel`)
- `--rank` flag: outputs `csr_top500.json` with per-company totals for `total_spend`, `education_spend`, and `vocational_spend`

### Search Prefixes (Default)
```
lim, ind, pri, cor, ent, pow, ste, ban, pha, ene,
oil, inf, tat, rel, fin, ins, tec, cem, aut, che
```
These 20 prefixes (plus 60 more in the extended set, 80 total) discovered 5,667 companies. However, **27,188 companies** filed CSR spending for FY 2023-24 per the National CSR Portal — meaning the prefix approach covers only ~21% of the universe.

### Phase 2: CDM Company Discovery (After 5,667 Exhausted)

**Problem:** The 80 prefix-based discovery only found 5,667 of 27,188 CSR-filing companies. Many company names start with prefixes not covered (hundreds of uncovered 3-letter combinations).

**Solution:** Use `mcacdm.nic.in/cdm/` (MCA CDM portal) to get a complete company list, then feed those CINs into the existing CAPTCHA+API fetch pipeline.

**Plan:**
1. **Scrape CDM portal** at `mcacdm.nic.in/cdm/` — reportedly offers CSV/XLSX downloads filterable by FY 2023-24, state, development sector, and PSU/Non-PSU classification
2. **Extract company names + CINs** from the CDM data
3. **Merge with existing `csr_companies.json`** — deduplicate by CIN, keep new discoveries
4. **Feed into existing pipeline** — `node csr-scraper.js --resume --source companies` continues with the expanded list
5. No changes needed to Phase 2 (API fetch) or Phase 3 (transform) — they already work with any `[{name, cin}]` list

**Trigger:** Implement when `--resume --source companies` reports all 5,667 companies processed (i.e., no more companies left to fetch).

**Fallback:** If CDM portal is inaccessible (SSL issues noted previously), generate systematic 3-letter prefixes (`aaa`-`zzz` filtered to common company name starts) and run additional `--discover` cycles. Alternatively, Dataful.in Dataset 1612 (₹999) has all companies with full detail.

**Reference:** The CSR Journal reports India Inc. spent ₹34,908.75 Cr on CSR in FY24 across 27,188 companies. Top 10 alone = ₹5,857 Cr (17%).

### CSR Frontend Architecture

**Key Files:**
| File | Purpose |
|------|---------|
| `src/components/csr/CsrPage.tsx` | Main page — fetches data, aggregates by CIN, stats bar, filters |
| `src/components/csr/CsrCompanyTable.tsx` | Sortable table — Education, Vocational, Total CSR columns + expanded geographic footprint |
| `src/components/csr/CsrPipeline.tsx` | Kanban board with drag-and-drop (`@dnd-kit`), DndContext + DragOverlay |
| `src/components/csr/PipelineCard.tsx` | Presentational card for pipeline leads |
| `src/components/csr/LeadDetailPanel.tsx` | Slide-over detail panel for pipeline leads |
| `src/hooks/useCsrData.ts` | React Query hook — fetches all `csr_spending` rows with pagination (1000-row batches via `.range()`) |
| `src/hooks/useCsrLeads.ts` | React Query hooks — `useCsrLeads()`, `useCreateLead()`, `useUpdateLead()`, `useArchiveLead()`, `useRestoreLead()` |
| `src/hooks/useCsrGeo.ts` | React Query hook — lazy-loads `csr_spending_geo` records per CIN when row is expanded |
| `src/hooks/useCsrShortlist.ts` | localStorage-based shortlist by CIN |

### Pipeline Drag-and-Drop (`CsrPipeline.tsx`)
- Uses `@dnd-kit/core`: `DndContext`, `DragOverlay`, `useDroppable`, `useDraggable`
- `PointerSensor` with `activationConstraint: { distance: 5 }` — prevents accidental drags on click
- `closestCorners` collision detection (column-based layout)
- Droppable IDs = stage keys (`'prospect'`, `'researching'`, etc.)
- Draggable IDs = lead UUIDs
- `onDragEnd` calls `useUpdateLead().mutate({ id, pipeline_stage })` to persist
- `DragOverlay` renders a floating card copy during drag

**Aggregation Logic (`CsrPage.tsx`):**
- Groups all `csr_spending` records by CIN
- `field.startsWith('Education')` → `eduSpend` + `eduProjects[]`
- `field.startsWith('Vocational')` → `vocSpend` + `vocProjects[]`
- Everything else contributes to `totalSpend` only
- Stats bar shows 4 cards: Companies with Edu/Voc CSR, Education CSR total, Vocational Skills CSR total, Shortlisted count

**Table Columns (Desktop):**
Star | Expand | Company | Education | Vocational | Total CSR | Edu %

**Expanded Detail:**
Shows the following sections when a row is expanded:
1. **Leadership** — CEO and CSR Head with LinkedIn/email links
2. **Geographic Footprint** — state-level horizontal stacked bars (Education/Vocational/Other), click to expand district breakdown. Priority states (Punjab, Bihar, Tamil Nadu, Maharashtra) sorted first with star icon. Lazy-loaded from `csr_spending_geo` table via `useCsrGeo` hook.
3. **Education NGO Partners** — funded NGOs with source links
4. **Pipeline Actions** — "Move to Pipeline" / "Remove from Pipeline" (soft delete with confirmation) / "Restore to Pipeline" (for archived leads)

**Pipeline Soft Delete:**
- `csr_leads.is_archived` boolean column — `true` = soft-deleted
- "Remove from Pipeline" shows inline confirmation dialog before archiving
- Archived leads are excluded from pipeline Kanban and pipeline count in stats bar
- "Restore to Pipeline" button shown for archived leads in the company table
- `useCsrLeads(fy, includeArchived)` — pass `true` to include archived leads (used by CsrPage to show restore option)

**Geographic Data:**
- **Table:** `csr_spending_geo` — stores per-record state/district/sector/project spend from MCA API
- **Upsert:** `scraper/csr-geo-upsert.ts` — reads `csr_progress.json`, classifies sectors (Education/Vocational/Other), deduplicates by `(cin, state, district, project, fiscal_year)` with amount summing, upserts to Supabase
- **Composite key:** `(cin, state, district, project, fiscal_year)` — unique constraint
- **Index:** `idx_csr_geo_cin_fy` on `(cin, fiscal_year)` for fast per-company lookups
- **RLS:** anon can `SELECT` only
- **Data:** 9,412 raw API records → ~unique rows across 1,153 companies, 39 states, 588 state-district pairs

**Filters:**
- Search by company name
- Min education spend threshold (All / ₹10 Cr+ / ₹50 Cr+ / ₹100 Cr+) — filters on `eduSpend` only
- Shortlisted only toggle

### Known Data Gotchas
1. **MCA API returns geographic duplicates**: Same `(project, state, district)` can appear 2-3x in raw API data. The upsert dedup handles this by summing amounts per `(cin, field, fiscal_year)` key.
2. **"Pan India" is not a summary row**: Rows with `state: "Pan India"` represent nationally-scoped spend. They are additive with state-specific rows, not summaries.
3. **Supabase row limit — RESOLVED**: The Supabase JS client returns max 1000 rows by default. The `useCsrData` hook now paginates with `.range()` in a while loop (1000-row batches). Current dataset has 1,398 rows (FY 2023-24).
4. **Browser profile locks**: If the Playwright browser crashes mid-scrape, stale lock files (`SingletonLock`, `SingletonSocket`, `SingletonCookie`) in `scraper/mca-browser-profile/` prevent relaunch. Delete them before restarting.
5. **`--resume` source selection**: `--resume` alone uses TARGET_COMPANIES (99). Use `--resume --source companies` to resume from the full discovered list (5,667 CINs from `csr_companies.json`).

## 15. Authentication (Google OAuth)

### Provider
Supabase Auth with Google OAuth (PKCE flow). No new packages — uses the auth module built into `@supabase/supabase-js`.

### Domain Restriction
Only `@centralsquarefoundation.org` Google accounts can access the app.
- **Google `hd` hint**: `signInWithOAuth` passes `hd: 'centralsquarefoundation.org'` so Google pre-selects the CSF account
- **Client-side enforcement**: After every sign-in, `AuthContext` checks `user.email?.endsWith('@centralsquarefoundation.org')` — mismatch triggers immediate `signOut()` with error message

### Key Files
| File | Purpose |
|------|---------|
| `src/contexts/AuthContext.tsx` | `AuthProvider` + `useAuth()` hook — manages session, domain validation, sign-in/out |
| `src/components/auth/LoginPage.tsx` | Full-screen branded login page with "Sign in with Google" button |
| `src/components/auth/AuthLoadingScreen.tsx` | Branded spinner shown during initial session check |

### Auth Flow
1. User visits site → `AuthProvider` calls `getSession()` (also handles PKCE code exchange from OAuth redirect)
2. No session → `LoginPage` shown
3. Click "Sign in with Google" → `supabase.auth.signInWithOAuth({ provider: 'google' })` → redirect to Google → Supabase callback → app with `?code=...`
4. Supabase JS auto-exchanges code for session → `onAuthStateChange` fires `SIGNED_IN`
5. Domain check: `@centralsquarefoundation.org` → dashboard; other → `signOut()` → error on `LoginPage`

### Session Persistence
Supabase stores auth tokens in `localStorage` automatically. Refresh does not require re-login. Token refresh is handled by `onAuthStateChange`.

### Manual Setup Required
1. **Google Cloud Console**: Create OAuth 2.0 Client ID with redirect URI `https://<supabase-project>.supabase.co/auth/v1/callback`
2. **Supabase Dashboard**: Authentication → Providers → Enable Google, paste Client ID + Secret; set Site URL and Redirect URLs

## 16. In-App Creator's Guide

### Overview
The Creator's Guide (`src/components/guide/GuidePage.tsx`) is a styled, scrollable HTML page aimed at non-technical users. It replaces a previous PDF iframe approach. Accessible from:
- Welcome Hub card ("Creator's Guide")
- Desktop sidebar link on the Grants page
- Mobile bottom nav ("Guide" tab)

### Sections
1. **What is ScoutEd?** — One-paragraph intro
2. **Getting Started** — Sign in, Welcome Hub, navigation
3. **Grant Opportunities** — Dashboard cards, scores, filters, bookmarks, hiding, preview pane
4. **Relevance Scoring** — Criteria table (sector +30, geography +20, funding +20, donor +15, duration +15, decay -5/week)
5. **CSR Partnership Prospects** — Company table, sorting, threshold filter, shortlisting, expanding detail, "Move to Pipeline"
6. **CSR Pipeline** — Kanban stages explained, drag-and-drop, detail panel, notes, concept notes
7. **Email Digest** — Subscribe, schedule (8:30 AM IST), unsubscribe
8. **Tips & Shortcuts** — Logo click, bookmarks persist, tab persistence, mobile nav, Load More

### Styling
- `max-w-3xl mx-auto` reading width, CSF branded colours
- `Section` component with yellow accent bar + CSF Blue heading
- `Tip` component with `LightBulbIcon` and `bg-csf-yellow/5` background