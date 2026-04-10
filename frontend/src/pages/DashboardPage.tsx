import { format } from 'date-fns'
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Building2,
  ClipboardList,
  TrendingUp,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useHistory, useLocations } from '../hooks/useDecompose'
import { Header } from '../components/layout/Header'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { PriorityBadge, RequestTypeBadge, TenureBadge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: history, isLoading: histLoading } = useHistory(5)
  const { data: locations = [] } = useLocations()

  const stats = [
    {
      label: 'Total Plans Generated',
      value: history?.total ?? '—',
      icon: ClipboardList,
      color: 'text-brand-400',
    },
    {
      label: 'Active Locations',
      value: locations.length,
      icon: Building2,
      color: 'text-emerald-400',
    },
    {
      label: 'AI Engine',
      value: 'Claude Sonnet',
      icon: BrainCircuit,
      color: 'text-purple-400',
    },
    {
      label: 'System Status',
      value: 'Operational',
      icon: Activity,
      color: 'text-emerald-400',
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Dashboard"
        subtitle="Facilities Operations Intelligence — real-time overview"
      />

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <Card key={s.label} className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-surface-muted flex items-center justify-center shrink-0">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-lg font-bold text-white">{s.value}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Plans</CardTitle>
              <button
                onClick={() => navigate('/history')}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-all"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </CardHeader>

            {histLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : history?.items.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No plans yet</p>
                <button
                  onClick={() => navigate('/decompose')}
                  className="mt-3 text-brand-400 hover:text-brand-300 text-xs transition-all"
                >
                  Generate your first plan →
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {history?.items.map(item => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/history/${item.id}`)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-muted cursor-pointer transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <RequestTypeBadge type={item.request_type as any} />
                        <PriorityBadge priority={item.priority} />
                      </div>
                      <p className="text-sm text-gray-300 truncate">{item.request_summary}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {format(new Date(item.created_at), 'dd MMM, HH:mm')} · {item.total_tasks} tasks
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-600 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Locations */}
          <Card>
            <CardHeader>
              <CardTitle>Office Locations</CardTitle>
              <button
                onClick={() => navigate('/locations')}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-all"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </CardHeader>
            <div className="space-y-2.5">
              {locations.slice(0, 5).map(loc => (
                <div key={loc.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-muted/30">
                  <div>
                    <p className="text-sm text-white font-medium">{loc.id}</p>
                    <p className="text-xs text-gray-500">{loc.country}</p>
                  </div>
                  <TenureBadge tenure={loc.tenure} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-brand-950/80 to-surface-card border-brand-800/50 flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">Ready to plan your next operation?</p>
            <p className="text-sm text-gray-400 mt-0.5">
              Turn any facilities request into a fully sequenced, responsibility-aware execution plan in seconds.
            </p>
          </div>
          <button
            onClick={() => navigate('/decompose')}
            className="shrink-0 ml-6 flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all"
          >
            <BrainCircuit className="h-4 w-4" />
            New Request
          </button>
        </Card>
      </div>
    </div>
  )
}
