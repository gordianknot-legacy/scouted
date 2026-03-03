# MCA CSR Data Scraper (FY 2023-24)

Extracts company-wise Corporate Social Responsibility spending data from the Ministry of Corporate Affairs (MCA) portal. The scraper uses Playwright browser automation to bypass Akamai CDN protections and interact with the MCA's live search + API.

## Prerequisites

```bash
npm install playwright dotenv
npx playwright install chromium
```

Optional (for CAPTCHA fallback only):
- `OPENROUTER_API_KEY` in `.env` — only needed if the MCA API starts returning 403

## Architecture

```
MCA Portal (mca.gov.in)
    |
    |  1. Live Search (type prefix → keyup AJAX)
    v
Company Table (name + CIN)
    |
    |  2. Deduplicate by CIN across all prefixes
    v
Unique CINs (~2000+)
    |
    |  3. page.evaluate(fetch(API_URL + ?cin=X&fy=FY 2023-24))
    v
Raw API Records (per state/district granularity)
    |
    |  4. transformAndSave() — classify sectors, aggregate "Other"
    v
csr_report_23_24.json
    |
    |  5. npx tsx csr-upsert.ts — validate, dedup (sum amounts), upsert
    v
Supabase csr_spending table
    |
    |  6. Frontend fetches via useCsrData() hook
    v
CSR Partnership Prospects page (/csr-data)
```

## Usage

### Full Scrape (Discover + Fetch)

```bash
cd scraper
node csr-scraper.js
```

This runs both phases:
1. **Discovery** — types 20 search prefixes into the MCA portal, harvests company names + CINs
2. **API Fetch** — calls the CSR detail API for each unique CIN, saves raw data + transformed report

### Resume (Skip Discovery)

```bash
node csr-scraper.js --resume
```

Loads `csr_companies.json` (saved from previous discovery) and continues API calls from where the progress file left off. Useful if a session expired mid-scrape.

### Custom Prefixes

```bash
node csr-scraper.js --prefixes lim,tat,rel
```

### Rank Top 500

```bash
node csr-scraper.js --rank
```

Reads raw API data from `csr_progress.json`, ranks companies by total CSR spend, outputs `csr_top500.json` with `education_spend`, `vocational_spend`, and `total_spend` per company.

### Upsert to Supabase

```bash
npx tsx csr-upsert.ts --file csr_report_23_24.json --fy 2023-24
```

## How the Scraper Works

### Phase 1: Live Search Discovery

The MCA portal has a live search feature: typing >= 3 characters triggers a `keyup` AJAX call that populates a company table. This **does not require CAPTCHA**.

The scraper types 20 strategic prefixes:
```
lim, ind, pri, cor, ent, pow, ste, ban, pha, ene,
oil, inf, tat, rel, fin, ins, tec, cem, aut, che
```

For each prefix:
1. Types via `pressSequentially()` to trigger the AJAX
2. Waits for the table to stabilise (4+ seconds of no row count change)
3. Clicks `#show_all` if available to load full results
4. Extracts `{ name, cin }` from table rows (`data-company`, `data-cin` attributes)
5. Deduplicates by CIN across all prefix runs

### Phase 2: API Fetch

For each unique CIN:
1. Calls `page.evaluate(fetch(API_PATH + '?cin=X&fy=FY 2023-24'))` — stays within the Akamai session
2. Parses response: `json.cmpny_csr_detail.data.cmpny_csr_detail_data`
3. Each record contains: `cin`, `amnt_spent`, `sector`, `csr_prjct`, `state`, `district`, `fncl_yr`, `mode`, `outlay`
4. 800ms delay between API calls; progress saved every 25 companies
5. Stops after 10 consecutive errors (session likely expired)

### Phase 3: Transform (`transformAndSave()`)

Groups raw API records by CIN and classifies each record's MCA `sector` field:

| MCA Sector Contains | Output Field Prefix | Example |
|---------------------|---------------------|---------|
| `"education"` | `Education: <project>` | `Education: Smart School Project` |
| `"vocational"` | `Vocational Skills: <project>` | `Vocational Skills: Skill Training For Youth` |
| Anything else | Summed into one row | `Other CSR Fields (Cumulative)` |

**Important:** Education and Vocational Skills are distinct MCA Schedule VII sectors and must stay separate. The frontend displays and filters them independently.

### Phase 4: Upsert (`csr-upsert.ts`)

1. Validates each row (requires `Company`, `CIN`, `Field`)
2. **Deduplicates by `cin|field|fiscal_year` key — SUMS amounts** for duplicate keys. This is critical because the MCA API returns one row per state/district. The same project name appears multiple times with different spend amounts across geographies. Summing gives the correct per-project total.
3. Upserts in batches of 50 to Supabase
4. Conflict resolution on `(cin, field, fiscal_year)` composite key — re-runs update existing rows

## Output Files

| File | Contents |
|------|----------|
| `csr_companies.json` | All discovered `{ name, cin }` pairs |
| `csr_progress.json` | Raw API data + processed company list (for `--resume`) |
| `csr_report_23_24.json` | Transformed output: `{ Company, CIN, Field, Spend_INR }[]` |
| `csr_top500.json` | Ranked companies with education/vocational/total spend |

## CAPTCHA Fallback

If the MCA API starts returning 403 (Akamai session expired or CAPTCHA required):
1. Scraper takes a screenshot of the CAPTCHA
2. Sends the screenshot to OpenRouter vision model (`google/gemini-2.0-flash-001`)
3. Submits the transcribed CAPTCHA text
4. Requires `OPENROUTER_API_KEY` in `.env`

## Known Limitations

- **Akamai session**: Browser sessions can expire mid-scrape. Use `--resume` to continue.
- **Rate limits**: 800ms delay between API calls. Faster rates risk 403 blocks.
- **Data completeness**: Coverage depends on search prefix selection. Current 20 prefixes cover the vast majority of CSR-filing companies but may miss some.
- **MCA API duplicates**: The geographic distribution API sometimes returns duplicate rows for the same `(project, state, district)`. The upsert dedup handles this by summing.
- **Supabase row limit**: Default Supabase JS client returns max 1000 rows. Current FY 2023-24 dataset has 979 rows.
