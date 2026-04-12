import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Activity, ClipboardList, CheckCircle, XCircle, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { Header } from '../components/layout/Header'
import { api } from '../api/client'
import type { AdminUserSummary, AuditEntry } from '../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  admin:               'text-red-400 bg-red-400/10 border-red-400/30',
  facilities_manager:  'text-teal-400 bg-teal-400/10 border-teal-400/30',
  technician:          'text-blue-400 bg-blue-400/10 border-blue-400/30',
  viewer:              'text-gray-400 bg-gray-400/10 border-gray-400/30',
}

const ROLES = ['viewer', 'technician', 'facilities_manager', 'admin']

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-ZA', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-xl p-5 border-2" style={{ backgroundColor: '#1e3a5f', borderColor: '#008080' }}>
      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">{label}</p>
      <p className="text-3xl font-black text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

// ─── User row ─────────────────────────────────────────────────────────────────

function UserRow({ user, onRoleChange, onToggleActive, isUpdating }: {
  user: AdminUserSummary
  onRoleChange: (id: string, role: string) => void
  onToggleActive: (id: string, active: boolean) => void
  isUpdating: boolean
}) {
  const [showRoles, setShowRoles] = useState(false)

  return (
    <tr className="border-b" style={{ borderColor: 'rgba(0,128,128,0.15)' }}>
      <td className="py-3 px-4">
        <p className="text-sm text-white font-medium">{user.full_name}</p>
        <p className="text-xs text-gray-500">{user.email}</p>
      </td>
      <td className="py-3 px-4">
        <div className="relative inline-block">
          <button
            onClick={() => setShowRoles(v => !v)}
            disabled={isUpdating}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${ROLE_COLORS[user.role] ?? ROLE_COLORS.viewer}`}
          >
            {user.role.replace('_', ' ')}
            <ChevronDown className="h-3 w-3" />
          </button>
          {showRoles && (
            <div
              className="absolute left-0 top-8 z-10 rounded-xl border overflow-hidden shadow-xl"
              style={{ backgroundColor: '#0f172a', borderColor: '#008080', minWidth: 160 }}
            >
              {ROLES.map(r => (
                <button
                  key={r}
                  onClick={() => { onRoleChange(user.id, r); setShowRoles(false) }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 transition-colors"
                >
                  {r.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>
      </td>
      <td className="py-3 px-4 text-xs text-gray-500">{fmtDate(user.created_at)}</td>
      <td className="py-3 px-4">
        <button
          onClick={() => onToggleActive(user.id, !user.is_active)}
          disabled={isUpdating}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: user.is_active ? '#34d399' : '#f87171' }}
        >
          {user.is_active
            ? <><CheckCircle className="h-3.5 w-3.5" /> Active</>
            : <><XCircle className="h-3.5 w-3.5" /> Inactive</>
          }
        </button>
      </td>
    </tr>
  )
}

// ─── Audit row ────────────────────────────────────────────────────────────────

function AuditRow({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false)
  const actionColor = entry.action.includes('deleted') || entry.action.includes('deactivate')
    ? '#f87171'
    : entry.action.includes('created')
      ? '#34d399'
      : '#9ca3af'

  return (
    <>
      <tr
        className="border-b cursor-pointer hover:bg-white/2 transition-colors"
        style={{ borderColor: 'rgba(0,128,128,0.15)' }}
        onClick={() => setExpanded(v => !v)}
      >
        <td className="py-2.5 px-4 text-xs text-gray-500 font-mono whitespace-nowrap">{fmt(entry.created_at)}</td>
        <td className="py-2.5 px-4 text-xs text-gray-400">{entry.user_email ?? '—'}</td>
        <td className="py-2.5 px-4">
          <span className="text-xs font-mono font-semibold" style={{ color: actionColor }}>{entry.action}</span>
        </td>
        <td className="py-2.5 px-4 text-xs text-gray-500">{entry.resource_type}</td>
        <td className="py-2.5 px-4 text-xs text-gray-600 font-mono">{entry.resource_id?.slice(0, 8) ?? '—'}</td>
      </tr>
      {expanded && entry.details && (
        <tr style={{ backgroundColor: 'rgba(0,128,128,0.04)' }}>
          <td colSpan={5} className="px-4 py-2">
            <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
              {JSON.stringify(entry.details, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'users' | 'audit'

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [auditPage, setAuditPage] = useState(0)
  const [auditFilter, setAuditFilter] = useState('')
  const qc = useQueryClient()

  const { data: dash, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.getAdminDashboard(),
    staleTime: 30_000,
  })

  const { data: auditData } = useQuery({
    queryKey: ['audit-log', auditPage, auditFilter],
    queryFn: () => api.getAuditLog({
      limit: 50,
      offset: auditPage * 50,
      action: auditFilter || undefined,
    }),
    staleTime: 15_000,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { role?: string; is_active?: boolean } }) =>
      api.updateUser(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
      toast.success('User updated')
    },
    onError: () => toast.error('Update failed'),
  })

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview',     icon: <Activity className="h-4 w-4" /> },
    { id: 'users',    label: 'Users',         icon: <Users className="h-4 w-4" /> },
    { id: 'audit',    label: 'Audit Log',     icon: <ClipboardList className="h-4 w-4" /> },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Admin Portal"
        subtitle="System administration — users, roles, and audit trail"
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: '#1e3a5f' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              style={tab === t.id
                ? { backgroundColor: '#008080', color: '#fff' }
                : { color: '#9ca3af' }
              }
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── Overview ── */}
        {tab === 'overview' && dash && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard label="Total Users"       value={dash.total_users}               sub={`${dash.active_users} active`} />
              <KpiCard label="Decompositions"    value={dash.total_decompositions}      sub="all time" />
              <KpiCard label="This Week"         value={dash.decompositions_this_week}  sub="decompositions" />
              <KpiCard label="This Month"        value={dash.decompositions_this_month} sub="decompositions" />
            </div>

            {/* Recent audit */}
            <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: '#008080' }}>
              <div className="px-4 py-3 border-b" style={{ backgroundColor: 'rgba(0,128,128,0.1)', borderColor: 'rgba(0,128,128,0.25)' }}>
                <p className="text-xs font-bold text-white uppercase tracking-widest">Recent Activity</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(0,128,128,0.06)' }}>
                      {['Time', 'User', 'Action', 'Resource', 'ID'].map(h => (
                        <th key={h} className="py-2 px-4 text-left text-xs text-gray-500 font-semibold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dash.recent_audit.map(e => <AuditRow key={e.id} entry={e} />)}
                    {dash.recent_audit.length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-sm text-gray-600">No audit entries yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Users ── */}
        {tab === 'users' && dash && (
          <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: '#008080' }}>
            <div className="px-4 py-3 border-b" style={{ backgroundColor: 'rgba(0,128,128,0.1)', borderColor: 'rgba(0,128,128,0.25)' }}>
              <p className="text-xs font-bold text-white uppercase tracking-widest">
                User Management — {dash.total_users} users
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: 'rgba(0,128,128,0.06)' }}>
                    {['Name / Email', 'Role', 'Joined', 'Status'].map(h => (
                      <th key={h} className="py-2 px-4 text-left text-xs text-gray-500 font-semibold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dash.users.map(u => (
                    <UserRow
                      key={u.id}
                      user={u}
                      isUpdating={updateMutation.isPending}
                      onRoleChange={(id, role) => updateMutation.mutate({ id, payload: { role } })}
                      onToggleActive={(id, is_active) => updateMutation.mutate({ id, payload: { is_active } })}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Audit Log ── */}
        {tab === 'audit' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Filter by action…"
                value={auditFilter}
                onChange={e => { setAuditFilter(e.target.value); setAuditPage(0) }}
                className="px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600 border outline-none focus:border-teal-400 transition-colors"
                style={{ backgroundColor: '#1e3a5f', borderColor: 'rgba(0,128,128,0.4)', width: 240 }}
              />
              {auditData && (
                <p className="text-xs text-gray-500">{auditData.total.toLocaleString()} entries</p>
              )}
            </div>

            <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: '#008080' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(0,128,128,0.06)' }}>
                      {['Time', 'User', 'Action', 'Resource', 'ID'].map(h => (
                        <th key={h} className="py-2 px-4 text-left text-xs text-gray-500 font-semibold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {auditData?.items.map(e => <AuditRow key={e.id} entry={e} />)}
                    {auditData?.items.length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-sm text-gray-600">No audit entries found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {auditData && auditData.total > 50 && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setAuditPage(p => Math.max(0, p - 1))}
                  disabled={auditPage === 0}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                  style={{ backgroundColor: '#1e3a5f' }}
                >
                  ← Previous
                </button>
                <p className="text-xs text-gray-500">
                  Page {auditPage + 1} of {Math.ceil(auditData.total / 50)}
                </p>
                <button
                  onClick={() => setAuditPage(p => p + 1)}
                  disabled={(auditPage + 1) * 50 >= auditData.total}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                  style={{ backgroundColor: '#1e3a5f' }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
