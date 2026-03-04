import { MagnifyingGlassIcon, RectangleStackIcon, NewspaperIcon } from '@heroicons/react/24/outline'
import type { Tab } from '../layout/MobileNav'

interface WelcomeHubProps {
  onNavigate: (tab: Tab) => void
}

const tools = [
  {
    id: 'dashboard' as Tab,
    title: 'Grant Opportunities',
    description: 'Browse scored grant and funding opportunities',
    icon: MagnifyingGlassIcon,
    iconBg: 'bg-csf-yellow/20',
    iconColor: 'text-csf-blue',
    hoverBorder: 'hover:border-csf-blue/30',
    enabled: true,
  },
  {
    id: 'pipeline' as Tab,
    title: 'CSR Prospects',
    description: 'Track CSR partnership outreach and prospects',
    icon: RectangleStackIcon,
    iconBg: 'bg-csf-purple/10',
    iconColor: 'text-csf-purple',
    hoverBorder: 'hover:border-csf-purple/30',
    enabled: true,
  },
  {
    id: 'pipeline' as Tab, // unused — card is disabled
    title: 'Donor Newsletter',
    description: "Curated quarterly newsletters for CSF's donors",
    icon: NewspaperIcon,
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-400',
    hoverBorder: '',
    enabled: false,
  },
]

export function WelcomeHub({ onNavigate }: WelcomeHubProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      {/* Logo + heading */}
      <div className="w-14 h-14 bg-csf-yellow rounded-2xl flex items-center justify-center shadow-sm shadow-csf-yellow/30 mb-5">
        <span className="text-csf-blue font-heading font-bold text-xl">SE</span>
      </div>
      <h2 className="font-heading text-2xl sm:text-3xl font-bold text-csf-blue tracking-tight">
        Welcome to Scout<span className="text-csf-yellow">Ed</span>
      </h2>
      <p className="font-body text-sm text-gray-500 mt-1.5 mb-10">
        CSF Partnerships &amp; Strategic Initiatives
      </p>

      {/* Tool cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
        {tools.map(tool => (
          <button
            key={tool.title}
            onClick={() => tool.enabled && onNavigate(tool.id)}
            disabled={!tool.enabled}
            className={`relative flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all ${
              tool.enabled
                ? `${tool.hoverBorder} hover:shadow-md cursor-pointer`
                : 'opacity-60 cursor-default'
            }`}
          >
            {!tool.enabled && (
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-csf-yellow text-csf-blue text-[10px] font-heading font-bold rounded-full uppercase tracking-wide">
                Coming Soon
              </span>
            )}
            <div className={`w-12 h-12 ${tool.iconBg} rounded-xl flex items-center justify-center mb-4`}>
              <tool.icon className={`w-6 h-6 ${tool.iconColor}`} />
            </div>
            <h3 className="font-heading text-sm font-bold text-gray-900 mb-1">
              {tool.title}
            </h3>
            <p className="font-body text-xs text-gray-400 leading-relaxed">
              {tool.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
