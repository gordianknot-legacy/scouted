import { useState } from 'react'
import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react'
import { XMarkIcon, DevicePhoneMobileIcon, ComputerDesktopIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'

interface NewsletterPreviewProps {
  html: string
  isOpen: boolean
  onClose: () => void
  onSendTest?: () => void
  isSendingTest?: boolean
}

export function NewsletterPreview({ html, isOpen, onClose, onSendTest, isSendingTest }: NewsletterPreviewProps) {
  const [width, setWidth] = useState<'desktop' | 'mobile'>('desktop')
  const [copied, setCopied] = useState(false)

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(html)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/40 animate-fade-in" />

      <div className="fixed inset-0 flex justify-end">
        <DialogPanel className="w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-slide-in-right">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-heading text-lg font-bold text-gray-900">Preview</h3>
            <div className="flex items-center gap-2">
              {/* Width toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setWidth('desktop')}
                  className={`p-1.5 rounded-md transition-colors ${width === 'desktop' ? 'bg-white shadow-sm text-csf-blue' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Desktop width"
                >
                  <ComputerDesktopIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setWidth('mobile')}
                  className={`p-1.5 rounded-md transition-colors ${width === 'mobile' ? 'bg-white shadow-sm text-csf-blue' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Mobile width"
                >
                  <DevicePhoneMobileIcon className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleCopyHtml}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-heading text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <ClipboardDocumentIcon className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy HTML'}
              </button>
              {onSendTest && (
                <button
                  onClick={onSendTest}
                  disabled={isSendingTest}
                  className="px-3 py-1.5 rounded-lg font-heading text-xs font-medium bg-csf-blue text-white hover:bg-csf-blue/90 disabled:opacity-50 transition-colors"
                >
                  {isSendingTest ? 'Sending...' : 'Send Test'}
                </button>
              )}
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Preview iframe */}
          <div className="flex-1 overflow-y-auto bg-gray-100 p-6 flex justify-center">
            <div
              className="transition-all duration-300"
              style={{ width: width === 'desktop' ? '600px' : '320px' }}
            >
              <iframe
                srcDoc={html}
                title="Newsletter preview"
                className="w-full bg-white rounded-lg shadow-lg border border-gray-200"
                style={{ height: '800px' }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
