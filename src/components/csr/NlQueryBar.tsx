import { useState, useRef, useEffect } from 'react'
import { MagnifyingGlassIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { EXAMPLE_QUERIES } from '../../lib/nl-query-parser'

interface NlQueryBarProps {
  onSubmit: (query: string) => void
  onClear: () => void
  isActive: boolean
  isLoading: boolean
  status: string
  source: 'rule' | 'llm' | null
  description: string
  error: string | null
  resultCount?: number
  countOnly?: boolean
}

export function NlQueryBar({
  onSubmit,
  onClear,
  isActive,
  isLoading,
  status,
  source,
  description,
  error,
  resultCount,
  countOnly,
}: NlQueryBarProps) {
  const [input, setInput] = useState('')
  const [showExamples, setShowExamples] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close examples on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowExamples(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (input.trim()) {
      onSubmit(input.trim())
      setShowExamples(false)
    }
  }

  function handleExampleClick(example: string) {
    setInput(example)
    onSubmit(example)
    setShowExamples(false)
  }

  function handleClear() {
    setInput('')
    onClear()
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className={`flex items-center gap-2 bg-white border rounded-xl px-3 py-2 transition-all ${
          isActive ? 'border-csf-blue/40 ring-2 ring-csf-blue/10' :
          error ? 'border-red-300' :
          'border-gray-200 focus-within:border-csf-blue/30 focus-within:ring-2 focus-within:ring-csf-blue/10'
        }`}>
          {isLoading ? (
            <div className="w-4.5 h-4.5 border-2 border-csf-blue/20 border-t-csf-blue rounded-full animate-spin shrink-0" />
          ) : (
            <SparklesIcon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-csf-blue' : 'text-gray-400'}`} />
          )}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onFocus={() => !isActive && setShowExamples(true)}
            placeholder="Ask about the data... e.g. &quot;top 20 education spenders with email&quot;"
            className="flex-1 font-body text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
          />
          {(input || isActive) && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
              aria-label="Clear query"
            >
              <XMarkIcon className="w-4 h-4 text-gray-400" />
            </button>
          )}
          {input && !isActive && (
            <button
              type="submit"
              className="px-2.5 py-1 rounded-lg bg-csf-blue text-white font-heading text-xs font-medium hover:bg-csf-blue/90 transition-colors shrink-0"
            >
              Search
            </button>
          )}
        </div>
      </form>

      {/* Active filter badge */}
      {isActive && description && (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-csf-blue/5 border border-csf-blue/10">
            <MagnifyingGlassIcon className="w-3.5 h-3.5 text-csf-blue/60" />
            <span className="font-body text-xs text-csf-blue/80">{description}</span>
          </div>
          {source === 'llm' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-heading font-medium bg-csf-purple/10 text-csf-purple">
              AI parsed
            </span>
          )}
          {resultCount !== undefined && (
            <span className="font-body text-xs text-gray-500">
              {countOnly ? (
                <span className="font-semibold text-csf-blue">{resultCount} companies match</span>
              ) : (
                <>{resultCount} result{resultCount !== 1 ? 's' : ''}</>
              )}
            </span>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-2 font-body text-xs text-red-500">{error}</p>
      )}

      {/* LLM loading indicator */}
      {status === 'llm' && (
        <p className="mt-2 font-body text-xs text-gray-400">Asking AI to interpret your query...</p>
      )}

      {/* Example queries dropdown */}
      {showExamples && !isActive && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1.5 overflow-hidden">
          <p className="px-3 py-1.5 font-heading text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Try asking
          </p>
          {EXAMPLE_QUERIES.map(example => (
            <button
              key={example}
              onClick={() => handleExampleClick(example)}
              className="w-full text-left px-3 py-2 font-body text-sm text-gray-700 hover:bg-csf-blue/5 hover:text-csf-blue transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
