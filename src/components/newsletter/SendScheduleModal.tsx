import { useState } from 'react'
import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react'
import { PaperAirplaneIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useUpdateNewsletter } from '../../hooks/useNewsletters'
import { useDonors } from '../../hooks/useDonors'
import { buildNewsletterHtml } from '../../lib/newsletter/template'
import type { NewsletterContent } from '../../types'

interface SendScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  newsletterId: string
  title: string
  subject: string
  contentJson: NewsletterContent
}

export function SendScheduleModal({ isOpen, onClose, newsletterId, title, subject, contentJson }: SendScheduleModalProps) {
  const { data: donors = [] } = useDonors()
  const updateNewsletter = useUpdateNewsletter()
  const [sending, setSending] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('09:00')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const activeDonors = donors.filter(d => d.is_active)

  const handleSendNow = async () => {
    if (activeDonors.length === 0) {
      setError('No active donors. Add donors first.')
      return
    }
    if (!subject.trim()) {
      setError('Subject line is required.')
      return
    }

    setSending(true)
    setError(null)
    try {
      // Save newsletter first
      const html_rendered = buildNewsletterHtml(contentJson)
      await updateNewsletter.mutateAsync({
        id: newsletterId,
        title,
        subject,
        content_json: contentJson,
        html_rendered,
      })

      const res = await fetch('/api/newsletter-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsletter_id: newsletterId }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send')
      }

      const result = await res.json()
      setSuccess(`Newsletter sent to ${result.sent_count || activeDonors.length} donors!`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }

  const handleSchedule = async () => {
    if (!scheduleDate || !scheduleTime) {
      setError('Pick a date and time.')
      return
    }
    if (!subject.trim()) {
      setError('Subject line is required.')
      return
    }

    setScheduling(true)
    setError(null)
    try {
      const scheduled_at = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString()
      const html_rendered = buildNewsletterHtml(contentJson)

      await updateNewsletter.mutateAsync({
        id: newsletterId,
        title,
        subject,
        content_json: contentJson,
        html_rendered,
        status: 'scheduled',
        scheduled_at,
      })

      setSuccess(`Scheduled for ${new Date(scheduled_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scheduling failed')
    } finally {
      setScheduling(false)
    }
  }

  const handleCancelSchedule = async () => {
    try {
      await updateNewsletter.mutateAsync({
        id: newsletterId,
        status: 'draft',
        scheduled_at: null,
      })
      setSuccess('Schedule cancelled. Newsletter reverted to draft.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel')
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/50 animate-fade-in" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Accent bar */}
          <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #00316B, #8FBAFF, #FFD400)' }} />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-heading text-lg font-bold text-gray-900">Send Newsletter</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Donor count */}
            <div className="bg-csf-blue/[0.03] rounded-xl p-4">
              <p className="font-heading text-sm font-semibold text-gray-900">
                {activeDonors.length} active {activeDonors.length === 1 ? 'donor' : 'donors'}
              </p>
              <p className="font-body text-xs text-gray-500 mt-0.5">
                {subject ? `Subject: "${subject}"` : 'No subject line set'}
              </p>
            </div>

            {error && (
              <p className="font-body text-sm text-csf-orange bg-csf-orange/5 px-4 py-2 rounded-xl">{error}</p>
            )}
            {success && (
              <p className="font-body text-sm text-csf-blue bg-csf-blue/5 px-4 py-2 rounded-xl">{success}</p>
            )}

            {!success && (
              <>
                {/* Send Now */}
                <button
                  onClick={handleSendNow}
                  disabled={sending || scheduling}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-csf-blue text-white rounded-xl font-heading text-sm font-semibold hover:bg-csf-blue/90 disabled:opacity-50 transition-colors"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                  {sending ? 'Sending...' : 'Send Now'}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="font-heading text-xs text-gray-400 uppercase">or schedule</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* Schedule */}
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30"
                  />
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="w-28 px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30"
                  />
                </div>
                <button
                  onClick={handleSchedule}
                  disabled={sending || scheduling || !scheduleDate}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl font-heading text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <ClockIcon className="w-4 h-4" />
                  {scheduling ? 'Scheduling...' : 'Schedule'}
                </button>
              </>
            )}

            {success && (
              <button
                onClick={onClose}
                className="w-full py-3 bg-csf-blue text-white rounded-xl font-heading text-sm font-semibold hover:bg-csf-blue/90 transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
