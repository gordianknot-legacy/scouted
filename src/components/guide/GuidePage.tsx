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
            Welcome to Scout<span className="text-csf-yellow">Ed</span>
          </h1>
          <p className="font-body text-sm text-gray-600 leading-relaxed">
            ScoutEd is an internal tool built for the Partnerships &amp; Strategic Initiatives team at Central Square Foundation.
            It automatically discovers grant opportunities, tracks CSR spending data, and helps manage your outreach pipeline — all in one place.
          </p>
        </div>

        <Section title="Getting Started">
          <p>
            Sign in using your <strong>@centralsquarefoundation.org</strong> Google account. Only CSF team members can access ScoutEd.
          </p>
          <p>
            After signing in, you'll land on the <strong>Welcome Hub</strong> — your home screen. From here you can jump to any of ScoutEd's tools:
          </p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li><strong>Grant Opportunities</strong> — Browse and filter funding opportunities</li>
            <li><strong>CSR Prospects</strong> — Explore company CSR spending data</li>
            <li><strong>Creator's Guide</strong> — This page</li>
          </ul>
          <Tip>Click the ScoutEd logo in the top-left corner at any time to return to the Welcome Hub.</Tip>
        </Section>

        <Section title="Grant Opportunities">
          <p>
            The Grant Opportunities dashboard shows funding opportunities discovered automatically from sources
            like NGOBox, FundsForNGOs, IDR Online, Devex, and others. New opportunities are added every morning.
          </p>
          <p>
            Each opportunity appears as a <strong>card</strong> showing the title, organisation, sector tags, location, deadline, and a relevance score.
          </p>

          <h3 className="font-heading text-sm font-bold text-gray-800 mt-4 mb-1">Filters</h3>
          <p>
            Use the sidebar (desktop) or the filter icon (mobile) to narrow results by relevance score, sector, state, or deadline.
            The search bar at the top lets you search by keywords.
          </p>

          <h3 className="font-heading text-sm font-bold text-gray-800 mt-4 mb-1">Actions on each card</h3>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li><strong>Bookmark</strong> — Save it to your Bookmarks tab for easy reference later</li>
            <li><strong>Hide</strong> — Remove it from your feed if it's not relevant</li>
            <li><strong>External link</strong> — Opens the original source page</li>
            <li><strong>Click the card</strong> — Opens a detailed preview panel on the right</li>
          </ul>
          <Tip>Bookmarks are saved in your browser and persist across sessions. Hidden items stay hidden until you clear them.</Tip>
        </Section>

        <Section title="Relevance Scoring">
          <p>
            Every opportunity gets a score from 0 to 100 based on how relevant it is to CSF's priorities. Here's how the score is calculated:
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
                  <td className="py-2 pr-4">Weekly decay (score drops by 5 points per week since posting)</td>
                  <td className="py-2 text-right font-heading font-semibold text-csf-orange">-5/week</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            The coloured circle on each card shows the score at a glance:
            <span className="inline-block ml-2 px-2 py-0.5 rounded-full bg-csf-lime/15 text-csf-blue text-xs font-heading font-semibold">Green = 75+</span>
            <span className="inline-block ml-1 px-2 py-0.5 rounded-full bg-csf-yellow/15 text-csf-blue text-xs font-heading font-semibold">Yellow = 50-74</span>
            <span className="inline-block ml-1 px-2 py-0.5 rounded-full bg-csf-orange/10 text-csf-orange text-xs font-heading font-semibold">Red = below 50</span>
          </p>
        </Section>

        <Section title="CSR Partnership Prospects">
          <p>
            The CSR Prospects page shows company-wise Corporate Social Responsibility spending data from MCA filings (FY 2023-24).
            Use it to identify companies that spend significantly on education.
          </p>

          <h3 className="font-heading text-sm font-bold text-gray-800 mt-4 mb-1">Company table</h3>
          <p>
            The table lists companies with their <strong>Education CSR</strong>, <strong>Vocational Skills CSR</strong>, and <strong>Total CSR</strong> spending.
            Click any column header to sort. Use the search bar to find a specific company.
          </p>

          <h3 className="font-heading text-sm font-bold text-gray-800 mt-4 mb-1">Spend threshold filter</h3>
          <p>
            Filter companies by minimum education spend: All, 10 Cr+, 50 Cr+, or 100 Cr+.
            This helps you focus on the biggest education spenders.
          </p>

          <h3 className="font-heading text-sm font-bold text-gray-800 mt-4 mb-1">Shortlisting &amp; Pipeline</h3>
          <p>
            Click the star icon to shortlist a company. Use the "Shortlisted only" toggle to see just your picks.
            Click <strong>"Move to Pipeline"</strong> to add a company to your outreach pipeline for tracking.
          </p>

          <Tip>Expand any company row to see a breakdown of individual education and vocational skills projects.</Tip>
        </Section>

        <Section title="CSR Pipeline">
          <p>
            The Pipeline is a Kanban board for tracking your outreach to CSR prospects.
            Companies move through these stages:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 ml-2">
            <li><strong>Prospect</strong> — Identified as a potential partner</li>
            <li><strong>Researching</strong> — Gathering intel on their CSR priorities</li>
            <li><strong>Outreach</strong> — Initial contact made</li>
            <li><strong>Proposal Sent</strong> — Formal proposal submitted</li>
            <li><strong>Responded</strong> — Received a response from the company</li>
            <li><strong>Accepted</strong> — Partnership confirmed</li>
            <li><strong>Declined</strong> — Company passed on the opportunity</li>
          </ol>
          <p className="mt-3">
            <strong>Drag and drop</strong> cards between columns to move them through the pipeline.
            Click any card to open the detail panel where you can add notes, track connections, and generate concept notes.
          </p>
          <Tip>Use the "Show Paused" button to reveal companies you've temporarily set aside.</Tip>
        </Section>

        <Section title="Email Digest">
          <p>
            Subscribe to the ScoutEd Daily Digest to receive the top-scored opportunities straight to your inbox.
          </p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Go to the <strong>Subscribe</strong> tab and enter your email</li>
            <li>You'll receive an email every morning at <strong>8:30 AM IST</strong></li>
            <li>Each digest includes the highest-scored opportunities from the last 24 hours</li>
            <li>Every email includes an unsubscribe link at the bottom</li>
          </ul>
        </Section>

        <Section title="Tips & Shortcuts">
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Click the <strong>ScoutEd logo</strong> in the header to return to the Welcome Hub from any page</li>
            <li>Your <strong>bookmarks</strong> and <strong>shortlist</strong> are saved locally and persist across sessions</li>
            <li>The <strong>current tab</strong> is remembered — refreshing the page won't send you back to Home</li>
            <li>On mobile, use the <strong>bottom navigation bar</strong> to switch between sections</li>
            <li>Use the <strong>"Load More"</strong> button at the bottom of the Grants page to see older opportunities</li>
          </ul>
        </Section>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-gray-100 text-center">
          <p className="font-body text-xs text-gray-400">
            ScoutEd v1.0 — Built for the Partnerships &amp; Strategic Initiatives team at CSF
          </p>
        </div>
      </div>
    </div>
  )
}
