import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BrainCircuit } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PillarData {
  number: string
  title: string
  tagline: string
  description: string
  accent: {
    color: string    // e.g. '#6366f1'
    bg: string       // e.g. 'rgba(99,102,241,0.15)'
    border: string   // e.g. 'rgba(99,102,241,0.5)'
    text: string     // e.g. '#a5b4fc'
  }
  keyBenefits: { emoji: string; label: string; desc: string }[]
  processCycle: { action: string; desc: string }[]
  coreComponents: { title: string; features: string[]; cta: string }[]
  phases: { title: string; duration: string; tags: string[] }[]
  kpis: { value: string; label: string; desc: string }[]
  caseStudy: { before: string[]; after: string[]; quote: string }
  otherPillars: { title: string; route: string; number: string }[]
}

// ─── Shared page shell ────────────────────────────────────────────────────────

export function PillarLayout({ data }: { data: PillarData }) {
  return (
    <div className="min-h-screen font-sans text-white" style={{ backgroundColor: '#0f172a' }}>

      {/* ── Nav ── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ backgroundColor: 'rgba(15,23,42,0.95)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <BrainCircuit className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm tracking-wide">SpaceMind OS</span>
          </div>
          <Link
            to="/methodology"
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            The Sifiso Methodology
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-14 space-y-20">

        {/* ── Hero ── */}
        <div className="text-center">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-5"
            style={{ backgroundColor: data.accent.bg, color: data.accent.text, border: `1px solid ${data.accent.border}` }}
          >
            Pillar {data.number} · The Sifiso Methodology
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">{data.title}</h1>
          <p className="text-lg font-semibold mb-4" style={{ color: data.accent.text }}>{data.tagline}</p>
          <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">{data.description}</p>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {data.keyBenefits.map(b => (
              <div
                key={b.label}
                className="flex items-center gap-3 px-5 py-3 rounded-xl border text-left"
                style={{ backgroundColor: data.accent.bg, borderColor: data.accent.border }}
              >
                <span className="text-2xl">{b.emoji}</span>
                <div>
                  <p className="text-white text-xs font-bold">{b.label}</p>
                  <p className="text-gray-500 text-xs">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Process Cycle ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-center mb-2" style={{ color: data.accent.text }}>
            Development Cycle
          </p>
          <h2 className="text-2xl font-bold text-white text-center mb-10">{data.title} Framework</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {data.processCycle.map((step, i) => (
              <div key={step.action} className="text-center">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-3 font-extrabold text-white text-sm"
                  style={{ backgroundColor: data.accent.color }}
                >
                  {i + 1}
                </div>
                <p className="text-white text-xs font-bold">{step.action}</p>
                <p className="text-gray-500 text-xs mt-0.5 leading-snug">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Core Components ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-center mb-2" style={{ color: data.accent.text }}>
            Core Components
          </p>
          <h2 className="text-2xl font-bold text-white text-center mb-10">What {data.title} Delivers</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {data.coreComponents.map(comp => (
              <div
                key={comp.title}
                className="rounded-2xl p-6 border-2 flex flex-col"
                style={{ backgroundColor: '#1e3a5f', borderColor: data.accent.color }}
              >
                <h3 className="text-white font-bold text-sm mb-4">{comp.title}</h3>
                <ul className="space-y-2.5 flex-1 mb-5">
                  {comp.features.map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-xs mt-0.5 shrink-0" style={{ color: data.accent.text }}>▸</span>
                      <span className="text-gray-400 text-xs leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs font-semibold cursor-pointer hover:underline" style={{ color: data.accent.text }}>
                  {comp.cta} →
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Implementation Timeline ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-center mb-2" style={{ color: data.accent.text }}>
            Implementation Strategy
          </p>
          <h2 className="text-2xl font-bold text-white text-center mb-10">Phase-by-Phase Rollout</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {data.phases.map((phase, i) => (
              <div
                key={phase.title}
                className="rounded-2xl p-6 border"
                style={{ backgroundColor: '#1e3a5f', borderColor: 'rgba(0,128,128,0.35)' }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 font-extrabold text-white text-sm"
                    style={{ backgroundColor: data.accent.color }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{phase.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: data.accent.text }}>{phase.duration}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {phase.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: data.accent.bg, color: data.accent.text }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── KPI Impact ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-center mb-2" style={{ color: data.accent.text }}>
            Measurable Impact
          </p>
          <h2 className="text-2xl font-bold text-white text-center mb-10">Results That Speak</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {data.kpis.map(kpi => (
              <div
                key={kpi.label}
                className="text-center rounded-2xl p-6 border-2"
                style={{ backgroundColor: '#1e3a5f', borderColor: data.accent.border }}
              >
                <p className="text-3xl font-extrabold mb-1" style={{ color: data.accent.text }}>{kpi.value}</p>
                <p className="text-white font-bold text-sm mb-1">{kpi.label}</p>
                <p className="text-gray-500 text-xs leading-snug">{kpi.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Case Study ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-center mb-2" style={{ color: data.accent.text }}>
            Case Study
          </p>
          <h2 className="text-2xl font-bold text-white text-center mb-10">Real-World Implementation</h2>
          <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: data.accent.border }}>
            <div className="grid md:grid-cols-2" style={{ backgroundColor: '#1e3a5f' }}>
              <div className="p-7 border-b md:border-b-0 md:border-r" style={{ borderColor: 'rgba(0,128,128,0.2)' }}>
                <p className="text-red-400 font-bold text-xs uppercase tracking-widest mb-4">Before</p>
                <ul className="space-y-3">
                  {data.caseStudy.before.map(b => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-gray-400">
                      <span className="text-red-500 shrink-0 mt-0.5">✗</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-7">
                <p className="text-green-400 font-bold text-xs uppercase tracking-widest mb-4">After</p>
                <ul className="space-y-3">
                  {data.caseStudy.after.map(a => (
                    <li key={a} className="flex items-start gap-2.5 text-sm text-gray-400">
                      <span className="text-green-400 shrink-0 mt-0.5">✓</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div
              className="px-7 py-5 border-t"
              style={{ backgroundColor: data.accent.bg, borderColor: data.accent.border }}
            >
              <p className="text-gray-300 text-sm italic leading-relaxed">"{data.caseStudy.quote}"</p>
            </div>
          </div>
        </div>

        {/* ── Other Pillars ── */}
        <div>
          <h2 className="text-xl font-bold text-white text-center mb-6">Explore Other Pillars</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {data.otherPillars.map(p => (
              <Link
                key={p.route}
                to={p.route}
                className="flex items-center justify-between p-4 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ backgroundColor: '#1e3a5f', borderColor: 'rgba(0,128,128,0.4)' }}
              >
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Pillar {p.number}</p>
                  <p className="text-white font-semibold text-sm">{p.title}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-teal-400 shrink-0" />
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/methodology"
              className="text-sm font-semibold transition-colors"
              style={{ color: '#2dd4bf' }}
            >
              ← Back to The Sifiso Methodology
            </Link>
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <footer className="border-t mt-4 py-8 text-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-gray-600 text-xs">The Sifiso Methodology · SpaceMind OS · Powered by Claude AI</p>
      </footer>
    </div>
  )
}
