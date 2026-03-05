import { ArrowLeftIcon, LightBulbIcon } from '@heroicons/react/24/outline'

interface GuidePageProps {
  onBack: () => void
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 bg-csf-yellow/5 border border-csf-yellow/20 rounded-xl px-4 py-3 my-4">
      <LightBulbIcon className="w-5 h-5 text-csf-yellow shrink-0 mt-0.5" />
      <p className="font-body text-sm text-gray-600">{children}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-csf-yellow rounded-full" />
        <h2 className="font-heading text-lg font-bold text-csf-blue">{title}</h2>
      </div>
      <div className="space-y-3 font-body text-sm text-gray-600 leading-relaxed">
        {children}
      </div>
    </section>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-gray-900 text-gray-100 text-xs rounded-xl px-4 py-3 my-3 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
      {children}
    </pre>
  )
}

function Term({ word, children }: { word: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start my-2">
      <span className="font-heading text-xs font-bold text-csf-blue bg-csf-blue/5 px-2 py-0.5 rounded-md whitespace-nowrap mt-0.5 shrink-0">{word}</span>
      <span className="font-body text-sm text-gray-600">{children}</span>
    </div>
  )
}

export function GuidePage({ onBack }: GuidePageProps) {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-gray-200/60 transition-colors"
          aria-label="Back to home"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="font-heading text-xl font-bold text-gray-900">
          Creator's Guide
        </h1>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-transparent p-6 sm:p-10">

        {/* Intro */}
        <div className="mb-10 pb-8 border-b border-gray-100">
          <h1 className="font-heading text-2xl font-bold text-csf-blue mb-3">
            The Scout<span className="text-csf-yellow">Ed</span> Creator's Guide
          </h1>
          <p className="font-body text-sm text-gray-600 leading-relaxed">
            This guide has two purposes. First, it's a <strong>user manual</strong> — it explains every feature of ScoutEd so you can get the most out of it. Second, and more importantly, it's a <strong>build guide</strong> — it walks you through how this tool was built from scratch, what technologies power it, and how you could replicate or extend it yourself, even without a programming background.
          </p>
          <p className="font-body text-sm text-gray-600 leading-relaxed mt-3">
            ScoutEd was built almost entirely through conversations with <strong>Claude Code</strong> (Anthropic's AI coding assistant). You describe what you want in plain English, and Claude writes the code, fixes bugs, and deploys it. This guide will show you exactly how that works.
          </p>
        </div>

        {/* ─── PART 1: THE BIG PICTURE ──────────────────────────── */}

        <div className="mb-8 pb-4 border-b border-csf-yellow/30">
          <p className="font-heading text-xs font-bold text-csf-yellow uppercase tracking-widest">Part 1</p>
          <h2 className="font-heading text-xl font-bold text-csf-blue mt-1">What Is ScoutEd &amp; How Was It Built?</h2>
        </div>

        <Section title="What ScoutEd Does">
          <p>
            ScoutEd is a web-based dashboard built for the Partnerships &amp; Strategic Initiatives team at Central Square Foundation (CSF). It solves a simple problem: <strong>finding and tracking funding opportunities for Indian education</strong>.
          </p>
          <p>Every day at 8:00 AM IST, ScoutEd automatically:</p>
          <ol className="list-decimal list-inside space-y-1.5 ml-2">
            <li>Scans 10+ websites for new grant opportunities, RFPs, and funding announcements</li>
            <li>Filters out anything unrelated to K-12 education in India</li>
            <li>Scores each opportunity from 0 to 100 based on how relevant it is to CSF</li>
            <li>Saves everything to a database so you can browse it from the dashboard</li>
            <li>Sends a summary email to subscribers at 8:30 AM IST</li>
          </ol>
          <p className="mt-2">
            Beyond grants, ScoutEd also tracks <strong>CSR spending data</strong> (which companies spend on education via Corporate Social Responsibility), lets you manage an <strong>outreach pipeline</strong> (like a CRM for partnerships), and create branded <strong>donor newsletters</strong>.
          </p>
        </Section>

        <Section title="The Tech Stack (In Plain English)">
          <p>
            Every web application is made of building blocks. Here's what powers ScoutEd, explained without jargon:
          </p>

          <Term word="React">
            The framework that builds what you see on screen. React lets you create interactive pages that update instantly when you click a button or type in a search box — without reloading the whole page. Think of it as the engine behind every screen in ScoutEd.
          </Term>
          <Term word="TypeScript">
            A safer version of JavaScript (the language web browsers understand). TypeScript catches mistakes before they reach you — like a spell checker for code.
          </Term>
          <Term word="Tailwind CSS">
            A toolkit for making things look good. Instead of writing custom design code from scratch, Tailwind provides ready-made building blocks like "make this blue", "round the corners", "add a shadow". Every colour, font, and spacing in ScoutEd uses Tailwind.
          </Term>
          <Term word="Supabase">
            The database — where all the data lives. Supabase is like a spreadsheet in the cloud that your app can read from and write to. It stores opportunities, donors, newsletters, CSR data, and user accounts. It also handles login (Google sign-in). Free tier is generous: 500 MB of storage, unlimited API calls.
          </Term>
          <Term word="Vercel">
            The hosting platform — where the website lives on the internet. When you visit scouted.whybe.ai, Vercel serves the page. It's free for small projects and automatically rebuilds the site every time you push new code. It also runs small backend functions (called "serverless functions") for things like sending emails.
          </Term>
          <Term word="GitHub">
            Where the code is stored and versioned. Every change ever made to ScoutEd is recorded here. GitHub also runs automated tasks on a schedule (called "Actions") — this is how the daily scraper and email digest work without anyone pressing a button.
          </Term>
          <Term word="Resend">
            The email delivery service. When ScoutEd sends a daily digest or a donor newsletter, it uses Resend's API. Free for up to 100 emails per day.
          </Term>
          <Term word="OpenRouter">
            A gateway to AI language models (LLMs). ScoutEd uses free LLMs through OpenRouter to classify grant opportunities ("Is this about K-12 education in India?") and to polish newsletter copy. The cost is zero — OpenRouter routes requests to whichever free model is available.
          </Term>
          <Term word="Vite">
            The development tool that bundles all the code into a fast website. When a developer runs the project locally, Vite shows changes instantly. When building for production, Vite compresses everything into optimised files.
          </Term>

          <Tip>The total monthly cost of running ScoutEd is zero. Every service used is on its free tier. This was a deliberate design constraint.</Tip>
        </Section>

        <Section title="How It Was Built (Claude Code)">
          <p>
            ScoutEd was built using <strong>Claude Code</strong> — Anthropic's AI coding tool that runs in your terminal. The workflow looks like this:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 ml-2">
            <li><strong>Describe what you want</strong> — "Build a dashboard that shows grant opportunities with a relevance score"</li>
            <li><strong>Claude writes the code</strong> — It creates files, writes components, connects to the database</li>
            <li><strong>Review and refine</strong> — "Make the cards look like this", "Add a filter for states", "The score calculation is wrong, fix it"</li>
            <li><strong>Claude fixes issues</strong> — It reads error messages, debugs, and retries</li>
            <li><strong>Deploy</strong> — "Push this to GitHub and deploy to Vercel"</li>
          </ol>
          <p className="mt-3">
            The key document that guides Claude is called <strong>CLAUDE.md</strong> — a file at the root of the project that describes everything: the brand guidelines, database schema, scoring algorithm, architecture decisions, and coding conventions. When Claude reads this file, it understands the full context and can make changes that fit the existing codebase.
          </p>
          <Tip>Think of CLAUDE.md as a detailed brief you'd give to a new developer joining the team. The more specific it is, the better Claude's output. ScoutEd's CLAUDE.md is over 600 lines long and covers every aspect of the system.</Tip>
        </Section>

        {/* ─── PART 2: SETTING IT UP ──────────────────────────── */}

        <div className="mb-8 mt-12 pb-4 border-b border-csf-yellow/30">
          <p className="font-heading text-xs font-bold text-csf-yellow uppercase tracking-widest">Part 2</p>
          <h2 className="font-heading text-xl font-bold text-csf-blue mt-1">Setting Up from Scratch</h2>
        </div>

        <Section title="Prerequisites (What You Need First)">
          <p>Before you begin, install these tools on your computer:</p>

          <h3 className="font-heading text-sm font-bold text-gray-800 mt-4 mb-1">1. Node.js (the runtime)</h3>
          <p>
            Node.js lets your computer run JavaScript outside of a browser. Download version 20 or newer from <strong>nodejs.org</strong> and run the installer. To verify it worked, open a terminal and type:
          </p>
          <CodeBlock>node --version{'\n'}# Should print something like: v20.11.0</CodeBlock>

          <h3 className="font-heading text-sm font-bold text-gray-800 mt-4 mb-1">2. Git (version control)</h3>
          <p>
            Git tracks changes to your code. Download from <strong>git-scm.com</strong>. After installing:
          </p>
          <CodeBlock>git --version{'\n'}# Should print something like: git version 2.43.0</CodeBlock>

          <h3 className="font-heading text-sm font-bold text-gray-800 mt-4 mb-1">3. A code editor</h3>
          <p>
            <strong>Visual Studio Code</strong> (VS Code) is recommended — it's free and works on all platforms. Download from <strong>code.visualstudio.com</strong>.
          </p>

          <h3 className="font-heading text-sm font-bold text-gray-800 mt-4 mb-1">4. Claude Code (the AI assistant)</h3>
          <p>
            Claude Code is a command-line tool from Anthropic. Install it by running:
          </p>
          <CodeBlock>npm install -g @anthropic-ai/claude-code</CodeBlock>
          <p>
            Then run <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">claude</code> in your terminal to start a conversation with Claude about your project.
          </p>
        </Section>

        <Section title="Step 1: Clone the Project">
          <p>
            "Cloning" means downloading a copy of the code from GitHub to your computer.
          </p>
          <CodeBlock>git clone https://github.com/gordianknot-legacy/scouted.git{'\n'}cd scouted</CodeBlock>
          <p>
            This creates a <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">scouted</code> folder with all the project files.
          </p>
        </Section>

        <Section title="Step 2: Install Dependencies">
          <p>
            "Dependencies" are external libraries the project needs. There are two sets — one for the frontend (the website) and one for the scraper (the daily data collector).
          </p>

          <h3 className="font-heading text-sm font-bold text-gray-800 mt-4 mb-1">Frontend dependencies</h3>
          <CodeBlock>npm install</CodeBlock>
          <p>This reads <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">package.json</code> and downloads everything listed under "dependencies" — React, Tailwind, Supabase client, drag-and-drop library, icons, etc.</p>

          <h3 className="font-heading text-sm font-bold text-gray-800 mt-4 mb-1">Scraper dependencies</h3>
          <CodeBlock>cd scraper{'\n'}npm install{'\n'}cd ..</CodeBlock>
          <p>This installs the scraper's own libraries — Cheerio (for reading HTML), dotenv (for loading secrets), and the Supabase client.</p>

          <Tip>If you see warnings about "peer dependencies" or "funding", you can ignore them. These are informational, not errors.</Tip>
        </Section>

        <Section title="Step 3: Create a Supabase Project">
          <p>
            Supabase is where all your data lives. Setting it up is free and takes about 10 minutes.
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Go to <strong>supabase.com</strong> and create an account (you can sign in with GitHub)</li>
            <li>Click <strong>"New Project"</strong>. Choose a name (e.g., "scouted"), set a database password, and pick a region close to your users (e.g., Mumbai)</li>
            <li>Once created, go to <strong>Settings → API</strong>. You'll see two keys:
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li><strong>anon/public key</strong> — safe to use in the frontend (limited by Row Level Security)</li>
                <li><strong>service_role key</strong> — full database access, keep this secret</li>
              </ul>
            </li>
            <li>Copy the <strong>Project URL</strong> (looks like <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">https://abcxyz.supabase.co</code>)</li>
          </ol>

          <h3 className="font-heading text-sm font-bold text-gray-800 mt-4 mb-1">Create the database tables</h3>
          <p>
            Go to the <strong>SQL Editor</strong> in the Supabase dashboard and run these commands one at a time. Each creates a table to store a different type of data:
          </p>

          <CodeBlock>{`-- Stores grant opportunities (filled by the daily scraper)
CREATE TABLE opportunities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  source_url TEXT UNIQUE,
  description TEXT,
  relevance_score INTEGER DEFAULT 0,
  deadline DATE,
  poc_email TEXT,
  tags TEXT[],
  organisation TEXT,
  amount TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores bookmark/hide actions per user
CREATE TABLE user_actions (
  user_id UUID NOT NULL,
  opportunity_id UUID NOT NULL,
  is_bookmarked BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  PRIMARY KEY (user_id, opportunity_id)
);

-- Stores email digest subscribers
CREATE TABLE subscribers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  unsubscribe_token UUID DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores CSR spending data (from MCA filings)
CREATE TABLE csr_spending (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company TEXT NOT NULL,
  cin TEXT NOT NULL,
  field TEXT NOT NULL,
  spend_inr NUMERIC DEFAULT 0,
  fiscal_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cin, field, fiscal_year)
);

-- Stores CSR pipeline leads (Kanban board)
CREATE TABLE csr_leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cin TEXT NOT NULL,
  company TEXT NOT NULL,
  pipeline_stage TEXT DEFAULT 'prospect',
  ishmeet_connected BOOLEAN,
  saurabh_connected BOOLEAN,
  connection_notes TEXT DEFAULT '',
  prior_association TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  assigned_to TEXT DEFAULT '',
  fiscal_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cin, fiscal_year)
);

-- Stores donor contacts (for newsletters)
CREATE TABLE donors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  organisation TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  unsubscribe_token UUID DEFAULT uuid_generate_v4() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores newsletters (drafts, scheduled, sent)
CREATE TABLE newsletters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  content_json JSONB NOT NULL DEFAULT '{}',
  html_rendered TEXT,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','scheduled','sent','failed')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  sent_count INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`}</CodeBlock>

          <h3 className="font-heading text-sm font-bold text-gray-800 mt-4 mb-1">Set up Row Level Security (RLS)</h3>
          <p>
            RLS controls who can read and write each table. Run this in the SQL Editor:
          </p>
          <CodeBlock>{`-- Opportunities: anyone can read, only scraper can write
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select" ON opportunities FOR SELECT USING (true);

-- User actions: open (managed by localStorage user_id)
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_all" ON user_actions FOR ALL USING (true) WITH CHECK (true);

-- Subscribers: anyone can insert, only service_role can read
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_insert" ON subscribers FOR INSERT WITH CHECK (true);

-- CSR spending: anyone can read
ALTER TABLE csr_spending ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select" ON csr_spending FOR SELECT USING (true);

-- CSR leads: open (app requires Google login)
ALTER TABLE csr_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_all" ON csr_leads FOR ALL USING (true) WITH CHECK (true);

-- Donors: open (app requires Google login)
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_all" ON donors FOR ALL USING (true) WITH CHECK (true);

-- Newsletters: open (app requires Google login)
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_all" ON newsletters FOR ALL USING (true) WITH CHECK (true);`}</CodeBlock>

          <h3 className="font-heading text-sm font-bold text-gray-800 mt-4 mb-1">Create a Storage bucket (for newsletter images)</h3>
          <p>
            In the Supabase dashboard, go to <strong>Storage → New Bucket</strong>. Name it <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">newsletter-images</code>, set it to <strong>Public</strong>, and set the allowed MIME types to <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">image/png, image/jpeg, image/gif, image/webp</code> with a 5 MB file size limit.
          </p>
        </Section>

        <Section title="Step 4: Set Up Google Login">
          <p>
            ScoutEd uses Google sign-in to restrict access to your organisation. Here's how to set it up:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Go to <strong>console.cloud.google.com</strong> → Create a new project (or use an existing one)</li>
            <li>Navigate to <strong>APIs &amp; Services → Credentials → Create Credentials → OAuth 2.0 Client ID</strong></li>
            <li>Set the application type to <strong>Web application</strong></li>
            <li>Under <strong>Authorised redirect URIs</strong>, add:
              <CodeBlock>{`https://YOUR-PROJECT.supabase.co/auth/v1/callback`}</CodeBlock>
              <p className="mt-1">(Replace YOUR-PROJECT with your actual Supabase project ID)</p>
            </li>
            <li>Copy the <strong>Client ID</strong> and <strong>Client Secret</strong></li>
            <li>In the Supabase dashboard, go to <strong>Authentication → Providers → Google</strong></li>
            <li>Toggle Google on, paste the Client ID and Secret</li>
            <li>Under <strong>Authentication → URL Configuration</strong>, set your <strong>Site URL</strong> to your domain (e.g., <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">https://scouted.whybe.ai</code>)</li>
          </ol>
          <Tip>To restrict access to a specific domain (like @yourcompany.org), find the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">ALLOWED_DOMAIN</code> constant in <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">src/contexts/AuthContext.tsx</code> and change it to your domain.</Tip>
        </Section>

        <Section title="Step 5: Configure Environment Variables">
          <p>
            Environment variables are secrets your app needs but that shouldn't be stored in the code. Create a file called <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">.env</code> in the project root:
          </p>
          <CodeBlock>{`# Frontend (Vite reads these — they start with VITE_)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: enables AI features (newsletter polish, grant classification)
VITE_OPENROUTER_API_KEY=your-openrouter-key-here`}</CodeBlock>
          <p className="mt-2">
            And create a <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">.env</code> file inside the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">scraper/</code> folder:
          </p>
          <CodeBlock>{`# Scraper (runs on the server, not in the browser)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: enables AI-based filtering of grant results
OPENROUTER_API_KEY=your-openrouter-key-here

# Required for sending email digests
RESEND_API_KEY=your-resend-key-here`}</CodeBlock>

          <h3 className="font-heading text-sm font-bold text-gray-800 mt-4 mb-1">Where to get each key</h3>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li><strong>Supabase keys</strong> — Dashboard → Settings → API</li>
            <li><strong>OpenRouter key</strong> — Sign up at <strong>openrouter.ai</strong> → Keys (free tier available)</li>
            <li><strong>Resend key</strong> — Sign up at <strong>resend.com</strong> → API Keys (100 free emails/day)</li>
          </ul>

          <Tip>Never share your service_role key or commit .env files to Git. The .gitignore file already excludes them.</Tip>
        </Section>

        <Section title="Step 6: Run It Locally">
          <p>
            Now you can start the development server and see ScoutEd in your browser:
          </p>
          <CodeBlock>npm run dev</CodeBlock>
          <p>
            Open <strong>http://localhost:5173</strong> in your browser. You should see the login page. Sign in with your Google account to access the dashboard.
          </p>
          <p className="mt-2">
            Any changes you make to the code will appear instantly in the browser — no need to refresh. This is called "hot module replacement".
          </p>
        </Section>

        <Section title="Step 7: Deploy to the Internet">
          <p>
            Deploying makes your app accessible to anyone with the URL. We use Vercel because it's free and automatic.
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Sign up at <strong>vercel.com</strong> (use your GitHub account)</li>
            <li>Click <strong>"Add New Project"</strong> → Import your GitHub repository</li>
            <li>Vercel auto-detects that it's a Vite project. Click <strong>"Deploy"</strong></li>
            <li>After the first deploy, go to <strong>Settings → Environment Variables</strong> and add:
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">VITE_SUPABASE_URL</code></li>
                <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">VITE_SUPABASE_ANON_KEY</code></li>
                <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">SUPABASE_URL</code></li>
                <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">SUPABASE_SERVICE_ROLE_KEY</code></li>
                <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">RESEND_API_KEY</code></li>
                <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">VITE_OPENROUTER_API_KEY</code> (optional)</li>
              </ul>
            </li>
            <li>Redeploy for the env vars to take effect</li>
          </ol>
          <p className="mt-2">
            From now on, every time you push code to GitHub, Vercel automatically rebuilds and deploys the site.
          </p>
          <Tip>To use a custom domain (like scouted.yourorg.com), go to Vercel Settings → Domains and add a CNAME record pointing to <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">cname.vercel-dns.com</code>.</Tip>
        </Section>

        <Section title="Step 8: Set Up Daily Automation">
          <p>
            The scraper and email digest run automatically via <strong>GitHub Actions</strong> — a free automation service built into GitHub. Two workflow files are already included in the project:
          </p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">.github/workflows/scraper.yml</code> — Runs at 8:00 AM IST, fetches new opportunities</li>
            <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">.github/workflows/daily-digest.yml</code> — Runs at 8:30 AM IST, emails the digest</li>
          </ul>
          <p className="mt-2">To activate them, add your secrets to GitHub:</p>
          <ol className="list-decimal list-inside space-y-1.5 ml-2">
            <li>Go to your GitHub repository → <strong>Settings → Secrets and variables → Actions</strong></li>
            <li>Click <strong>"New repository secret"</strong> and add each:
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">SUPABASE_URL</code></li>
                <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">SUPABASE_SERVICE_ROLE_KEY</code></li>
                <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">OPENROUTER_API_KEY</code></li>
                <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">RESEND_API_KEY</code></li>
              </ul>
            </li>
          </ol>
          <p className="mt-2">
            You can also trigger either workflow manually: go to <strong>Actions</strong> tab → select the workflow → <strong>"Run workflow"</strong>.
          </p>
          <Tip>Scheduled workflows only run on the default branch (usually "main" or "master"). If your workflows aren't running, check that the branch name matches.</Tip>
        </Section>

        {/* ─── PART 3: HOW THE FEATURES WORK ──────────────────── */}

        <div className="mb-8 mt-12 pb-4 border-b border-csf-yellow/30">
          <p className="font-heading text-xs font-bold text-csf-yellow uppercase tracking-widest">Part 3</p>
          <h2 className="font-heading text-xl font-bold text-csf-blue mt-1">How Each Feature Works</h2>
        </div>

        <Section title="Grant Opportunities">
          <p>
            The Grant Opportunities dashboard is the heart of ScoutEd. Every morning, the scraper visits 10+ websites — NGOBox, FundsForNGOs, IDR Online, Devex, Alliance Magazine, and Google Custom Search — to find new funding opportunities. It parses the HTML or RSS feeds, extracts structured data (title, deadline, amount, location), and filters for India + K-12 education relevance.
          </p>

          <h3 className="font-heading text-sm font-bold text-gray-800 mt-4 mb-1">How scoring works</h3>
          <p>
            Each opportunity receives a relevance score (0–100) based on five criteria:
          </p>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="font-heading font-semibold text-gray-700 pb-2 pr-4">Criteria</th>
                  <th className="font-heading font-semibold text-gray-700 pb-2 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="font-body text-gray-600">
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-4">Matches a CSF sector (FLN, EdTech, School Governance, etc.)</td>
                  <td className="py-2 text-right font-heading font-semibold text-csf-blue">+30</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-4">Located in a CSF priority state (UP, MP, Haryana, Gujarat, etc.)</td>
                  <td className="py-2 text-right font-heading font-semibold text-csf-blue">+20</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-4">Funding size above 1 Crore</td>
                  <td className="py-2 text-right font-heading font-semibold text-csf-blue">+20</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-4">From a known education funder (Gates Foundation, Tata, Wipro, etc.)</td>
                  <td className="py-2 text-right font-heading font-semibold text-csf-blue">+15</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-4">Duration longer than 2 years</td>
                  <td className="py-2 text-right font-heading font-semibold text-csf-blue">+15</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Weekly decay (score drops over time so fresh results rank higher)</td>
                  <td className="py-2 text-right font-heading font-semibold text-csf-orange">-5/week</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            The coloured dot on each card shows the score at a glance:
            <span className="inline-block ml-2 px-2 py-0.5 rounded-full bg-csf-lime/15 text-csf-blue text-xs font-heading font-semibold">Green = 75+</span>
            <span className="inline-block ml-1 px-2 py-0.5 rounded-full bg-csf-yellow/15 text-csf-blue text-xs font-heading font-semibold">Yellow = 50–74</span>
            <span className="inline-block ml-1 px-2 py-0.5 rounded-full bg-csf-orange/10 text-csf-orange text-xs font-heading font-semibold">Red = below 50</span>
          </p>

          <h3 className="font-heading text-sm font-bold text-gray-800 mt-4 mb-1">Using the dashboard</h3>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li><strong>Filter</strong> by score level, sector, state, or deadline using the sidebar (desktop) or filter icon (mobile)</li>
            <li><strong>Search</strong> by keyword using the search bar at the top</li>
            <li><strong>Bookmark</strong> an opportunity to save it for later</li>
            <li><strong>Hide</strong> irrelevant items to declutter your feed</li>
            <li><strong>Click a card</strong> to see the full description in a preview panel</li>
            <li><strong>Load More</strong> at the bottom to see older results</li>
          </ul>
          <Tip>Bookmarks are saved in your browser and persist across sessions. Hidden items stay hidden until you clear your browser data.</Tip>
        </Section>

        <Section title="CSR Partnership Prospects">
          <p>
            The CSR Prospects page displays company-wise Corporate Social Responsibility spending data scraped from MCA (Ministry of Corporate Affairs) filings for FY 2023-24. It helps identify companies that spend significantly on education — potential CSR partners.
          </p>
          <p>
            <strong>How the data was collected:</strong> A Playwright-based browser scraper opens the MCA portal, types company name prefixes into the live search bar (which triggers an AJAX call — no CAPTCHA needed), harvests company CINs, then calls the MCA API for each company's CSR detail. The scraper classifies spending into three categories: Education, Vocational Skills, and Other.
          </p>

          <h3 className="font-heading text-sm font-bold text-gray-800 mt-4 mb-1">Using the table</h3>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Click column headers to <strong>sort</strong> by Education, Vocational, or Total CSR spend</li>
            <li>Use the <strong>spend threshold</strong> filter (All / 10 Cr+ / 50 Cr+ / 100 Cr+) to focus on major spenders</li>
            <li>Click the <strong>star icon</strong> to shortlist a company</li>
            <li><strong>Expand</strong> any row to see a breakdown of individual projects</li>
            <li>Click <strong>"Move to Pipeline"</strong> to start tracking outreach for that company</li>
          </ul>
        </Section>

        <Section title="CSR Pipeline (Kanban Board)">
          <p>
            Once you move a company to the pipeline, it appears on a Kanban board where you can track your outreach progress. Companies move through these stages:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 ml-2">
            <li><strong>Prospect</strong> — Identified as a potential partner</li>
            <li><strong>Researching</strong> — Gathering intel on their CSR priorities</li>
            <li><strong>Outreach</strong> — Initial contact made</li>
            <li><strong>Proposal Sent</strong> — Formal proposal submitted</li>
            <li><strong>Responded</strong> — Received a response from the company</li>
            <li><strong>Accepted</strong> — Partnership confirmed</li>
            <li><strong>Declined</strong> — Company passed</li>
          </ol>
          <p className="mt-3">
            <strong>Drag and drop</strong> cards between columns to update their stage. Click any card to open a detail panel where you can add notes, track personal connections, and auto-generate concept notes (as PowerPoint or Word documents, optionally with AI-drafted content).
          </p>
          <Tip>The drag-and-drop uses a library called @dnd-kit. The pipeline saves every change to the database instantly — no "save" button needed.</Tip>
        </Section>

        <Section title="Donor Newsletter">
          <p>
            The newsletter tool lets you compose, preview, and send branded quarterly newsletters to donors — all without leaving ScoutEd.
          </p>

          <h3 className="font-heading text-sm font-bold text-gray-800 mt-4 mb-1">Managing donors</h3>
          <p>
            Click <strong>"Manage Donors"</strong> to add, edit, or remove contacts. You can add donors individually or use <strong>"Bulk Import"</strong> to paste a CSV list (one per line: name, email, organisation). Toggle the switch to mark donors as active or inactive — only active donors receive newsletters.
          </p>

          <h3 className="font-heading text-sm font-bold text-gray-800 mt-4 mb-1">Creating a newsletter</h3>
          <p>
            Click <strong>"New Newsletter"</strong> to start with a pre-built template. The editor offers two modes:
          </p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li><strong>Structured mode</strong> — Fill in titled sections: CEO Message, Section Headers, Impact Stories, Stats Grids, Events Lists, Calls to Action, or Custom blocks. Reorder sections with up/down arrows. Upload images via drag-and-drop.</li>
            <li><strong>Free Text mode</strong> — Paste raw content and click <strong>"Structure with AI"</strong>. An AI model reads your text and organises it into the structured sections automatically.</li>
          </ul>
          <p className="mt-2">
            Click the <strong>sparkle icon</strong> on any section to have AI polish the copy — tightening wording, fixing grammar, and ensuring British English spelling.
          </p>

          <h3 className="font-heading text-sm font-bold text-gray-800 mt-4 mb-1">Preview &amp; send</h3>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li><strong>Preview</strong> — Opens a live preview of the email. Toggle between desktop (600px) and mobile (320px) widths. Copy the raw HTML for use in other tools.</li>
            <li><strong>Send Test</strong> — Sends a test email to yourself before sending to donors</li>
            <li><strong>Send Now</strong> — Sends immediately to all active donors via Resend</li>
            <li><strong>Schedule</strong> — Pick a future date and time; a daily cron job checks and sends when the time arrives</li>
          </ul>
          <Tip>Every newsletter email includes a personalised unsubscribe link. When a donor clicks it, they're automatically removed from the list.</Tip>
        </Section>

        <Section title="Email Digest">
          <p>
            The daily email digest is a separate feature from the donor newsletter. It sends the top-scored grant opportunities to internal subscribers every morning at 8:30 AM IST.
          </p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Go to the <strong>Subscribe</strong> tab and enter your email</li>
            <li>You'll receive a branded HTML email with the 10 highest-scored opportunities from the last 48 hours</li>
            <li>Each email includes an unsubscribe link at the bottom</li>
          </ul>
          <p className="mt-2">
            <strong>How it works behind the scenes:</strong> A GitHub Actions workflow runs at 3:00 AM UTC (8:30 AM IST). It executes a TypeScript script that queries Supabase for recent opportunities, fetches all subscribers, builds a personalised HTML email for each (with unique unsubscribe tokens), and sends the batch via Resend's API.
          </p>
        </Section>

        {/* ─── PART 4: UNDERSTANDING THE ARCHITECTURE ─────────── */}

        <div className="mb-8 mt-12 pb-4 border-b border-csf-yellow/30">
          <p className="font-heading text-xs font-bold text-csf-yellow uppercase tracking-widest">Part 4</p>
          <h2 className="font-heading text-xl font-bold text-csf-blue mt-1">Understanding the Architecture</h2>
        </div>

        <Section title="How the Pieces Fit Together">
          <p>
            Here's the entire system in one picture:
          </p>
          <div className="bg-gray-50 rounded-xl p-4 my-3 font-mono text-xs text-gray-600 leading-loose overflow-x-auto whitespace-pre">{
`┌─────────────────────────────────────────────────────┐
│  DAILY AT 8:00 AM IST (GitHub Actions)              │
│                                                     │
│  scraper/index.ts                                   │
│    → Fetch 10+ websites (NGOBox, Devex, IDR, etc.)  │
│    → Parse HTML / RSS feeds                         │
│    → Filter: India + K-12 education                 │
│    → Score 0-100 (sector, geography, funding, etc.) │
│    → Classify via AI (OpenRouter free models)       │
│    → Save to Supabase "opportunities" table         │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  DAILY AT 8:30 AM IST (GitHub Actions)              │
│                                                     │
│  scraper/send-digest.ts                             │
│    → Query top 10 opportunities from last 48 hours  │
│    → Fetch subscribers + their unsubscribe tokens   │
│    → Build personalised HTML email for each         │
│    → Send batch via Resend API                      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  USER VISITS THE APP (Vercel + React)               │
│                                                     │
│  → Google sign-in (Supabase Auth)                   │
│  → Fetch opportunities / CSR data from Supabase     │
│  → Display cards, filters, pipeline, newsletters    │
│  → Actions saved: bookmarks (local), leads (DB)     │
│  → Newsletter sends via Vercel serverless functions  │
└─────────────────────────────────────────────────────┘`}
          </div>
        </Section>

        <Section title="Folder Structure">
          <p>
            Knowing where things live makes it much easier to make changes. Here are the most important folders:
          </p>
          <div className="bg-gray-50 rounded-xl p-4 my-3 font-mono text-xs text-gray-600 leading-loose overflow-x-auto whitespace-pre">{
`scouted/
├── src/                          ← Frontend code (what you see)
│   ├── App.tsx                   ← Main app: tabs, routing, layout
│   ├── components/
│   │   ├── home/                 ← Welcome Hub
│   │   ├── cards/                ← Opportunity cards
│   │   ├── csr/                  ← CSR table, pipeline, detail panel
│   │   ├── newsletter/           ← Newsletter editor, donor manager
│   │   ├── guide/                ← This guide page
│   │   ├── filters/              ← Filter sidebar and drawer
│   │   ├── layout/               ← Header, mobile nav, nav drawer
│   │   └── auth/                 ← Login page, loading screen
│   ├── hooks/                    ← Data-fetching logic (React Query)
│   ├── lib/                      ← Utilities (Supabase client, formatters)
│   ├── contexts/                 ← Auth context (Google OAuth)
│   └── types/                    ← TypeScript type definitions
├── scraper/                      ← Backend scraper code
│   ├── index.ts                  ← Main scraper entry point
│   ├── config.ts                 ← Sources, sectors, states, funders
│   ├── scoring.ts                ← Relevance score algorithm
│   ├── llm-filter.ts             ← AI classification engine
│   ├── send-digest.ts            ← Email digest sender
│   └── parsers/                  ← Per-source HTML/RSS parsers
├── api/                          ← Vercel serverless functions
│   ├── subscribe.ts              ← Email subscription endpoint
│   ├── unsubscribe.ts            ← Digest unsubscribe handler
│   ├── newsletter-send.ts        ← Newsletter send endpoint
│   ├── donor-unsubscribe.ts      ← Newsletter unsubscribe handler
│   └── cron/send-scheduled.ts    ← Scheduled newsletter cron
├── .github/workflows/            ← GitHub Actions (daily automation)
├── CLAUDE.md                     ← Instructions for Claude Code
├── vercel.json                   ← Vercel routing + cron config
└── package.json                  ← Frontend dependencies`}
          </div>
        </Section>

        <Section title="The Cost Breakdown">
          <p>
            One of ScoutEd's key design constraints was <strong>zero infrastructure cost</strong>. Here's how every service stays free:
          </p>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="font-heading font-semibold text-gray-700 pb-2 pr-4">Service</th>
                  <th className="font-heading font-semibold text-gray-700 pb-2 pr-4">What It Does</th>
                  <th className="font-heading font-semibold text-gray-700 pb-2 text-right">Monthly Cost</th>
                </tr>
              </thead>
              <tbody className="font-body text-gray-600">
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-4 font-heading font-semibold text-gray-700">Vercel</td>
                  <td className="py-2 pr-4">Hosts the website + serverless functions</td>
                  <td className="py-2 text-right font-heading font-semibold text-csf-blue">Free</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-4 font-heading font-semibold text-gray-700">Supabase</td>
                  <td className="py-2 pr-4">Database, auth, file storage</td>
                  <td className="py-2 text-right font-heading font-semibold text-csf-blue">Free</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-4 font-heading font-semibold text-gray-700">GitHub Actions</td>
                  <td className="py-2 pr-4">Daily scraper + email automation</td>
                  <td className="py-2 text-right font-heading font-semibold text-csf-blue">Free</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-4 font-heading font-semibold text-gray-700">Resend</td>
                  <td className="py-2 pr-4">Sends digest + newsletter emails</td>
                  <td className="py-2 text-right font-heading font-semibold text-csf-blue">Free</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-4 font-heading font-semibold text-gray-700">OpenRouter</td>
                  <td className="py-2 pr-4">AI grant filtering + newsletter polish</td>
                  <td className="py-2 text-right font-heading font-semibold text-csf-blue">Free</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-heading font-semibold text-gray-700">Google OAuth</td>
                  <td className="py-2 pr-4">Secure sign-in restricted to CSF domain</td>
                  <td className="py-2 text-right font-heading font-semibold text-csf-blue">Free</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Tip>All of these services have generous free tiers. ScoutEd comfortably fits within them for a 3-user internal tool. If you scale to 100+ users, you may need to upgrade Supabase (starting at $25/month).</Tip>
        </Section>

        {/* ─── PART 5: TIPS & REFERENCE ──────────────────────── */}

        <div className="mb-8 mt-12 pb-4 border-b border-csf-yellow/30">
          <p className="font-heading text-xs font-bold text-csf-yellow uppercase tracking-widest">Part 5</p>
          <h2 className="font-heading text-xl font-bold text-csf-blue mt-1">Tips, Shortcuts &amp; Reference</h2>
        </div>

        <Section title="Tips & Shortcuts">
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Click the <strong>ScoutEd logo</strong> in the header to return to the Welcome Hub from any page</li>
            <li>Your <strong>bookmarks</strong> and <strong>shortlist</strong> are saved locally and persist across sessions</li>
            <li>The <strong>current tab</strong> is remembered — refreshing the page won't send you back to Home</li>
            <li>On mobile, use the <strong>bottom navigation bar</strong> to switch between sections</li>
            <li>Use the <strong>hamburger menu</strong> (top-left) to access all tools via the navigation drawer</li>
            <li>Use <strong>"Load More"</strong> at the bottom of the Grants page to see older opportunities</li>
          </ul>
        </Section>

        <Section title="Working with Claude Code">
          <p>
            If you want to modify or extend ScoutEd, here are some tips for working with Claude Code effectively:
          </p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li><strong>Keep CLAUDE.md up to date</strong> — This is the single source of truth. When you add a feature, document it here so future Claude sessions understand the full context.</li>
            <li><strong>Be specific in your prompts</strong> — "Add a filter for organisation name on the CSR table" is better than "improve the CSR page".</li>
            <li><strong>Ask Claude to read files first</strong> — Before making changes, ask Claude to read the relevant files so it understands the existing patterns.</li>
            <li><strong>Test locally before deploying</strong> — Run <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">npm run dev</code> and verify changes in the browser before pushing.</li>
            <li><strong>Commit often</strong> — Use <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">/commit</code> in Claude Code to create descriptive commits after each feature.</li>
          </ul>
          <Tip>Claude Code can read error messages from your terminal, browser console, and build output. If something breaks, just paste the error and ask Claude to fix it.</Tip>
        </Section>

        <Section title="Adding New Data Sources">
          <p>
            To add a new website as a grant source for the scraper:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 ml-2">
            <li><strong>Create a parser</strong> — Add a new file in <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">scraper/parsers/</code> that exports a function taking a URL and returning an array of opportunities</li>
            <li><strong>Add to config</strong> — Register the source URL and parser name in <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">scraper/config.ts</code></li>
            <li><strong>Register the parser</strong> — Import and add it to the PARSERS map in <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">scraper/index.ts</code></li>
            <li><strong>Test it</strong> — Run <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">npx tsx index.ts</code> locally to verify</li>
          </ol>
          <p className="mt-2">
            You can describe the website to Claude Code and ask it to write the parser for you. For example: "Add a scraper for NITI Aayog's grants page at niti.gov.in. The grants are listed in a table with columns for title, deadline, and description."
          </p>
        </Section>

        <Section title="Key Files Reference">
          <p>
            A quick lookup for the most frequently edited files:
          </p>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="font-heading font-semibold text-gray-700 pb-2 pr-4">If you want to...</th>
                  <th className="font-heading font-semibold text-gray-700 pb-2">Edit this file</th>
                </tr>
              </thead>
              <tbody className="font-body text-gray-600">
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-4">Change the scoring algorithm</td>
                  <td className="py-2 font-mono text-xs">scraper/scoring.ts</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-4">Add a new grant source</td>
                  <td className="py-2 font-mono text-xs">scraper/config.ts + parsers/</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-4">Change which domain can log in</td>
                  <td className="py-2 font-mono text-xs">src/contexts/AuthContext.tsx</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-4">Edit the Welcome Hub cards</td>
                  <td className="py-2 font-mono text-xs">src/components/home/WelcomeHub.tsx</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-4">Change the email template</td>
                  <td className="py-2 font-mono text-xs">src/lib/newsletter/template.ts</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-4">Add pipeline stages</td>
                  <td className="py-2 font-mono text-xs">src/types/index.ts (PIPELINE_STAGES)</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-4">Change brand colours or fonts</td>
                  <td className="py-2 font-mono text-xs">src/index.css (Tailwind theme)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Modify the daily digest email</td>
                  <td className="py-2 font-mono text-xs">scraper/send-digest.ts</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-gray-100 text-center">
          <p className="font-body text-xs text-gray-400">
            ScoutEd v1.0 — Built with Claude Code for the Partnerships &amp; Strategic Initiatives team at CSF
          </p>
          <p className="font-body text-[11px] text-gray-300 mt-1">
            Total infrastructure cost: &#8377;0/month
          </p>
        </div>
      </div>
    </div>
  )
}
