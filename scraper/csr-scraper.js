/**
 * CSR Data Scraper — MCA Portal (Per-Company CAPTCHA)
 *
 * For each target company:
 *   1. Type search term → live search populates table
 *   2. Click the matching company row → CAPTCHA appears
 *   3. Intercept audio WAV from generateCaptchaWithHMAC → local Whisper transcription
 *   4. Submit → intercept the API response with CSR data
 *   5. Save results, move to next company
 *
 * Requires: Python 3.13+ with faster-whisper installed
 *   pip install faster-whisper
 *
 * Usage:
 *   node csr-scraper.js                              (scrape TARGET_COMPANIES list)
 *   node csr-scraper.js --resume                     (skip already-processed companies)
 *   node csr-scraper.js --manual                     (solve each captcha yourself)
 *   node csr-scraper.js --start 20                   (start from company #20)
 *   node csr-scraper.js --only "tata,reliance"       (only specific companies)
 *   node csr-scraper.js --discover                   (discover companies via live search, no CAPTCHA)
 *   node csr-scraper.js --source target              (use TARGET_COMPANIES, default)
 *   node csr-scraper.js --source companies           (use csr_companies.json, prioritised)
 *   node csr-scraper.js --source mylist.json         (use custom JSON [{name,cin},...])
 *   node csr-scraper.js --rank                       (rank scraped companies by spend, output top 500)
 *
 * Output: csr_report_23_24.json, csr_top500.json
 */

import { chromium } from 'playwright';
import { config } from 'dotenv';
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import fs from 'fs';
import path from 'path';

// Load .env from project root
config({ path: path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '.env') });

// ─── Config ─────────────────────────────────────────────────────────────────
const MCA_URL = 'https://www.mca.gov.in/content/csr/global/master/home/ExploreCsrData/company-wise.html';
const API_PATH = '/content/csr/global/master/home/home/csr-expenditure--geographical-distribution/state/district/company.companyReportAPI.html';
const TARGET_FY = 'FY 2023-24';
const OUTPUT_FILE = 'csr_report_23_24.json';
const PROGRESS_FILE = 'csr_progress.json';
const PROFILE_DIR = path.resolve('./mca-browser-profile');
const MAX_CAPTCHA_RETRIES = 15;
const COMPANIES_FILE = 'csr_companies.json';
const DISCOVER_PROGRESS_FILE = 'csr_discover_progress.json';
const TOP500_FILE = 'csr_top500.json';

// ─── Discovery Prefixes (for --discover mode) ──────────────────────────────
// ~80 prefixes covering top CSR spenders + broad company coverage
const DISCOVER_PREFIXES = [
  // Original 20
  'lim', 'ind', 'pri', 'cor', 'ent', 'pow', 'ste', 'ban', 'pha', 'ene',
  'oil', 'inf', 'tat', 'rel', 'fin', 'ins', 'tec', 'cem', 'aut', 'che',
  // New ~60 for gaps (HDFC, Bajaj, Wipro, SBI, etc.)
  'hdf', 'baj', 'wip', 'ada', 'coa', 'sbi', 'sta', 'rec', 'nat', 'hdfc',
  'bha', 'her', 'god', 'kot', 'amb', 'ult', 'lar', 'hin', 'jsw', 'ved',
  'cip', 'sun', 'hcl', 'mar', 'nes', 'dlf', 'api', 'axi', 'ici', 'ong',
  'pet', 'ntp', 'gra', 'tit', 'vol', 'yes', 'lup', 'pid', 'mut', 'hou',
  'gar', 'mis', 'nal', 'ney', 'nor', 'rai', 'ras', 'sat', 'bri', 'col',
  'cro', 'eng', 'esa', 'exl', 'goa', 'hyu', 'jin', 'lti', 'man', 'mah',
];

// ─── Target Companies (Top ~100 CSR Spenders) ──────────────────────────────
const TARGET_COMPANIES = [
  'AADHAR HOUSING FINANCE LIMITED',
  'ADANI ENTERPRISES LIMITED',
  'ADANI TOTAL GAS LTD',
  'ADITYA BIRLA CAPITAL LIMITED',
  'AGEAS FEDERAL LIFE INSURANCE',
  'APOLLO TYRES LIMITED',
  'ASIAN PAINTS LTD.',
  'AXIS BANK LTD.',
  'BAJAJ AUTO LIMITED',
  'BAJAJ FINSERV LIMITED',
  'BHARAT COKING COAL LIMITED',
  'BHARAT ELECTRONICS LIMITED',
  'BHARAT HEAVY ELECTRICALS LIMITED',
  'BHARAT PETROLEUM CORPORATION LIMITED',
  'BRITANNIA INDUSTRIES LIMITED',
  'CENTRAL COALFIELDS LIMITED',
  'CGI',
  'CIPLA LIMITED',
  'COAL INDIA LIMITED',
  'COLGATE PALMOLIVE (INDIA) LIMITED',
  'CROMPTON GREAVES CONSUMER ELECTRICALS LIMITED',
  'DLF LIMITED',
  "DR. REDDY'S LABORATORIES",
  'ELECTRONICS CORPORATION OF INDIA LIMITED',
  'ENGINEERS INDIA LIMITED',
  'ESAB INDIA LIMITED',
  'EXL SERVICE (INDIA) PRIVATE LIMITED',
  'GARDEN REACH SHIPBUILDERS & ENGINEERS LIMITED',
  'GOA SHIPYARD LIMITED',
  'GRASIM INDUSTRIES LIMITED',
  'HCL TECHNOLOGIES LIMITED',
  'HDFC BANK LIMITED',
  'HERO MOTOCORP LIMITED',
  'HINDALCO INDUSTRIES LIMITED',
  'HINDUSTAN AERONAUTICS LIMITED',
  'HINDUSTAN COPPER LIMITED',
  'HINDUSTAN PETROLEUM CORPORATION LIMITED',
  'HINDUSTAN UNILEVER LIMITED',
  'HINDUSTAN URVARAK & RASAYAN LIMITED',
  'HINDUSTAN ZINC LIMITED',
  'HONDA INDIA FOUNDATION',
  'HOUSING AND URBAN DEVELOPMENT CORPORATION LIMITED',
  'HYUNDAI MOTOR INDIA LTD',
  'ICICI BANK LIMITED',
  'INDIAN OIL CORPORATION LIMITED',
  'INFOSYS LIMITED',
  'ITC LIMITED',
  'JINDAL STEEL AND POWER LIMITED',
  'JSW STEEL LIMITED',
  'KOTAK MAHINDRA BANK LIMITED',
  'LARSEN & TOUBRO LIMITED',
  'LTIMINDTREE LIMITED',
  'LUPIN LIMITED',
  'MAHINDRA AND MAHINDRA LIMITED',
  'MANGANESE ORE (INDIA) LIMITED',
  'MARICO LIMITED',
  'MARUTI SUZUKI INDIA LTD.',
  'METAL SCRAP TRADE CORPORATION LIMITED',
  'METALLURGICAL & ENGINEERING CONSULTANTS (INDIA) LIMITED',
  'MISHRA DHATU NIGAM LIMITED',
  'MUTHOOT FINANCE LTD',
  'NATIONAL ALUMINIUM COMPANY LIMITED',
  'NATIONAL HYDROELECTRIC POWER CORPORATION LIMITED',
  'NATIONAL FERTILIZERS LIMITED',
  'NATIONAL MINERAL DEVELOPMENT CORPORATION LIMITED',
  'NATIONAL THERMAL POWER CORPORATION LIMITED',
  'NESTLE INDIA LIMITED',
  'NEYVELI LIGNITE CORPORATION INDIA LIMITED',
  'NORTH EASTERN ELECTRIC POWER CORPORATION LIMITED',
  'NORTHERN COALFIELDS LIMITED',
  'OIL AND NATURAL GAS CORPORATION LIMITED',
  'OIL INDIA LIMITED',
  'PETRONET LNG LIMITED',
  'PIDILITE INDUSTRIES LIMITED',
  'POWER FINANCE CORPORATION LIMITED',
  'POWER GRID CORPORATION OF INDIA LIMITED',
  'RAILTEL CORPORATION OF INDIA LIMITED',
  'RASHTRIYA CHEMICALS AND FERTILIZERS LIMITED',
  'REC LIMITED',
  'RELIANCE INDUSTRIES LIMITED',
  'RELIANCE JIO INFOCOMM LIMITED',
  'SATLUJ JAL VIDYUT NIGAM LIMITED',
  'STATE BANK OF INDIA',
  'STEEL AUTHORITY OF INDIA LIMITED',
  'SUN PHARMACEUTICAL INDUSTRIES LIMITED',
  'TATA CONSULTANCY SERVICES LIMITED',
  'TATA CONSUMER PRODUCTS LIMITED',
  'TATA MOTORS LIMITED',
  'TATA POWER COMPANY LIMITED',
  'TATA STEEL LIMITED',
  'TECH MAHINDRA LIMITED',
  'THDC INDIA LIMITED',
  'TITAN COMPANY LIMITED',
  'ULTRATECH CEMENT LIMITED',
  'VA TECH WABAG LIMITED',
  'VEDANTA LIMITED',
  'VOLTAS LIMITED',
  'WIPRO LIMITED',
  'YES BANK LIMITED',
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));
const isResume = process.argv.includes('--resume');
const isManual = process.argv.includes('--manual');

function getStartIndex() {
  const idx = process.argv.indexOf('--start');
  if (idx !== -1 && process.argv[idx + 1]) return parseInt(process.argv[idx + 1]) - 1;
  return 0;
}

function getOnlyFilter() {
  const idx = process.argv.indexOf('--only');
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1].split(',').map(s => s.trim().toLowerCase());
  }
  return null;
}

const isDiscover = process.argv.includes('--discover');
const isRank = process.argv.includes('--rank');

function getSourceFlag() {
  const idx = process.argv.indexOf('--source');
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return 'target';
}

function getDiscoverPrefixes() {
  const idx = process.argv.indexOf('--prefixes');
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1].split(',').map(s => s.trim().toLowerCase());
  }
  return DISCOVER_PREFIXES;
}

/** Load previously discovered companies from csr_companies.json */
function loadDiscoveredCompanies() {
  try {
    if (fs.existsSync(COMPANIES_FILE)) {
      return JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf-8'));
    }
  } catch {}
  return [];
}

/** Load discover progress (which prefixes have been processed) */
function loadDiscoverProgress() {
  try {
    if (fs.existsSync(DISCOVER_PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(DISCOVER_PROGRESS_FILE, 'utf-8'));
    }
  } catch {}
  return { completedPrefixes: [] };
}

/** Save discover progress */
function saveDiscoverProgress(completedPrefixes) {
  fs.writeFileSync(DISCOVER_PROGRESS_FILE, JSON.stringify({ completedPrefixes }));
}

/** Build company list from --source flag, sorted by priority */
function buildCompanyList(source) {
  if (source === 'target') {
    return TARGET_COMPANIES.map(name => ({ name, cin: null }));
  }

  const filePath = source === 'companies' ? COMPANIES_FILE : source;
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: Source file not found: ${filePath}`);
    console.error('  Run --discover first to populate csr_companies.json');
    process.exit(1);
  }

  const companies = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`Loaded ${companies.length} companies from ${filePath}`);

  if (source === 'companies') {
    // Prioritise: TARGET_COMPANIES first, then GOI (government), then rest
    const targetNorms = new Set(
      TARGET_COMPANIES.map(n => n.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim())
    );

    const isTargetMatch = (name) => {
      const norm = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
      return targetNorms.has(norm) || [...targetNorms].some(t => norm.includes(t) || t.includes(norm));
    };

    const isGovCompany = (cin) => cin && cin.includes('GOI');

    const tier1 = []; // TARGET_COMPANIES matches
    const tier2 = []; // Government companies (CIN contains GOI)
    const tier3 = []; // Everything else

    for (const c of companies) {
      if (isTargetMatch(c.name)) tier1.push(c);
      else if (isGovCompany(c.cin)) tier2.push(c);
      else tier3.push(c);
    }

    console.log(`  Priority: ${tier1.length} target, ${tier2.length} government, ${tier3.length} other`);
    return [...tier1, ...tier2, ...tier3];
  }

  return companies;
}

/** Build a short search term from company name for live search */
function buildSearchTerm(name) {
  // Remove common suffixes to get distinctive part
  const clean = name
    .replace(/\s*(PRIVATE\s+)?LIMITED\.?$/i, '')
    .replace(/\s*LTD\.?$/i, '')
    .replace(/\s*CORPORATION$/i, '')
    .replace(/\s*COMPANY$/i, '')
    .trim();

  const words = clean.split(/\s+/);

  // For short names (1-2 words), use as-is
  if (words.length <= 2) return clean.toLowerCase();

  // Use first 2-3 distinctive words
  const skipWords = new Set(['and', 'of', 'the', '&', '(india)', 'india']);
  const significant = words.filter(w => !skipWords.has(w.toLowerCase()));
  return significant.slice(0, 2).join(' ').toLowerCase();
}

/** Fuzzy match: check if a table row name matches our target */
function isMatch(tableName, targetName) {
  const a = tableName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  const b = targetName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

  // Exact match
  if (a === b) return true;

  // One contains the other
  if (a.includes(b) || b.includes(a)) return true;

  // First 3 words match
  const aWords = a.split(' ').slice(0, 3).join(' ');
  const bWords = b.split(' ').slice(0, 3).join(' ');
  if (aWords === bWords && aWords.length > 5) return true;

  return false;
}

function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
  } catch {}
  return { processedCompanies: [], allApiData: [] };
}

function saveProgress(processedCompanies, allApiData) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ processedCompanies, allApiData }));
}

function transformAndSave(apiData) {
  const companyMap = new Map();
  for (const item of apiData) {
    const key = item.cin || item.company_name;
    if (!companyMap.has(key)) companyMap.set(key, []);
    companyMap.get(key).push(item);
  }

  const results = [];
  for (const [key, items] of companyMap) {
    const companyName = items[0]?.company_name || key;
    const cin = items[0]?.cin || key;
    let otherSum = 0;

    for (const item of items) {
      const sector = (item.sector || '').toLowerCase();
      const amount = parseFloat(item.amnt_spent) || 0;

      if (sector.includes('education')) {
        results.push({
          Company: companyName,
          CIN: cin,
          Field: `Education: ${item.csr_prjct || item.sector}`,
          Spend_INR: amount,
        });
      } else if (sector.includes('vocational')) {
        results.push({
          Company: companyName,
          CIN: cin,
          Field: `Vocational Skills: ${item.csr_prjct || item.sector}`,
          Spend_INR: amount,
        });
      } else {
        otherSum += amount;
      }
    }

    if (otherSum > 0) {
      results.push({
        Company: companyName,
        CIN: cin,
        Field: 'Other CSR Fields (Cumulative)',
        Spend_INR: otherSum,
      });
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`  Saved ${OUTPUT_FILE}: ${results.length} records from ${companyMap.size} companies`);
  return results;
}

// ─── Audio CAPTCHA: Local Whisper Solver ─────────────────────────────────────

const PYTHON_PATH = 'C:\\Users\\CSF\\AppData\\Local\\Programs\\Python\\Python313\\python.exe';
const SOLVER_SCRIPT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), 'captcha-solver.py');
const TEMP_WAV = path.resolve('./captcha_temp.wav');

let solverProcess = null;
let solverRL = null;
let solverReady = false;

/** Start the Python captcha-solver process (loads model once) */
function startSolver() {
  return new Promise((resolve, reject) => {
    console.log('Starting captcha solver (loading Whisper model)...');
    solverProcess = spawn(PYTHON_PATH, [SOLVER_SCRIPT], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Catch spawn errors (e.g. ENOENT if Python path is wrong)
    solverProcess.on('error', (err) => {
      console.error(`  [solver] spawn error: ${err.message}`);
      reject(new Error(`Solver spawn failed: ${err.message}`));
    });

    solverRL = createInterface({ input: solverProcess.stdout });

    solverProcess.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      // Suppress noisy warnings, only show real errors
      if (msg && !msg.includes('UserWarning') && !msg.includes('symlinks')) {
        console.log(`  [solver] ${msg.slice(0, 120)}`);
      }
    });

    solverProcess.on('exit', (code) => {
      console.log(`  Solver process exited (code ${code})`);
      solverProcess = null;
      solverReady = false;
    });

    // Wait for "READY" line
    const onLine = (line) => {
      if (line.trim() === 'READY') {
        solverReady = true;
        console.log('Captcha solver ready.');
        resolve();
      }
    };
    solverRL.once('line', onLine);

    // Timeout after 90s (model load can be slow on first run)
    setTimeout(() => {
      if (!solverReady) {
        solverRL.removeListener('line', onLine);
        reject(new Error('Solver startup timed out'));
      }
    }, 90000);
  });
}

/** Send a WAV file to the solver and get captcha + alternatives back */
function solveCaptchaAudio(wavFilePath) {
  return new Promise((resolve) => {
    if (!solverProcess || !solverReady) {
      resolve(null);
      return;
    }

    const onLine = (line) => {
      try {
        const result = JSON.parse(line.trim());
        if (result.ok) {
          const method = result.method || 'whisper';
          const conf = result.confidence || [];
          const confStr = conf.length
            ? ` [${conf.map(c => (c * 100).toFixed(0) + '%').join(', ')}]`
            : '';
          const methodLabel = { groq: 'Groq', google: 'Google', whisper: 'Whisper', fingerprint: 'Fingerprint' }[method] || method;
          console.log(`    ${methodLabel} read: "${result.captcha}"${confStr}`);
          if (method !== 'fingerprint') {
            console.log(`    Raw: "${result.raw}"`);
          }
          console.log(`    Alternatives: ${(result.alts || []).length} variants`);
          resolve({
            primary: result.captcha,
            alts: result.alts || [],
            method,
            confidence: conf,
          });
        } else {
          console.log(`    Solver error: ${result.error}`);
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    solverRL.once('line', onLine);

    // Timeout after 15s per solve (cloud APIs return in <2s, base.en in <5s)
    setTimeout(() => {
      solverRL.removeListener('line', onLine);
      console.log('    Solver timed out (15s)');
      resolve(null);
    }, 15000);

    solverProcess.stdin.write(wavFilePath + '\n');
  });
}

/** Stop the solver process */
function stopSolver() {
  if (solverProcess) {
    try {
      solverProcess.stdin.write('EXIT\n');
      solverProcess.stdin.end();
    } catch {}
  }
}

/** Extract WAV audio from the multipart response of generateCaptchaWithHMAC */
function extractWavFromMultipart(buffer) {
  for (let i = 0; i < buffer.length - 12; i++) {
    if (buffer[i] === 0x52 && buffer[i + 1] === 0x49 &&
        buffer[i + 2] === 0x46 && buffer[i + 3] === 0x46 &&
        buffer[i + 8] === 0x57 && buffer[i + 9] === 0x41 &&
        buffer[i + 10] === 0x56 && buffer[i + 11] === 0x45) {
      const fileSize = buffer.readUInt32LE(i + 4) + 8;
      if (i + fileSize <= buffer.length) {
        return Buffer.from(buffer.slice(i, i + fileSize));
      }
      return Buffer.from(buffer.slice(i));
    }
  }
  return null;
}

// ─── Discover Mode: CAPTCHA-free company harvesting ─────────────────────────

async function discoverCompanies(page) {
  const prefixes = getDiscoverPrefixes();
  const discoverProg = loadDiscoverProgress();
  const completedSet = new Set(discoverProg.completedPrefixes || []);

  // Load existing companies and build CIN set for dedup
  const existingCompanies = loadDiscoveredCompanies();
  const cinSet = new Set(existingCompanies.map(c => c.cin));
  const allCompanies = [...existingCompanies];

  const pendingPrefixes = prefixes.filter(p => !completedSet.has(p));
  console.log(`\nDiscover mode: ${prefixes.length} prefixes (${pendingPrefixes.length} remaining)`);
  console.log(`Existing companies: ${allCompanies.length} (${cinSet.size} unique CINs)\n`);

  let totalNew = 0;

  for (let pi = 0; pi < prefixes.length; pi++) {
    const prefix = prefixes[pi];

    if (completedSet.has(prefix)) {
      continue;
    }

    console.log(`[${pi + 1}/${prefixes.length}] Prefix: "${prefix}"`);

    // Type prefix into search box
    const searchBox = page.locator('#SearchBox');
    await searchBox.click();
    await searchBox.fill('');
    await sleep(500);
    await searchBox.pressSequentially(prefix, { delay: 120 });

    // Wait for table to stabilise (at least 4s of no row count change)
    let prevCount = 0;
    let stableStart = null;
    for (let i = 0; i < 25; i++) {
      await sleep(1000);
      const count = await page.$$eval(
        '#myTable #geoTBody tr, #myTable tbody tr',
        r => r.length
      ).catch(() => 0);

      if (count > 0 && count === prevCount) {
        if (!stableStart) stableStart = Date.now();
        if (Date.now() - stableStart >= 4000) break;
      } else {
        stableStart = null;
      }
      prevCount = count;
    }

    if (prevCount === 0) {
      console.log(`  No results for "${prefix}". Skipping.`);
      completedSet.add(prefix);
      saveDiscoverProgress([...completedSet]);
      continue;
    }

    // Click "Show All" to get full results if available
    try {
      const showAllBtn = page.locator('#show_all');
      const visible = await showAllBtn.isVisible({ timeout: 2000 }).catch(() => false);
      if (visible) {
        await showAllBtn.click();
        await sleep(3000);
        // Wait for expanded table to stabilise
        for (let i = 0; i < 10; i++) {
          await sleep(1000);
          const count = await page.$$eval(
            '#myTable #geoTBody tr, #myTable tbody tr',
            r => r.length
          ).catch(() => 0);
          if (count > prevCount) {
            prevCount = count;
          } else if (count === prevCount) {
            break;
          }
        }
      }
    } catch {}

    // Extract all {name, cin} from the table
    const rowData = await page.$$eval(
      '#myTable #geoTBody tr, #myTable tbody tr',
      rows => rows.map(r => ({
        name: r.getAttribute('data-company') || r.querySelector('td')?.innerText?.trim() || '',
        cin: r.getAttribute('data-cin') || '',
      })).filter(d => d.name && d.cin)
    ).catch(() => []);

    // Deduplicate against existing CINs
    let newCount = 0;
    for (const row of rowData) {
      if (!cinSet.has(row.cin)) {
        cinSet.add(row.cin);
        allCompanies.push(row);
        newCount++;
      }
    }

    totalNew += newCount;
    console.log(`  Found ${rowData.length} rows, ${newCount} new (total: ${allCompanies.length})`);

    // Mark prefix as done and save
    completedSet.add(prefix);
    saveDiscoverProgress([...completedSet]);

    // Save companies every prefix
    fs.writeFileSync(COMPANIES_FILE, JSON.stringify(allCompanies, null, 2));

    // Brief delay before next prefix
    await sleep(1500);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Discovery complete`);
  console.log(`${'='.repeat(50)}`);
  console.log(`Total companies: ${allCompanies.length} (${cinSet.size} unique CINs)`);
  console.log(`New this run: ${totalNew}`);
  console.log(`Saved to: ${COMPANIES_FILE}`);
  console.log(`\nNext: node csr-scraper.js --source companies --resume`);

  return allCompanies;
}

// ─── Rank Mode: Generate top 500 by total spend ─────────────────────────────

function rankCompanies() {
  const progress = loadProgress();
  const apiData = progress.allApiData || [];

  if (apiData.length === 0) {
    console.error('ERROR: No API data found in csr_progress.json');
    console.error('  Run the scraper first to collect data.');
    process.exit(1);
  }

  console.log(`Ranking from ${apiData.length} raw API records...`);

  // Group by CIN and sum amnt_spent
  const companyMap = new Map();
  for (const item of apiData) {
    const cin = item.cin || 'UNKNOWN';
    if (!companyMap.has(cin)) {
      companyMap.set(cin, {
        cin,
        company_name: item.company_name || '',
        total_spend: 0,
        education_spend: 0,
        vocational_spend: 0,
        record_count: 0,
        sectors: new Set(),
      });
    }
    const entry = companyMap.get(cin);
    const amount = parseFloat(item.amnt_spent) || 0;
    entry.total_spend += amount;
    entry.record_count++;

    const sector = (item.sector || '').toLowerCase();
    if (sector) entry.sectors.add(item.sector);
    if (sector.includes('education')) {
      entry.education_spend += amount;
    } else if (sector.includes('vocational')) {
      entry.vocational_spend += amount;
    }
  }

  // Sort by total spend descending
  const ranked = [...companyMap.values()]
    .sort((a, b) => b.total_spend - a.total_spend)
    .slice(0, 500)
    .map((entry, i) => ({
      rank: i + 1,
      company: entry.company_name,
      cin: entry.cin,
      total_spend_inr: Math.round(entry.total_spend),
      education_spend_inr: Math.round(entry.education_spend),
      vocational_spend_inr: Math.round(entry.vocational_spend),
      total_spend_crore: (entry.total_spend / 1e7).toFixed(2),
      education_spend_crore: (entry.education_spend / 1e7).toFixed(2),
      vocational_spend_crore: (entry.vocational_spend / 1e7).toFixed(2),
      record_count: entry.record_count,
      sector_count: entry.sectors.size,
    }));

  fs.writeFileSync(TOP500_FILE, JSON.stringify(ranked, null, 2));

  console.log(`\n${'='.repeat(60)}`);
  console.log(`TOP 500 CSR SPENDERS (FY 2023-24)`);
  console.log(`${'='.repeat(60)}`);

  // Show top 20 summary
  const showCount = Math.min(20, ranked.length);
  for (const r of ranked.slice(0, showCount)) {
    const eduPct = r.total_spend_inr > 0
      ? ((r.education_spend_inr / r.total_spend_inr) * 100).toFixed(0)
      : '0';
    console.log(`  #${String(r.rank).padStart(3)} | ₹${r.total_spend_crore.padStart(8)} Cr | Edu: ${eduPct.padStart(3)}% | ${r.company}`);
  }

  if (ranked.length > showCount) {
    console.log(`  ... and ${ranked.length - showCount} more`);
  }

  console.log(`\nTotal companies ranked: ${ranked.length}`);
  console.log(`Companies with data: ${companyMap.size}`);
  console.log(`Saved to: ${TOP500_FILE}`);
  console.log(`\nNext: npx tsx csr-upsert.ts --file ${OUTPUT_FILE} --fy 2023-24`);
}

/** Intercept captcha response, extract WAV, solve with Whisper. Returns {primary, alts} or null */
async function solveCaptchaFromResponse(responseBody) {
  const wav = extractWavFromMultipart(responseBody);
  if (!wav) {
    console.log('    No WAV found in captcha response.');
    return null;
  }
  console.log(`    Captured audio: ${Math.round(wav.length / 1024)}KB WAV`);

  fs.writeFileSync(TEMP_WAV, wav);
  return solveCaptchaAudio(TEMP_WAV);
}




// ─── Process One Company ────────────────────────────────────────────────────
async function processCompany(page, companyName, index, total) {
  const searchTerm = buildSearchTerm(companyName);
  console.log(`\n[${index + 1}/${total}] ${companyName}`);
  console.log(`  Searching: "${searchTerm}"`);

  // Clear and type search term
  const searchBox = page.locator('#SearchBox');
  await searchBox.click();
  await searchBox.fill('');
  await sleep(500);
  await searchBox.pressSequentially(searchTerm, { delay: 100 });

  // Wait for table to stabilise
  let prevCount = 0;
  let stableStart = null;
  for (let i = 0; i < 20; i++) {
    await sleep(1000);
    const count = await page.$$eval(
      '#myTable #geoTBody tr, #myTable tbody tr',
      r => r.length
    ).catch(() => 0);
    if (count > 0 && count === prevCount) {
      if (!stableStart) stableStart = Date.now();
      if (Date.now() - stableStart >= 3000) break;
    } else {
      stableStart = null;
    }
    prevCount = count;
  }

  if (prevCount === 0) {
    console.log('  No results found. Trying shorter search...');
    // Try just the first word
    const firstWord = searchTerm.split(' ')[0];
    await searchBox.click();
    await searchBox.fill('');
    await sleep(500);
    await searchBox.pressSequentially(firstWord, { delay: 100 });

    for (let i = 0; i < 15; i++) {
      await sleep(1000);
      prevCount = await page.$$eval(
        '#myTable #geoTBody tr, #myTable tbody tr',
        r => r.length
      ).catch(() => 0);
      if (prevCount > 0) {
        await sleep(3000); // Wait for it to stabilise
        break;
      }
    }

    if (prevCount === 0) {
      console.log('  SKIP: No results for this company.');
      return null;
    }
  }

  console.log(`  Found ${prevCount} results. Looking for match...`);

  // Find the best matching row — rank by similarity, prefer exact/shorter matches
  const matchResult = await page.evaluate(({ target }) => {
    const normalise = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    const targetNorm = normalise(target);

    const rows = document.querySelectorAll('#myTable #geoTBody tr, #myTable tbody tr');
    const candidates = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row.getAttribute('data-company') ||
                   row.querySelector('td')?.innerText?.trim() || '';
      const nameNorm = normalise(name);
      const cin = row.getAttribute('data-cin') || '';

      let score = 0;
      // Exact match
      if (nameNorm === targetNorm) score = 100;
      // Target contains the row name (row name is shorter)
      else if (targetNorm.includes(nameNorm) && nameNorm.length > 5) score = 80;
      // Row name contains the target (row name is longer/more specific)
      else if (nameNorm.includes(targetNorm) && targetNorm.length > 5) score = 70;
      // First 3 words match
      else {
        const tWords = targetNorm.split(' ').slice(0, 3).join(' ');
        const nWords = nameNorm.split(' ').slice(0, 3).join(' ');
        if (tWords === nWords && tWords.length > 5) score = 60;
        // First 2 words match
        else {
          const t2 = targetNorm.split(' ').slice(0, 2).join(' ');
          const n2 = nameNorm.split(' ').slice(0, 2).join(' ');
          if (t2 === n2 && t2.length > 5) score = 40;
        }
      }

      if (score > 0) {
        // Bonus: prefer names closer in length to target (penalise very different lengths)
        const lenDiff = Math.abs(nameNorm.length - targetNorm.length);
        score -= Math.min(lenDiff, 20);
        candidates.push({ index: i, name, cin, score });
      }
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length > 0) {
      const best = candidates[0];
      return { found: true, index: best.index, name: best.name, cin: best.cin };
    }

    // Return first few rows for debugging
    const firstRows = [];
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      firstRows.push(rows[i].getAttribute('data-company') || rows[i].querySelector('td')?.innerText?.trim() || '?');
    }
    return { found: false, firstRows };
  }, { target: companyName });

  if (!matchResult.found) {
    console.log(`  SKIP: No matching row found.`);
    if (matchResult.firstRows) {
      console.log(`  Available: ${matchResult.firstRows.slice(0, 3).join(' | ')}`);
    }
    return null;
  }

  console.log(`  Matched: "${matchResult.name}" (CIN: ${matchResult.cin})`);

  // Manual mode: human solves in browser
  if (isManual) {
    const rows = page.locator('#myTable #geoTBody tr, #myTable tbody tr');
    await rows.nth(matchResult.index).click();
    await sleep(2000);
    console.log('  MANUAL: Solve the CAPTCHA and click Submit in the browser.');
    try {
      const response = await page.waitForResponse(
        resp => resp.url().includes('companyReportAPI'),
        { timeout: 120000 }
      );
      const json = await response.json().catch(() => null);
      if (json && json.resCode !== '206') {
        const items = json?.cmpny_csr_detail?.data?.cmpny_csr_detail_data || [];
        console.log(`  Got ${items.length} CSR records.`);
        return items.map(item => ({ ...item, company_name: matchResult.name }));
      }
    } catch {
      console.log('  Timed out waiting for manual captcha.');
    }
    return null;
  }

  // ── Auto CAPTCHA: Single-shot per attempt ───────────────────────────
  // Each attempt: click row → wait for captcha → grab audio → solve → submit.
  // Uses a persistent listener to always capture the latest captcha response.

  // Dismiss any alert dialogs automatically
  page.on('dialog', dialog => dialog.dismiss().catch(() => {}));

  // Persistent listener: always store the latest captcha response body
  let lastCaptchaBody = null;
  page.on('response', async (resp) => {
    if (resp.url().includes('generateCaptchaWithHMAC') && resp.status() === 200) {
      try {
        lastCaptchaBody = await resp.body();
        console.log(`    [listener] Captured captcha response: ${Math.round(lastCaptchaBody.length / 1024)}KB`);
      } catch {}
    }
  });

  for (let attempt = 0; attempt < MAX_CAPTCHA_RETRIES; attempt++) {
    // On retry, reload page and re-search
    if (attempt > 0) {
      console.log('  Reloading page for fresh attempt...');
      await page.goto(MCA_URL, { waitUntil: 'networkidle', timeout: 60000 });
      await sleep(2000);
      await page.locator('#SearchBox').waitFor({ timeout: 15000 });
      const searchBox = page.locator('#SearchBox');
      await searchBox.fill('');
      await searchBox.pressSequentially(buildSearchTerm(companyName), { delay: 100 });
      for (let w = 0; w < 15; w++) {
        await sleep(1000);
        const count = await page.$$eval('#myTable tbody tr', r => r.length).catch(() => 0);
        if (count > 0) { await sleep(3000); break; }
      }
    }

    // Step 1: Clear last captcha, then click row (triggers fresh generateCaptchaWithHMAC)
    lastCaptchaBody = null;
    const rows = page.locator('#myTable #geoTBody tr, #myTable tbody tr');
    await rows.nth(matchResult.index).click();
    console.log(`  Attempt ${attempt + 1}/${MAX_CAPTCHA_RETRIES}: clicked row, waiting for captcha...`);

    // Step 2: Wait for captcha dialog to render
    try {
      await page.locator('#captcha_play_image').waitFor({ timeout: 10000 });
    } catch {
      console.log(`  Attempt ${attempt + 1}/${MAX_CAPTCHA_RETRIES}: captcha dialog did not appear`);
      continue;
    }

    // Step 3: Wait for the listener to capture the captcha response (poll up to 10s)
    for (let w = 0; w < 20 && !lastCaptchaBody; w++) {
      await sleep(500);
    }
    if (!lastCaptchaBody) {
      console.log(`  Attempt ${attempt + 1}/${MAX_CAPTCHA_RETRIES}: no captcha response captured`);
      continue;
    }

    // Step 4: Extract WAV and solve
    let solveResult = null;
    try {
      solveResult = await solveCaptchaFromResponse(lastCaptchaBody);
    } catch (err) {
      console.log(`  Attempt ${attempt + 1}/${MAX_CAPTCHA_RETRIES}: solve error: ${err.message}`);
    }

    if (!solveResult || !solveResult.primary) {
      console.log(`  Attempt ${attempt + 1}/${MAX_CAPTCHA_RETRIES}: solve failed`);
      continue;
    }

    // Step 5: Try primary answer, then each alternative before reloading
    const candidates = [solveResult.primary, ...solveResult.alts];
    let apiResponse = null;

    for (let ci = 0; ci < candidates.length; ci++) {
      const answer = candidates[ci];
      console.log(`  Attempt ${attempt + 1}/${MAX_CAPTCHA_RETRIES}: submitting "${answer}" (${ci === 0 ? 'primary' : `alt ${ci}/${solveResult.alts.length}`})`);

      const captchaInput = page.locator('#customCaptchaInput');
      await captchaInput.click();
      await captchaInput.fill('');
      await captchaInput.pressSequentially(answer, { delay: 50 });

      // Submit the captcha answer
      await page.locator('#check').click();
      await sleep(1500);

      // Check for wrong captcha
      const pageText = await page.textContent('body').catch(() => '');
      if (pageText.includes('captcha entered is incorrect') || pageText.includes('Incorrect Captcha')) {
        console.log('    Wrong captcha.');
        // If more alternatives remain, try next without reloading
        if (ci + 1 < candidates.length) {
          const dialogVisible = await page.locator('#customCaptchaInput').isVisible({ timeout: 2000 }).catch(() => false);
          if (!dialogVisible) {
            console.log('    Captcha dialog closed. Will reload.');
            break;
          }
          continue;
        }
        break; // No more alternatives
      }

      // Captcha accepted — now click Download Report to trigger the API call
      console.log('    Captcha accepted. Clicking Download Report...');
      try {
        const dlBtn = page.locator('#downloadreport');
        await dlBtn.waitFor({ state: 'visible', timeout: 8000 });

        // Wait for button to become enabled (not disabled)
        for (let w = 0; w < 10; w++) {
          const isDisabled = await dlBtn.evaluate(el =>
            el.classList.contains('disable-cursor') || el.disabled || el.getAttribute('disabled') !== null
          ).catch(() => true);
          if (!isDisabled) break;
          await sleep(500);
        }

        const apiRespPromise = page.waitForResponse(
          resp => resp.url().includes('companyReportAPI'),
          { timeout: 15000 }
        ).catch(() => null);

        await dlBtn.click({ timeout: 5000 });
        console.log('    Clicked download report. Waiting for API response...');

        apiResponse = await apiRespPromise;
      } catch (err) {
        console.log(`    Download report error: ${err.message.slice(0, 80)}`);
      }

      if (apiResponse) break; // Success!
      console.log('    No API response after download click.');
      break;
    }

    if (!apiResponse) {
      continue; // Retry with fresh page
    }

    let apiData = null;
    try {
      const text = await apiResponse.text();
      const json = JSON.parse(text);
      if (json.resCode === '206' || json.resCode === 206) {
        console.log('    Session expired. Will retry.');
        continue;
      }
      const items = json?.cmpny_csr_detail?.data?.cmpny_csr_detail_data || [];
      apiData = items.filter(item => item.fncl_yr === TARGET_FY)
                     .map(item => ({ ...item, company_name: matchResult.name }));
    } catch {
      console.log('    Failed to parse API response.');
      continue;
    }

    console.log(`  SUCCESS: ${apiData.length} records for ${TARGET_FY}`);
    return apiData;
  }

  console.log('  FAILED: Could not solve CAPTCHA after max retries.');
  return null;
}

// ─── Main ───────────────────────────────────────────────────────────────────
(async () => {
  // ── Rank mode: offline, no browser needed ────────────────────────────
  if (isRank) {
    rankCompanies();
    return;
  }

  const startIdx = getStartIndex();
  const onlyFilter = getOnlyFilter();
  const source = getSourceFlag();

  // Build target list based on --source flag
  let targets;
  if (isDiscover) {
    // Discover mode — targets not needed, we just harvest CINs
    targets = [];
  } else if (source === 'target') {
    targets = TARGET_COMPANIES.map(name => ({ name, cin: null }));
  } else {
    targets = buildCompanyList(source);
  }

  if (onlyFilter && !isDiscover) {
    targets = targets.filter(t =>
      onlyFilter.some(f => t.name.toLowerCase().includes(f))
    );
    console.log(`Filtered to ${targets.length} companies matching: ${onlyFilter.join(', ')}`);
  }

  console.log(`ScoutEd CSR Scraper`);
  if (isDiscover) {
    console.log(`Mode: DISCOVER (CAPTCHA-free live search harvesting)`);
  } else {
    console.log(`Mode: ${isManual ? 'manual CAPTCHA' : 'auto CAPTCHA (solver cascade)'}`);
    console.log(`Source: ${source} (${targets.length} companies, starting from #${startIdx + 1})`);
  }
  console.log(`Target FY: ${TARGET_FY}\n`);

  // Start the local Whisper solver (loads model once) — not needed for discover
  if (!isManual && !isDiscover) {
    try {
      await startSolver();
    } catch (err) {
      console.error(`ERROR: Could not start captcha solver: ${err.message}`);
      console.error('  Make sure faster-whisper is installed: pip install faster-whisper');
      console.error('  Or run with --manual to solve each captcha yourself.');
      process.exit(1);
    }
  }

  // Load progress (for scrape mode)
  const progress = loadProgress();
  const processedSet = new Set(progress.processedCompanies || []);
  let allApiData = progress.allApiData || [];

  if (isResume && !isDiscover && processedSet.size > 0) {
    console.log(`Resuming: ${processedSet.size} companies already processed.`);
  }

  // Launch browser
  console.log('Launching browser...');
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    console.log('Navigating to MCA CSR page...');
    await page.goto(MCA_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await sleep(3000);

    // Wait for search box to confirm page loaded
    await page.locator('#SearchBox').waitFor({ timeout: 15000 });
    console.log('Page loaded.');

    // ── Discover mode ─────────────────────────────────────────────────
    if (isDiscover) {
      await discoverCompanies(page);
      return;
    }

    // ── Scrape mode ───────────────────────────────────────────────────
    console.log('Starting company processing...');

    let succeeded = 0;
    let failed = 0;
    let skipped = 0;
    let consecutiveErrors = 0;

    for (let i = startIdx; i < targets.length; i++) {
      const target = targets[i];
      const companyName = target.name;
      // Use CIN as a secondary key for resume dedup when available
      const progressKey = target.cin || companyName;

      // Skip if already processed (resume mode)
      if (isResume && (processedSet.has(progressKey) || processedSet.has(companyName))) {
        skipped++;
        continue;
      }

      // Stop after 10 consecutive errors (session likely expired)
      if (consecutiveErrors >= 10) {
        console.log(`\n  STOPPING: ${consecutiveErrors} consecutive errors. Session likely expired.`);
        console.log('  Run again with --resume to continue.');
        break;
      }

      try {
        const items = await processCompany(page, companyName, i, targets.length);

        if (items && items.length > 0) {
          allApiData.push(...items);
          succeeded++;
          consecutiveErrors = 0;
        } else if (items !== null) {
          // API returned but no data for this FY
          succeeded++;
          consecutiveErrors = 0;
          console.log(`  No ${TARGET_FY} data for this company.`);
        } else {
          failed++;
          consecutiveErrors++;
        }

        processedSet.add(progressKey);
        processedSet.add(companyName); // Add both keys for robustness

        // Save progress every 5 companies
        if ((succeeded + failed) % 5 === 0) {
          saveProgress([...processedSet], allApiData);
          transformAndSave(allApiData);
          console.log(`\n  >> Progress: ${succeeded} succeeded, ${failed} failed, ${skipped} skipped`);
        }

        // Brief delay between companies
        await sleep(1500);

        // Reload page every 20 companies to prevent session issues
        if ((succeeded + failed) % 20 === 0 && i < targets.length - 1) {
          console.log('\n  Reloading page to refresh session...');
          await page.goto(MCA_URL, { waitUntil: 'networkidle', timeout: 60000 });
          await sleep(3000);
          await page.locator('#SearchBox').waitFor({ timeout: 15000 });
        }

      } catch (err) {
        console.log(`  EXCEPTION: ${err.message.slice(0, 100)}`);
        failed++;
        consecutiveErrors++;
        processedSet.add(progressKey);
        processedSet.add(companyName);

        // Try to recover by reloading
        try {
          await page.goto(MCA_URL, { waitUntil: 'networkidle', timeout: 60000 });
          await sleep(3000);
        } catch {}
      }
    }

    // ── Final save ──────────────────────────────────────────────────────
    saveProgress([...processedSet], allApiData);
    const finalResults = transformAndSave(allApiData);

    console.log(`\n${'='.repeat(50)}`);
    console.log(`DONE`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Succeeded: ${succeeded}`);
    console.log(`Failed:    ${failed}`);
    console.log(`Skipped:   ${skipped}`);
    console.log(`Records:   ${allApiData.length} raw, ${finalResults.length} output`);
    console.log(`Output:    ${OUTPUT_FILE}`);
    console.log(`\nNext: npx tsx csr-upsert.ts --file ${OUTPUT_FILE} --fy 2023-24`);

  } catch (error) {
    console.error('Fatal error:', error.message);
    if (allApiData.length > 0) {
      saveProgress([...processedSet], allApiData);
      transformAndSave(allApiData);
      console.log('Saved partial data.');
    }
  } finally {
    console.log('\nStopping solver & closing browser...');
    stopSolver();
    // Clean up temp WAV
    try { fs.unlinkSync(TEMP_WAV); } catch {}
    await context.close().catch(() => {});
  }
})();
