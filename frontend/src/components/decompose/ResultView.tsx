import { useState } from 'react'
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Copy,
  Download,
  Globe,
  Lock,
  Lightbulb,
  ListChecks,
  Loader2,
} from 'lucide-react'
import { PhaseCard } from './PhaseCard'
import { GanttChart } from './GanttChart'
import { PriorityBadge, RequestTypeBadge, TenureBadge } from '../ui/Badge'
import { Card } from '../ui/Card'
import type { DecompositionResult } from '../../types'
import { api } from '../../api/client'
import toast from 'react-hot-toast'

interface ResultViewProps {
  result: DecompositionResult
  decompositionId?: string
}

type Tab = 'plan' | 'timeline'

export function ResultView({ result, decompositionId }: ResultViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('plan')
  const [exportLoading, setExportLoading] = useState<string | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    toast.success('Copied to clipboard')
  }

  const handleExport = async (format: 'pdf' | 'json' | 'markdown' | 'excel') => {
    setShowExportMenu(false)
    setExportLoading(format)
    try {
      await api.exportDecomposition(result.id, format)
      toast.success(`Exported as ${format === 'markdown' ? 'Markdown' : format.toUpperCase()}`)
    } catch {
      toast.error('Export failed — please try again')
    } finally {
      setExportLoading(null)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Summary header */}
      <Card className="border-brand-800/50 bg-brand-950/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <RequestTypeBadge type={result.request_type} />
              <PriorityBadge priority={result.priority} />
              <TenureBadge tenure={result.location_context.tenure} />
            </div>
            <p className="text-white font-medium">{result.request_summary}</p>
            <p className="text-gray-500 text-xs mt-1.5 line-clamp-2 italic">"{result.original_request}"</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={copyJSON}
              className="h-8 w-8 rounded-lg border border-surface-border flex items-center justify-center text-gray-400 hover:text-white hover:border-brand-700/60 transition-all"
              title="Copy JSON"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            {/* Export dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu((v) => !v)}
                className="h-8 px-2.5 rounded-lg border border-surface-border flex items-center gap-1.5 text-gray-400 hover:text-white hover:border-brand-700/60 transition-all text-xs font-medium"
                title="Export plan"
              >
                {exportLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Export
                <ChevronDown className="h-3 w-3" />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-9 z-10 bg-surface-card border border-surface-border rounded-lg shadow-xl py-1 min-w-[120px]">
                  {(['pdf', 'excel', 'json', 'markdown'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => handleExport(fmt)}
                      className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-surface-muted hover:text-white transition-colors"
                    >
                      {fmt === 'markdown' ? 'Markdown' : fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <Stat icon={ListChecks} label="Phases" value={result.phases.length} />
          <Stat icon={ClipboardList} label="Total Tasks" value={result.total_tasks} />
          <Stat
            icon={Calendar}
            label="Est. Duration"
            value={result.total_estimated_duration_days ? `${result.total_estimated_duration_days}d` : '—'}
          />
          <Stat
            icon={Globe}
            label="Location"
            value={result.location_context.country}
          />
        </div>
      </Card>

      {/* Location context */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InfoCard
          icon={Building2}
          title="Building Tenure"
          value={result.location_context.tenure.toUpperCase()}
          sub={result.location_context.notes}
        />
        <InfoCard
          icon={Lock}
          title="Landlord Approval"
          value={result.location_context.landlord_approval_required ? 'Required' : 'Not Required'}
          variant={result.location_context.landlord_approval_required ? 'warning' : 'success'}
        />
        <InfoCard
          icon={Globe}
          title="Country"
          value={result.location_context.country}
          sub={result.location_context.location_id}
        />
      </div>

      {/* Tab bar */}
      <div className="flex rounded-xl bg-surface-muted/40 p-1 border border-surface-border w-fit">
        {([['plan', 'Execution Plan', ListChecks], ['timeline', 'Timeline', Calendar]] as const).map(
          ([tab, label, Icon]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ),
        )}
      </div>

      {/* Phases — Execution Plan tab */}
      {activeTab === 'plan' && (
        <div className="space-y-3">
          {result.phases
            .sort((a, b) => a.order - b.order)
            .map((phase, i) => (
              <PhaseCard
                key={phase.name + i}
                phase={phase}
                defaultOpen={i === 0}
                decompositionId={decompositionId}
              />
            ))}
        </div>
      )}

      {/* Timeline — Gantt tab */}
      {activeTab === 'timeline' && (
        <Card>
          <GanttChart result={result} />
        </Card>
      )}

      {/* Risks */}
      {result.key_risks.length > 0 && (
        <Section icon={AlertTriangle} title="Key Risks" iconClass="text-amber-400">
          <ul className="space-y-2">
            {result.key_risks.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <Section icon={Lightbulb} title="Expert Recommendations" iconClass="text-brand-400">
          <ul className="space-y-2">
            {result.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Landlord items */}
      {result.landlord_items.length > 0 && (
        <Section icon={Lock} title="Landlord Sign-Off Required" iconClass="text-amber-400">
          <ul className="space-y-2">
            {result.landlord_items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                <Lock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Compliance notes */}
      {result.compliance_notes.length > 0 && (
        <Section icon={Globe} title="Compliance Notes" iconClass="text-sky-400">
          <ul className="space-y-2">
            {result.compliance_notes.map((note, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                <Globe className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                {note}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="bg-surface-muted/40 rounded-lg px-3 py-2.5 flex items-center gap-2.5">
      <Icon className="h-4 w-4 text-brand-400 shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  title,
  value,
  sub,
  variant = 'default',
}: {
  icon: React.ElementType
  title: string
  value: string
  sub?: string | null
  variant?: 'default' | 'warning' | 'success'
}) {
  const colors = {
    default: 'text-brand-400',
    warning: 'text-amber-400',
    success: 'text-emerald-400',
  }
  return (
    <Card className="flex items-start gap-3">
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${colors[variant]}`} />
      <div>
        <p className="text-xs text-gray-500">{title}</p>
        <p className={`text-sm font-semibold ${colors[variant]}`}>{value}</p>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </Card>
  )
}

function Section({
  icon: Icon,
  title,
  iconClass,
  children,
}: {
  icon: React.ElementType
  title: string
  iconClass: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${iconClass}`} />
        {title}
      </h3>
      {children}
    </Card>
  )
}
