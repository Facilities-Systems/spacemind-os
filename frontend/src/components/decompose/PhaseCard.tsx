import { memo, useState } from 'react'
import { ChevronDown, Clock, ListChecks } from 'lucide-react'
import { clsx } from 'clsx'
import { TaskRow } from './TaskRow'
import type { Phase } from '../../types'

interface PhaseCardProps {
  phase: Phase
  defaultOpen?: boolean
  decompositionId?: string
}

export const PhaseCard = memo(function PhaseCard({ phase, defaultOpen = true, decompositionId }: PhaseCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const totalHours = phase.tasks.reduce((sum, t) => sum + (t.estimated_duration_hours ?? 0), 0)
  const panelId = `phase-tasks-${phase.order}`

  return (
    <div className="border border-surface-border rounded-xl overflow-hidden animate-slide-up">
      {/* Phase header */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${phase.name} — ${open ? 'collapse' : 'expand'} tasks`}
        className="w-full flex items-center gap-4 px-5 py-4 bg-surface-card hover:bg-surface-muted/60 transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset"
      >
        <div className="h-8 w-8 rounded-lg bg-brand-600/20 border border-brand-700/40 flex items-center justify-center text-brand-300 font-bold text-sm shrink-0" aria-hidden="true">
          {phase.order}
        </div>

        <div className="flex-1">
          <p className="font-semibold text-white text-sm">{phase.name}</p>
          {phase.description && (
            <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{phase.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0" aria-hidden="true">
          <span className="flex items-center gap-1">
            <ListChecks className="h-3.5 w-3.5" />
            {phase.tasks.length} tasks
          </span>
          {totalHours > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {totalHours}h
            </span>
          )}
          <ChevronDown className={clsx('h-4 w-4 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {/* Tasks */}
      {open && (
        <div id={panelId} className="px-4 pb-4 pt-1 space-y-2 bg-surface animate-fade-in">
          {phase.tasks.map((task, i) => (
            <TaskRow key={task.id} task={task} index={i} decompositionId={decompositionId} />
          ))}
          {phase.tasks.length === 0 && (
            <p className="text-gray-600 text-sm text-center py-4">No tasks in this phase</p>
          )}
        </div>
      )}
    </div>
  )
})
