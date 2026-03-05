import { MagnifyingGlassIcon, RectangleStackIcon, NewspaperIcon, BookOpenIcon } from '@heroicons/react/24/outline'
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
    id: 'csr' as Tab,
    title: 'CSR Prospects',
    description: 'Track CSR partnership outreach and prospects',
    icon: RectangleStackIcon,
    iconBg: 'bg-csf-purple/10',
    iconColor: 'text-csf-purple',
    hoverBorder: 'hover:border-csf-purple/30',
    enabled: true,
  },
  {
    id: 'newsletter' as Tab,
    title: 'Donor Newsletter',
    description: "Curated quarterly newsletters for CSF's donors",
    icon: NewspaperIcon,
    iconBg: 'bg-csf-orange/10',
    iconColor: 'text-csf-orange',
    hoverBorder: 'hover:border-csf-orange/30',
    enabled: true,
  },
  {
    id: 'guide' as Tab,
    title: "Creator's Guide",
    description: 'Learn how ScoutEd works and how to use it',
    icon: BookOpenIcon,
    iconBg: 'bg-csf-yellow/20',
    iconColor: 'text-csf-blue',
    hoverBorder: 'hover:border-csf-blue/30',
    enabled: true,
  },
]

export function WelcomeHub({ onNavigate }: WelcomeHubProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in relative">
      {/* Subtle radial gradient background */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(255,212,0,0.06) 0%, transparent 70%)' }} />

      {/* Logo + heading */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-14 h-14 bg-csf-yellow rounded-2xl flex items-center justify-center shadow-sm shadow-csf-yellow/30 mb-7">
          <span className="text-csf-blue font-heading font-bold text-xl">SE</span>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-csf-blue tracking-tight">
          Welcome to Scout<span className="text-csf-yellow">Ed</span>
        </h2>
        <p className="font-body text-sm text-gray-500 mt-1.5 mb-12">
          CSF Partnerships &amp; Strategic Initiatives
        </p>
      </div>

      {/* Tool cards */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-4xl">
        {tools.map(tool => (
          <button
            key={tool.title}
            onClick={() => tool.enabled && onNavigate(tool.id)}
            disabled={!tool.enabled}
            className={`relative flex flex-col items-center text-center p-8 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-transparent transition-all ${
              tool.enabled
                ? 'hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] cursor-pointer'
                : 'opacity-60 cursor-default'
            }`}
          >
            {!tool.enabled && (
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-csf-yellow text-csf-blue text-[11px] font-heading font-bold rounded-full uppercase tracking-wide">
                Coming Soon
              </span>
            )}
            <div className={`w-14 h-14 ${tool.iconBg} rounded-xl flex items-center justify-center mb-5`}>
              <tool.icon className={`w-7 h-7 ${tool.iconColor}`} />
            </div>
            <h3 className="font-heading text-base font-bold text-gray-900 mb-1.5">
              {tool.title}
            </h3>
            <p className="font-body text-sm text-gray-400 leading-relaxed">
              {tool.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
