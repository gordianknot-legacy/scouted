import { useState, useCallback, useEffect } from 'react'

const BOOKMARKS_KEY = 'scouted_bookmarks'
const HIDDEN_KEY = 'scouted_hidden'

function loadSet(key: string): Set<string> {
  try {
    const stored = localStorage.getItem(key)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

function saveSet(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...set]))
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => loadSet(BOOKMARKS_KEY))
  const [hidden, setHidden] = useState<Set<string>>(() => loadSet(HIDDEN_KEY))

  useEffect(() => {
    saveSet(BOOKMARKS_KEY, bookmarks)
  }, [bookmarks])

  useEffect(() => {
    saveSet(HIDDEN_KEY, hidden)
  }, [hidden])

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleHidden = useCallback((id: string) => {
    setHidden(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const isBookmarked = useCallback((id: string) => bookmarks.has(id), [bookmarks])
  const isHidden = useCallback((id: string) => hidden.has(id), [hidden])

  return { bookmarks, toggleBookmark, isBookmarked, hidden, toggleHidden, isHidden }
}
