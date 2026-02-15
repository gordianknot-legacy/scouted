import { useState } from 'react'
import { BellAlertIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export function EmailSubscribe() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Something went wrong')
      }

      setStatus('success')
      setEmail('')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
        <CheckCircleIcon className="w-10 h-10 text-green-500 mx-auto mb-2" />
        <h3 className="font-heading font-bold text-base text-gray-900">Subscribed!</h3>
        <p className="font-body text-xs text-gray-500 mt-1">
          Check your inbox for a confirmation email.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-3 text-xs text-csf-blue hover:underline font-body"
        >
          Subscribe another email
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-csf-yellow/15 rounded-xl flex items-center justify-center">
          <BellAlertIcon className="w-4.5 h-4.5 text-csf-blue" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-sm text-gray-900">
            Daily Digest
          </h3>
          <p className="font-body text-[11px] text-gray-400">Top opportunities at 8:30 AM IST</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your.email@csf.org"
          required
          className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-csf-blue/15 focus:border-csf-blue/40 transition-all"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-4 py-2 bg-csf-yellow text-csf-blue text-sm font-heading font-bold rounded-xl hover:bg-csf-yellow/90 transition-all hover:shadow-md hover:shadow-csf-yellow/20 disabled:opacity-50 whitespace-nowrap"
        >
          {status === 'loading' ? '...' : 'Go'}
        </button>
      </form>

      {status === 'error' && (
        <p className="mt-2 text-xs text-red-600 font-body">{errorMsg}</p>
      )}
    </div>
  )
}
