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
* **Duration (+10pts):** > 2 Years.
* **Decay:** Score decreases by 5 points for every week since posting.

### B. User Interface
1.  **Onboarding Flow:** - A 3-step modal tour for first-time visitors explaining **ScoutEd**.
    - "Welcome to ScoutEd -> How Scoring Works -> How to Subscribe".
2.  **Dashboard (Main View):**
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
- **Duration (+10)**: Project >= 2 years
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

Note: Google Custom Search JSON API sunsets **1 Jan 2027**. The scraper gracefully skips if env vars are not set.

## 10. Security: RLS Policy Rationale
- **opportunities**: anon can `SELECT` only. No `INSERT`/`UPDATE` for anon. Scraper uses `service_role` key which bypasses RLS.
- **subscribers**: anon can `INSERT` only (to subscribe). No `SELECT` for anon (prevents email harvesting). `service_role` reads for digest.
- **user_actions**: open `USING(true)` — TODO: lock to `auth.uid()` when Supabase Auth is added. Currently uses localStorage `user_id`.

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
- **data.gov.in** — Open government CSR expenditure datasets (Dataset 1612)
- **csr.gov.in** — National CSR Portal (requires browser automation)

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