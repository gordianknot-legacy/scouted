import {
  HomeIcon,
  BookmarkIcon,
  EnvelopeIcon,
  ChartBarIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  BookmarkIcon as BookmarkIconSolid,
  EnvelopeIcon as EnvelopeIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  BookOpenIcon as BookOpenIconSolid,
} from '@heroicons/react/24/solid'

export type Tab = 'dashboard' | 'bookmarks' | 'subscribe' | 'csr' | 'guide'

interface MobileNavProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const tabs: { id: Tab; label: string; icon: typeof HomeIcon; activeIcon: typeof HomeIconSolid }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: HomeIcon, activeIcon: HomeIconSolid },
  { id: 'bookmarks', label: 'Bookmarks', icon: BookmarkIcon, activeIcon: BookmarkIconSolid },
  { id: 'subscribe', label: 'Subscribe', icon: EnvelopeIcon, activeIcon: EnvelopeIconSolid },
  { id: 'csr', label: 'CSR Data', icon: ChartBarIcon, activeIcon: ChartBarIconSolid },
  { id: 'guide', label: 'Guide', icon: BookOpenIcon, activeIcon: BookOpenIconSolid },
]

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-gray-200/50 lg:hidden safe-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id
          const Icon = isActive ? tab.activeIcon : tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all ${
                isActive ? 'text-csf-blue scale-105' : 'text-gray-400'
              }`}
            >
              <Icon className="w-5.5 h-5.5" />
              <span className="text-[10px] font-heading font-medium">{tab.label}</span>
              {isActive && (
                <div className="w-1 h-1 bg-csf-blue rounded-full -mt-0.5" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
