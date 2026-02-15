import { useState } from 'react'
import { FunnelIcon } from '@heroicons/react/24/outline'
import { Header } from './components/layout/Header'
import { MobileNav, type Tab } from './components/layout/MobileNav'
import { OpportunityCard } from './components/cards/OpportunityCard'
import { FilterSidebar } from './components/filters/FilterSidebar'
import { MobileFilterDrawer } from './components/filters/MobileFilterDrawer'
import { OnboardingModal } from './components/onboarding/OnboardingModal'
import { EmailSubscribe } from './components/subscription/EmailSubscribe'
import { PreviewPane } from './components/preview/PreviewPane'
import { SearchBar } from './components/ui/SearchBar'
import { useOpportunities } from './hooks/useOpportunities'
import { useBookmarks } from './hooks/useBookmarks'
import { useOnboarding } from './hooks/useOnboarding'
import type { Filters, Opportunity } from './types'

const defaultFilters: Filters = {
  scoreLevel: null,
  sectors: [],
  states: [],
  deadlineBefore: null,
  search: '',
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)

  const { data: opportunities = [], isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useOpportunities(filters)
  const { isBookmarked, toggleBookmark, isHidden, toggleHidden, bookmarks } = useBookmarks()
  const { showOnboarding, completeOnboarding } = useOnboarding()

  // Filter out hidden items for dashboard view
  const visibleOpportunities = opportunities.filter(opp => !isHidden(opp.id))

  // Bookmarked items for bookmarks tab
  const bookmarkedOpportunities = opportunities.filter(opp => isBookmarked(opp.id))

  // Active filter count for badge
  const filterCount = (filters.scoreLevel ? 1 : 0) + filters.sectors.length + filters.states.length + (filters.deadlineBefore ? 1 : 0)

  // Content based on active tab
  const renderContent = () => {
    if (activeTab === 'subscribe') {
      return (
        <div className="max-w-lg mx-auto animate-fade-in">
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-4">
            Email Subscription
          </h2>
          <EmailSubscribe />
          <div className="mt-5 p-4 bg-csf-blue/[0.03] rounded-2xl border border-csf-blue/5">
            <h3 className="font-heading font-semibold text-sm text-csf-blue mb-2">
              What you'll receive
            </h3>
            <ul className="space-y-2 font-body text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-csf-blue rounded-full shrink-0" />
                Top-scored opportunities from the last 24 hours
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-csf-blue rounded-full shrink-0" />
                Direct links to grant applications
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-csf-blue rounded-full shrink-0" />
                Relevance scores and deadline alerts
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-csf-blue rounded-full shrink-0" />
                Delivered daily at 8:30 AM IST
              </li>
            </ul>
          </div>
        </div>
      )
    }

    if (activeTab === 'bookmarks') {
      return (
        <div className="animate-fade-in">
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-4">
            Bookmarked ({bookmarks.size})
          </h2>
          {bookmarkedOpportunities.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>
              </div>
              <p className="font-heading font-semibold text-gray-700">No bookmarks yet</p>
              <p className="font-body text-sm text-gray-400 mt-1">
                Tap the bookmark icon on any opportunity to save it here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {bookmarkedOpportunities.map(opp => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  isBookmarked
                  onToggleBookmark={() => toggleBookmark(opp.id)}
                  onHide={() => toggleHidden(opp.id)}
                  onClick={() => setSelectedOpportunity(opp)}
                />
              ))}
            </div>
          )}
        </div>
      )
    }

    // Dashboard (default)
    return (
      <div className="animate-fade-in">
        {/* Search + Filter toggle (mobile) */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <SearchBar
              value={filters.search}
              onChange={search => setFilters(f => ({ ...f, search }))}
            />
          </div>
          <button
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden relative p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
            aria-label="Open filters"
          >
            <FunnelIcon className="w-5 h-5 text-gray-600" />
            {filterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-csf-blue text-white text-[9px] font-heading font-bold rounded-full flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </button>
        </div>

        {/* Results count */}
        <p className="text-xs font-heading text-gray-400 mb-4 uppercase tracking-wider">
          {visibleOpportunities.length} {visibleOpportunities.length === 1 ? 'opportunity' : 'opportunities'} found
        </p>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-[3px] border-csf-blue/10 border-t-csf-blue rounded-full animate-spin mx-auto" />
            <p className="font-body text-sm text-gray-400 mt-4">Loading opportunities...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-16">
            <p className="font-body text-red-600">Failed to load opportunities.</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && visibleOpportunities.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            </div>
            <p className="font-heading font-semibold text-gray-700">No matches found</p>
            <p className="font-body text-sm text-gray-400 mt-1">Try adjusting your filters.</p>
            <button
              onClick={() => setFilters(defaultFilters)}
              className="mt-3 text-sm text-csf-blue hover:underline font-heading font-medium"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Opportunity cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleOpportunities.map(opp => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              isBookmarked={isBookmarked(opp.id)}
              onToggleBookmark={() => toggleBookmark(opp.id)}
              onHide={() => toggleHidden(opp.id)}
              onClick={() => setSelectedOpportunity(opp)}
            />
          ))}
        </div>

        {/* Load More */}
        {hasNextPage && (
          <div className="text-center mt-8">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl font-heading text-sm font-semibold text-csf-blue hover:bg-csf-blue hover:text-white transition-all shadow-sm disabled:opacity-50"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] pb-20 lg:pb-0">
      <Header onMenuToggle={() => setShowMobileMenu(!showMobileMenu)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="lg:flex lg:gap-8">
          {/* Desktop sidebar */}
          {activeTab === 'dashboard' && (
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <FilterSidebar filters={filters} onChange={setFilters} />
                </div>
                <EmailSubscribe />
              </div>
            </aside>
          )}

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {renderContent()}
          </main>
        </div>
      </div>

      {/* Mobile navigation */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Mobile filter drawer */}
      <MobileFilterDrawer
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        filters={filters}
        onChange={setFilters}
      />

      {/* Preview pane */}
      <PreviewPane
        opportunity={selectedOpportunity}
        isOpen={selectedOpportunity !== null}
        onClose={() => setSelectedOpportunity(null)}
        isBookmarked={selectedOpportunity ? isBookmarked(selectedOpportunity.id) : false}
        onToggleBookmark={() => {
          if (selectedOpportunity) toggleBookmark(selectedOpportunity.id)
        }}
        onHide={() => {
          if (selectedOpportunity) {
            toggleHidden(selectedOpportunity.id)
            setSelectedOpportunity(null)
          }
        }}
      />

      {/* Onboarding modal */}
      <OnboardingModal isOpen={showOnboarding} onComplete={completeOnboarding} />
    </div>
  )
}
