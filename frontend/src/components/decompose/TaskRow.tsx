import { memo, useState } from 'react'
import { AlertTriangle, ChevronDown, Clock, Lock } from 'lucide-react'
import { clsx } from 'clsx'
import { RiskBadge, ResponsibleBadge } from '../ui/Badge'
import type { PhaseStatus, TaskItem } from '../../types'
import { api } from '../../api/client'
import toast from 'react-hot-toast'

const STATUS_STYLES: Record<PhaseStatus, string> = {
  pending:     'bg-gray-700/40 text-gray-400 border-gray-600/30',
  in_progress: 'bg-brand-700/40 text-brand-300 border-brand-600/40',
  completed:   'bg-emerald-800/40 text-emerald-300 border-emerald-700/40',
  blocked:     'bg-red-900/40 text-red-300 border-red-800/40',
}

const STATUS_LABELS: Record<PhaseStatus, string> = {
  pending:     'Pending',
  in_progress: 'In Progress',
  completed:   'Completed',
  blocked:     'Blocked',
}

interface TaskRowProps {
  task: TaskItem
  index: number
  decompositionId?: string
  onStatusChange?: (taskId: string, status: PhaseStatus) => void
}

export const TaskRow = memo(function TaskRow({ task, index, decompositionId, onStatusChange }: TaskRowProps) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<PhaseStatus>(task.status)
  const [updating, setUpdating] = useState(false)

  const panelId = `task-panel-${task.id}`

  const handleStatusChange = async (newStatus: PhaseStatus) => {
    if (!decompositionId || newStatus === status) return
    setUpdating(true)
    try {
      await api.updateTaskStatus(decompositionId, task.id, newStatus)
      setStatus(newStatus)
      onStatusChange?.(task.id, newStatus)
      toast.success(`Task marked as ${STATUS_LABELS[newStatus]}`)
    } catch {
      toast.error('Failed to update task status')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="border border-surface-border rounded-lg overflow-hidden bg-surface">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface-muted/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset"
      >
        {/* Index */}
        <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-surface-muted border border-surface-border flex items-center justify-center text-xs text-gray-500 font-mono" aria-hidden="true">
          {index + 1}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={clsx('text-sm font-medium', status === 'completed' ? 'text-gray-500 line-through' : 'text-white')}>
              {task.name}
            </span>
            {task.landlord_approval_required && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-900/20 border border-amber-700/30 rounded px-1.5 py-0.5">
                <Lock className="h-2.5 w-2.5" aria-hidden="true" /> Landlord approval required
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <ResponsibleBadge party={task.responsible.party} />
            <RiskBadge level={task.risk_level} />
            {task.estimated_duration_hours && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" aria-hidden="true" />
                <span>{task.estimated_duration_hours}h</span>
              </span>
            )}
          </div>
        </div>

        {/* Status badge */}
        <span className={clsx('shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium', STATUS_STYLES[status])} aria-label={`Status: ${STATUS_LABELS[status]}`}>
          {STATUS_LABELS[status]}
        </span>

        <ChevronDown
          className={clsx('h-4 w-4 text-gray-500 shrink-0 mt-0.5 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div id={panelId} className="px-4 pb-4 pt-1 border-t border-surface-border space-y-3 animate-fade-in bg-surface-muted/20">
          {task.description && (
            <p className="text-sm text-gray-400">{task.description}</p>
          )}
          {task.responsible.notes && (
            <p className="text-xs text-gray-500 italic">{task.responsible.notes}</p>
          )}

          {/* Status selector */}
          {decompositionId && (
            <div>
              <p id={`status-label-${task.id}`} className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Update Status</p>
              <div role="group" aria-labelledby={`status-label-${task.id}`} className="flex flex-wrap gap-1.5">
                {(Object.keys(STATUS_LABELS) as PhaseStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={updating || s === status}
                    aria-pressed={s === status}
                    aria-label={`Set status to ${STATUS_LABELS[s]}`}
                    onClick={(e) => { e.stopPropagation(); handleStatusChange(s) }}
                    className={clsx(
                      'text-xs px-2.5 py-1 rounded-full border font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
                      s === status
                        ? STATUS_STYLES[s] + ' opacity-100'
                        : 'bg-surface border-surface-border text-gray-500 hover:text-white hover:border-brand-700/40',
                      updating && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {task.risks.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Risks</p>
              <ul className="space-y-1">
                {task.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-400/80">
                    <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" aria-hidden="true" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {task.dependencies.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Dependencies</p>
              <div className="flex flex-wrap gap-1">
                {task.dependencies.map(d => (
                  <code key={d} className="text-xs bg-surface border border-surface-border rounded px-1.5 py-0.5 text-gray-400 font-mono">{d}</code>
                ))}
              </div>
            </div>
          )}
          {task.notes && (
            <p className="text-xs text-brand-300/70 bg-brand-900/20 border border-brand-800/30 rounded-lg px-3 py-2">
              {task.notes}
            </p>
          )}
        </div>
      )}
    </div>
  )
})
