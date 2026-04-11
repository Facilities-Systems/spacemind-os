import { useState } from 'react'
import { CheckCircle2, Clock, MessageSquarePlus } from 'lucide-react'
import { Header } from '../components/layout/Header'

const SERVICES = [
  {
    emoji: '🧺',
    name: 'Laundry & Dry Cleaning',
    desc: 'Schedule pickup and delivery of work attire, uniforms, and personal garments.',
    turnaround: '48 hours',
  },
  {
    emoji: '🚗',
    name: 'Vehicle Registration & Licence Discs',
    desc: 'Assist with motor vehicle licence renewal, registration papers, and disc collection.',
    turnaround: '3–5 business days',
  },
  {
    emoji: '✉️',
    name: 'Document Services',
    desc: 'Courier dispatch, certified copies, notary coordination, and bulk printing.',
    turnaround: 'Same day',
  },
  {
    emoji: '💊',
    name: 'Pharmacy Pickup',
    desc: 'Collect prescription and over-the-counter medication from designated pharmacy partners.',
    turnaround: '4 hours',
  },
  {
    emoji: '🍱',
    name: 'Meal & Catering Orders',
    desc: 'Arrange catering for meetings, events, and team lunches with approved vendors.',
    turnaround: '24 hours',
  },
  {
    emoji: '🛒',
    name: 'Grocery & Personal Shopping',
    desc: 'Place grocery or personal shopping orders for collection — save your lunch break.',
    turnaround: '24–48 hours',
  },
  {
    emoji: '🏥',
    name: 'Appointment Booking',
    desc: 'Book doctor, dentist, specialist, or optometrist appointments near the office.',
    turnaround: '1 business day',
  },
  {
    emoji: '➕',
    name: 'Custom Request',
    desc: 'Anything not listed above — submit a custom concierge request and we\'ll assist.',
    turnaround: 'Varies',
  },
]

const ACTIVE_REQUESTS = [
  { service: 'Laundry & Dry Cleaning', requestedBy: 'Nompumelelo Dube',  date: '2026-04-10', status: 'In Progress', est: '2026-04-12' },
  { service: 'Vehicle Licence Disc',   requestedBy: 'Thabo Mthembu',      date: '2026-04-09', status: 'Pending',     est: '2026-04-14' },
  { service: 'Pharmacy Pickup',        requestedBy: 'Zanele Mkhize',       date: '2026-04-11', status: 'Completed',   est: '2026-04-11' },
  { service: 'Document Services',      requestedBy: 'Sipho Dlamini',       date: '2026-04-11', status: 'In Progress', est: '2026-04-11' },
  { service: 'Appointment Booking',    requestedBy: 'Bongani Nkosi',       date: '2026-04-08', status: 'Completed',   est: '2026-04-09' },
]

const STATUS_STYLE: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  'Pending':     { bg: 'rgba(245,158,11,0.2)',  color: '#fcd34d', icon: <Clock className="h-3 w-3" /> },
  'In Progress': { bg: 'rgba(99,102,241,0.2)',  color: '#a5b4fc', icon: <Clock className="h-3 w-3" /> },
  'Completed':   { bg: 'rgba(16,185,129,0.2)',  color: '#6ee7b7', icon: <CheckCircle2 className="h-3 w-3" /> },
}

const STATS = [
  { label: 'Active Requests', value: '4',  sub: 'Currently in progress' },
  { label: 'Completed Today', value: '2',  sub: 'Requests fulfilled' },
  { label: 'Services Available', value: '8', sub: 'Concierge service types' },
  { label: 'Avg Turnaround', value: '1.5d', sub: 'Average completion time' },
]

export function ConciergePage() {
  const [requested, setRequested] = useState<string | null>(null)

  return (
    <div className="flex flex-col h-full">
      <Header title="Concierge Services" subtitle="People & Wellness — Employee Assistance & Lifestyle Support" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STATS.map(s => (
            <div
              key={s.label}
              className="rounded-xl p-4 border-2"
              style={{ backgroundColor: '#1e3a5f', borderColor: '#a855f7' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#d8b4fe' }}>
                {s.label}
              </p>
              <p className="text-2xl font-extrabold text-white">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Intro */}
        <div
          className="rounded-xl p-5 border flex items-start gap-4"
          style={{ backgroundColor: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.35)' }}
        >
          <span className="text-3xl shrink-0">🤝</span>
          <div>
            <p className="text-white font-bold">Your Personal Facilities Concierge</p>
            <p className="text-gray-400 text-sm mt-1 leading-relaxed">
              Our concierge service is here so you never have to leave the office for life's admin.
              From collecting your car's licence disc to booking a specialist appointment — submit a request
              and our team will handle it for you.
            </p>
          </div>
        </div>

        {/* Service cards */}
        <div>
          <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
            <span style={{ color: '#d8b4fe' }}>✦</span>
            AVAILABLE SERVICES
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICES.map(svc => (
              <div
                key={svc.name}
                className="rounded-xl p-5 border-2 flex flex-col transition-all hover:-translate-y-1"
                style={{ backgroundColor: '#1e3a5f', borderColor: '#a855f7' }}
              >
                <div className="text-3xl mb-3">{svc.emoji}</div>
                <h3 className="text-white font-bold text-sm leading-tight mb-2">{svc.name}</h3>
                <p className="text-gray-500 text-xs leading-relaxed flex-1">{svc.desc}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#d8b4fe' }}>
                    ⏱ {svc.turnaround}
                  </span>
                </div>
                <button
                  onClick={() => setRequested(svc.name)}
                  className="mt-3 w-full py-2 rounded-lg text-xs font-bold transition-all"
                  style={requested === svc.name
                    ? { backgroundColor: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.4)' }
                    : { backgroundColor: 'rgba(168,85,247,0.2)', color: '#d8b4fe', border: '1px solid rgba(168,85,247,0.4)' }
                  }
                >
                  {requested === svc.name ? '✓ Requested' : 'Request Service'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Active requests */}
        <div>
          <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4" style={{ color: '#d8b4fe' }} />
            ACTIVE REQUESTS
          </h2>
          <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: '#a855f7' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'rgba(168,85,247,0.15)' }}>
                    {['Service', 'Requested By', 'Date', 'Status', 'Est. Completion'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#d8b4fe' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ACTIVE_REQUESTS.map((row, i) => {
                    const s = STATUS_STYLE[row.status]
                    return (
                      <tr
                        key={i}
                        className="border-t"
                        style={{ borderColor: 'rgba(168,85,247,0.15)', backgroundColor: i % 2 === 0 ? '#1e3a5f' : 'rgba(30,58,95,0.6)' }}
                      >
                        <td className="px-4 py-3 text-white font-medium">{row.service}</td>
                        <td className="px-4 py-3 text-gray-300">{row.requestedBy}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{row.date}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5 w-fit text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>
                            {s.icon}{row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{row.est}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
