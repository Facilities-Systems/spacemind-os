import { useState } from 'react'
import { AlertTriangle, ChevronDown, Clock, Lock } from 'lucide-react'
import { clsx } from 'clsx'
import { RiskBadge, ResponsibleBadge } from '../ui/Badge'
import type { TaskItem } from '../../types'

export function TaskRow({ task, index }: { task: TaskItem; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-surface-border rounded-lg overflow-hidden bg-surface">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface-muted/40 transition-all"
      >
        {/* Index */}
        <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-surface-muted border border-surface-border flex items-center justify-center text-xs text-gray-500 font-mono">
          {index + 1}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white">{task.name}</span>
            {task.landlord_approval_required && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-900/20 border border-amber-700/30 rounded px-1.5 py-0.5">
                <Lock className="h-2.5 w-2.5" /> Landlord Approval
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <ResponsibleBadge party={task.responsible.party} />
            <RiskBadge level={task.risk_level} />
            {task.estimated_duration_hours && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {task.estimated_duration_hours}h
              </span>
            )}
          </div>
        </div>

        <ChevronDown className={clsx('h-4 w-4 text-gray-500 shrink-0 mt-0.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-surface-border space-y-3 animate-fade-in bg-surface-muted/20">
          {task.description && (
            <p className="text-sm text-gray-400">{task.description}</p>
          )}
          {task.responsible.notes && (
            <p className="text-xs text-gray-500 italic">{task.responsible.notes}</p>
          )}
          {task.risks.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Risks</p>
              <ul className="space-y-1">
                {task.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-400/80">
                    <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
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
}
