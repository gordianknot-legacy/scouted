import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react'
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  RectangleStackIcon,
  BookOpenIcon,
  NewspaperIcon,
} from '@heroicons/react/24/outline'
import type { Tab } from './MobileNav'

interface NavDrawerProps {
  isOpen: boolean
  onClose: () => void
  activeTab: Tab
  onNavigate: (tab: Tab) => void
}

const navItems: {
  id: Tab
  label: string
  description: string
  icon: typeof MagnifyingGlassIcon
  iconBg: string
  iconColor: string
  enabled: boolean
}[] = [
  {
    id: 'dashboard',
    label: 'Grant Opportunities',
    description: 'Browse scored grants and funding',
    icon: MagnifyingGlassIcon,
    iconBg: 'bg-csf-yellow/20',
    iconColor: 'text-csf-blue',
    enabled: true,
  },
  {
    id: 'csr',
    label: 'CSR Prospects',
    description: 'Company CSR spending data',
    icon: ChartBarIcon,
    iconBg: 'bg-csf-yellow/20',
    iconColor: 'text-csf-blue',
    enabled: true,
  },
  {
    id: 'pipeline',
    label: 'CSR Pipeline',
    description: 'Track outreach to prospects',
    icon: RectangleStackIcon,
    iconBg: 'bg-csf-purple/10',
    iconColor: 'text-csf-purple',
    enabled: true,
  },
  {
    id: 'guide',
    label: "Creator's Guide",
    description: 'Learn how ScoutEd works',
    icon: BookOpenIcon,
    iconBg: 'bg-csf-yellow/20',
    iconColor: 'text-csf-blue',
    enabled: true,
  },
  {
    id: 'newsletter' as Tab,
    label: 'Donor Newsletter',
    description: "Curated quarterly newsletters",
    icon: NewspaperIcon,
    iconBg: 'bg-csf-orange/10',
    iconColor: 'text-csf-orange',
    enabled: true,
  },
]

export function NavDrawer({ isOpen, onClose, activeTab, onNavigate }: NavDrawerProps) {
  function handleNavigate(tab: Tab) {
    onNavigate(tab)
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/30 transition-opacity duration-200" />
      <div className="fixed inset-0 flex">
        <DialogPanel className="w-72 max-w-[80vw] h-full bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-csf-yellow rounded-2xl flex items-center justify-center shadow-sm shadow-csf-yellow/30">
                <span className="text-csf-blue font-heading font-bold text-sm">SE</span>
              </div>
              <span className="font-heading text-lg font-bold text-csf-blue tracking-tight">
                Scout<span className="text-csf-yellow">Ed</span>
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navItems.map(item => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => item.enabled && handleNavigate(item.id)}
                  disabled={!item.enabled}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${
                    isActive
                      ? 'bg-csf-blue/[0.06]'
                      : item.enabled
                        ? 'hover:bg-gray-50'
                        : 'opacity-50 cursor-default'
                  }`}
                >
                  <div className={`w-9 h-9 ${item.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-heading text-sm font-semibold truncate ${
                      isActive ? 'text-csf-blue' : 'text-gray-900'
                    }`}>
                      {item.label}
                    </p>
                    <p className="font-body text-xs text-gray-400 truncate">
                      {item.description}
                    </p>
                  </div>
                  {!item.enabled && (
                    <span className="ml-auto px-1.5 py-0.5 bg-csf-yellow text-csf-blue text-[10px] font-heading font-bold rounded-full uppercase shrink-0">
                      Soon
                    </span>
                  )}
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-csf-blue rounded-full shrink-0" />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100">
            <p className="font-body text-[11px] text-gray-400 text-center">
              CSF Partnerships &amp; Strategic Initiatives
            </p>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
