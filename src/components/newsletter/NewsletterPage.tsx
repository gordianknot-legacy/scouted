import { useState } from 'react'
import { ArrowLeftIcon, PlusIcon, UserGroupIcon, NewspaperIcon } from '@heroicons/react/24/outline'
import { DonorManager } from './DonorManager'
import { NewsletterEditor } from './NewsletterEditor'
import { useNewsletters, useCreateNewsletter, useDeleteNewsletter } from '../../hooks/useNewsletters'
import type { Newsletter, NewsletterStatus } from '../../types'

interface NewsletterPageProps {
  onBack: () => void
}

const STATUS_STYLES: Record<NewsletterStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-csf-yellow/15 text-csf-blue',
  sent: 'bg-csf-lime/15 text-csf-blue',
  failed: 'bg-csf-orange/10 text-csf-orange',
}

type View = 'list' | 'donors' | 'editor'

export function NewsletterPage({ onBack }: NewsletterPageProps) {
  const [view, setView] = useState<View>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const { data: newsletters = [], isLoading } = useNewsletters()
  const createNewsletter = useCreateNewsletter()
  const deleteNewsletter = useDeleteNewsletter()

  const handleNew = async () => {
    try {
      const result = await createNewsletter.mutateAsync({
        title: 'Untitled Newsletter',
        subject: '',
        content_json: {
          quarterLabel: '',
          heroImage: null,
          sections: [
            { id: crypto.randomUUID(), type: 'ceo_message', title: "Message from the CEO", body: '', image: null },
            { id: crypto.randomUUID(), type: 'section_header', title: 'Foundational Literacy & Numeracy', body: '', image: null },
            { id: crypto.randomUUID(), type: 'impact_story', title: '', body: '', image: null },
            { id: crypto.randomUUID(), type: 'section_header', title: 'EdTech & Innovation', body: '', image: null },
            { id: crypto.randomUUID(), type: 'impact_story', title: '', body: '', image: null },
            { id: crypto.randomUUID(), type: 'section_header', title: 'Organisation Updates', body: '', image: null },
            { id: crypto.randomUUID(), type: 'custom', title: '', body: '', image: null },
          ],
        },
      })
      setEditingId(result.id)
      setView('editor')
    } catch (err) {
      console.error('Failed to create newsletter:', err)
    }
  }

  const handleEdit = (nl: Newsletter) => {
    setEditingId(nl.id)
    setView('editor')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this newsletter?')) return
    try {
      await deleteNewsletter.mutateAsync(id)
    } catch (err) {
      console.error('Failed to delete newsletter:', err)
    }
  }

  if (view === 'donors') {
    return <DonorManager onBack={() => setView('list')} />
  }

  if (view === 'editor' && editingId) {
    return <NewsletterEditor id={editingId} onBack={() => { setEditingId(null); setView('list') }} />
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-gray-200/60 transition-colors"
          aria-label="Back to home"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="font-heading text-xl font-bold text-gray-900">
          Donor Newsletter
        </h1>
        <div className="flex-1" />
        <button
          onClick={() => setView('donors')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl font-heading text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <UserGroupIcon className="w-4 h-4" />
          Manage Donors
        </button>
        <button
          onClick={handleNew}
          disabled={createNewsletter.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-csf-blue text-white rounded-xl font-heading text-sm font-semibold hover:bg-csf-blue/90 transition-colors shadow-sm disabled:opacity-50"
        >
          <PlusIcon className="w-4 h-4" />
          {createNewsletter.isPending ? 'Creating...' : 'New Newsletter'}
        </button>
      </div>

      {/* Newsletter list */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-[3px] border-csf-blue/10 border-t-csf-blue rounded-full animate-spin mx-auto" />
          <p className="font-body text-sm text-gray-400 mt-4">Loading newsletters...</p>
        </div>
      ) : newsletters.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <NewspaperIcon className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-heading font-semibold text-gray-700">No newsletters yet</p>
          <p className="font-body text-sm text-gray-400 mt-1">
            Create your first donor newsletter to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {newsletters.map(nl => (
            <div
              key={nl.id}
              className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-transparent hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all cursor-pointer"
              onClick={() => handleEdit(nl)}
            >
              <div className="w-10 h-10 bg-csf-orange/10 rounded-xl flex items-center justify-center shrink-0">
                <NewspaperIcon className="w-5 h-5 text-csf-orange" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm font-bold text-gray-900 truncate">
                  {nl.title || 'Untitled Newsletter'}
                </p>
                <p className="font-body text-xs text-gray-400 mt-0.5">
                  {nl.subject || 'No subject line'}
                  {nl.sent_at && ` · Sent ${new Date(nl.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  {nl.scheduled_at && nl.status === 'scheduled' && ` · Scheduled for ${new Date(nl.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-lg font-heading text-xs font-medium capitalize ${STATUS_STYLES[nl.status]}`}>
                {nl.status}
              </span>
              {nl.status === 'sent' && nl.sent_count > 0 && (
                <span className="font-heading text-xs text-gray-400">
                  {nl.sent_count} sent
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(nl.id) }}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
