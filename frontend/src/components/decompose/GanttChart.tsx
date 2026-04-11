import type { DecompositionResult, Phase } from '../../types'

const RISK_COLORS: Record<string, string> = {
  low:      'bg-emerald-600/70 border-emerald-500/50',
  medium:   'bg-amber-600/70 border-amber-500/50',
  high:     'bg-red-600/70 border-red-500/50',
  critical: 'bg-red-800/80 border-red-700/60',
}

interface GanttChartProps {
  result: DecompositionResult
}

export function GanttChart({ result }: GanttChartProps) {
  const phases = [...result.phases].sort((a, b) => a.order - b.order)

  // Total hours across all phases (for scale)
  const phaseHours = phases.map((p) =>
    p.tasks.reduce((s, t) => s + (t.estimated_duration_hours ?? 0), 0),
  )
  const totalHours = phaseHours.reduce((s, h) => s + h, 0) || 1

  // Cumulative offsets for sequential positioning
  const offsets: number[] = []
  let running = 0
  for (const h of phaseHours) {
    offsets.push(running)
    running += h
  }

  const daysLabel = result.total_estimated_duration_days
    ? `${result.total_estimated_duration_days} days`
    : `~${Math.ceil(totalHours / 8)} working days`

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Sequential execution timeline · Total estimate: <span className="text-white font-medium">{daysLabel}</span>
        </p>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <LegendDot color="bg-emerald-600" label="Low risk" />
          <LegendDot color="bg-amber-600" label="Medium risk" />
          <LegendDot color="bg-red-600" label="High risk" />
        </div>
      </div>

      {/* Timeline scale */}
      <div className="relative">
        <div className="flex justify-between text-xs text-gray-600 mb-1 px-px">
          <span>Start</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>End</span>
        </div>
        <div className="h-px bg-surface-border mb-4" />

        {/* Phase rows */}
        <div className="space-y-3">
          {phases.map((phase, idx) => {
            const phaseW = (phaseHours[idx] / totalHours) * 100
            const phaseX = (offsets[idx] / totalHours) * 100

            return (
              <PhaseRow
                key={phase.name}
                phase={phase}
                widthPct={phaseW}
                leftPct={phaseX}
                totalHours={totalHours}
                phaseHours={phaseHours[idx]}
              />
            )
          })}
        </div>

        {/* Today marker (start) */}
        <div
          className="absolute top-6 bottom-0 w-px bg-brand-500/60 pointer-events-none"
          style={{ left: '0%' }}
        >
          <span className="absolute -top-5 -translate-x-1/2 text-xs text-brand-400 whitespace-nowrap">Today</span>
        </div>
      </div>

      {/* Task detail table */}
      <div className="mt-6 border border-surface-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-surface-card text-gray-500 text-left">
              <th className="px-4 py-2.5 font-medium">Phase</th>
              <th className="px-4 py-2.5 font-medium">Task</th>
              <th className="px-4 py-2.5 font-medium">Owner</th>
              <th className="px-4 py-2.5 font-medium text-right">Hours</th>
              <th className="px-4 py-2.5 font-medium">Risk</th>
            </tr>
          </thead>
          <tbody>
            {phases.flatMap((phase, pi) =>
              phase.tasks.map((task, ti) => (
                <tr
                  key={task.id}
                  className={ti % 2 === 0 ? 'bg-surface' : 'bg-surface-muted/30'}
                >
                  {ti === 0 && (
                    <td
                      rowSpan={phase.tasks.length}
                      className="px-4 py-2 text-brand-300 font-medium border-r border-surface-border align-top"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="h-5 w-5 rounded bg-brand-600/20 border border-brand-700/40 flex items-center justify-center text-xs font-bold text-brand-300">
                          {phase.order}
                        </span>
                        <span className="line-clamp-2">{phase.name}</span>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-2 text-gray-300">{task.name}</td>
                  <td className="px-4 py-2 text-gray-500 capitalize">
                    {task.responsible.party.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-400">
                    {task.estimated_duration_hours ?? '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-white text-xs border ${RISK_COLORS[task.risk_level] ?? RISK_COLORS.low}`}>
                      {task.risk_level}
                    </span>
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PhaseRow({
  phase,
  widthPct,
  leftPct,
  totalHours,
  phaseHours,
}: {
  phase: Phase
  widthPct: number
  leftPct: number
  totalHours: number
  phaseHours: number
}) {
  const estDays = Math.ceil(phaseHours / 8)

  return (
    <div className="flex items-center gap-3">
      {/* Phase label */}
      <div className="w-36 shrink-0 text-right">
        <p className="text-xs text-white font-medium truncate">{phase.name}</p>
        <p className="text-xs text-gray-500">{phaseHours > 0 ? `${estDays}d est.` : 'TBD'}</p>
      </div>

      {/* Bar track */}
      <div className="flex-1 h-8 relative bg-surface-muted/30 rounded-lg border border-surface-border overflow-hidden">
        {/* Phase bar */}
        <div
          className="absolute top-0 h-full rounded-lg bg-brand-600/30 border border-brand-700/40 flex items-center px-2 overflow-hidden"
          style={{
            left: `${leftPct}%`,
            width: `${Math.max(widthPct, 4)}%`,
          }}
        >
          {/* Task micro-bars inside phase bar */}
          {phase.tasks.map((task) => {
            const taskW = ((task.estimated_duration_hours ?? 0) / (phaseHours || 1)) * 100
            return (
              <div
                key={task.id}
                title={`${task.name} (${task.estimated_duration_hours ?? 0}h)`}
                className={`h-4 rounded shrink-0 border mr-0.5 ${RISK_COLORS[task.risk_level] ?? RISK_COLORS.low}`}
                style={{ width: `${Math.max(taskW, 3)}%` }}
              />
            )
          })}
        </div>
      </div>

      {/* Task count */}
      <div className="w-12 shrink-0 text-xs text-gray-600 text-right">
        {phase.tasks.length}t
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  )
}
