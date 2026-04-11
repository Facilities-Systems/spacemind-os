import { useState } from 'react'
import { BookOpen, Calendar, ExternalLink, Globe, GraduationCap, Newspaper } from 'lucide-react'
import { Header } from '../components/layout/Header'

const NEWS = [
  {
    headline: 'IFMA Report: AI Adoption in FM Reaches 34% Globally',
    source: 'IFMA World Workplace',
    date: '2026-04-10',
    summary: 'The International Facility Management Association reports that over a third of global FM organisations now use AI tools for planning, maintenance prediction, and space optimisation.',
    tag: 'Technology',
    tagColor: '#6366f1',
  },
  {
    headline: 'South Africa OHS Amendment Act — New Workplace Safety Requirements Effective June 2026',
    source: 'SAFMA',
    date: '2026-04-09',
    summary: 'The Department of Labour has published the Occupational Health & Safety Amendment Regulations effective 1 June 2026, introducing updated requirements for fire safety audits and emergency drill frequencies.',
    tag: 'Compliance',
    tagColor: '#ef4444',
  },
  {
    headline: 'Green Building Council SA Releases 2026 Net Zero Pathway Report',
    source: 'GBCSA',
    date: '2026-04-08',
    summary: 'South Africa\'s GBCSA has published its 2026 Net Zero Carbon Buildings Standard, providing FM practitioners with a compliance roadmap toward carbon-neutral built environments by 2030.',
    tag: 'Sustainability',
    tagColor: '#10b981',
  },
  {
    headline: 'The Rise of the Digital Twin in Corporate Facilities Management',
    source: 'Facilities Management Journal',
    date: '2026-04-07',
    summary: 'Digital twin technology is enabling facilities managers to simulate space changes, test maintenance schedules, and predict energy consumption — all without touching the physical asset.',
    tag: 'Innovation',
    tagColor: '#0ea5e9',
  },
  {
    headline: 'IFMA Africa Chapter Summit 2026 — Johannesburg Confirmed as Host City',
    source: 'IFMA Africa',
    date: '2026-04-05',
    summary: 'The 2026 IFMA Africa Chapter Summit will be held in Johannesburg in September, focusing on smart buildings, ESG compliance, and the future of the FM profession in Sub-Saharan Africa.',
    tag: 'Events',
    tagColor: '#f59e0b',
  },
  {
    headline: 'Workspace Flexibility Index 2026: What Employees Really Want',
    source: 'CoreNet Global',
    date: '2026-04-03',
    summary: 'New research from CoreNet Global reveals that 68% of employees prefer a hybrid model with hot-desking, while 22% still prefer assigned workstations — creating new challenges for space planners.',
    tag: 'Workplace',
    tagColor: '#a855f7',
  },
]

const INTERNAL_TRAININGS = [
  {
    title: 'SpaceMind OS Power User',
    provider: 'SpaceMind OS / Facilities Team',
    date: '2026-04-25',
    format: 'In-Person',
    duration: '3 hours',
    desc: 'Master AI planning, multi-agent mode, PDF/Excel export, task tracking, and the full history module.',
  },
  {
    title: 'FM Compliance Workshop: OHS Act 2026',
    provider: 'Safety & Compliance Division',
    date: '2026-05-08',
    format: 'In-Person',
    duration: '4 hours',
    desc: 'Deep dive into the new OHS Amendment Act requirements — emergency protocols, risk assessments, and FM responsibilities.',
  },
  {
    title: 'Vendor Management & Procurement',
    provider: 'Finance & Procurement',
    date: '2026-05-15',
    format: 'Online',
    duration: '2 hours',
    desc: 'Best practices for vendor evaluation, SLA management, purchase order compliance, and cost-saving strategies.',
  },
]

const EXTERNAL_COURSES = [
  {
    title: 'Facility Management Professional (FMP)',
    provider: 'IFMA',
    date: '2026-06-01',
    format: 'Online',
    duration: 'Self-paced',
    desc: 'The globally recognised FMP designation — covers operations & maintenance, project management, and leadership.',
    link: '#',
  },
  {
    title: 'SAFMA Annual Conference 2026',
    provider: 'South African FM Association',
    date: '2026-08-14',
    format: 'In-Person',
    duration: '2 days',
    desc: 'SA\'s premier FM industry event — networking, case studies, regulatory updates, and keynote speakers.',
    link: '#',
  },
  {
    title: 'LEED Green Associate Exam Prep',
    provider: 'Green Building Council SA',
    date: '2026-05-20',
    format: 'Hybrid',
    duration: '6 weeks',
    desc: 'Prepare for the LEED Green Associate credential, covering sustainable building design and operations.',
    link: '#',
  },
  {
    title: 'FM Leadership & Strategic Thinking',
    provider: 'Wits University Short Courses',
    date: '2026-07-07',
    format: 'Hybrid',
    duration: '5 days',
    desc: 'Designed for senior FM practitioners — leadership frameworks, strategic planning, and stakeholder management.',
    link: '#',
  },
]

const FORMAT_STYLE: Record<string, { bg: string; color: string }> = {
  'In-Person': { bg: 'rgba(16,185,129,0.2)',  color: '#6ee7b7' },
  'Online':    { bg: 'rgba(99,102,241,0.2)',  color: '#a5b4fc' },
  'Hybrid':    { bg: 'rgba(245,158,11,0.2)',  color: '#fcd34d' },
}

const TAG_BG: Record<string, string> = {
  Technology:   'rgba(99,102,241,0.15)',
  Compliance:   'rgba(239,68,68,0.15)',
  Sustainability:'rgba(16,185,129,0.15)',
  Innovation:   'rgba(14,165,233,0.15)',
  Events:       'rgba(245,158,11,0.15)',
  Workplace:    'rgba(168,85,247,0.15)',
}

export function NewsTrainingPage() {
  const [tab, setTab] = useState<'news' | 'training'>('news')

  return (
    <div className="flex flex-col h-full">
      <Header title="News & Training" subtitle="Intelligence & Growth — FM Knowledge Hub" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">

        {/* Tab selector */}
        <div className="flex gap-2 p-1 rounded-xl w-fit" style={{ backgroundColor: '#1e3a5f' }}>
          {[
            { key: 'news', label: 'Facilities News', icon: Newspaper },
            { key: 'training', label: 'Training & Courses', icon: GraduationCap },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as 'news' | 'training')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={tab === t.key
                ? { backgroundColor: '#6366f1', color: '#fff' }
                : { color: '#9ca3af' }
              }
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* NEWS TAB */}
        {tab === 'news' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-brand-400" />
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Global FM Industry News</p>
            </div>
            {NEWS.map((article, i) => (
              <div
                key={i}
                className="rounded-xl p-5 border-2 transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: '#1e3a5f', borderColor: 'rgba(99,102,241,0.4)' }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: TAG_BG[article.tag] ?? 'rgba(99,102,241,0.15)', color: article.tagColor }}
                      >
                        {article.tag}
                      </span>
                      <span className="text-xs text-gray-600">{article.source}</span>
                      <span className="text-xs text-gray-700">·</span>
                      <span className="text-xs text-gray-600">{article.date}</span>
                    </div>
                    <h3 className="text-white font-bold text-sm leading-snug">{article.headline}</h3>
                  </div>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed mb-3">{article.summary}</p>
                <button className="flex items-center gap-1.5 text-xs font-semibold transition-all" style={{ color: '#818cf8' }}>
                  <ExternalLink className="h-3 w-3" />
                  Read Full Article
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TRAINING TAB */}
        {tab === 'training' && (
          <div className="space-y-6">

            {/* Internal */}
            <div>
              <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-amber-400" />
                INTERNAL TRAINING SESSIONS
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {INTERNAL_TRAININGS.map(course => {
                  const fmt = FORMAT_STYLE[course.format]
                  return (
                    <div
                      key={course.title}
                      className="rounded-xl p-5 border-2 flex flex-col"
                      style={{ backgroundColor: '#1e3a5f', borderColor: '#f59e0b' }}
                    >
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: fmt.bg, color: fmt.color }}>
                          {course.format}
                        </span>
                        <span className="text-xs text-gray-600">{course.duration}</span>
                      </div>
                      <h3 className="text-white font-bold text-sm leading-tight mb-1">{course.title}</h3>
                      <p className="text-amber-300/70 text-xs mb-2">{course.provider}</p>
                      <p className="text-gray-500 text-xs leading-relaxed flex-1">{course.desc}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {course.date}
                        </div>
                        <button
                          className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                          style={{ backgroundColor: 'rgba(245,158,11,0.2)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.35)' }}
                        >
                          Register
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* External */}
            <div>
              <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-indigo-400" />
                EXTERNAL COURSES & CERTIFICATIONS
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXTERNAL_COURSES.map(course => {
                  const fmt = FORMAT_STYLE[course.format]
                  return (
                    <div
                      key={course.title}
                      className="rounded-xl p-5 border-2 flex flex-col"
                      style={{ backgroundColor: '#1e3a5f', borderColor: '#6366f1' }}
                    >
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: fmt.bg, color: fmt.color }}>
                          {course.format}
                        </span>
                        <span className="text-xs text-gray-600">{course.duration}</span>
                      </div>
                      <h3 className="text-white font-bold text-sm leading-tight mb-1">{course.title}</h3>
                      <p className="text-indigo-300/70 text-xs mb-2">{course.provider}</p>
                      <p className="text-gray-500 text-xs leading-relaxed flex-1">{course.desc}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {course.date}
                        </div>
                        <button
                          className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                          style={{ backgroundColor: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.35)' }}
                        >
                          Register
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
