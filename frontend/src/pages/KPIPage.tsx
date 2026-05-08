import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Activity, AlertTriangle, CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react'
import { Header } from '../components/layout/Header'

const STRATEGIC_KPIS = [
  {
    label: 'Inventory Health Score',
    value: '85.2%',
    desc: 'Stock levels, expiry compliance & reorder adherence',
    trend: '+2.1%',
    up: true,
    progress: 85,
    color: '#10b981',
  },
  {
    label: 'Facilities Efficiency',
    value: '97.3%',
    desc: 'On-time task completion across all operation types',
    trend: '+0.8%',
    up: true,
    progress: 97,
    color: '#6366f1',
  },
  {
    label: 'Cost Savings YTD',
    value: 'R 125,400',
    desc: 'Savings vs. baseline through AI-optimised planning',
    trend: '+R 12k this month',
    up: true,
    progress: 68,
    color: '#f59e0b',
  },
  {
    label: 'Compliance Rate',
    value: '91.7%',
    desc: 'WO/REQ captured, OHS adherence & tool return rate',
    trend: '-1.2%',
    up: false,
    progress: 92,
    color: '#0ea5e9',
  },
]

const LOCATION_PERF = [
  { name: 'FP1 HQ', efficiency: 97.3, color: '#10b981' },
  { name: 'FP2 Office', efficiency: 94.1, color: '#6366f1' },
  { name: 'London UK', efficiency: 98.8, color: '#0ea5e9' },
  { name: 'Nairobi KE', efficiency: 89.4, color: '#f59e0b' },
  { name: 'Lagos NG', efficiency: 91.2, color: '#ec4899' },
]

const OP_COMPLETION = [
  { name: 'Office Move', rate: 100, color: '#6366f1' },
  { name: 'Fit-Out',     rate: 87,  color: '#8b5cf6' },
  { name: 'Renovation',  rate: 92,  color: '#ec4899' },
  { name: 'Canteen',     rate: 95,  color: '#f59e0b' },
  { name: 'Maintenance', rate: 99,  color: '#10b981' },
  { name: 'Space Chg',   rate: 88,  color: '#06b6d4' },
  { name: 'Vendor',      rate: 83,  color: '#f97316' },
]

const COMPLIANCE = [
  { metric: 'WO/REQ Capture Rate',     current: '88%',   target: '95%', status: 'warning' },
  { metric: 'Tool Return Rate',         current: '94.5%', target: '98%', status: 'warning' },
  { metric: 'Asset Visibility',         current: '96.2%', target: '98%', status: 'good' },
  { metric: 'OHS Incident Response',   current: '100%',  target: '100%', status: 'good' },
  { metric: 'Maintenance SLA (24h)',   current: '91.3%', target: '95%', status: 'warning' },
  { metric: 'First Aid Kit Restocked', current: '78%',   target: '100%', status: 'critical' },
]

const GOALS = [
  { label: 'Paperless Operations',     progress: 64, target: '100% digital by 2026', color: '#6366f1' },
  { label: 'Zero Tool Loss',           progress: 71, target: '0 unreturned items',   color: '#10b981' },
  { label: 'OHS Zero Incidents',       progress: 88, target: 'DIFR of 0 by Q4',     color: '#f59e0b' },
  { label: 'AI Plan Adoption',         progress: 52, target: '100% AI-planned ops',  color: '#0ea5e9' },
]

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #008080',
  borderRadius: 8,
  color: '#fff',
  fontSize: 12,
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  good:     <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />,
  warning:  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />,
  critical: <AlertTriangle className="h-3.5 w-3.5 text-red-400" />,
}

export function KPIPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Performance KPIs" subtitle="Intelligence & Growth — Strategic Metrics Dashboard" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">

        {/* Strategic KPI cards */}
        <div>
          <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-400" />
            STRATEGIC KPIs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STRATEGIC_KPIS.map(kpi => (
              <div
                key={kpi.label}
                className="rounded-xl p-5 border-2"
                style={{ backgroundColor: '#1e3a5f', borderColor: '#6366f1' }}
              >
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">{kpi.label}</p>
                <p className="text-2xl font-extrabold text-white mb-1">{kpi.value}</p>
                <div className="flex items-center gap-1.5 mb-3">
                  {kpi.up
                    ? <TrendingUp className="h-3 w-3 text-green-400" />
                    : <TrendingDown className="h-3 w-3 text-red-400" />
                  }
                  <span className="text-xs" style={{ color: kpi.up ? '#6ee7b7' : '#f87171' }}>{kpi.trend}</span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 rounded-full mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${kpi.progress}%`, backgroundColor: kpi.color }}
                  />
                </div>
                <p className="text-gray-600 text-xs leading-relaxed">{kpi.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* By-location */}
          <div
            className="rounded-xl p-5 border-2"
            style={{ backgroundColor: '#1e3a5f', borderColor: '#6366f1' }}
          >
            <h3 className="text-white font-bold text-xs tracking-widest uppercase mb-4">EFFICIENCY BY LOCATION</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={LOCATION_PERF} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[80, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [`${v}%`, 'Efficiency']}
                />
                <Bar dataKey="efficiency" radius={[4, 4, 0, 0]}>
                  {LOCATION_PERF.map(entry => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* By-operation-type */}
          <div
            className="rounded-xl p-5 border-2"
            style={{ backgroundColor: '#1e3a5f', borderColor: '#6366f1' }}
          >
            <h3 className="text-white font-bold text-xs tracking-widest uppercase mb-4">COMPLETION RATE BY OPERATION TYPE</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={OP_COMPLETION} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis domain={[75, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [`${v}%`, 'Completion']}
                />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {OP_COMPLETION.map(entry => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compliance metrics */}
        <div>
          <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-indigo-400" />
            COMPLIANCE METRICS
          </h2>
          <div className="overflow-x-auto rounded-xl border-2" style={{ borderColor: '#6366f1' }}>
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr style={{ backgroundColor: 'rgba(99,102,241,0.15)' }}>
                  {['Metric', 'Current', 'Target', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#a5b4fc' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPLIANCE.map((row, i) => (
                  <tr
                    key={i}
                    className="border-t"
                    style={{ borderColor: 'rgba(99,102,241,0.15)', backgroundColor: i % 2 === 0 ? '#1e3a5f' : 'rgba(30,58,95,0.6)' }}
                  >
                    <td className="px-4 py-3 text-white font-medium">{row.metric}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: row.status === 'good' ? '#6ee7b7' : row.status === 'warning' ? '#fcd34d' : '#f87171' }}>
                      {row.current}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{row.target}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 w-fit">{STATUS_ICON[row.status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Goals tracker */}
        <div>
          <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            2026 STRATEGIC GOALS
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GOALS.map(g => (
              <div
                key={g.label}
                className="rounded-xl p-5 border-2"
                style={{ backgroundColor: '#1e3a5f', borderColor: '#6366f1' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white font-bold text-sm">{g.label}</p>
                  <span className="text-xl font-extrabold" style={{ color: g.color }}>{g.progress}%</span>
                </div>
                <div className="h-2 rounded-full mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${g.progress}%`, backgroundColor: g.color }}
                  />
                </div>
                <p className="text-gray-500 text-xs">{g.target}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
