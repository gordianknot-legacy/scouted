import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeftIcon, PlusIcon, EyeIcon, SparklesIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { useNewsletter, useUpdateNewsletter } from '../../hooks/useNewsletters'
import { SectionEditor } from './SectionEditor'
import { NewsletterPreview } from './NewsletterPreview'
import { ImageUpload } from './ImageUpload'
import { SendScheduleModal } from './SendScheduleModal'
import { buildNewsletterHtml } from '../../lib/newsletter/template'
import type { NewsletterSection, NewsletterSectionType, NewsletterContent } from '../../types'

interface NewsletterEditorProps {
  id: string
  onBack: () => void
}

type EditorMode = 'structured' | 'freetext'

export function NewsletterEditor({ id, onBack }: NewsletterEditorProps) {
  const { data: newsletter, isLoading } = useNewsletter(id)
  const updateNewsletter = useUpdateNewsletter()

  const [mode, setMode] = useState<EditorMode>('structured')
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [quarterLabel, setQuarterLabel] = useState('')
  const [heroImage, setHeroImage] = useState<string | null>(null)
  const [sections, setSections] = useState<NewsletterSection[]>([])
  const [freeText, setFreeText] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [polishingId, setPolishingId] = useState<string | null>(null)
  const [sendingTest, setSendingTest] = useState(false)
  const [structuring, setStructuring] = useState(false)

  // Init from loaded newsletter
  const initialised = useRef(false)
  useEffect(() => {
    if (newsletter && !initialised.current) {
      initialised.current = true
      setTitle(newsletter.title || '')
      setSubject(newsletter.subject || '')
      const c = newsletter.content_json
      setQuarterLabel(c?.quarterLabel || '')
      setHeroImage(c?.heroImage || null)
      setSections(c?.sections || [])
    }
  }, [newsletter])

  // Auto-save debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const save = useCallback(() => {
    if (!newsletter) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const content_json: NewsletterContent = { quarterLabel, heroImage, sections }
      const html_rendered = buildNewsletterHtml(content_json)
      updateNewsletter.mutate({ id, title, subject, content_json, html_rendered })
    }, 2000)
  }, [id, title, subject, quarterLabel, heroImage, sections, newsletter, updateNewsletter])

  useEffect(() => {
    if (initialised.current) save()
  }, [title, subject, quarterLabel, heroImage, sections])

  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [])

  const handleAddSection = (type: NewsletterSectionType = 'custom') => {
    const newSection: NewsletterSection = {
      id: crypto.randomUUID(),
      type,
      title: '',
      body: '',
      image: null,
      ...(type === 'stats' ? { stats: [{ label: '', value: '' }] } : {}),
      ...(type === 'events' ? { events: [{ date: '', description: '' }] } : {}),
    }
    setSections([...sections, newSection])
  }

  const handleSectionChange = (index: number, updated: NewsletterSection) => {
    const next = [...sections]
    next[index] = updated
    setSections(next)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const next = [...sections]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    setSections(next)
  }

  const handleMoveDown = (index: number) => {
    if (index === sections.length - 1) return
    const next = [...sections]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    setSections(next)
  }

  const handleDeleteSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index))
  }

  const handlePolish = async (section: NewsletterSection) => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
    if (!apiKey) { alert('VITE_OPENROUTER_API_KEY not set'); return }

    setPolishingId(section.id)
    try {
      const { polishSection } = await import('../../lib/newsletter/ai-polish')
      const result = await polishSection(section)
      setSections(prev => prev.map(s => s.id === section.id ? { ...s, title: result.title, body: result.body } : s))
    } catch (err) {
      console.error('Polish failed:', err)
    } finally {
      setPolishingId(null)
    }
  }

  const handleStructureFromFreeText = async () => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
    if (!apiKey) { alert('VITE_OPENROUTER_API_KEY not set'); return }
    if (!freeText.trim()) return

    setStructuring(true)
    try {
      const { structureFromFreeText } = await import('../../lib/newsletter/ai-polish')
      const content = await structureFromFreeText(freeText)
      setQuarterLabel(content.quarterLabel || quarterLabel)
      setSections(content.sections)
      setMode('structured')
    } catch (err) {
      console.error('Structuring failed:', err)
    } finally {
      setStructuring(false)
    }
  }

  const handleSendTest = async () => {
    setSendingTest(true)
    try {
      const content_json: NewsletterContent = { quarterLabel, heroImage, sections }
      const html_rendered = buildNewsletterHtml(content_json)
      // Save first
      await updateNewsletter.mutateAsync({ id, title, subject, content_json, html_rendered })
      // Send test
      const res = await fetch('/api/newsletter-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsletter_id: id, test_email: 'self' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send test')
      }
      alert('Test email sent!')
    } catch (err) {
      alert(`Send test failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setSendingTest(false)
    }
  }

  const previewHtml = buildNewsletterHtml({ quarterLabel, heroImage, sections })

  if (isLoading) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-10 h-10 border-[3px] border-csf-blue/10 border-t-csf-blue rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  const hasAiKey = !!import.meta.env.VITE_OPENROUTER_API_KEY

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-200/60 transition-colors" aria-label="Back">
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="font-heading text-xl font-bold text-gray-900 truncate flex-1">
          {title || 'Untitled Newsletter'}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl font-heading text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <EyeIcon className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-csf-blue text-white rounded-xl font-heading text-sm font-semibold hover:bg-csf-blue/90 transition-colors shadow-sm"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 max-w-xs">
        <button
          onClick={() => setMode('structured')}
          className={`flex-1 py-1.5 rounded-lg font-heading text-sm font-medium transition-colors ${
            mode === 'structured' ? 'bg-white text-csf-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Structured
        </button>
        <button
          onClick={() => setMode('freetext')}
          className={`flex-1 py-1.5 rounded-lg font-heading text-sm font-medium transition-colors ${
            mode === 'freetext' ? 'bg-white text-csf-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Free Text
        </button>
      </div>

      <div className="max-w-3xl">
        {mode === 'structured' ? (
          <div className="space-y-4">
            {/* Title + Subject */}
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-transparent p-5 space-y-4">
              <div>
                <label className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Newsletter Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Q4 Donor Update — Jan-Mar 2026"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30"
                />
              </div>
              <div>
                <label className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Email Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="CSF Quarterly Update — January to March 2026"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30"
                />
              </div>
              <div>
                <label className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Quarter Label</label>
                <input
                  type="text"
                  value={quarterLabel}
                  onChange={e => setQuarterLabel(e.target.value)}
                  placeholder="Quarterly Update — Jan-Mar 2026"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30"
                />
              </div>
              <ImageUpload label="Hero Image" value={heroImage} onChange={setHeroImage} />
            </div>

            {/* Sections */}
            {sections.map((section, i) => (
              <SectionEditor
                key={section.id}
                section={section}
                index={i}
                total={sections.length}
                onChange={updated => handleSectionChange(i, updated)}
                onMoveUp={() => handleMoveUp(i)}
                onMoveDown={() => handleMoveDown(i)}
                onDelete={() => handleDeleteSection(i)}
                onPolish={hasAiKey ? handlePolish : undefined}
                isPolishing={polishingId === section.id}
              />
            ))}

            {/* Add Section */}
            <button
              onClick={() => handleAddSection()}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-2xl font-heading text-sm font-medium text-gray-400 hover:border-csf-blue/30 hover:text-csf-blue transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Add Section
            </button>
          </div>
        ) : (
          /* Free-text mode */
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-transparent p-5">
              <label className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Paste or type your newsletter content
              </label>
              <textarea
                value={freeText}
                onChange={e => setFreeText(e.target.value)}
                placeholder="Paste the full newsletter text here. The AI will structure it into sections automatically..."
                rows={16}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30 resize-none"
              />
              {hasAiKey && (
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleStructureFromFreeText}
                    disabled={structuring || !freeText.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-csf-purple text-white rounded-xl font-heading text-sm font-semibold hover:bg-csf-purple/90 disabled:opacity-50 transition-colors"
                  >
                    <SparklesIcon className="w-4 h-4" />
                    {structuring ? 'Structuring...' : 'Structure with AI'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auto-save indicator */}
        {updateNewsletter.isPending && (
          <p className="font-body text-xs text-gray-400 mt-3 text-center">Saving...</p>
        )}
      </div>

      {/* Preview panel */}
      <NewsletterPreview
        html={previewHtml}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onSendTest={handleSendTest}
        isSendingTest={sendingTest}
      />

      {/* Send/Schedule modal */}
      <SendScheduleModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        newsletterId={id}
        title={title}
        subject={subject}
        contentJson={{ quarterLabel, heroImage, sections }}
      />
    </div>
  )
}
