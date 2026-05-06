import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Hammer,
  Plus,
  Search,
  Wrench,
  Zap,
  Thermometer,
  Droplets,
  Shield,
  XCircle,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'

// ─── Types & constants ────────────────────────────────────────────────────────

type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed'
type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low'
type TicketCategory = 'Electrical' | 'Plumbing' | 'HVAC' | 'Structural' | 'Security' | 'General'

interface Ticket {
  id: string
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  submittedBy: string
  department: string
  location: string
  submittedAt: string
  updatedAt: string
  assignedTo?: string
  workOrder?: string
}

const STATUS_STYLE: Record<TicketStatus, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  Open:        { bg: 'bg-red-900/30',    text: 'text-red-400',    icon: AlertTriangle },
  'In Progress': { bg: 'bg-amber-900/30', text: 'text-amber-400', icon: Clock },
  Resolved:    { bg: 'bg-green-900/30',  text: 'text-green-400',  icon: CheckCircle2 },
  Closed:      { bg: 'bg-gray-800',      text: 'text-gray-400',   icon: XCircle },
}

const PRIORITY_STYLE: Record<TicketPriority, { dot: string; label: string }> = {
  Critical: { dot: 'bg-red-500',    label: 'text-red-400' },
  High:     { dot: 'bg-orange-500', label: 'text-orange-400' },
  Medium:   { dot: 'bg-amber-500',  label: 'text-amber-400' },
  Low:      { dot: 'bg-green-500',  label: 'text-green-400' },
}

const CATEGORY_ICON: Record<TicketCategory, typeof Wrench> = {
  Electrical: Zap,
  Plumbing:   Droplets,
  HVAC:       Thermometer,
  Structural: Hammer,
  Security:   Shield,
  General:    Wrench,
}

const MOCK_TICKETS: Ticket[] = [
  {
    id: 'TKT-2025-0041',
    title: 'Aircon unit not cooling — Meeting Room 3B',
    description: 'The HVAC unit in Meeting Room 3B stopped cooling. Room temperature is 28°C. Meeting scheduled for 10:00.',
    category: 'HVAC', priority: 'Critical', status: 'In Progress',
    submittedBy: 'Zanele Dlamini', department: 'Finance', location: 'Floor 3 — Block B',
    submittedAt: '2025-09-15 07:42', updatedAt: '2025-09-15 08:10', assignedTo: 'Sipho Ndlovu', workOrder: 'WO-2025-0281',
  },
  {
    id: 'TKT-2025-0040',
    title: 'Flickering lights — Open Plan FP2',
    description: 'Lights in the north-east section of FP2 open plan have been flickering intermittently since Monday.',
    category: 'Electrical', priority: 'High', status: 'Open',
    submittedBy: 'Thandeka Mokoena', department: 'Operations', location: 'Floor 2 — FP2',
    submittedAt: '2025-09-15 08:01', updatedAt: '2025-09-15 08:01',
  },
  {
    id: 'TKT-2025-0039',
    title: 'Blocked drain — Ladies bathroom Level 1',
    description: 'Basin drain is completely blocked. Water pooling on the floor. Out of order sign placed.',
    category: 'Plumbing', priority: 'High', status: 'In Progress',
    submittedBy: 'Reception Desk', department: 'Facilities', location: 'Level 1 — Ladies Bathroom',
    submittedAt: '2025-09-14 16:30', updatedAt: '2025-09-15 07:55', assignedTo: 'Bongani Khumalo', workOrder: 'WO-2025-0280',
  },
  {
    id: 'TKT-2025-0038',
    title: 'Access card reader malfunction — Gate 2',
    description: 'Card reader at Gate 2 (parking entrance) not reading cards reliably. Staff having to tailgate.',
    category: 'Security', priority: 'High', status: 'Open',
    submittedBy: 'Security Control Room', department: 'Security', location: 'Basement — Gate 2',
    submittedAt: '2025-09-14 14:15', updatedAt: '2025-09-14 14:15',
  },
  {
    id: 'TKT-2025-0037',
    title: 'Broken window latch — Office 204',
    description: 'Window latch in office 204 is broken. Window cannot be secured. Safety concern.',
    category: 'Structural', priority: 'Medium', status: 'Open',
    submittedBy: 'Mpho Sithole', department: 'HR', location: 'Floor 2 — Office 204',
    submittedAt: '2025-09-14 11:00', updatedAt: '2025-09-14 11:00',
  },
  {
    id: 'TKT-2025-0036',
    title: 'Replace expired fire extinguisher — Kitchen L3',
    description: 'Fire extinguisher in Level 3 kitchen expired in August. Needs immediate replacement.',
    category: 'General', priority: 'Medium', status: 'Resolved',
    submittedBy: 'Nokukhanya Zulu', department: 'IT', location: 'Floor 3 — Kitchen',
    submittedAt: '2025-09-13 09:20', updatedAt: '2025-09-14 15:40', assignedTo: 'Thabo Mthembu', workOrder: 'WO-2025-0278',
  },
  {
    id: 'TKT-2025-0035',
    title: 'Projector bulb replacement — Boardroom',
    description: 'Boardroom projector showing "Lamp End of Life" warning. Please replace before Thursday board meeting.',
    category: 'Electrical', priority: 'Medium', status: 'Resolved',
    submittedBy: 'PA to CEO', department: 'Executive', location: 'Ground Floor — Boardroom',
    submittedAt: '2025-09-12 13:00', updatedAt: '2025-09-13 10:30', assignedTo: 'Sipho Ndlovu', workOrder: 'WO-2025-0275',
  },
  {
    id: 'TKT-2025-0034',
    title: 'Hot water geyser pressure issue — Staff showers',
    description: 'Low hot water pressure in staff shower area. Cold water pressure normal.',
    category: 'Plumbing', priority: 'Low', status: 'Closed',
    submittedBy: 'Lerato Kekana', department: 'Facilities', location: 'Basement — Change Rooms',
    submittedAt: '2025-09-10 07:30', updatedAt: '2025-09-12 14:00', assignedTo: 'Bongani Khumalo', workOrder: 'WO-2025-0271',
  },
]

const STATS = [
  { label: 'Open Tickets',      value: '4',  color: 'text-red-400',   sub: '2 critical / high' },
  { label: 'In Progress',       value: '2',  color: 'text-amber-400', sub: 'Technicians assigned' },
  { label: 'Resolved Today',    value: '1',  color: 'text-green-400', sub: 'Avg resolution 6.2h' },
  { label: 'Total This Month',  value: '41', color: 'text-teal-400',  sub: '93% resolved on time' },
]

// ─── New Ticket Modal ─────────────────────────────────────────────────────────

interface NewTicketModalProps { onClose: () => void }

function NewTicketModal({ onClose }: NewTicketModalProps) {
  const [form, setForm] = useState({
    title: '', category: 'General' as TicketCategory, priority: 'Medium' as TicketPriority,
    department: '', location: '', description: '',
  })

  const input = 'w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-lg rounded-2xl border-2 border-[#008080]/60 p-6 space-y-4" style={{ backgroundColor: '#1e3a5f' }}>
        <h2 className="text-white font-bold text-lg">Log New Ticket</h2>

        <div className="space-y-3">
          <input className={input} placeholder="Ticket title / summary" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />

          <div className="grid grid-cols-2 gap-3">
            <select className={input} value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as TicketCategory }))}>
              {(['Electrical','Plumbing','HVAC','Structural','Security','General'] as TicketCategory[]).map(c =>
                <option key={c}>{c}</option>)}
            </select>
            <select className={input} value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value as TicketPriority }))}>
              {(['Critical','High','Medium','Low'] as TicketPriority[]).map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input className={input} placeholder="Department" value={form.department}
              onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
            <input className={input} placeholder="Location / Room" value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>

          <textarea className={`${input} resize-none`} rows={4} placeholder="Describe the fault or request in detail..."
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors">
            Cancel
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: '#008080' }}>
            Submit Ticket
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TicketsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'All'>('All')
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'All'>('All')
  const [showModal, setShowModal] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = MOCK_TICKETS.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) || t.department.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || t.status === statusFilter
    const matchPriority = priorityFilter === 'All' || t.priority === priorityFilter
    return matchSearch && matchStatus && matchPriority
  })

  return (
    <div className="flex flex-col h-full">
      <Header title="Help Desk Tickets" subtitle="Service requests, faults & work orders" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">

        {/* Stats strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STATS.map(s => (
            <Card key={s.label} className="flex items-center gap-3 py-3">
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-white font-semibold">{s.label}</p>
                <p className="text-xs text-gray-500">{s.sub}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              className="w-full bg-[#1e293b] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
              placeholder="Search by title, ID or department…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Filter className="my-auto h-4 w-4 text-gray-500 shrink-0" />
            <select
              className="bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as TicketStatus | 'All')}
            >
              <option value="All">All Statuses</option>
              {(['Open','In Progress','Resolved','Closed'] as TicketStatus[]).map(s => <option key={s}>{s}</option>)}
            </select>
            <select
              className="bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as TicketPriority | 'All')}
            >
              <option value="All">All Priorities</option>
              {(['Critical','High','Medium','Low'] as TicketPriority[]).map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shrink-0 transition-colors"
            style={{ backgroundColor: '#008080' }}
          >
            <Plus className="h-4 w-4" /> New Ticket
          </button>
        </div>

        {/* Ticket list */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <Card className="text-center py-12 text-gray-500">No tickets match your filters.</Card>
          )}

          {filtered.map(ticket => {
            const StatusIcon = STATUS_STYLE[ticket.status].icon
            const CategoryIcon = CATEGORY_ICON[ticket.category]
            const isExpanded = expandedId === ticket.id

            return (
              <div
                key={ticket.id}
                className="rounded-2xl border-2 overflow-hidden transition-all cursor-pointer"
                style={{ backgroundColor: '#1e3a5f', borderColor: 'rgba(0,128,128,0.4)' }}
                onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
              >
                {/* Ticket header row */}
                <div className="p-4 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: 'rgba(0,128,128,0.2)' }}>
                    <CategoryIcon className="h-4 w-4" style={{ color: '#2dd4bf' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500">{ticket.id}</span>
                      {ticket.workOrder && (
                        <span className="text-xs font-mono text-gray-600">{ticket.workOrder}</span>
                      )}
                    </div>
                    <p className="text-white font-semibold text-sm leading-snug">{ticket.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{ticket.location} · {ticket.department}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {/* Status badge */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[ticket.status].bg} ${STATUS_STYLE[ticket.status].text}`}>
                      <StatusIcon className="h-3 w-3" />
                      {ticket.status}
                    </span>
                    {/* Priority dot */}
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${PRIORITY_STYLE[ticket.priority].label}`}>
                      <span className={`h-2 w-2 rounded-full ${PRIORITY_STYLE[ticket.priority].dot}`} />
                      {ticket.priority}
                    </span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-[#008080]/20 pt-3 space-y-3">
                    <p className="text-sm text-gray-300">{ticket.description}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-400">
                      <div><span className="text-gray-500">Submitted by:</span><br />{ticket.submittedBy}</div>
                      <div><span className="text-gray-500">Logged:</span><br />{ticket.submittedAt}</div>
                      <div><span className="text-gray-500">Updated:</span><br />{ticket.updatedAt}</div>
                      {ticket.assignedTo && (
                        <div><span className="text-gray-500">Assigned to:</span><br />{ticket.assignedTo}</div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#008080]/60 text-teal-400 hover:bg-[#008080]/10 transition-colors">
                        Update Status
                      </button>
                      <button className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-700 text-gray-400 hover:bg-gray-700/30 transition-colors">
                        Add Note
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>

      {showModal && <NewTicketModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
