import { useState } from 'react'
import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react'
import {
  MagnifyingGlassIcon,
  ChartBarIcon,
  BellIcon,
} from '@heroicons/react/24/outline'

interface OnboardingModalProps {
  isOpen: boolean
  onComplete: () => void
}

const steps = [
  {
    icon: MagnifyingGlassIcon,
    title: 'Welcome to ScoutEd',
    description:
      'ScoutEd automatically scouts and aggregates funding and grant opportunities relevant to CSF\'s mission in Indian education. New opportunities are fetched daily at 8 AM IST.',
  },
  {
    icon: ChartBarIcon,
    title: 'How Scoring Works',
    description:
      'Each opportunity is scored 0\u2013100 based on sector match (FLN, EdTech, School Governance), geography (CSF priority states), funding size, and programme duration. Scores decay over time to keep the feed fresh.',
  },
  {
    icon: BellIcon,
    title: 'Stay Updated',
    description:
      'Subscribe to receive a daily digest of the top-scored opportunities at 8:30 AM IST. You can also bookmark opportunities and hide irrelevant ones to customise your feed.',
  },
]

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0)
  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <Dialog open={isOpen} onClose={() => {}} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/50 animate-fade-in" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
          {/* Top accent gradient */}
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #00316B, #8FBAFF, #FFD400)' }} />

          <div className="p-6 sm:p-8 text-center">
            {/* Icon */}
            <div className="w-14 h-14 bg-csf-blue/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <current.icon className="w-7 h-7 text-csf-blue" />
            </div>

            {/* Content */}
            <h2 className="font-heading text-xl font-bold text-gray-900 mb-3">
              {current.title}
            </h2>
            <p className="font-body text-sm text-gray-500 leading-relaxed">
              {current.description}
            </p>

            {/* Progress bar */}
            <div className="flex items-center gap-1.5 mt-6 justify-center">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === step ? 'w-6 bg-csf-blue' : i < step ? 'w-3 bg-csf-blue/30' : 'w-3 bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 mt-6">
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="px-5 py-2.5 text-sm font-heading font-medium text-gray-500 hover:text-gray-900 transition-colors rounded-xl hover:bg-gray-50"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => {
                  if (isLast) onComplete()
                  else setStep(s => s + 1)
                }}
                className="px-6 py-2.5 bg-csf-blue text-white text-sm font-heading font-bold rounded-xl hover:bg-csf-blue/90 transition-all hover:shadow-lg hover:shadow-csf-blue/20"
              >
                {isLast ? "Let's Go" : 'Next'}
              </button>
            </div>

            {!isLast && (
              <button
                onClick={onComplete}
                className="mt-3 text-xs text-gray-400 hover:text-gray-600 font-body transition-colors"
              >
                Skip tour
              </button>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
