import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative group">
      <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-csf-blue transition-colors" />
      <input
        type="text"
        placeholder="Search opportunities..."
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white font-body text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/15 focus:border-csf-blue/40 transition-all shadow-sm"
      />
    </div>
  )
}
