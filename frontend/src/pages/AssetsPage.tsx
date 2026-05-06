import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Activity, AlertTriangle, BrainCircuit, ChevronRight, ClipboardList,
  PackageCheck, PlusCircle, RefreshCw, Wrench, X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Header } from '../components/layout/Header'
import { api } from '../api/client'
import type { Asset, MaintenanceLog } from '../types'

const CATEGORIES = ['HVAC', 'Electrical', 'Plumbing', 'Fire Safety', 'Security', 'Elevators', 'IT Infrastructure', 'Furniture', 'Vehicles', 'Kitchen Equipment', 'Other']

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  active:             { bg: 'rgba(16,185,129,0.2)',  color: '#6ee7b7', label: 'Active' },
  under_maintenance:  { bg: 'rgba(245,158,11,0.2)',  color: '#fcd34d', label: 'Under Maintenance' },
  decommissioned:     { bg: 'rgba(107,114,128,0.2)', color: '#9ca3af', label: 'Decommissioned' },
}

function conditionColor(score: number) {
  if (score >= 8) return '#6ee7b7'
  if (score >= 5) return '#fcd34d'
  return '#f87171'
}

function conditionLabel(score: number) {
  if (score >= 8) return 'Excellent'
  if (score >= 6) return 'Good'
  if (score >= 4) return 'Fair'
  return 'Poor'
}

// ─── Add Asset Modal ─────────────────────────────────────────────────────────

function AddAssetModal({ onClose, onSave }: { onClose: () => void; onSave: (data: Partial<Asset>) => void }) {
  const [form, setForm] = useState({ name: '', asset_code: '', category: CATEGORIES[0], location_id: '', purchase_cost: '', useful_life_years: '', notes: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f1624] border border-[#008080]/40 rounded-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-base">Register New Asset</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-500 hover:text-white" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs block mb-1">Asset Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Carrier HVAC Unit 3" className="w-full bg-[#1e3a5f]/40 border border-[#008080]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#008080]" />
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">Asset Code *</label>
              <input value={form.asset_code} onChange={e => set('asset_code', e.target.value)} placeholder="e.g. HVAC-003" className="w-full bg-[#1e3a5f]/40 border border-[#008080]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#008080]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs block mb-1">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full bg-[#1e3a5f]/40 border border-[#008080]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#008080]">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">Location</label>
              <input value={form.location_id} onChange={e => set('location_id', e.target.value)} placeholder="e.g. FP1 — Level 2" className="w-full bg-[#1e3a5f]/40 border border-[#008080]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#008080]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs block mb-1">Purchase Cost (R)</label>
              <input type="number" value={form.purchase_cost} onChange={e => set('purchase_cost', e.target.value)} placeholder="0" className="w-full bg-[#1e3a5f]/40 border border-[#008080]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#008080]" />
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">Useful Life (years)</label>
              <input type="number" value={form.useful_life_years} onChange={e => set('useful_life_years', e.target.value)} placeholder="10" className="w-full bg-[#1e3a5f]/40 border border-[#008080]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#008080]" />
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-xs block mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="w-full bg-[#1e3a5f]/40 border border-[#008080]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#008080] resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-surface-border text-gray-400 text-sm hover:text-white">Cancel</button>
          <button
            onClick={() => {
              if (!form.name.trim() || !form.asset_code.trim()) { toast.error('Name and Asset Code are required'); return }
              onSave({ ...form, purchase_cost: form.purchase_cost ? Number(form.purchase_cost) : null, useful_life_years: form.useful_life_years ? Number(form.useful_life_years) : null })
            }}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#008080' }}
          >
            Register Asset
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Maintenance Modal ────────────────────────────────────────────────────────

function MaintenanceModal({ asset, onClose, onSave }: { asset: Asset; onClose: () => void; onSave: (data: Partial<MaintenanceLog>) => void }) {
  const [form, setForm] = useState({ maintenance_type: 'preventive', description: '', cost: '', performed_by: '', performed_at: new Date().toISOString().slice(0, 16), condition_before: String(asset.condition_score), condition_after: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f1624] border border-amber-500/40 rounded-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-base">Log Maintenance — {asset.name}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-500 hover:text-white" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs block mb-1">Type</label>
              <select value={form.maintenance_type} onChange={e => set('maintenance_type', e.target.value)} className="w-full bg-[#1e3a5f]/40 border border-amber-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                <option value="preventive">Preventive</option>
                <option value="corrective">Corrective</option>
                <option value="inspection">Inspection</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">Performed At</label>
              <input type="datetime-local" value={form.performed_at} onChange={e => set('performed_at', e.target.value)} className="w-full bg-[#1e3a5f]/40 border border-amber-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-xs block mb-1">Description *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="w-full bg-[#1e3a5f]/40 border border-amber-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 resize-none" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-gray-400 text-xs block mb-1">Cost (R)</label>
              <input type="number" value={form.cost} onChange={e => set('cost', e.target.value)} className="w-full bg-[#1e3a5f]/40 border border-amber-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">Condition Before</label>
              <input type="number" step="0.1" min="0" max="10" value={form.condition_before} onChange={e => set('condition_before', e.target.value)} className="w-full bg-[#1e3a5f]/40 border border-amber-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">Condition After</label>
              <input type="number" step="0.1" min="0" max="10" value={form.condition_after} onChange={e => set('condition_after', e.target.value)} className="w-full bg-[#1e3a5f]/40 border border-amber-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-xs block mb-1">Performed By</label>
            <input value={form.performed_by} onChange={e => set('performed_by', e.target.value)} className="w-full bg-[#1e3a5f]/40 border border-amber-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-surface-border text-gray-400 text-sm hover:text-white">Cancel</button>
          <button
            onClick={() => {
              if (!form.description.trim()) { toast.error('Description is required'); return }
              onSave({ ...form, maintenance_type: form.maintenance_type as import('../types').MaintenanceType, cost: form.cost ? Number(form.cost) : null, condition_before: form.condition_before ? Number(form.condition_before) : null, condition_after: form.condition_after ? Number(form.condition_after) : null })
            }}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#f59e0b' }}
          >
            Log Maintenance
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Asset Detail Drawer ──────────────────────────────────────────────────────

function AssetDrawer({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  const qc = useQueryClient()
  const [showMaintModal, setShowMaintModal] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const { data: history = [] } = useQuery({
    queryKey: ['asset-history', asset.id],
    queryFn: () => api.getAssetHistory(asset.id),
  })

  const logMaint = useMutation({
    mutationFn: (data: Partial<MaintenanceLog>) => api.logMaintenance(asset.id, data as Omit<MaintenanceLog, 'id' | 'asset_id'>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-history', asset.id] })
      qc.invalidateQueries({ queryKey: ['assets'] })
      setShowMaintModal(false)
      toast.success('Maintenance logged')
    },
    onError: () => toast.error('Failed to log maintenance'),
  })

  const handleAI = async () => {
    setAiLoading(true)
    try {
      const res = await api.analyseAsset(asset.id)
      setAiAnalysis(res.analysis)
    } catch {
      toast.error('AI analysis failed')
    } finally {
      setAiLoading(false)
    }
  }

  const st = STATUS_STYLE[asset.status] ?? STATUS_STYLE.active

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0f1624] border-l border-[#008080]/30 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-border flex items-start justify-between">
          <div>
            <p className="text-white font-bold text-base">{asset.name}</p>
            <p className="text-gray-500 text-xs mt-0.5">{asset.asset_code} · {asset.category}</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-500 hover:text-white mt-0.5" /></button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5">
          {/* Status + Condition */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 border" style={{ borderColor: st.color + '40', backgroundColor: st.bg }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: st.color }}>Status</p>
              <p className="text-white text-sm font-bold">{st.label}</p>
            </div>
            <div className="rounded-xl p-3 border" style={{ borderColor: conditionColor(asset.condition_score) + '40', backgroundColor: conditionColor(asset.condition_score) + '20' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: conditionColor(asset.condition_score) }}>Condition</p>
              <p className="text-white text-sm font-bold">{asset.condition_score}/10 — {conditionLabel(asset.condition_score)}</p>
            </div>
          </div>

          {/* Key info */}
          <div className="rounded-xl border border-surface-border p-4 space-y-2">
            {[
              { label: 'Location', value: asset.location_id || '—' },
              { label: 'Purchase Cost', value: asset.purchase_cost ? `R ${asset.purchase_cost.toLocaleString()}` : '—' },
              { label: 'Current Value', value: asset.current_value ? `R ${asset.current_value.toLocaleString()}` : '—' },
              { label: 'Useful Life', value: asset.useful_life_years ? `${asset.useful_life_years} years` : '—' },
              { label: 'Last Maintained', value: asset.last_maintained_at ? new Date(asset.last_maintained_at).toLocaleDateString() : 'Never' },
              { label: 'Next Due', value: asset.next_maintenance_due ? new Date(asset.next_maintenance_due).toLocaleDateString() : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500 text-xs">{label}</span>
                <span className="text-white text-xs font-medium">{value}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowMaintModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-900/20"
            >
              <Wrench className="h-3.5 w-3.5" /> Log Maintenance
            </button>
            <button
              onClick={handleAI}
              disabled={aiLoading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-purple-500/40 text-purple-300 text-xs font-semibold hover:bg-purple-900/20 disabled:opacity-50"
            >
              {aiLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <BrainCircuit className="h-3.5 w-3.5" />}
              AI Analysis
            </button>
          </div>

          {/* AI Analysis result */}
          {aiAnalysis && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-900/10 p-4">
              <p className="text-purple-300 font-semibold text-xs uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <BrainCircuit className="h-3.5 w-3.5" /> Claude Analysis
              </p>
              <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-line">{aiAnalysis}</p>
            </div>
          )}

          {/* Maintenance history */}
          <div>
            <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <ClipboardList className="h-3.5 w-3.5 text-teal-400" /> Maintenance History
            </h3>
            {history.length === 0 ? (
              <p className="text-gray-600 text-xs py-4 text-center">No maintenance events recorded</p>
            ) : (
              <div className="space-y-2">
                {history.map(h => (
                  <div key={h.id} className="rounded-lg border border-surface-border p-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-white text-xs font-semibold capitalize">{h.maintenance_type}</span>
                      <span className="text-gray-600 text-xs">{new Date(h.performed_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-400 text-xs">{h.description}</p>
                    <div className="flex gap-3 mt-1.5">
                      {h.cost != null && <span className="text-gray-500 text-xs">R{h.cost.toLocaleString()}</span>}
                      {h.condition_before != null && h.condition_after != null && (
                        <span className="text-gray-500 text-xs">{h.condition_before}→{h.condition_after}/10</span>
                      )}
                      {h.performed_by && <span className="text-gray-500 text-xs">by {h.performed_by}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showMaintModal && (
          <MaintenanceModal
            asset={asset}
            onClose={() => setShowMaintModal(false)}
            onSave={data => logMaint.mutate(data)}
          />
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AssetsPage() {
  const qc = useQueryClient()
  const [filterCat, setFilterCat] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<Asset | null>(null)

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets', filterCat, filterStatus],
    queryFn: () => api.getAssets({ category: filterCat || undefined, status: filterStatus || undefined }),
  })

  const { data: analytics } = useQuery({
    queryKey: ['asset-analytics'],
    queryFn: api.getAssetAnalytics,
  })

  const createAsset = useMutation({
    mutationFn: (data: Partial<Asset>) => api.createAsset(data as Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'status'>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] })
      qc.invalidateQueries({ queryKey: ['asset-analytics'] })
      setShowAdd(false)
      toast.success('Asset registered')
    },
    onError: () => toast.error('Failed to register asset'),
  })

  const stats = analytics ? [
    { label: 'Total Assets',    value: analytics.total_assets,           sub: 'Portfolio size' },
    { label: 'Active',          value: analytics.active_count,           sub: 'Operational' },
    { label: 'Portfolio Value', value: `R${(analytics.total_portfolio_value / 1000).toFixed(0)}k`, sub: 'Current est. value' },
    { label: 'Avg Condition',   value: `${analytics.avg_condition_score}/10`, sub: `${analytics.low_condition_count} low`, alert: analytics.low_condition_count > 0 },
  ] : []

  return (
    <div className="flex flex-col h-full">
      <Header title="Asset Lifecycle" subtitle="Facilities Operations — Portfolio Management" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">

        {/* Stats */}
        {analytics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map(s => (
              <div key={s.label} className="rounded-xl p-4 border-2" style={{ backgroundColor: '#1e3a5f', borderColor: s.alert ? '#ef4444' : '#008080' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: s.alert ? '#f87171' : '#2dd4bf' }}>{s.label}</p>
                <p className="text-2xl font-extrabold text-white">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Overdue alert */}
        {analytics && analytics.overdue_maintenance_count > 0 && (
          <div className="rounded-xl border-2 border-red-500/60 bg-red-900/20 px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
            <p className="text-red-300 text-sm font-semibold">
              {analytics.overdue_maintenance_count} asset{analytics.overdue_maintenance_count > 1 ? 's' : ''} with overdue maintenance — action required
            </p>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-[#1e3a5f]/40 border border-[#008080]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-[#1e3a5f]/40 border border-[#008080]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="under_maintenance">Under Maintenance</option>
            <option value="decommissioned">Decommissioned</option>
          </select>
          <div className="flex-1" />
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#008080' }}
          >
            <PlusCircle className="h-4 w-4" /> Register Asset
          </button>
        </div>

        {/* Asset grid */}
        {isLoading ? (
          <div className="text-center py-20 text-gray-600">Loading assets...</div>
        ) : assets.length === 0 ? (
          <div className="text-center py-20">
            <PackageCheck className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No assets registered yet</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 text-teal-400 text-sm hover:underline">Register your first asset →</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {assets.map(asset => {
              const st = STATUS_STYLE[asset.status] ?? STATUS_STYLE.active
              return (
                <button
                  key={asset.id}
                  onClick={() => setSelected(asset)}
                  className="bg-[#1e3a5f]/30 border border-[#008080]/20 rounded-xl p-4 text-left hover:border-[#008080]/60 hover:bg-[#1e3a5f]/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#008080' + '30' }}>
                      <Activity className="h-4 w-4" style={{ color: '#2dd4bf' }} />
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                  <p className="text-white text-sm font-bold leading-tight mb-0.5">{asset.name}</p>
                  <p className="text-gray-500 text-xs mb-3">{asset.asset_code} · {asset.category}</p>

                  {/* Condition bar */}
                  <div className="mb-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600 text-xs">Condition</span>
                      <span className="text-xs font-semibold" style={{ color: conditionColor(asset.condition_score) }}>{asset.condition_score}/10</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${asset.condition_score * 10}%`, backgroundColor: conditionColor(asset.condition_score) }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs">{asset.location_id || 'No location'}</span>
                    <ChevronRight className="h-4 w-4 text-gray-700 group-hover:text-teal-400" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {showAdd && <AddAssetModal onClose={() => setShowAdd(false)} onSave={data => createAsset.mutate(data)} />}
      {selected && <AssetDrawer asset={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
