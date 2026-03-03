import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'scouted_csr_shortlist'

function loadSet(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

export function useCsrShortlist() {
  const [shortlisted, setShortlisted] = useState<Set<string>>(() => loadSet())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...shortlisted]))
  }, [shortlisted])

  const toggle = useCallback((cin: string) => {
    setShortlisted(prev => {
      const next = new Set(prev)
      if (next.has(cin)) next.delete(cin)
      else next.add(cin)
      return next
    })
  }, [])

  const isShortlisted = useCallback((cin: string) => shortlisted.has(cin), [shortlisted])

  return { shortlisted, toggle, isShortlisted, count: shortlisted.size }
}
