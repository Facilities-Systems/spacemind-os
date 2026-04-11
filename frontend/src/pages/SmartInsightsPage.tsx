import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import {
  Activity,
  BarChart3,
  Brain,
  Download,
  Leaf,
  Radio,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { Header } from '../components/layout/Header'

// ─── Data ────────────────────────────────────────────────────────────────────
const STRATEGIC_KPIS = [
  { label: 'Inventory Health Score', value: '85.2%', trend: '↑', good: true },
  { label: 'AI Recommendations',     value: '19 Active', trend: '→', good: true },
  { label: 'Cost Optimisation',      value: 'R 125k',    trend: '↑', good: true },
  { label: 'Data Quality Score',     value: '95.2%',     trend: '↑', good: true },
]

const HUMAN_CENTERED = [
  { emoji: '🌱', label: 'Grounds & Plants',   score: '92%',   detail: '4 gardens maintained · Watering schedule on track' },
  { emoji: '🧼', label: 'Building Hygiene',   score: '98%',   detail: '12 zones cleaned · 0 complaints today' },
  { emoji: '🍽️', label: 'Food Services',     score: '4.6/5', detail: '342 meals served · Special: Chicken Curry' },
  { emoji: '🩺', label: 'Health & Wellness',  score: '4m 12s',detail: 'Avg nurse response time · 0 open incidents' },
  { emoji: '🛡️', label: 'Security & Safety', score: '100%',  detail: 'All access points secured · 0 alerts' },
  { emoji: '♻️', label: 'Environmental Care', score: '91%',   detail: 'Recycling rate · Energy within target' },
]

const SENSOR_OVERVIEW = [
  { label: 'Temperature',  sensors: '12/12', avg: '22.5°C',  status: 'green', icon: '🌡️' },
  { label: 'Humidity',     sensors: '8/8',   avg: '45%',     status: 'green', icon: '💧' },
  { label: 'Occupancy',    sensors: '15/15', avg: '72%',     status: 'amber', icon: '👥' },
  { label: 'Air Quality',  sensors: '10/10', avg: 'CO₂ 450ppm', status: 'green', icon: '🌬️' },
  { label: 'Noise Level',  sensors: '6/6',   avg: '65dB',    status: 'green', icon: '🔊' },
  { label: 'Security',     sensors: '25/25', avg: 'All Secure', status: 'green', icon: '📷' },
]

const ZONES = [
  { name: 'Main Office Floor',  temp: '22.3°C', humidity: '44%', co2: '445ppm', noise: '63dB', occupancy: '78%' },
  { name: 'Operations Hub',     temp: '23.1°C', humidity: '47%', co2: '461ppm', noise: '71dB', occupancy: '65%' },
  { name: 'Breakout & Canteen', temp: '21.8°C', humidity: '42%', co2: '430ppm', noise: '74dB', occupancy: '55%' },
]

const ML_MODELS = [
  { name: 'Random Forest Ensemble', accuracy: 94.2, trained: '2026-04-09', predictions: 1847 },
  { name: 'Neural Network (LSTM)',  accuracy: 91.2, trained: '2026-04-08', predictions: 923 },
  { name: 'Time Series Analysis',   accuracy: 88.7, trained: '2026-04-10', predictions: 614 },
]

const PREDICTIONS = [
  { equipment: 'HVAC Unit — 5th Floor',   risk: 'HIGH',   prob: 78, failure: '2026-04-28', component: 'Compressor', rec: 'Schedule preventative maintenance immediately. Check refrigerant levels and compressor wear.' },
  { equipment: 'Generator Set B',          risk: 'MEDIUM', prob: 42, failure: '2026-05-15', component: 'Fuel Injector', rec: 'Inspect fuel injectors at next service. Monitor fuel consumption trend closely.' },
  { equipment: 'Elevator Motor — Block A', risk: 'LOW',    prob: 18, failure: '2026-06-30', component: 'Drive Belt', rec: 'Monitor during quarterly maintenance. No immediate action required.' },
]

const ENV_METRICS = [
  { label: 'Energy Consumption', current: '42,300 kWh', target: '40,000 kWh', change: '-8%', good: true },
  { label: 'Water Usage',        current: '1,840 m³',   target: '1,750 m³',   change: '-5%', good: true },
  { label: 'Waste Recycling',    current: '68%',        target: '75%',        change: '+6%', good: true },
  { label: 'Carbon Footprint',   current: '12.4 tCO₂e', target: '10.0 tCO₂e', change: '-3%', good: true },
]

const SUSTAINABILITY_GOALS = [
  { label: 'Carbon Neutrality',   progress: 42, target: 'Zero net carbon by 2030', color: '#10b981' },
  { label: 'Renewable Energy',    progress: 15, target: '100% renewable by 2030',  color: '#6366f1' },
  { label: 'Waste Diversion',     progress: 68, target: '90% waste diversion',     color: '#a855f7' },
  { label: 'Water Conservation',  progress: 34, target: '50% reduction by 2030',   color: '#0ea5e9' },
]

const MONTHLY_TREND = [
  { month: 'Oct', energy: 48200, water: 2100, recycling: 62 },
  { month: 'Nov', energy: 46800, water: 2040, recycling: 63 },
  { month: 'Dec', energy: 44100, water: 1980, recycling: 65 },
  { month: 'Jan', energy: 45200, water: 1920, recycling: 65 },
  { month: 'Feb', energy: 43600, water: 1880, recycling: 67 },
  { month: 'Mar', energy: 42300, water: 1840, recycling: 68 },
]

const REPORTS = [
  { emoji: '📦', name: 'Inventory Report',     desc: 'Full stock levels, low-stock alerts & reorder recommendations', time: '~30s' },
  { emoji: '⚖️', name: 'Compliance Report',   desc: 'WO/REQ capture, tool return rates & OHS compliance status',   time: '~45s' },
  { emoji: '📊', name: 'KPI Dashboard Report', desc: 'Strategic KPIs, location performance & goal progress',        time: '~20s' },
  { emoji: '🌱', name: 'Sustainability Report',desc: 'Energy, water, waste & carbon footprint with ESG score',     time: '~60s' },
  { emoji: '🚨', name: 'Incident Report',      desc: 'Medical incidents, near-misses & corrective actions log',     time: '~25s' },
  { emoji: '📋', name: 'Executive Summary',    desc: 'High-level overview for senior management — 1-page format',   time: '~15s' },
]

const TABS = [
  { key: 'dashboard',   label: 'Dashboard',           icon: BarChart3 },
  { key: 'iot',         label: 'IoT Monitoring',       icon: Radio },
  { key: 'predictive',  label: 'Predictive Analytics', icon: Brain },
  { key: 'sustain',     label: 'Sustainability',        icon: Leaf },
  { key: 'reports',     label: 'Reports',               icon: Download },
]

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #6366f1',
  borderRadius: 8,
  color: '#fff',
  fontSize: 12,
}

const RISK_STYLE: Record<string, { bg: string; color: string }> = {
  HIGH:   { bg: 'rgba(239,68,68,0.2)',  color: '#f87171' },
  MEDIUM: { bg: 'rgba(245,158,11,0.2)', color: '#fcd34d' },
  LOW:    { bg: 'rgba(16,185,129,0.2)', color: '#6ee7b7' },
}

const SENSOR_DOT: Record<string, string> = {
  green: '#10b981',
  amber: '#f59e0b',
  red:   '#ef4444',
}

export function SmartInsightsPage() {
  const [tab, setTab] = useState('dashboard')
  const [generated, setGenerated] = useState<string | null>(null)

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Smart Insights"
        subtitle="Intelligence & Growth — IoT · AI Analytics · Sustainability"
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">

        {/* Tab bar */}
        <div className="flex flex-wrap gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: '#1e3a5f' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={tab === t.key
                ? { backgroundColor: '#6366f1', color: '#fff' }
                : { color: '#9ca3af' }
              }
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── DASHBOARD TAB ─────────────────────────────────────────────── */}
        {tab === 'dashboard' && (
          <div className="space-y-5">
            {/* Strategic KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {STRATEGIC_KPIS.map(k => (
                <div
                  key={k.label}
                  className="rounded-xl p-4 border-2"
                  style={{ backgroundColor: '#1e3a5f', borderColor: '#6366f1' }}
                >
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">{k.label}</p>
                  <p className="text-xl font-extrabold text-white">{k.value}</p>
                  <p className="text-xs mt-1" style={{ color: k.good ? '#6ee7b7' : '#f87171' }}>{k.trend} vs last month</p>
                </div>
              ))}
            </div>

            {/* Human-Centered Operations */}
            <div>
              <h2 className="text-white font-bold text-xs tracking-widest uppercase mb-3 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-indigo-400" />
                HUMAN-CENTERED OPERATIONS
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {HUMAN_CENTERED.map(op => (
                  <div
                    key={op.label}
                    className="rounded-xl p-4 border flex items-start gap-3"
                    style={{ backgroundColor: '#1e3a5f', borderColor: 'rgba(99,102,241,0.35)' }}
                  >
                    <span className="text-xl shrink-0">{op.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-semibold text-sm">{op.label}</p>
                        <span className="text-xs font-bold" style={{ color: '#a3e635' }}>{op.score}</span>
                      </div>
                      <p className="text-gray-500 text-xs">{op.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── IoT MONITORING TAB ────────────────────────────────────────── */}
        {tab === 'iot' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-xs tracking-widest uppercase flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-cyan-400" />
                SENSOR OVERVIEW
                <span className="flex items-center gap-1 text-green-400 text-xs font-normal normal-case">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse inline-block" />
                  Live
                </span>
              </h2>
              <button className="flex items-center gap-1.5 text-xs text-cyan-400 border border-cyan-700/50 px-3 py-1.5 rounded-lg hover:bg-cyan-900/30 transition-all">
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {SENSOR_OVERVIEW.map(s => (
                <div
                  key={s.label}
                  className="rounded-xl p-4 border-2 text-center"
                  style={{ backgroundColor: '#1e3a5f', borderColor: '#0ea5e9' }}
                >
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: SENSOR_DOT[s.status] }} />
                    <span className="text-xs text-gray-400">{s.sensors}</span>
                  </div>
                  <p className="text-white font-bold text-sm">{s.avg}</p>
                  <p className="text-gray-600 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Zone cards */}
            <div>
              <h2 className="text-white font-bold text-xs tracking-widest uppercase mb-3 flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-cyan-400" />
                LIVE ZONE READINGS
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ZONES.map(z => (
                  <div
                    key={z.name}
                    className="rounded-xl p-5 border-2"
                    style={{ backgroundColor: '#1e3a5f', borderLeft: '4px solid #0ea5e9', borderTop: '2px solid #0ea5e9', borderRight: '2px solid #0ea5e9', borderBottom: '2px solid #0ea5e9' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-white font-bold text-sm">{z.name}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(16,185,129,0.2)', color: '#6ee7b7' }}>ONLINE</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { label: 'Temperature', val: z.temp },
                        { label: 'Humidity', val: z.humidity },
                        { label: 'CO₂', val: z.co2 },
                        { label: 'Noise', val: z.noise },
                      ].map(m => (
                        <div key={m.label} className="flex flex-col">
                          <span className="text-gray-500">{m.label}</span>
                          <span className="text-white font-bold">{m.val}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-indigo-900/50">
                      <span className="text-gray-500 text-xs">Occupancy: </span>
                      <span className="text-white text-xs font-bold">{z.occupancy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PREDICTIVE ANALYTICS TAB ──────────────────────────────────── */}
        {tab === 'predictive' && (
          <div className="space-y-5">
            {/* ML Models */}
            <div>
              <h2 className="text-white font-bold text-xs tracking-widest uppercase mb-3 flex items-center gap-2">
                <Brain className="h-3.5 w-3.5 text-indigo-400" />
                ML MODEL PERFORMANCE
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ML_MODELS.map(m => (
                  <div
                    key={m.name}
                    className="rounded-xl p-5 border-2"
                    style={{ backgroundColor: '#1e3a5f', borderColor: '#6366f1' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-white font-bold text-sm leading-tight">{m.name}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(16,185,129,0.2)', color: '#6ee7b7' }}>ACTIVE</span>
                    </div>
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Accuracy</span>
                        <span className="font-bold text-white">{m.accuracy}%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${m.accuracy}%`, backgroundColor: '#6366f1' }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                      <span>Last trained: {m.trained}</span>
                      <span>{m.predictions.toLocaleString()} predictions</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment predictions */}
            <div>
              <h2 className="text-white font-bold text-xs tracking-widest uppercase mb-3 flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                EQUIPMENT FAILURE PREDICTIONS
              </h2>
              <div className="space-y-3">
                {PREDICTIONS.map(p => {
                  const rs = RISK_STYLE[p.risk]
                  return (
                    <div
                      key={p.equipment}
                      className="rounded-xl p-5 border-2"
                      style={{ backgroundColor: '#1e3a5f', borderColor: p.risk === 'HIGH' ? '#ef4444' : p.risk === 'MEDIUM' ? '#f59e0b' : '#10b981' }}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <p className="text-white font-bold text-sm">{p.equipment}</p>
                          <p className="text-gray-500 text-xs mt-0.5">Component at risk: <span className="text-gray-300">{p.component}</span></p>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: rs.bg, color: rs.color }}>
                          {p.risk} RISK
                        </span>
                      </div>
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">Failure probability</span>
                          <span className="font-bold" style={{ color: rs.color }}>{p.prob}%</span>
                        </div>
                        <div className="h-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                          <div className="h-2 rounded-full" style={{ width: `${p.prob}%`, backgroundColor: rs.color }} />
                        </div>
                      </div>
                      <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                        <span className="text-gray-400 font-semibold">Recommendation: </span>
                        <span className="text-gray-300">{p.rec}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">Predicted failure date: <span className="text-gray-400">{p.failure}</span></p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── SUSTAINABILITY TAB ────────────────────────────────────────── */}
        {tab === 'sustain' && (
          <div className="space-y-5">
            {/* Environmental metrics */}
            <div>
              <h2 className="text-white font-bold text-xs tracking-widest uppercase mb-3 flex items-center gap-2">
                <Leaf className="h-3.5 w-3.5 text-green-400" />
                ENVIRONMENTAL METRICS
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {ENV_METRICS.map(m => (
                  <div
                    key={m.label}
                    className="rounded-xl p-4 border-2"
                    style={{ backgroundColor: '#1e3a5f', borderColor: '#10b981' }}
                  >
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">{m.label}</p>
                    <p className="text-lg font-extrabold text-white">{m.current}</p>
                    <p className="text-xs text-gray-600 mt-0.5">Target: {m.target}</p>
                    <p className="text-xs mt-1 font-bold" style={{ color: m.good ? '#6ee7b7' : '#f87171' }}>{m.change} vs last month</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trend chart */}
            <div
              className="rounded-xl p-5 border-2"
              style={{ backgroundColor: '#1e3a5f', borderColor: '#10b981' }}
            >
              <h3 className="text-white font-bold text-xs tracking-widest uppercase mb-4">6-MONTH SUSTAINABILITY TREND (ENERGY kWh)</h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={MONTHLY_TREND} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toLocaleString()} kWh`, 'Energy']} />
                  <Line type="monotone" dataKey="energy" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 2030 Goals */}
            <div>
              <h2 className="text-white font-bold text-xs tracking-widest uppercase mb-3 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-green-400" />
                2030 SUSTAINABILITY GOALS
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SUSTAINABILITY_GOALS.map(g => (
                  <div
                    key={g.label}
                    className="rounded-xl p-5 border-2"
                    style={{ backgroundColor: '#1e3a5f', borderColor: '#10b981' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-white font-bold text-sm">{g.label}</p>
                      <span className="text-xl font-extrabold" style={{ color: g.color }}>{g.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-2 rounded-full" style={{ width: `${g.progress}%`, backgroundColor: g.color }} />
                    </div>
                    <p className="text-gray-500 text-xs">{g.target}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ESG Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="rounded-xl p-6 border-2 text-center flex flex-col items-center justify-center"
                style={{ backgroundColor: '#1e3a5f', borderColor: '#10b981' }}
              >
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Overall ESG Rating</p>
                <p className="text-5xl font-extrabold mb-2" style={{ color: '#6ee7b7' }}>A-</p>
                <p className="text-gray-400 text-sm">Industry Top 15%</p>
              </div>
              <div
                className="rounded-xl p-6 border-2"
                style={{ backgroundColor: '#1e3a5f', borderColor: '#10b981' }}
              >
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-4 font-bold">Individual ESG Scores</p>
                {[
                  { label: 'Environmental', score: 'A', num: 85, color: '#10b981' },
                  { label: 'Social',        score: 'B+', num: 78, color: '#0ea5e9' },
                  { label: 'Governance',    score: 'A-', num: 82, color: '#6366f1' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3 mb-3">
                    <span className="text-xs text-gray-400 w-28">{s.label}</span>
                    <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${s.num}%`, backgroundColor: s.color }} />
                    </div>
                    <span className="text-xs font-bold w-8 text-right" style={{ color: s.color }}>{s.score}</span>
                    <span className="text-xs text-gray-600 w-12 text-right">{s.num}/100</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── REPORTS TAB ───────────────────────────────────────────────── */}
        {tab === 'reports' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-white font-bold text-xs tracking-widest uppercase mb-4 flex items-center gap-2">
                <Download className="h-3.5 w-3.5 text-indigo-400" />
                GENERATE REPORTS
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {REPORTS.map(r => (
                  <div
                    key={r.name}
                    className="rounded-xl p-5 border-2 flex flex-col transition-all hover:-translate-y-0.5"
                    style={{ backgroundColor: '#1e3a5f', borderColor: '#6366f1' }}
                  >
                    <div className="text-3xl mb-3">{r.emoji}</div>
                    <h3 className="text-white font-bold text-sm mb-1">{r.name}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed flex-1">{r.desc}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-gray-600">Est. {r.time}</span>
                      <button
                        onClick={() => setGenerated(r.name)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                        style={generated === r.name
                          ? { backgroundColor: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.4)' }
                          : { backgroundColor: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)' }
                        }
                      >
                        {generated === r.name ? '✓ Generated' : 'Generate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent reports */}
            <div>
              <h2 className="text-white font-bold text-xs tracking-widest uppercase mb-3">RECENT REPORTS</h2>
              <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: '#6366f1' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(99,102,241,0.15)' }}>
                      {['Report Name', 'Generated', 'Size', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#a5b4fc' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Weekly KPI Dashboard', date: '2026-04-10', size: '1.2 MB' },
                      { name: 'Inventory Report — April', date: '2026-04-08', size: '0.8 MB' },
                      { name: 'OHS Compliance Audit Q1', date: '2026-04-01', size: '2.4 MB' },
                      { name: 'Monthly Sustainability', date: '2026-04-01', size: '1.7 MB' },
                    ].map((row, i) => (
                      <tr key={i} className="border-t" style={{ borderColor: 'rgba(99,102,241,0.15)', backgroundColor: i % 2 === 0 ? '#1e3a5f' : 'rgba(30,58,95,0.6)' }}>
                        <td className="px-4 py-3 text-white font-medium">{row.name}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{row.date}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{row.size}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>View</button>
                            <button className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#6ee7b7' }}>Download</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
