import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, ClipboardList, Download, Printer, Star, Users } from 'lucide-react'
import { Header } from '../components/layout/Header'

const STATS = [
  { label: 'Total Transactions', value: '247', sub: 'All time' },
  { label: 'Outstanding Items', value: '23', sub: 'Currently checked out', alert: true },
  { label: 'Returned Today', value: '8', sub: 'Completed returns' },
  { label: 'Overdue Items', value: '4', sub: 'Past expected return', alert: true },
]

const TRANSACTIONS = [
  { item: 'Angle Grinder 230mm', borrower: 'Sipho Dlamini', dept: 'Maintenance', wo: 'WO-2024-0187', out: '2026-04-08', expected: '2026-04-09', returned: '2026-04-09', status: 'Returned', notes: 'Disc replaced' },
  { item: 'Extension Cord 10m', borrower: 'Bongani Nkosi', dept: 'Electrical', wo: 'WO-2024-0191', out: '2026-04-09', expected: '2026-04-09', returned: '', status: 'Overdue', notes: '' },
  { item: 'Cordless Drill Set', borrower: 'Thabo Mthembu', dept: 'Carpentry', wo: 'WO-2024-0193', out: '2026-04-10', expected: '2026-04-11', returned: '', status: 'Outstanding', notes: 'Conference room fit-out' },
  { item: 'Pressure Washer', borrower: 'Lungelo Zulu', dept: 'Hygiene', wo: '', out: '2026-04-07', expected: '2026-04-08', returned: '', status: 'Overdue', notes: 'No WO/REQ' },
  { item: 'Safety Harness (L)', borrower: 'Nkosinathi Dube', dept: 'Maintenance', wo: 'WO-2024-0195', out: '2026-04-11', expected: '2026-04-12', returned: '', status: 'Outstanding', notes: 'Roof access work' },
  { item: 'Paint Roller Set', borrower: 'Nokwanda Mhlongo', dept: 'Painting', wo: 'WO-2024-0188', out: '2026-04-09', expected: '2026-04-10', returned: '2026-04-10', status: 'Returned', notes: '' },
  { item: '20m Measuring Tape', borrower: 'Sibusiso Khumalo', dept: 'Projects', wo: 'WO-2024-0196', out: '2026-04-11', expected: '2026-04-14', returned: '', status: 'Outstanding', notes: 'Space planning' },
]

const SCORECARD = [
  { name: 'Sipho Dlamini',    dept: 'Maintenance', checkouts: 18, returned: 18, score: 100, rank: '⭐ Excellent' },
  { name: 'Nokwanda Mhlongo', dept: 'Painting',    checkouts: 12, returned: 12, score: 100, rank: '⭐ Excellent' },
  { name: 'Thabo Mthembu',    dept: 'Carpentry',   checkouts: 15, returned: 14, score: 93,  rank: '✅ High' },
  { name: 'Sibusiso Khumalo', dept: 'Projects',    checkouts: 9,  returned: 8,  score: 89,  rank: '✅ High' },
  { name: 'Bongani Nkosi',    dept: 'Electrical',  checkouts: 11, returned: 9,  score: 82,  rank: '⚠️ Needs Support' },
  { name: 'Lungelo Zulu',     dept: 'Hygiene',     checkouts: 7,  returned: 5,  score: 71,  rank: '⚠️ Needs Support' },
]

const STATUS_STYLE: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  Returned:    { bg: 'rgba(16,185,129,0.2)',  color: '#6ee7b7', icon: <CheckCircle2 className="h-3 w-3" /> },
  Outstanding: { bg: 'rgba(245,158,11,0.2)',  color: '#fcd34d', icon: <Clock className="h-3 w-3" /> },
  Overdue:     { bg: 'rgba(239,68,68,0.2)',   color: '#f87171', icon: <AlertTriangle className="h-3 w-3" /> },
}

export function SignOutPage() {
  const [statusFilter, setStatusFilter] = useState('All')
  const [deptFilter,   setDeptFilter]   = useState('All')

  const filtered = TRANSACTIONS.filter(t =>
    (statusFilter === 'All' || t.status === statusFilter) &&
    (deptFilter   === 'All' || t.dept === deptFilter)
  )

  const departments = ['All', ...Array.from(new Set(TRANSACTIONS.map(t => t.dept)))]

  return (
    <div className="flex flex-col h-full">
      <Header title="Equipment Sign-Out" subtitle="Facilities Operations — Checkout Register & Stewardship" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STATS.map(s => (
            <div
              key={s.label}
              className="rounded-xl p-4 border-2"
              style={{ backgroundColor: '#1e3a5f', borderColor: s.alert ? '#ef4444' : '#008080' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: s.alert ? '#f87171' : '#2dd4bf' }}>
                {s.label}
              </p>
              <p className="text-2xl font-extrabold text-white">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Filter bar + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-sm px-3 py-2 rounded-lg border text-white bg-transparent outline-none cursor-pointer"
              style={{ borderColor: '#008080', backgroundColor: '#1e3a5f' }}
            >
              {['All', 'Returned', 'Outstanding', 'Overdue'].map(s => (
                <option key={s} value={s} style={{ backgroundColor: '#1e3a5f' }}>{s}</option>
              ))}
            </select>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="text-sm px-3 py-2 rounded-lg border text-white bg-transparent outline-none cursor-pointer"
              style={{ borderColor: '#008080', backgroundColor: '#1e3a5f' }}
            >
              {departments.map(d => (
                <option key={d} value={d} style={{ backgroundColor: '#1e3a5f' }}>{d === 'All' ? 'All Departments' : d}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            {[
              { icon: Download, label: 'Export CSV' },
              { icon: Printer,  label: 'Print' },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all"
                style={{ backgroundColor: 'rgba(0,128,128,0.1)', borderColor: '#008080', color: '#2dd4bf' }}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions table */}
        <div>
          <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-3 flex items-center gap-2">
            <ClipboardList className="h-4 w-4" style={{ color: '#2dd4bf' }} />
            ALL TRANSACTIONS
            <span className="text-xs font-normal text-gray-500">({filtered.length} records)</span>
          </h2>
          <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: '#008080' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'rgba(0,128,128,0.2)' }}>
                    {['Item', 'Borrower', 'Dept', 'WO/REQ', 'Out Date', 'Expected', 'Returned', 'Status', 'Notes'].map(h => (
                      <th key={h} className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#2dd4bf' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => {
                    const s = STATUS_STYLE[row.status]
                    return (
                      <tr
                        key={i}
                        className="border-t transition-all hover:brightness-110"
                        style={{ borderColor: 'rgba(0,128,128,0.2)', backgroundColor: i % 2 === 0 ? '#1e3a5f' : 'rgba(30,58,95,0.6)' }}
                      >
                        <td className="px-3 py-2.5 text-white font-medium whitespace-nowrap">{row.item}</td>
                        <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">{row.borrower}</td>
                        <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">{row.dept}</td>
                        <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap" style={{ color: row.wo ? '#a3e635' : '#ef4444' }}>
                          {row.wo || '⚠ None'}
                        </td>
                        <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">{row.out}</td>
                        <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">{row.expected}</td>
                        <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">{row.returned || '—'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="flex items-center gap-1.5 w-fit text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>
                            {s.icon}{row.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-gray-500 text-xs max-w-[120px] truncate">{row.notes || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Stewardship scorecard */}
        <div>
          <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-3 flex items-center gap-2">
            <Star className="h-4 w-4" style={{ color: '#a3e635' }} />
            STEWARDSHIP SCORECARD
          </h2>
          <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: '#008080' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'rgba(0,128,128,0.2)' }}>
                    {['Staff Member', 'Department', 'Checkouts', 'Returned', 'Return Rate', 'Stewardship Rank'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#2dd4bf' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SCORECARD.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t"
                      style={{ borderColor: 'rgba(0,128,128,0.2)', backgroundColor: i % 2 === 0 ? '#1e3a5f' : 'rgba(30,58,95,0.6)' }}
                    >
                      <td className="px-4 py-3 text-white font-semibold">{row.name}</td>
                      <td className="px-4 py-3 text-gray-400">{row.dept}</td>
                      <td className="px-4 py-3 text-white">{row.checkouts}</td>
                      <td className="px-4 py-3 text-white">{row.returned}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${row.score}%`,
                                backgroundColor: row.score >= 95 ? '#10b981' : row.score >= 80 ? '#f59e0b' : '#ef4444',
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold" style={{ color: row.score >= 95 ? '#6ee7b7' : row.score >= 80 ? '#fcd34d' : '#f87171' }}>
                            {row.score}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{row.rank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><Users className="h-3 w-3 text-green-400" /> Excellent: ≥95% return rate</span>
            <span className="flex items-center gap-1.5"><Users className="h-3 w-3 text-amber-400" /> High: 80–94%</span>
            <span className="flex items-center gap-1.5"><Users className="h-3 w-3 text-red-400" /> Needs Support: &lt;80%</span>
          </div>
        </div>

      </div>
    </div>
  )
}
