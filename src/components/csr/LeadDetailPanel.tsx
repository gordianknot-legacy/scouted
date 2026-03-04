import { useState, useEffect, useCallback, useRef } from 'react'
import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { formatINR } from '../../lib/formatters'
import { PIPELINE_STAGES } from '../../types'
import type { CsrLead, PipelineStage } from '../../types'
import type { CompanySummary } from '../../lib/csr-utils'
import { useUpdateLead } from '../../hooks/useCsrLeads'

interface LeadDetailPanelProps {
  lead: CsrLead | null
  company: CompanySummary | null
  isOpen: boolean
  onClose: () => void
}

function TriStateToggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean | null
  onChange: (v: boolean | null) => void
}) {
  const next = () => {
    if (value === null) onChange(true)
    else if (value === true) onChange(false)
    else onChange(null)
  }

  return (
    <button
      onClick={next}
      className="flex items-center gap-2 group"
    >
      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
        value === null
          ? 'border-gray-300 text-gray-300'
          : value
            ? 'border-csf-lime bg-csf-lime text-csf-blue'
            : 'border-csf-orange bg-csf-orange text-white'
      }`}>
        {value === null ? '?' : value ? '\u2713' : '\u2717'}
      </span>
      <span className="font-heading text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
        {label}
      </span>
      <span className="font-body text-[11px] text-gray-400">
        {value === null ? 'Unknown' : value ? 'Connected' : 'Not Connected'}
      </span>
    </button>
  )
}

export function LeadDetailPanel({ lead, company, isOpen, onClose }: LeadDetailPanelProps) {
  const updateLead = useUpdateLead()

  const [connectionNotes, setConnectionNotes] = useState('')
  const [priorAssociation, setPriorAssociation] = useState('')
  const [notes, setNotes] = useState('')
  const [assignedTo, setAssignedTo] = useState('')

  // Sync local state when lead changes
  useEffect(() => {
    if (lead) {
      setConnectionNotes(lead.connection_notes || '')
      setPriorAssociation(lead.prior_association || '')
      setNotes(lead.notes || '')
      setAssignedTo(lead.assigned_to || '')
    }
  }, [lead?.id])

  // Debounced save for text fields
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const debouncedUpdate = useCallback((field: string, value: string) => {
    if (!lead) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateLead.mutate({ id: lead.id, [field]: value })
    }, 500)
  }, [lead, updateLead])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  if (!lead || !company) return null

  const handleStageChange = (stage: PipelineStage) => {
    updateLead.mutate({ id: lead.id, pipeline_stage: stage })
  }

  const handleConnectionToggle = (field: 'ishmeet_connected' | 'saurabh_connected', value: boolean | null) => {
    updateLead.mutate({ id: lead.id, [field]: value })
  }

  const topProjects = [
    ...company.eduProjects.slice(0, 3).map(p => ({ ...p, type: 'edu' as const })),
    ...company.vocProjects.slice(0, 2).map(p => ({ ...p, type: 'voc' as const })),
  ]

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/40 animate-fade-in" />

      <div className="fixed inset-0 flex justify-end">
        <DialogPanel className="w-full max-w-xl bg-white shadow-2xl flex flex-col animate-slide-in-right">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="min-w-0">
              <h3 className="font-heading text-lg font-bold text-gray-900 truncate">
                {lead.company}
              </h3>
              <p className="font-body text-xs text-gray-400 font-mono mt-0.5">{lead.cin}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors shrink-0"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* CSR Summary */}
            <section>
              <h4 className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                CSR Spending
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-csf-light-blue/10 rounded-xl px-3 py-2">
                  <p className="font-body text-[11px] text-gray-400 uppercase">Education</p>
                  <p className="font-heading text-sm font-bold text-csf-blue">{formatINR(company.eduSpend)}</p>
                </div>
                <div className="bg-csf-purple/5 rounded-xl px-3 py-2">
                  <p className="font-body text-[11px] text-gray-400 uppercase">Vocational</p>
                  <p className="font-heading text-sm font-bold text-csf-purple">{formatINR(company.vocSpend)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl px-3 py-2">
                  <p className="font-body text-[11px] text-gray-400 uppercase">Total CSR</p>
                  <p className="font-heading text-sm font-bold text-gray-700">{formatINR(company.totalSpend)}</p>
                </div>
              </div>
              {topProjects.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="font-body text-[11px] text-gray-400 uppercase">Top Projects</p>
                  {topProjects.map((p, i) => (
                    <div key={i} className="flex items-start justify-between gap-3">
                      <p className="font-body text-xs text-gray-600 min-w-0 truncate">{p.field}</p>
                      <p className={`font-heading text-xs font-semibold shrink-0 ${
                        p.type === 'edu' ? 'text-csf-blue' : 'text-csf-purple'
                      }`}>
                        {formatINR(p.spend)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Pipeline Stage */}
            <section>
              <h4 className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Pipeline Stage
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {PIPELINE_STAGES.map(s => (
                  <button
                    key={s.key}
                    onClick={() => handleStageChange(s.key)}
                    className={`px-2.5 py-1 rounded-lg font-heading text-xs font-medium transition-all ${
                      lead.pipeline_stage === s.key
                        ? s.colour + ' ring-2 ring-offset-1 ring-gray-300'
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Connection Status */}
            <section>
              <h4 className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Connection Status
              </h4>
              <div className="space-y-2.5">
                <TriStateToggle
                  label="Ishmeet Singh"
                  value={lead.ishmeet_connected}
                  onChange={(v) => handleConnectionToggle('ishmeet_connected', v)}
                />
                <TriStateToggle
                  label="Saurabh Chopra"
                  value={lead.saurabh_connected}
                  onChange={(v) => handleConnectionToggle('saurabh_connected', v)}
                />
              </div>
            </section>

            {/* Connection Notes */}
            <section>
              <h4 className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Connection Notes
              </h4>
              <textarea
                value={connectionNotes}
                onChange={e => {
                  setConnectionNotes(e.target.value)
                  debouncedUpdate('connection_notes', e.target.value)
                }}
                placeholder="LinkedIn connections, mutual contacts, warm intros..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30 resize-none"
              />
            </section>

            {/* Prior CSF Association */}
            <section>
              <h4 className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Prior CSF Association
              </h4>
              <textarea
                value={priorAssociation}
                onChange={e => {
                  setPriorAssociation(e.target.value)
                  debouncedUpdate('prior_association', e.target.value)
                }}
                placeholder="Previous donations, event participation, existing partnerships..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30 resize-none"
              />
            </section>

            {/* General Notes */}
            <section>
              <h4 className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Notes
              </h4>
              <textarea
                value={notes}
                onChange={e => {
                  setNotes(e.target.value)
                  debouncedUpdate('notes', e.target.value)
                }}
                placeholder="General notes about this lead..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30 resize-none"
              />
            </section>

            {/* Assigned To */}
            <section>
              <h4 className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Assigned To
              </h4>
              <input
                type="text"
                value={assignedTo}
                onChange={e => {
                  setAssignedTo(e.target.value)
                  debouncedUpdate('assigned_to', e.target.value)
                }}
                placeholder="Team member name..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 font-body text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-csf-blue/20 focus:border-csf-blue/30"
              />
            </section>

            {/* Generate Concept Note */}
            <section>
              <h4 className="font-heading text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Generate Concept Note
              </h4>
              <ConceptNoteButtons company={company} lead={lead} />
            </section>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

function ConceptNoteButtons({ company, lead }: { company: CompanySummary; lead: CsrLead }) {
  const [generating, setGenerating] = useState<string | null>(null)

  const handleGenerate = async (mode: 'template-pptx' | 'template-docx' | 'ai-pptx') => {
    setGenerating(mode)
    try {
      const data = {
        company: company.company,
        cin: company.cin,
        eduSpend: company.eduSpend,
        vocSpend: company.vocSpend,
        totalSpend: company.totalSpend,
        eduProjects: company.eduProjects,
        vocProjects: company.vocProjects,
        priorAssociation: lead.prior_association,
        notes: lead.notes,
      }

      if (mode === 'ai-pptx') {
        const { generateCsrConceptPptx } = await import('../../lib/docgen/csr-concept-generator')
        const { generateAiDraft } = await import('../../lib/docgen/ai-draft')
        const aiDraft = await generateAiDraft(data)
        await generateCsrConceptPptx(data, aiDraft)
      } else if (mode === 'template-pptx') {
        const { generateCsrConceptPptx } = await import('../../lib/docgen/csr-concept-generator')
        await generateCsrConceptPptx(data)
      } else {
        const { generateCsrConceptDocx } = await import('../../lib/docgen/csr-concept-generator')
        await generateCsrConceptDocx(data)
      }
    } catch (err) {
      console.error('Failed to generate concept note:', err)
    } finally {
      setGenerating(null)
    }
  }

  const hasAiKey = !!import.meta.env.VITE_OPENROUTER_API_KEY

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleGenerate('template-pptx')}
        disabled={!!generating}
        className="px-3 py-1.5 rounded-lg font-heading text-xs font-medium bg-csf-blue text-white hover:bg-csf-blue/90 disabled:opacity-50 transition-colors"
      >
        {generating === 'template-pptx' ? 'Generating...' : 'Template PPTX'}
      </button>
      <button
        onClick={() => handleGenerate('template-docx')}
        disabled={!!generating}
        className="px-3 py-1.5 rounded-lg font-heading text-xs font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {generating === 'template-docx' ? 'Generating...' : 'Template DOCX'}
      </button>
      {hasAiKey && (
        <button
          onClick={() => handleGenerate('ai-pptx')}
          disabled={!!generating}
          className="px-3 py-1.5 rounded-lg font-heading text-xs font-medium bg-csf-purple text-white hover:bg-csf-purple/90 disabled:opacity-50 transition-colors"
        >
          {generating === 'ai-pptx' ? 'Generating...' : 'AI Draft PPTX'}
        </button>
      )}
    </div>
  )
}
