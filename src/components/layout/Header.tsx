import { Bars3Icon } from '@heroicons/react/24/outline'

interface HeaderProps {
  onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass-dark text-white shadow-lg shadow-csf-blue/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Open menu"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-csf-yellow rounded-xl flex items-center justify-center shadow-sm shadow-csf-yellow/30">
                <span className="text-csf-blue font-heading font-bold text-sm">SE</span>
              </div>
              <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight">
                Scout<span className="text-csf-yellow">Ed</span>
              </h1>
            </div>
          </div>
          <p className="hidden sm:block font-body text-sm text-white/50">
            CSF Partnerships &middot; Grant Opportunities
          </p>
        </div>
      </div>
    </header>
  )
}
