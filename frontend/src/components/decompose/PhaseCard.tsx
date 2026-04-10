import { useState } from 'react'
import { ChevronDown, Clock, ListChecks } from 'lucide-react'
import { clsx } from 'clsx'
import { TaskRow } from './TaskRow'
import type { Phase } from '../../types'

interface PhaseCardProps {
  phase: Phase
  defaultOpen?: boolean
}

export function PhaseCard({ phase, defaultOpen = true }: PhaseCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const totalHours = phase.tasks.reduce((sum, t) => sum + (t.estimated_duration_hours ?? 0), 0)

  return (
    <div className="border border-surface-border rounded-xl overflow-hidden animate-slide-up">
      {/* Phase header */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 bg-surface-card hover:bg-surface-muted/60 transition-all text-left"
      >
        <div className="h-8 w-8 rounded-lg bg-brand-600/20 border border-brand-700/40 flex items-center justify-center text-brand-300 font-bold text-sm shrink-0">
          {phase.order}
        </div>

        <div className="flex-1">
          <p className="font-semibold text-white text-sm">{phase.name}</p>
          {phase.description && (
            <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{phase.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
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
        <div className="px-4 pb-4 pt-1 space-y-2 bg-surface animate-fade-in">
          {phase.tasks.map((task, i) => (
            <TaskRow key={task.id} task={task} index={i} />
          ))}
          {phase.tasks.length === 0 && (
            <p className="text-gray-600 text-sm text-center py-4">No tasks in this phase</p>
          )}
        </div>
      )}
    </div>
  )
}
