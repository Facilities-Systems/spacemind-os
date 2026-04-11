import { AlertTriangle, CheckCircle2, Heart, Phone, PlusCircle, ShieldCheck, Stethoscope, Thermometer } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { useMedical } from '../hooks/useMedical'

const QUICK_ACTIONS = [
  { emoji: '📋', label: 'New Incident', desc: 'Log a medical incident or injury report' },
  { emoji: '💓', label: 'Vital Signs', desc: 'Record employee vital signs & wellness check' },
  { emoji: '💊', label: 'Inventory', desc: 'View and update first aid kit stock levels' },
  { emoji: '🩺', label: 'Equipment', desc: 'Check medical equipment status & calibration' },
]

const SEVERITY_STYLE: Record<string, { bg: string; color: string }> = {
  Low:      { bg: 'rgba(16,185,129,0.2)',  color: '#6ee7b7' },
  Medium:   { bg: 'rgba(245,158,11,0.2)',  color: '#fcd34d' },
  High:     { bg: 'rgba(245,158,11,0.2)',  color: '#fcd34d' },
  Critical: { bg: 'rgba(239,68,68,0.2)',   color: '#f87171' },
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Open:     { bg: 'rgba(239,68,68,0.2)',   color: '#f87171' },
  Referred: { bg: 'rgba(245,158,11,0.2)',  color: '#fcd34d' },
  Resolved: { bg: 'rgba(16,185,129,0.2)',  color: '#6ee7b7' },
}

const STOCK_STYLE: Record<string, { bg: string; color: string }> = {
  Good:     { bg: 'rgba(16,185,129,0.2)',  color: '#6ee7b7' },
  Low:      { bg: 'rgba(245,158,11,0.2)',  color: '#fcd34d' },
  Critical: { bg: 'rgba(239,68,68,0.2)',   color: '#f87171' },
}

function itemStockStatus(qty: number, min: number): 'Critical' | 'Low' | 'Good' {
  if (qty === 0) return 'Critical'
  if (qty <= min) return 'Low'
  return 'Good'
}

export function MedicalPage() {
  const { analytics, incidents, items, isLoading } = useMedical()

  const stats = [
    { label: 'Open Incidents',    value: analytics ? String(analytics.open_incidents)      : '—', sub: 'Requiring attention' },
    { label: 'Critical Cases',    value: analytics ? String(analytics.critical_incidents)   : '—', sub: 'Emergency level', accent: '#10b981' },
    { label: 'Low Medical Stock', value: analytics ? String(analytics.low_stock_count)      : '—', sub: 'First aid items',  alert: (analytics?.low_stock_count  ?? 0) > 0 },
    { label: 'Expiring Soon',     value: analytics ? String(analytics.expiring_soon_count)  : '—', sub: 'Within 30 days',  alert: (analytics?.expiring_soon_count ?? 0) > 0 },
  ]

  const incidentRows = incidents.map(inc => {
    const dt = new Date(inc.reported_at)
    return {
      id:       inc.id.slice(-8).toUpperCase(),
      date:     dt.toISOString().split('T')[0],
      time:     dt.toTimeString().slice(0, 5),
      patient:  inc.employee_name ?? '—',
      dept:     inc.department    ?? '—',
      type:     inc.incident_type,
      severity: inc.severity,
      status:   inc.status,
    }
  })

  const itemRows = items.map((item, i) => ({
    no:     i + 1,
    name:   item.name,
    code:   `MED-${String(i + 1).padStart(3, '0')}`,
    qty:    item.quantity,
    unit:   item.unit,
    min:    item.min_level,
    status: itemStockStatus(item.quantity, item.min_level),
    expiry: item.expiry_date ? item.expiry_date.slice(0, 7) : '—',
  }))

  return (
    <div className="flex flex-col h-full">
      <Header title="Medical Services" subtitle="People & Wellness — Health Center Dashboard" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(s => (
            <div
              key={s.label}
              className="rounded-xl p-4 border-2"
              style={{ backgroundColor: '#1e3a5f', borderColor: s.alert ? '#ef4444' : '#0ea5e9' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: s.alert ? '#f87171' : '#38bdf8' }}>
                {s.label}
              </p>
              <p className="text-2xl font-extrabold text-white">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Main content (left 2 cols) */}
          <div className="lg:col-span-2 space-y-5">

            {/* Quick actions */}
            <div>
              <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-3 flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-cyan-400" />
                QUICK ACTIONS
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {QUICK_ACTIONS.map(qa => (
                  <button
                    key={qa.label}
                    className="rounded-xl p-4 border-2 text-left cursor-pointer transition-all hover:-translate-y-1"
                    style={{ backgroundColor: '#1e3a5f', borderColor: '#0ea5e9' }}
                  >
                    <div className="text-2xl mb-2">{qa.emoji}</div>
                    <p className="text-white font-bold text-xs">{qa.label}</p>
                    <p className="text-gray-500 text-xs mt-1 leading-tight">{qa.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent incidents */}
            <div>
              <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                RECENT INCIDENTS
              </h2>
              <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: '#0ea5e9' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(14,165,233,0.15)' }}>
                        {['Incident ID', 'Date/Time', 'Patient', 'Department', 'Type', 'Severity', 'Status'].map(h => (
                          <th key={h} className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#38bdf8' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-500 text-sm">Loading incidents…</td></tr>
                      ) : incidentRows.length === 0 ? (
                        <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-500 text-sm">No incidents recorded.</td></tr>
                      ) : incidentRows.map((inc, i) => {
                        const sev = SEVERITY_STYLE[inc.severity] ?? { bg: 'rgba(100,100,100,0.2)', color: '#9ca3af' }
                        const sts = STATUS_STYLE[inc.status]     ?? { bg: 'rgba(100,100,100,0.2)', color: '#9ca3af' }
                        return (
                          <tr
                            key={inc.id}
                            className="border-t"
                            style={{ borderColor: 'rgba(14,165,233,0.15)', backgroundColor: i % 2 === 0 ? '#1e3a5f' : 'rgba(30,58,95,0.6)' }}
                          >
                            <td className="px-3 py-2.5 font-mono text-xs text-cyan-300">{inc.id}</td>
                            <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">{inc.date} {inc.time}</td>
                            <td className="px-3 py-2.5 text-white font-medium whitespace-nowrap">{inc.patient}</td>
                            <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">{inc.dept}</td>
                            <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">{inc.type}</td>
                            <td className="px-3 py-2.5">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: sev.bg, color: sev.color }}>{inc.severity}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: sts.bg, color: sts.color }}>{inc.status}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* First aid kit */}
            <div>
              <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-3 flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-400" />
                FIRST AID KIT STATUS
              </h2>
              <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: '#0ea5e9' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(14,165,233,0.15)' }}>
                        {['#', 'Item Name', 'Code', 'Stock', 'Unit', 'Min Level', 'Status', 'Expiry'].map(h => (
                          <th key={h} className="text-left px-3 py-2.5 text-xs font-bold uppercase tracking-wider" style={{ color: '#38bdf8' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-500 text-sm">Loading items…</td></tr>
                      ) : itemRows.length === 0 ? (
                        <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-500 text-sm">No medical items found.</td></tr>
                      ) : itemRows.map((row, i) => {
                        const s = STOCK_STYLE[row.status]
                        return (
                          <tr
                            key={row.code}
                            className="border-t"
                            style={{ borderColor: 'rgba(14,165,233,0.15)', backgroundColor: i % 2 === 0 ? '#1e3a5f' : 'rgba(30,58,95,0.6)' }}
                          >
                            <td className="px-3 py-2 text-gray-500 text-xs">{row.no}</td>
                            <td className="px-3 py-2 text-white font-medium">{row.name}</td>
                            <td className="px-3 py-2 font-mono text-xs text-cyan-400">{row.code}</td>
                            <td className="px-3 py-2 font-bold" style={{ color: row.qty < row.min ? '#f87171' : '#6ee7b7' }}>{row.qty}</td>
                            <td className="px-3 py-2 text-gray-500 text-xs">{row.unit}</td>
                            <td className="px-3 py-2 text-gray-500">{row.min}</td>
                            <td className="px-3 py-2">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>{row.status}</span>
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-400">{row.expiry}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">

            {/* Nurse on duty */}
            <div
              className="rounded-xl p-5 border-2 text-center"
              style={{ backgroundColor: '#1e3a5f', borderColor: '#0ea5e9' }}
            >
              <div className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgba(14,165,233,0.2)' }}>
                <Stethoscope className="h-7 w-7 text-cyan-400" />
              </div>
              <p className="text-white font-bold">NURSE ON DUTY</p>
              <p className="text-cyan-300 text-sm mt-0.5">Sister Nomvula Hadebe</p>
              <div
                className="mt-3 flex items-center justify-center gap-1.5 text-xs text-green-300 font-semibold"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                On Site — Available
              </div>
              <p className="text-gray-500 text-xs mt-2">Office Hours: 07:00–16:30</p>
            </div>

            {/* Emergency contacts */}
            <div
              className="rounded-xl p-5 border-2"
              style={{ backgroundColor: '#1e3a5f', borderColor: '#0ea5e9' }}
            >
              <h3 className="text-white font-bold text-xs tracking-widest uppercase mb-3 flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-cyan-400" />
                EMERGENCY CONTACTS
              </h3>
              {[
                { label: 'Emergency Services', num: '10177',        color: '#f87171' },
                { label: 'Local Hospital',     num: '031 240 1111', color: '#38bdf8' },
                { label: 'Company Nurse',      num: 'Ext. 4400',    color: '#6ee7b7' },
                { label: 'Security Desk',      num: 'Ext. 4000',    color: '#a3e635' },
              ].map(c => (
                <div key={c.label} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'rgba(14,165,233,0.15)' }}>
                  <p className="text-gray-400 text-xs">{c.label}</p>
                  <p className="font-bold text-xs" style={{ color: c.color }}>{c.num}</p>
                </div>
              ))}
            </div>

            {/* Compliance */}
            <div
              className="rounded-xl p-5 border-2"
              style={{ backgroundColor: '#1e3a5f', borderColor: '#10b981' }}
            >
              <h3 className="text-white font-bold text-xs tracking-widest uppercase mb-3 flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
                OHS COMPLIANCE
              </h3>
              {[
                { label: 'Last Drill',         value: '2026-03-14' },
                { label: 'Risk Assessment',    value: 'Current'    },
                { label: 'First Aider Ratio',  value: '1:50 ✅'   },
                { label: 'OHS Representative', value: 'B. Nkosi'   },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'rgba(16,185,129,0.15)' }}>
                  <p className="text-gray-400 text-xs">{item.label}</p>
                  <p className="text-green-300 text-xs font-semibold">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Wellness tip */}
            <div
              className="rounded-xl p-4 border text-center"
              style={{ backgroundColor: 'rgba(14,165,233,0.08)', borderColor: 'rgba(14,165,233,0.3)' }}
            >
              <Thermometer className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
              <p className="text-white text-xs font-bold">Today's Wellness Tip</p>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                Stay hydrated — drink at least 8 glasses of water daily. Facilities teams working outdoors should drink more.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
