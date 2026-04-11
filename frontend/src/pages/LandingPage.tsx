import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowRight, BrainCircuit } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ─── Static intelligence snapshot ────────────────────────────────────────────
const SNAPSHOT_DATA = [
  { name: 'Move',    score: 85 },
  { name: 'Fit-Out', score: 72 },
  { name: 'Reno',    score: 78 },
  { name: 'Canteen', score: 91 },
  { name: 'Maint',   score: 97 },
  { name: 'Space',   score: 88 },
  { name: 'Vendor',  score: 83 },
]

// ─── Strategic Facilities Intelligence features ────────────────────────────
const FEATURES = [
  {
    emoji: '🧠',
    title: 'Global FM Intelligence',
    desc: 'Plain-language requests converted to sequenced, multi-phase execution plans by AI',
  },
  {
    emoji: '📋',
    title: 'Stewardship Charter',
    desc: 'The Sifiso Methodology — Four Pillars of accountability & legacy leadership',
  },
  {
    emoji: '📊',
    title: 'KPI & Legacy Dashboard',
    desc: 'Real-time visibility across all operations, priorities, and locations',
  },
  {
    emoji: '🎓',
    title: 'Knowledge Templates',
    desc: '7 YAML templates built from FM expertise — phases, risks & compliance pre-loaded',
  },
  {
    emoji: '⚡',
    title: 'Deep Analysis Mode',
    desc: '5 specialist AI agents in parallel — 2× richer output for complex operations',
  },
  {
    emoji: '🌱',
    title: 'Sustainability & Compliance',
    desc: 'OHS Act, CDM 2015, NEMA, LAWMA — country rules auto-injected on every plan',
  },
]

export function LandingPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen font-sans text-white flex flex-col" style={{ backgroundColor: '#1e293b' }}>

      {/* ── Top nav bar ───────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-50 border-b"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#0d9488', backdropFilter: 'blur(8px)' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded flex items-center justify-center" style={{ backgroundColor: '#0d9488' }}>
              <BrainCircuit className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-xs tracking-widest uppercase">SpaceMind OS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/methodology"
              className="text-xs font-semibold transition-colors"
              style={{ color: '#5eead4' }}
            >
              Methodology
            </Link>
            <button
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded transition-all"
              style={{ backgroundColor: '#0d9488', color: '#fff' }}
            >
              {isAuthenticated ? 'Open Dashboard' : 'Get Started'}
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <header
        className="relative flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #003366 0%, #008080 100%)',
          minHeight: '140px',
        }}
      >
        <div className="text-center px-6 py-6">
          <h1 className="text-2xl font-extrabold text-white tracking-wide sm:text-3xl">
            SPACEMIND OS
          </h1>
          <h2 className="text-base font-semibold mt-1" style={{ color: '#5eead4' }}>
            FACILITIES INTELLIGENCE SYSTEM
          </h2>
          <p
            className="text-xs font-semibold italic mt-2 max-w-xl mx-auto sm:text-sm"
            style={{ color: '#a3e635' }}
          >
            "Stewardship in facility management ensures sustainable spaces, aligning resources with purpose."
          </p>
          <p className="mt-1 text-xs" style={{ color: '#99f6e4' }}>
            — Sifiso Cyprian Shezi, Facilities Intelligence Practitioner
          </p>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="flex-grow container mx-auto px-4 py-6 max-w-7xl">

        {/* ── Row 1: 3-column cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

          {/* Welcome card */}
          <section
            className="rounded-lg p-4 border-2 flex flex-col items-center text-center"
            style={{ backgroundColor: '#1e3a5f', borderColor: '#008080' }}
          >
            <h3 className="text-base font-semibold text-white mb-1">WELCOME, SIFISO</h3>
            <p className="text-sm font-medium mb-3" style={{ color: '#2dd4bf' }}>
              Facilities Steward | Systems Architect
            </p>
            <p className="text-white text-xs max-w-xs leading-relaxed">
              "Building the framework for operational excellence through disciplined
              asset management and AI-powered intelligence"
            </p>
            <div
              className="mt-4 h-14 w-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#0d9488', border: '2px solid #5eead4' }}
            >
              <BrainCircuit className="h-7 w-7 text-white" />
            </div>
          </section>

          {/* Today's Snapshot — bar chart */}
          <section
            className="rounded-lg p-4"
            style={{ backgroundColor: '#334155' }}
          >
            <h3 className="text-base font-semibold text-white mb-3">
              TODAY'S SNAPSHOT
            </h3>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SNAPSHOT_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" tick={{ fill: '#fff', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[60, 100]} tick={{ fill: '#fff', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #0d9488', borderRadius: 6, fontSize: 11 }}
                    labelStyle={{ color: '#5eead4' }}
                    itemStyle={{ color: '#a3e635' }}
                    formatter={(v: number) => [`${v}%`, 'AI Readiness']}
                  />
                  <Bar dataKey="score" fill="#008080" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Precision Management card */}
          <section
            className="rounded-lg p-4 text-center flex flex-col items-center justify-center"
            style={{ backgroundColor: '#0d9488' }}
          >
            <span className="text-3xl mb-2">💡</span>
            <p className="text-white text-sm font-bold">Precision Management</p>
            <p className="text-white text-sm">Excellence in Execution</p>
            <div className="mt-4 space-y-1.5 text-xs text-white/80">
              <p>System Uptime: <span className="font-bold text-white">99.97%</span></p>
              <p>AI Agents Active: <span className="font-bold text-white">5 Specialists</span></p>
              <p>Templates Loaded: <span className="font-bold text-white">7 Operation Types</span></p>
            </div>
          </section>
        </div>

        {/* ── Strategic Facilities Intelligence ─────────────────────────── */}
        <section className="mb-6">
          <h3 className="text-xl font-semibold text-center text-white mb-4 tracking-wide">
            STRATEGIC FACILITIES INTELLIGENCE
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {FEATURES.map(({ emoji, title, desc }) => (
              <div
                key={title}
                className="rounded-lg p-3 cursor-pointer transition-all hover:-translate-y-1"
                style={{
                  backgroundColor: 'rgba(0, 51, 102, 0.7)',
                  borderLeft: '4px solid #008080',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.backgroundColor = 'rgba(0, 51, 102, 0.9)'
                  el.style.boxShadow = '0 4px 12px rgba(0, 131, 143, 0.3)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.backgroundColor = 'rgba(0, 51, 102, 0.7)'
                  el.style.boxShadow = 'none'
                }}
              >
                <div className="text-2xl mb-2">{emoji}</div>
                <div className="text-xs font-bold text-white mb-1">{title}</div>
                <div className="text-xs" style={{ color: '#cccccc' }}>{desc}</div>
              </div>
            ))}
          </div>
        </section>


      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="text-center py-4" style={{ backgroundColor: '#0f172a' }}>
        <p className="text-gray-400 text-sm">
          Powered by <strong className="text-white">Claude AI</strong> · A division of{' '}
          <strong className="text-white">ARISAN-SIFISO</strong>
        </p>
        <div className="flex justify-center space-x-6 mt-2 text-gray-500 text-sm">
          <span className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4" />
            <span>Facilities Steward</span>
          </span>
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9M12 4H3m9 16V4" />
            </svg>
            <span>Systems Architect</span>
          </span>
        </div>
      </footer>
    </div>
  )
}
