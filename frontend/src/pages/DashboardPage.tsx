import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Building2,
  ClipboardList,
  Heart,
  LayoutTemplate,
  Package,
  Stethoscope,
  TrendingUp,
  Warehouse,
  Zap,
} from 'lucide-react'
import { useHistory, useLocations } from '../hooks/useDecompose'
import { api } from '../api/client'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: history } = useHistory(1)
  const { data: locations = [] } = useLocations()

  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: api.getAnalytics,
    staleTime: 60_000,
  })

  const stats = [
    {
      label: 'AI Plans Generated',
      value: (analytics?.total_decompositions as number) ?? history?.total ?? '—',
      icon: ClipboardList,
      color: 'text-teal-400',
    },
    {
      label: 'Active Locations',
      value: locations.length || 5,
      icon: Building2,
      color: 'text-teal-400',
    },
    {
      label: 'AI Specialist Agents',
      value: 5,
      icon: Zap,
      color: 'text-teal-400',
    },
    {
      label: 'System Status',
      value: 'Operational',
      icon: Activity,
      color: 'text-green-400',
    },
  ]

  const hubs = [
    {
      key: 'facilities',
      title: 'FACILITIES OPERATIONS',
      description: 'Storeroom, floor plans & asset management',
      primaryRoute: '/storeroom',
      icon: Warehouse,
      modules: [
        {
          icon: Package,
          label: 'Storeroom',
          desc: 'Inventory, sign-out register, CCTV cameras & requisitions',
          route: '/storeroom',
        },
        {
          icon: LayoutTemplate,
          label: 'Floor Plans',
          desc: 'Interactive building layouts, space stats & occupancy',
          route: '/floor-plans',
        },
        {
          icon: ClipboardList,
          label: 'Help Desk Tickets',
          desc: 'Service requests, faults & work orders from occupants',
          route: '/tickets',
        },
      ],
      btnLabel: 'Enter Facilities Ops',
    },
    {
      key: 'people',
      title: 'PEOPLE & WELLNESS',
      description: 'Health services & employee assistance',
      primaryRoute: '/medical',
      icon: Heart,
      modules: [
        {
          icon: Stethoscope,
          label: 'Medical Services',
          desc: 'Paramedic on duty, incident reports & first aid inventory',
          route: '/medical',
        },
        {
          icon: TrendingUp,
          label: 'Concierge Services',
          desc: 'Laundry, vehicle registration, pharmacy & employee errands',
          route: '/concierge',
        },
      ],
      btnLabel: 'Enter People Services',
    },
    {
      key: 'intelligence',
      title: 'INTELLIGENCE & GROWTH',
      description: 'KPIs, FM news, training & smart analytics',
      primaryRoute: '/smart-insights',
      icon: BarChart3,
      modules: [
        {
          icon: Activity,
          label: 'Performance KPIs',
          desc: 'Efficiency metrics, compliance rates & goal tracking',
          route: '/kpi',
        },
        {
          icon: BrainCircuit,
          label: 'News & Training',
          desc: 'Global FM industry news and available training courses',
          route: '/news-training',
        },
        {
          icon: Zap,
          label: 'Smart Insights',
          desc: 'IoT monitoring, predictive analytics & sustainability',
          route: '/smart-insights',
        },
      ],
      btnLabel: 'Enter Intelligence Hub',
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Dashboard"
        subtitle="SpaceMind OS — Facilities Intelligence Portal"
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">

        {/* ── Stats strip ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(s => (
            <Card key={s.label} className="flex items-center gap-3 py-3">
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(0,128,128,0.15)' }}
              >
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{s.label}</p>
                <p className="text-base font-bold text-white">{s.value}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Three navigation hub cards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {hubs.map(hub => (
            <div
              key={hub.key}
              className="rounded-2xl p-6 border-2 flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl"
              style={{
                backgroundColor: '#1e3a5f',
                borderColor: '#008080',
                boxShadow: '0 4px 20px rgba(0,128,128,0.1)',
              }}
            >
              {/* Card header */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'rgba(0,128,128,0.25)' }}
                >
                  <hub.icon className="h-6 w-6" style={{ color: '#2dd4bf' }} />
                </div>
                <div>
                  <h2 className="text-white font-bold text-sm tracking-widest">{hub.title}</h2>
                  <p className="text-xs mt-0.5" style={{ color: '#2dd4bf' }}>{hub.description}</p>
                </div>
              </div>

              {/* Sub-modules */}
              <div className="space-y-2 flex-1 mb-5">
                {hub.modules.map(mod => (
                  <div
                    key={mod.route}
                    onClick={() => navigate(mod.route)}
                    className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all group"
                    style={{ backgroundColor: 'rgba(0,128,128,0.12)' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(0,128,128,0.25)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(0,128,128,0.12)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <mod.icon className="h-4 w-4 shrink-0" style={{ color: '#a3e635' }} />
                      <div>
                        <p className="text-white text-sm font-semibold leading-tight">{mod.label}</p>
                        <p className="text-xs mt-0.5 text-gray-500 leading-tight">{mod.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: '#2dd4bf' }} />
                  </div>
                ))}
              </div>

              {/* Enter CTA */}
              <button
                onClick={() => navigate(hub.primaryRoute)}
                className="w-full py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: '#008080', color: '#fff' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0a9e9e' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#008080' }}
              >
                {hub.btnLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* ── AI Planning quick-action strip ────────────────────────────── */}
        <div
          className="rounded-2xl border-2 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ backgroundColor: '#0f172a', borderColor: 'rgba(99,102,241,0.4)' }}
        >
          <div>
            <p className="font-bold text-white flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-brand-400" />
              AI Facilities Planning
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Turn any facilities request into a fully sequenced, multi-phase execution plan — powered by Claude AI.
            </p>
          </div>
          <button
            onClick={() => navigate('/decompose')}
            className="shrink-0 flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
          >
            <BrainCircuit className="h-4 w-4" />
            Generate a Plan
          </button>
        </div>

      </div>
    </div>
  )
}
