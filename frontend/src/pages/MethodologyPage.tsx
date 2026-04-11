import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BrainCircuit,
  BarChart3,
  Cog,
  Users,
  Rocket,
  CheckCircle2,
  ArrowRightLeft,
  Building2,
  Layers,
  UtensilsCrossed,
  Wrench,
  LayoutGrid,
  Package,
  Globe,
} from 'lucide-react'

// ─── The Sifiso Methodology — 4 Pillars ──────────────────────────────────────
const PILLARS = [
  {
    icon: Cog,
    title: 'Systematic Processes',
    route: '/methodology/systematic-processes',
    description:
      'Structured, repeatable execution frameworks for every facilities operation — from reactive maintenance to 90-day full fit-outs.',
    points: ['Standard Operating Procedures', 'Workflow Optimisation', 'Quality Control Systems'],
    color: 'brand',
  },
  {
    icon: Users,
    title: 'Stakeholder Integration',
    route: '/methodology/stakeholder-integration',
    description:
      'Transparent accountability across every party — internal teams, vendors, landlords, IT — with compliance built in from day one.',
    points: ['Multi-party Responsibility', 'Landlord Approval Tracking', 'Compliance Automation'],
    color: 'cyan',
  },
  {
    icon: BarChart3,
    title: 'Data Intelligence',
    route: '/methodology/data-intelligence',
    description:
      'Multi-agent AI specialists analyse every dimension — operations, technical, vendor — then synthesise into a single authoritative plan.',
    points: ['5 Specialist AI Agents', 'Vector Memory Learning', 'Analytics & Reporting'],
    color: 'purple',
  },
  {
    icon: Rocket,
    title: 'Continuous Innovation',
    route: '/methodology/continuous-innovation',
    description:
      'Each completed plan enriches the intelligence layer — the system learns from every operation across every location and context.',
    points: ['Past Case Injection', 'Cross-Location Learning', 'Adaptive Compliance Rules'],
    color: 'amber',
  },
]

const OPERATIONS = [
  { icon: ArrowRightLeft, label: 'Office Move',         duration: '~21 days', color: 'text-brand-400' },
  { icon: Building2,      label: 'Full Fit-Out',        duration: '~90 days', color: 'text-purple-400' },
  { icon: Layers,         label: 'Floor Renovation',    duration: '~60 days', color: 'text-amber-400' },
  { icon: UtensilsCrossed,label: 'Canteen Setup',       duration: '~45 days', color: 'text-green-400' },
  { icon: Wrench,         label: 'Maintenance',         duration: '~3 days',  color: 'text-red-400' },
  { icon: LayoutGrid,     label: 'Space Change',        duration: '~21 days', color: 'text-cyan-400' },
  { icon: Package,        label: 'Vendor Coordination', duration: '~30 days', color: 'text-orange-400' },
]

const PILLAR_ACCENTS: Record<string, string> = {
  brand:  'border-brand-500/40 bg-brand-900/20',
  cyan:   'border-cyan-500/40 bg-cyan-900/20',
  purple: 'border-purple-500/40 bg-purple-900/20',
  amber:  'border-amber-500/40 bg-amber-900/20',
}

const PILLAR_ICON_BG: Record<string, string> = {
  brand:  'bg-brand-600/30 text-brand-300',
  cyan:   'bg-cyan-600/30 text-cyan-300',
  purple: 'bg-purple-600/30 text-purple-300',
  amber:  'bg-amber-600/30 text-amber-300',
}

const PILLAR_DOT: Record<string, string> = {
  brand:  'text-brand-400',
  cyan:   'text-cyan-400',
  purple: 'text-purple-400',
  amber:  'text-amber-400',
}

export function MethodologyPage() {
  return (
    <div className="min-h-screen bg-surface font-sans text-white overflow-x-hidden">

      {/* ── Top nav bar ───────────────────────────────────────────────────── */}
      <header className="border-b border-surface-border bg-surface-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <BrainCircuit className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm tracking-wide">SpaceMind OS</span>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* ── Page Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-surface-border">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-surface to-surface pointer-events-none" />
        <div className="absolute top-0 left-1/3 w-80 h-80 bg-brand-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-900/40 border border-brand-700/40 text-brand-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <BrainCircuit className="h-3.5 w-3.5" />
            The Philosophy Behind SpaceMind OS
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5">
            The Sifiso Methodology
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            A practitioner's framework for transformative facilities management —
            systematic, human-centred, and built for the realities of the African and global workspace.
          </p>
          {/* Core stewardship quote */}
          <div className="max-w-2xl mx-auto bg-surface-card/60 border border-surface-border rounded-2xl px-8 py-6 backdrop-blur-sm">
            <blockquote className="text-gray-300 italic text-base leading-relaxed mb-3">
              "Stewardship in facility management ensures sustainable spaces, aligning resources
              with purpose. True innovation comes not from authority, but from understanding needs
              and crafting solutions that transform operations and perceptions."
            </blockquote>
            <cite className="text-brand-400 text-sm font-semibold not-italic">
              — Sifiso Cyprian Shezi · Facilities Intelligence Practitioner
            </cite>
          </div>
        </div>
      </section>

      {/* ── The Level 1 Revolution ────────────────────────────────────────── */}
      <section className="border-b border-surface-border bg-surface-card/40">
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-brand-400 text-xs font-bold uppercase tracking-widest">
              The Philosophy
            </span>
            <h2 className="text-3xl font-bold text-white mt-3 mb-5">
              The Level 1 Revolution
            </h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Transformative change in facilities management doesn't require seniority — it requires
              vision, systematic thinking, and unwavering commitment to excellence.
            </p>
            <p className="text-gray-400 leading-relaxed mb-6">
              SpaceMind OS was built to prove that a Facilities Assistant with deep operational
              knowledge and the right tools can out-plan, out-execute, and out-deliver any
              traditional manual process.
            </p>
            <div className="space-y-2.5">
              {[
                'Every operation is sequenced with expert FM logic',
                'Landlord, vendor and compliance risks flagged automatically',
                'Country-specific regulations enforced on every plan',
                'Multi-agent AI delivers 5× richer analysis on complex requests',
              ].map(point => (
                <div key={point} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">{point}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface-card border border-surface-border rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-2xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center mx-auto mb-4">
                <BrainCircuit className="h-8 w-8 text-brand-400" />
              </div>
              <p className="text-white font-semibold">SpaceMind OS</p>
              <p className="text-gray-500 text-sm">The Sifiso Methodology, Powered by AI</p>
            </div>
            <div className="space-y-3">
              {[
                { step: '01', label: 'Describe your request in plain language' },
                { step: '02', label: 'AI decomposes into phases, tasks & responsibilities' },
                { step: '03', label: 'Risks, compliance & landlord items surfaced automatically' },
                { step: '04', label: 'Export as PDF, Excel or Markdown — ready to execute' },
              ].map(({ step, label }) => (
                <div key={step} className="flex items-center gap-3">
                  <span className="text-brand-500 text-xs font-bold w-6 shrink-0">{step}</span>
                  <div className="flex-1 h-px bg-surface-border" />
                  <span className="text-gray-400 text-xs text-right max-w-[200px]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── The Four Pillars ──────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <span className="text-brand-400 text-xs font-bold uppercase tracking-widest">
            Core Framework
          </span>
          <h2 className="text-3xl font-bold text-white mt-3 mb-4">Four Pillars of Excellence</h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
            Every feature of SpaceMind OS is rooted in these four principles — each pillar
            translated directly into AI capability.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PILLARS.map(({ icon: Icon, title, route, description, points, color }) => (
            <Link
              key={title}
              to={route}
              className={`border rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 block ${PILLAR_ACCENTS[color]}`}
            >
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 ${PILLAR_ICON_BG[color]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-white font-bold text-sm mb-2">{title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed mb-4">{description}</p>
              <ul className="space-y-1.5 mb-4">
                {points.map(pt => (
                  <li key={pt} className="flex items-start gap-1.5">
                    <span className={`text-xs mt-0.5 ${PILLAR_DOT[color]}`}>▸</span>
                    <span className="text-gray-400 text-xs">{pt}</span>
                  </li>
                ))}
              </ul>
              <p className={`text-xs font-semibold ${PILLAR_DOT[color]}`}>Explore pillar →</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 7 Operation Types ─────────────────────────────────────────────── */}
      <section className="border-t border-surface-border bg-surface-card/30">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <span className="text-brand-400 text-xs font-bold uppercase tracking-widest">
              Systematic Processes in Practice
            </span>
            <h2 className="text-3xl font-bold text-white mt-3 mb-4">
              7 Operation Templates
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">
              Every operation type is backed by a YAML knowledge template built from real FM
              expertise — phases, sequencing rules, risks, and compliance checks pre-loaded.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {OPERATIONS.map(({ icon: Icon, label, duration, color }) => (
              <div
                key={label}
                className="bg-surface-card border border-surface-border rounded-xl p-4 text-center"
              >
                <Icon className={`h-6 w-6 mx-auto mb-2.5 ${color}`} />
                <p className="text-white text-xs font-semibold leading-tight mb-1">{label}</p>
                <p className="text-gray-600 text-xs">{duration}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Global coverage ───────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-surface-card border border-surface-border rounded-2xl p-10 text-center">
          <Globe className="h-10 w-10 text-brand-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">
            Global Coverage, Local Compliance
          </h2>
          <p className="text-gray-500 text-sm max-w-xl mx-auto mb-8">
            Compliance rules for South Africa, United Kingdom, Kenya, and Nigeria — OHS Act,
            CDM 2015, NEMA, LAWMA — injected automatically on every plan based on location.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { flag: '🇿🇦', name: 'South Africa',   tenure: 'OHS Act · NBR · B-BBEE' },
              { flag: '🇬🇧', name: 'United Kingdom', tenure: 'CDM 2015 · BS 7671 · Part B' },
              { flag: '🇰🇪', name: 'Kenya',          tenure: 'NEMA · NCA · KEBS' },
              { flag: '🇳🇬', name: 'Nigeria',        tenure: 'LAWMA · COREN · LASPPPA' },
            ].map(({ flag, name, tenure }) => (
              <div key={name} className="bg-surface border border-surface-border rounded-xl px-5 py-3 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{flag}</span>
                  <span className="text-white text-sm font-semibold">{name}</span>
                </div>
                <p className="text-gray-600 text-xs">{tenure}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-surface-border bg-surface-card/40">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <BrainCircuit className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-bold leading-none">SpaceMind OS</p>
              <p className="text-gray-600 text-xs">AI-powered Facilities Operations Intelligence</p>
            </div>
          </div>
          <p className="text-gray-600 text-xs text-center">
            Built on The Sifiso Methodology · Powered by Claude AI ·{' '}
            <span className="text-brand-500">v1.0.0</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
