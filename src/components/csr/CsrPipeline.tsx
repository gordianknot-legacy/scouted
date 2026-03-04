import { useState, useMemo } from 'react'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useCsrLeads, useUpdateLead } from '../../hooks/useCsrLeads'
import { useCsrData } from '../../hooks/useCsrData'
import { aggregateByCin, type CompanySummary } from '../../lib/csr-utils'
import { formatINR } from '../../lib/formatters'
import { PIPELINE_STAGES } from '../../types'
import type { CsrLead, PipelineStage } from '../../types'
import { PipelineCard } from './PipelineCard'
import { LeadDetailPanel } from './LeadDetailPanel'

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`space-y-2 min-h-[60px] rounded-xl transition-colors ${isOver ? 'bg-csf-yellow/5' : ''}`}
    >
      {children}
    </div>
  )
}

function DraggableCard({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`touch-none ${isDragging ? 'opacity-30' : ''}`}
    >
      {children}
    </div>
  )
}

interface CsrPipelineProps {
  onBack: () => void
}

const VISIBLE_STAGES: PipelineStage[] = ['prospect', 'researching', 'outreach', 'proposal_sent', 'responded', 'won', 'lost']

export function CsrPipeline({ onBack }: CsrPipelineProps) {
  const [showPaused, setShowPaused] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const updateLead = useUpdateLead()

  const { data: leads = [], isLoading: leadsLoading } = useCsrLeads('2023-24')
  const { data: records = [], isLoading: recordsLoading } = useCsrData('2023-24')

  const companiesByCin = useMemo(() => {
    const companies = aggregateByCin(records)
    const map = new Map<string, CompanySummary>()
    for (const c of companies) map.set(c.cin, c)
    return map
  }, [records])

  const stages = showPaused ? [...VISIBLE_STAGES, 'paused' as PipelineStage] : VISIBLE_STAGES

  const leadsByStage = useMemo(() => {
    const map = new Map<PipelineStage, CsrLead[]>()
    for (const s of PIPELINE_STAGES) map.set(s.key, [])
    for (const l of leads) {
      const bucket = map.get(l.pipeline_stage) || []
      bucket.push(l)
      map.set(l.pipeline_stage, bucket)
    }
    return map
  }, [leads])

  // Stats
  const activeLeads = leads.filter(l => l.pipeline_stage !== 'paused' && l.pipeline_stage !== 'lost')
  const pipelineEduSpend = activeLeads.reduce((sum, l) => {
    const c = companiesByCin.get(l.cin)
    return sum + (c?.eduSpend || 0)
  }, 0)

  const selectedLead = leads.find(l => l.id === selectedLeadId) || null
  const selectedCompany = selectedLead ? companiesByCin.get(selectedLead.cin) || null : null

  const activeDragLead = activeDragId ? leads.find(l => l.id === activeDragId) : null
  const activeDragCompany = activeDragLead ? companiesByCin.get(activeDragLead.cin) || null : null

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null)
    const { active, over } = event
    if (!over) return

    const leadId = active.id as string
    const newStage = over.id as PipelineStage
    const lead = leads.find(l => l.id === leadId)
    if (!lead || lead.pipeline_stage === newStage) return

    updateLead.mutate({ id: leadId, pipeline_stage: newStage })
  }

  const isLoading = leadsLoading || recordsLoading

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-gray-200/60 transition-colors"
          aria-label="Back to CSR Data"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-heading text-xl font-bold text-gray-900">
            CSR Pipeline
          </h2>
          <p className="font-body text-xs text-gray-400 mt-0.5">
            Track outreach to CSR prospects
          </p>
        </div>
        <button
          onClick={() => setShowPaused(!showPaused)}
          className={`px-3 py-1.5 rounded-lg font-heading text-xs font-medium transition-all ${
            showPaused
              ? 'bg-gray-200 text-gray-700'
              : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
          }`}
        >
          {showPaused ? 'Hide Paused' : 'Show Paused'}
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-[3px] border-csf-purple/20 border-t-csf-purple rounded-full animate-spin mx-auto" />
          <p className="font-body text-sm text-gray-400 mt-4">Loading pipeline...</p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-transparent px-4 py-3">
              <p className="font-body text-xs text-gray-400 uppercase tracking-wider">Total Leads</p>
              <p className="font-heading text-xl font-bold text-csf-purple mt-0.5">{leads.length}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-csf-purple/15 px-4 py-3">
              <p className="font-body text-xs text-gray-400 uppercase tracking-wider">Education CSR in Pipeline</p>
              <p className="font-heading text-xl font-bold text-csf-blue mt-0.5">{formatINR(pipelineEduSpend)}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-transparent px-4 py-3">
              <p className="font-body text-xs text-gray-400 uppercase tracking-wider">Active Stages</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {VISIBLE_STAGES.slice(0, 4).map(s => {
                  const count = leadsByStage.get(s)?.length || 0
                  if (count === 0) return null
                  const info = PIPELINE_STAGES.find(ps => ps.key === s)
                  return (
                    <span key={s} className={`px-1.5 py-0.5 rounded text-[11px] font-heading font-semibold ${info?.colour || ''}`}>
                      {count}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Empty state */}
          {leads.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-csf-purple/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-csf-purple/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m-15 0A2.25 2.25 0 0 0 3 12v5.25A2.25 2.25 0 0 0 5.25 19.5h13.5A2.25 2.25 0 0 0 21 17.25V12a2.25 2.25 0 0 0-1.5-2.122" />
                </svg>
              </div>
              <p className="font-heading font-semibold text-gray-700">No leads in pipeline</p>
              <p className="font-body text-sm text-gray-400 mt-1">
                Go to CSR Data and click "Move to Pipeline" on a company to get started.
              </p>
            </div>
          )}

          {/* Kanban board */}
          {leads.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="overflow-x-auto -mx-4 px-4 pb-4">
                <div className="flex gap-4" style={{ minWidth: `${stages.length * 260}px` }}>
                  {stages.map(stageKey => {
                    const stageLeads = leadsByStage.get(stageKey) || []
                    const info = PIPELINE_STAGES.find(s => s.key === stageKey)!

                    return (
                      <div
                        key={stageKey}
                        className="flex-1 min-w-[240px]"
                      >
                        {/* Column header */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-heading font-semibold ${info.colour}`}>
                            {info.label}
                          </span>
                          <span className="font-heading text-xs text-gray-400">
                            {stageLeads.length}
                          </span>
                        </div>

                        {/* Cards */}
                        <DroppableColumn id={stageKey}>
                          {stageLeads.map(lead => {
                            const comp = companiesByCin.get(lead.cin)
                            if (!comp) return null

                            return (
                              <DraggableCard key={lead.id} id={lead.id}>
                                <PipelineCard
                                  company={comp}
                                  stage={lead.pipeline_stage}
                                  assignedTo={lead.assigned_to}
                                  onClick={() => setSelectedLeadId(lead.id)}
                                />
                              </DraggableCard>
                            )
                          })}
                          {stageLeads.length === 0 && (
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                              <p className="font-body text-xs text-gray-400">No leads</p>
                            </div>
                          )}
                        </DroppableColumn>
                      </div>
                    )
                  })}
                </div>
              </div>

              <DragOverlay>
                {activeDragLead && activeDragCompany && (
                  <div className="w-[240px]">
                    <PipelineCard
                      company={activeDragCompany}
                      stage={activeDragLead.pipeline_stage}
                      assignedTo={activeDragLead.assigned_to}
                      onClick={() => {}}
                    />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </>
      )}

      {/* Lead detail slide-over */}
      <LeadDetailPanel
        lead={selectedLead}
        company={selectedCompany}
        isOpen={selectedLeadId !== null}
        onClose={() => setSelectedLeadId(null)}
      />
    </div>
  )
}
