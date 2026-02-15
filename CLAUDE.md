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
- **India-focused** (NGOBox, `/tag/india/`): education filter only
- **Education-focused** (`/education/`, `/edtech/`): India filter only
- **International general** (Grants.gov, GOV.UK FCDO): both India + education filters
- Negative keywords (`veterinary`, `petroleum`, `mining`, `military`) reject non-education noise

### Rate Limiting
- Detail page fetching: 3 concurrent, 1s delay, 10s timeout
- Pagination: up to 5 pages per NGOBox source, sequential
- API sources (Grants.gov, GOV.UK): single request each

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
- **IDR** (idronline.org) — Indian development sector articles
- **NITI Aayog** — Government of India policy think tank
- **MyGov.in** — Government citizen engagement platform
- **Give2Asia** — Asia-focused philanthropy grants