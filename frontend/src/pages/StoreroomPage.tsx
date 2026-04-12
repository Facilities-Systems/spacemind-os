import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Minus,
  Package,
  PackageOpen,
  Plus,
  Printer,
  QrCode,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  Pencil,
  X,
  CornerDownLeft,
  Boxes,
  FileText,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { api } from '../api/client'
import {
  useStoreroom,
  CATEGORIES,
  DEPARTMENTS,
  ROLES,
  STOCK_STYLE,
  TX_STYLE,
  REQ_STYLE,
  PRIORITY_STYLE,
  type InventoryItem,
  type ItemCategory,
  type StockPriority,
  type TxStatus,
} from '../hooks/useStoreroom'
import type { SignOutTx } from '../types'

// ─── Form defaults ────────────────────────────────────────────────────────────

const defaultItemForm = {
  name: '', code: '', category: 'Tools' as ItemCategory,
  quantity: 0, unit: 'Pcs', min_level: 5, location: '',
}

const defaultSignOutForm = {
  item_id: '', quantity: 1, borrower: '', department: '',
  work_order: '', expected_return: '', notes: '',
}

const defaultReqForm = {
  requester: '', role: '', department: '', work_order: '',
  priority: 'Medium' as StockPriority, items_description: '', notes: '',
}

// ─── Shared input style ───────────────────────────────────────────────────────

const inp = {
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(0,128,128,0.4)',
  borderRadius: 8,
  color: '#fff',
  padding: '7px 12px',
  fontSize: 13,
  width: '100%',
  outline: 'none',
} as const

const sel = { ...inp, cursor: 'pointer' } as const

// ─── Stewardship computation ──────────────────────────────────────────────────

function computeStewardship(transactions: SignOutTx[]) {
  const map = new Map<string, { borrower: string; dept: string | null; total: number; returned: number; overdue: number }>()
  for (const tx of transactions) {
    const prev = map.get(tx.borrower) ?? { borrower: tx.borrower, dept: tx.department, total: 0, returned: 0, overdue: 0 }
    prev.total++
    if (tx.status === 'Returned') prev.returned++
    if (tx.status === 'Overdue')  prev.overdue++
    map.set(tx.borrower, prev)
  }
  return Array.from(map.values())
    .map(e => ({ ...e, rate: e.total > 0 ? Math.round((e.returned / e.total) * 100) : 0 }))
    .sort((a, b) => b.rate - a.rate)
}

function rankOf(rate: number) {
  if (rate === 100) return { label: '⭐ Exemplary', color: '#6ee7b7' }
  if (rate >= 80)   return { label: '✅ Good',      color: '#a5b4fc' }
  if (rate >= 60)   return { label: '⚠️ Fair',      color: '#fcd34d' }
  return                   { label: '🔴 Poor',      color: '#f87171' }
}

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = 'inventory' | 'signout' | 'compliance' | 'cameras' | 'requisitions'

// ─── Camera data ─────────────────────────────────────────────────────────────

const CAMERAS = [
  { num: 1, name: 'Main Entrance',     location: 'Storeroom Door — South' },
  { num: 2, name: 'Shelving Aisle A',  location: 'Electrical & Plumbing Row' },
  { num: 3, name: 'Shelving Aisle B',  location: 'Tools & Equipment Row' },
  { num: 4, name: 'Issue Counter',     location: 'Sign-Out Desk — North Wall' },
]

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-lg rounded-2xl p-6 border-2"
        style={{ backgroundColor: '#1e293b', borderColor: '#008080', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-sm tracking-wide uppercase">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function StoreroomPage() {
  const {
    items, transactions, requisitions, isLoading,
    addItem, updateItem, deleteItem,
    signOut, returnItem,
    addRequisition, updateReqStatus,
    itemStockStatus,
  } = useStoreroom()

  // Tab
  const [tab, setTab] = useState<Tab>('inventory')

  // ── Inventory tab state ──
  const [search, setSearch]           = useState('')
  const [catFilter, setCatFilter]     = useState<ItemCategory | 'All'>('All')
  const [stockFilter, setStockFilter] = useState<'All' | 'Low' | 'Critical'>('All')

  // ── Sign-out tab state ──
  const [txStatus, setTxStatus] = useState<TxStatus | 'All'>('All')
  const [txDept, setTxDept]     = useState('All')

  // ── QR modal ──
  const [qrItemId, setQrItemId] = useState<string | null>(null)
  const { data: qrData, isFetching: qrLoading } = useQuery({
    queryKey: ['inventory', 'qr', qrItemId],
    queryFn:  () => api.getItemQr(qrItemId!),
    enabled:  !!qrItemId,
    staleTime: Infinity,
  })

  // ── Compliance data ──
  const { data: compliance } = useQuery({
    queryKey: ['inventory', 'compliance'],
    queryFn:  api.getComplianceAnalytics,
    staleTime: 60_000,
  })

  // ── Modals ──
  const [addItemOpen,  setAddItemOpen]  = useState(false)
  const [editItem,     setEditItem]     = useState<InventoryItem | null>(null)
  const [deleteId,     setDeleteId]     = useState<string | null>(null)
  const [signOutOpen,  setSignOutOpen]  = useState(false)
  const [reqOpen,      setReqOpen]      = useState(false)

  // ── Form state ──
  const [itemForm,    setItemForm]    = useState(defaultItemForm)
  const [signOutForm, setSignOutForm] = useState(defaultSignOutForm)
  const [reqForm,     setReqForm]     = useState(defaultReqForm)
  const [formError,   setFormError]   = useState('')

  // Camera clock
  const [clock, setClock] = useState('')
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // ── Computed ──
  const filteredItems = items.filter(item => {
    if (catFilter !== 'All' && item.category !== catFilter) return false
    if (stockFilter === 'Low'      && itemStockStatus(item.quantity, item.min_level) !== 'Low')      return false
    if (stockFilter === 'Critical' && itemStockStatus(item.quantity, item.min_level) !== 'Critical') return false
    const q = search.toLowerCase()
    if (q && !item.name.toLowerCase().includes(q) && !item.code.toLowerCase().includes(q)) return false
    return true
  })

  const filteredTxs = transactions.filter(tx => {
    if (txStatus !== 'All' && tx.status !== txStatus)   return false
    if (txDept   !== 'All' && tx.department !== txDept) return false
    return true
  })

  const lowCount      = items.filter(i => itemStockStatus(i.quantity, i.min_level) === 'Low').length
  const criticalCount = items.filter(i => itemStockStatus(i.quantity, i.min_level) === 'Critical').length
  const outstanding   = transactions.filter(tx => tx.status === 'Outstanding').length
  const overdue       = transactions.filter(tx => tx.status === 'Overdue').length
  const pendingReqs   = requisitions.filter(r => r.status === 'Pending').length

  const stewardship = computeStewardship(transactions)

  const allDepts = Array.from(new Set(transactions.map(t => t.department).filter(Boolean))).sort() as string[]

  // ── Sign-out form helpers ──
  const soItem = items.find(i => i.id === signOutForm.item_id)
  const maxQty = soItem?.quantity ?? 0

  // ── Handlers ──
  function handleAddItem() {
    if (!itemForm.name.trim() || !itemForm.code.trim() || !itemForm.location.trim()) {
      setFormError('Name, Code, and Location are required.')
      return
    }
    addItem.mutate({
      name:      itemForm.name,
      code:      itemForm.code,
      category:  itemForm.category,
      quantity:  itemForm.quantity,
      unit:      itemForm.unit,
      min_level: itemForm.min_level,
      location:  itemForm.location,
      notes:     null,
    })
    setAddItemOpen(false)
    setItemForm(defaultItemForm)
    setFormError('')
  }

  function openEditItem(item: InventoryItem) {
    setEditItem(item)
    setItemForm({
      name: item.name, code: item.code, category: item.category,
      quantity: item.quantity, unit: item.unit, min_level: item.min_level,
      location: item.location ?? '',
    })
    setFormError('')
  }

  function handleUpdateItem() {
    if (!editItem) return
    if (!itemForm.name.trim() || !itemForm.code.trim() || !itemForm.location.trim()) {
      setFormError('Name, Code, and Location are required.')
      return
    }
    updateItem.mutate({
      id:        editItem.id,
      name:      itemForm.name,
      category:  itemForm.category,
      quantity:  itemForm.quantity,
      unit:      itemForm.unit,
      min_level: itemForm.min_level,
      location:  itemForm.location,
    })
    setEditItem(null)
    setItemForm(defaultItemForm)
    setFormError('')
  }

  function handleSignOut() {
    if (!signOutForm.item_id || !signOutForm.borrower.trim() || !signOutForm.work_order.trim() || !signOutForm.expected_return) {
      setFormError('Item, Borrower, WO/REQ, and Expected Return are required.')
      return
    }
    if (signOutForm.quantity < 1 || signOutForm.quantity > maxQty) {
      setFormError(`Quantity must be between 1 and ${maxQty}.`)
      return
    }
    signOut.mutate({
      item_id:         signOutForm.item_id,
      quantity:        signOutForm.quantity,
      borrower:        signOutForm.borrower,
      department:      signOutForm.department || undefined,
      work_order:      signOutForm.work_order,
      expected_return: signOutForm.expected_return,
      notes:           signOutForm.notes || undefined,
    })
    setSignOutOpen(false)
    setSignOutForm(defaultSignOutForm)
    setFormError('')
  }

  function handleAddReq() {
    if (!reqForm.requester.trim() || !reqForm.work_order.trim() || !reqForm.items_description.trim()) {
      setFormError('Requester, WO/REQ, and Items Needed are required.')
      return
    }
    addRequisition.mutate({
      requester:         reqForm.requester,
      role:              reqForm.role || undefined,
      department:        reqForm.department || undefined,
      work_order:        reqForm.work_order,
      priority:          reqForm.priority,
      items_description: reqForm.items_description,
      notes:             reqForm.notes || undefined,
    })
    setReqOpen(false)
    setReqForm(defaultReqForm)
    setFormError('')
  }

  // ── Reorder analytics from the analytics query (hook doesn't expose yet — derive from items) ──
  const reorderItems = items.filter(i => i.min_level > 0 && i.quantity <= i.min_level)
    .map(i => ({
      item_id: i.id, item_code: i.code, item_name: i.name,
      current_qty: i.quantity, min_level: i.min_level,
      deficit: Math.max(0, i.min_level - i.quantity),
      suggested_reorder_qty: Math.max(1, (i.min_level * 2) - i.quantity),
    }))
  const criticalReorder = reorderItems.filter(r => r.current_qty === 0)

  // ── Tab config ──
  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'inventory',    label: 'Inventory',    icon: <Boxes className="h-4 w-4" />,        badge: criticalCount + lowCount || undefined },
    { key: 'signout',      label: 'Sign-Out',     icon: <ClipboardList className="h-4 w-4" />, badge: overdue || undefined },
    { key: 'compliance',   label: 'Compliance',   icon: <ShieldCheck className="h-4 w-4" /> },
    { key: 'cameras',      label: 'Cameras',      icon: <Camera className="h-4 w-4" /> },
    { key: 'requisitions', label: 'Requisitions', icon: <FileText className="h-4 w-4" />,     badge: pendingReqs || undefined },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header title="Storeroom" subtitle="Facilities Operations — Inventory, Sign-Out & Requisitions" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-5">

        {/* ── Stats strip ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total SKUs',      value: items.length,   color: '#008080', alert: false },
            { label: 'Low Stock',       value: lowCount,        color: '#f59e0b', alert: lowCount > 0 },
            { label: 'Critical / Zero', value: criticalCount,   color: '#ef4444', alert: criticalCount > 0 },
            { label: 'Outstanding',     value: outstanding,     color: '#6366f1', alert: false },
            { label: 'Overdue',         value: overdue,         color: '#ef4444', alert: overdue > 0 },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-xl p-4 border-2"
              style={{ backgroundColor: '#1e3a5f', borderColor: s.alert ? s.color : '#008080' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: s.color }}>{s.label}</p>
              <p className="text-2xl font-extrabold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: '#1e3a5f' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={tab === t.key
                ? { backgroundColor: '#008080', color: '#fff' }
                : { color: '#9ca3af' }
              }
            >
              {t.icon}
              {t.label}
              {t.badge !== undefined && (
                <span
                  className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full text-xs font-bold flex items-center justify-center"
                  style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: 9 }}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            INVENTORY TAB
        ═══════════════════════════════════════════════════════════════ */}
        {tab === 'inventory' && (
          <div className="space-y-4">

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  style={{ ...inp, paddingLeft: 36 }}
                  placeholder="Search name or code…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* Category filter */}
              <div className="relative">
                <select
                  style={sel}
                  value={catFilter}
                  onChange={e => setCatFilter(e.target.value as ItemCategory | 'All')}
                  className="pr-8 appearance-none"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>

              {/* Stock filter */}
              <div className="relative">
                <select
                  style={sel}
                  value={stockFilter}
                  onChange={e => setStockFilter(e.target.value as 'All' | 'Low' | 'Critical')}
                  className="pr-8 appearance-none"
                >
                  <option value="All">All Stock Levels</option>
                  <option value="Low">Low Stock</option>
                  <option value="Critical">Critical / Zero</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>

              {/* Add item */}
              <button
                onClick={() => { setAddItemOpen(true); setFormError('') }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                style={{ backgroundColor: '#008080', color: '#fff' }}
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>

            {/* Critical reorder banner */}
            {criticalReorder.length > 0 && (
              <div
                className="flex flex-wrap items-start gap-3 px-4 py-3 rounded-xl text-sm"
                style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)' }}
              >
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs mb-1.5" style={{ color: '#f87171' }}>
                    {criticalReorder.length} item{criticalReorder.length > 1 ? 's' : ''} at zero stock — immediate reorder required
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {criticalReorder.map(r => (
                      <span key={r.item_id} className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>
                        {r.item_code} · reorder {r.suggested_reorder_qty} {items.find(i => i.id === r.item_id)?.unit ?? 'units'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Low stock banner */}
            {lowCount > 0 && criticalReorder.length === 0 && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)', color: '#fcd34d' }}
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{lowCount} item{lowCount > 1 ? 's' : ''} below minimum level — review stock soon</span>
              </div>
            )}

            {/* Table */}
            <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: '#008080' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(0,128,128,0.15)' }}>
                      {['Code', 'Item Name', 'Category', 'Qty', 'Unit', 'Min', 'Location', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#2dd4bf' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500 text-sm">Loading inventory…</td></tr>
                    ) : filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-gray-500 text-sm">
                          No items match your filters.
                        </td>
                      </tr>
                    ) : filteredItems.map((item, i) => {
                      const st  = itemStockStatus(item.quantity, item.min_level)
                      const sty = STOCK_STYLE[st]
                      return (
                        <tr
                          key={item.id}
                          className="border-t transition-colors"
                          style={{ borderColor: 'rgba(0,128,128,0.15)', backgroundColor: i % 2 === 0 ? '#1e3a5f' : 'rgba(30,58,95,0.5)' }}
                        >
                          <td className="px-3 py-2.5 font-mono text-xs text-teal-300 whitespace-nowrap">{item.code}</td>
                          <td className="px-3 py-2.5 text-white font-medium">{item.name}</td>
                          <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">{item.category}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateItem.mutate({ id: item.id, quantity: Math.max(0, item.quantity - 1) })}
                                className="h-5 w-5 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span
                                className="font-bold min-w-8 text-center"
                                style={{ color: item.quantity === 0 ? '#f87171' : item.quantity < item.min_level ? '#fcd34d' : '#6ee7b7' }}
                              >
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateItem.mutate({ id: item.id, quantity: item.quantity + 1 })}
                                className="h-5 w-5 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-gray-500 text-xs">{item.unit}</td>
                          <td className="px-3 py-2.5 text-gray-500">{item.min_level}</td>
                          <td className="px-3 py-2.5 font-mono text-xs text-gray-400">{item.location}</td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: sty.bg, color: sty.color }}>
                              {st}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setQrItemId(item.id)}
                                className="text-gray-500 hover:text-teal-300 transition-colors"
                                title="Show QR code"
                              >
                                <QrCode className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => openEditItem(item)}
                                className="text-gray-500 hover:text-teal-300 transition-colors"
                                title="Edit item"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteId(item.id)}
                                className="text-gray-500 hover:text-red-400 transition-colors"
                                title="Delete item"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-gray-600">Showing {filteredItems.length} of {items.length} items · Last updated live</p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SIGN-OUT TAB
        ═══════════════════════════════════════════════════════════════ */}
        {tab === 'signout' && (
          <div className="space-y-5">

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <select style={sel} value={txStatus} onChange={e => setTxStatus(e.target.value as TxStatus | 'All')} className="pr-8 appearance-none">
                  <option value="All">All Statuses</option>
                  <option value="Outstanding">Outstanding</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Returned">Returned</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select style={sel} value={txDept} onChange={e => setTxDept(e.target.value)} className="pr-8 appearance-none">
                  <option value="All">All Departments</option>
                  {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>
              <button
                onClick={() => { setSignOutOpen(true); setFormError('') }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ml-auto transition-all"
                style={{ backgroundColor: '#008080', color: '#fff' }}
              >
                <PackageOpen className="h-4 w-4" />
                Issue Item
              </button>
            </div>

            {/* Transactions table */}
            <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: '#008080' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(0,128,128,0.15)' }}>
                      {['Code', 'Item', 'Qty', 'Borrower', 'Dept', 'WO/REQ', 'Date Out', 'Exp. Return', 'Status', 'Action'].map(h => (
                        <th key={h} className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#2dd4bf' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-500 text-sm">Loading transactions…</td></tr>
                    ) : filteredTxs.length === 0 ? (
                      <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-500 text-sm">No transactions match your filters.</td></tr>
                    ) : filteredTxs.map((tx, i) => {
                      const sty = TX_STYLE[tx.status]
                      return (
                        <tr
                          key={tx.id}
                          className="border-t"
                          style={{ borderColor: 'rgba(0,128,128,0.15)', backgroundColor: i % 2 === 0 ? '#1e3a5f' : 'rgba(30,58,95,0.5)' }}
                        >
                          <td className="px-3 py-2.5 font-mono text-xs text-teal-300">{tx.item_code}</td>
                          <td className="px-3 py-2.5 text-white font-medium whitespace-nowrap">{tx.item_name}</td>
                          <td className="px-3 py-2.5 text-center font-bold text-gray-300">{tx.quantity}</td>
                          <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">{tx.borrower}</td>
                          <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">{tx.department}</td>
                          <td className="px-3 py-2.5">
                            <span
                              className="font-mono text-xs px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: tx.work_order ? 'rgba(0,128,128,0.15)' : 'rgba(239,68,68,0.15)',
                                color: tx.work_order ? '#2dd4bf' : '#f87171',
                              }}
                            >
                              {tx.work_order || 'MISSING'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">{tx.date_out?.slice(0, 10)}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">{tx.expected_return?.slice(0, 10)}</td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: sty.bg, color: sty.color }}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            {tx.status !== 'Returned' && (
                              <button
                                onClick={() => returnItem.mutate(tx.id)}
                                className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg transition-all"
                                style={{ backgroundColor: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.35)' }}
                              >
                                <CornerDownLeft className="h-3 w-3" />
                                Return
                              </button>
                            )}
                            {tx.status === 'Returned' && (
                              <span className="flex items-center gap-1 text-xs text-gray-600">
                                <CheckCircle2 className="h-3 w-3 text-green-600" /> {tx.date_returned?.slice(0, 10)}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stewardship scorecard */}
            {stewardship.length > 0 && (
              <div>
                <h3 className="text-white font-bold text-xs tracking-widest uppercase mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-teal-400" />
                  STEWARDSHIP SCORECARD
                </h3>
                <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: '#008080' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(0,128,128,0.15)' }}>
                        {['Borrower', 'Department', 'Total', 'Returned', 'Overdue', 'Return Rate', 'Rank'].map(h => (
                          <th key={h} className="text-left px-3 py-2.5 text-xs font-bold uppercase tracking-wider" style={{ color: '#2dd4bf' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stewardship.map((s, i) => {
                        const rank = rankOf(s.rate)
                        return (
                          <tr key={s.borrower} className="border-t" style={{ borderColor: 'rgba(0,128,128,0.15)', backgroundColor: i % 2 === 0 ? '#1e3a5f' : 'rgba(30,58,95,0.5)' }}>
                            <td className="px-3 py-2.5 text-white font-medium">{s.borrower}</td>
                            <td className="px-3 py-2.5 text-gray-400">{s.dept}</td>
                            <td className="px-3 py-2.5 text-center text-gray-300">{s.total}</td>
                            <td className="px-3 py-2.5 text-center font-bold text-green-400">{s.returned}</td>
                            <td className="px-3 py-2.5 text-center font-bold" style={{ color: s.overdue > 0 ? '#f87171' : '#6ee7b7' }}>{s.overdue}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                                  <div className="h-1.5 rounded-full" style={{ width: `${s.rate}%`, backgroundColor: rank.color }} />
                                </div>
                                <span className="text-xs font-bold" style={{ color: rank.color, minWidth: 32 }}>{s.rate}%</span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-xs font-semibold" style={{ color: rank.color }}>{rank.label}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            COMPLIANCE TAB
        ═══════════════════════════════════════════════════════════════ */}
        {tab === 'compliance' && (
          <div className="space-y-5">

            {/* KPI strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Compliance Rate',    value: compliance ? `${compliance.compliance_rate}%` : '—',  color: (compliance?.compliance_rate ?? 100) >= 90 ? '#6ee7b7' : '#f87171' },
                { label: 'Total Sign-Outs',    value: compliance?.total_transactions ?? '—', color: '#2dd4bf' },
                { label: 'Outstanding',        value: compliance?.outstanding ?? '—',        color: '#fcd34d' },
                { label: 'Overdue',            value: compliance?.overdue ?? '—',            color: compliance?.overdue ? '#f87171' : '#6ee7b7' },
              ].map(k => (
                <div key={k.label} className="rounded-xl p-4 border-2" style={{ backgroundColor: '#1e3a5f', borderColor: '#008080' }}>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{k.label}</p>
                  <p className="text-2xl font-extrabold" style={{ color: k.color }}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Compliance gauge */}
            {compliance && (
              <div className="rounded-xl p-5 border-2" style={{ backgroundColor: '#1e3a5f', borderColor: '#008080' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#2dd4bf' }}>Overall Return Compliance</p>
                  <span className="text-sm font-extrabold" style={{ color: compliance.compliance_rate >= 90 ? '#6ee7b7' : compliance.compliance_rate >= 70 ? '#fcd34d' : '#f87171' }}>
                    {compliance.compliance_rate}%
                  </span>
                </div>
                <div className="w-full rounded-full h-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${compliance.compliance_rate}%`,
                      backgroundColor: compliance.compliance_rate >= 90 ? '#10b981' : compliance.compliance_rate >= 70 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Department scorecard */}
            {compliance && compliance.by_department.length > 0 && (
              <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: '#008080' }}>
                <div className="px-4 py-3" style={{ backgroundColor: 'rgba(0,128,128,0.15)' }}>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#2dd4bf' }}>Department Scorecard</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(0,128,128,0.08)' }}>
                      {['Department', 'Total', 'Returned', 'Outstanding', 'Overdue', 'Rate'].map(h => (
                        <th key={h} className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#2dd4bf' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compliance.by_department.map((d, i) => (
                      <tr key={d.department} className="border-t" style={{ borderColor: 'rgba(0,128,128,0.15)', backgroundColor: i % 2 === 0 ? '#1e3a5f' : 'rgba(30,58,95,0.5)' }}>
                        <td className="px-4 py-2.5 text-white font-medium">{d.department}</td>
                        <td className="px-4 py-2.5 text-gray-400">{d.total}</td>
                        <td className="px-4 py-2.5" style={{ color: '#6ee7b7' }}>{d.returned}</td>
                        <td className="px-4 py-2.5" style={{ color: '#fcd34d' }}>{d.outstanding}</td>
                        <td className="px-4 py-2.5" style={{ color: d.overdue > 0 ? '#f87171' : '#6ee7b7' }}>{d.overdue}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: d.compliance_rate >= 90 ? 'rgba(16,185,129,0.2)' : d.compliance_rate >= 70 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                              color: d.compliance_rate >= 90 ? '#6ee7b7' : d.compliance_rate >= 70 ? '#fcd34d' : '#f87171' }}
                          >
                            {d.compliance_rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Outstanding borrowers */}
            {compliance && compliance.top_outstanding_borrowers.length > 0 && (
              <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: '#008080' }}>
                <div className="px-4 py-3" style={{ backgroundColor: 'rgba(0,128,128,0.15)' }}>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#2dd4bf' }}>Outstanding Borrowers</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(0,128,128,0.08)' }}>
                      {['Borrower', 'Department', 'Items Outstanding'].map(h => (
                        <th key={h} className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wider" style={{ color: '#2dd4bf' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compliance.top_outstanding_borrowers.map((b, i) => (
                      <tr key={b.borrower} className="border-t" style={{ borderColor: 'rgba(0,128,128,0.15)', backgroundColor: i % 2 === 0 ? '#1e3a5f' : 'rgba(30,58,95,0.5)' }}>
                        <td className="px-4 py-2.5 text-white font-medium">{b.borrower}</td>
                        <td className="px-4 py-2.5 text-gray-400">{b.department ?? '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className="font-bold" style={{ color: '#fcd34d' }}>{b.outstanding}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!compliance && (
              <div className="text-center py-12 text-gray-500 text-sm">Loading compliance data…</div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            CAMERAS TAB
        ═══════════════════════════════════════════════════════════════ */}
        {tab === 'cameras' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold flex items-center gap-2">
                <Camera className="h-4 w-4 text-teal-400" />
                Live CCTV Feeds — Storeroom
              </p>
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#6ee7b7' }}>
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                All cameras online
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CAMERAS.map(cam => (
                <div
                  key={cam.num}
                  className="relative rounded-xl overflow-hidden border-2"
                  style={{ backgroundColor: '#070d14', borderColor: 'rgba(0,128,128,0.4)', aspectRatio: '16/9' }}
                >
                  {/* Scanline overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)',
                    }}
                  />

                  {/* Camera content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Camera className="h-14 w-14 mb-3" style={{ color: 'rgba(0,128,128,0.3)' }} />
                    <p className="text-sm font-bold" style={{ color: 'rgba(45,212,191,0.6)' }}>{cam.name}</p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(156,163,175,0.4)' }}>{cam.location}</p>
                  </div>

                  {/* LIVE badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold text-red-400">LIVE</span>
                  </div>

                  {/* Camera number */}
                  <div className="absolute top-3 right-3 z-20">
                    <span className="font-mono text-xs" style={{ color: 'rgba(45,212,191,0.5)' }}>CAM {String(cam.num).padStart(2, '0')}</span>
                  </div>

                  {/* Timestamp */}
                  <div className="absolute bottom-3 right-3 z-20">
                    <span className="font-mono text-xs" style={{ color: 'rgba(45,212,191,0.5)' }}>{clock}</span>
                  </div>

                  {/* Date */}
                  <div className="absolute bottom-3 left-3 z-20">
                    <span className="font-mono text-xs" style={{ color: 'rgba(45,212,191,0.4)' }}>2026-04-11</span>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="rounded-xl p-4 border text-sm"
              style={{ backgroundColor: 'rgba(0,128,128,0.06)', borderColor: 'rgba(0,128,128,0.3)', color: '#6b7280' }}
            >
              <p className="font-semibold text-teal-400 mb-1">Storeroom Camera Policy</p>
              CCTV cameras are installed at all storeroom entry/exit points and shelving aisles for asset accountability and loss prevention.
              All sign-outs must be captured on the Sign-Out register. Unregistered removal of items will be flagged.
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            REQUISITIONS TAB
        ═══════════════════════════════════════════════════════════════ */}
        {tab === 'requisitions' && (
          <div className="space-y-4">

            {/* Toolbar */}
            <div className="flex items-center gap-3">
              <p className="text-xs text-gray-500 flex-1">
                FM staff (electricians, plumbers, painters, etc.) submit requisitions to receive materials from the storeroom.
              </p>
              <button
                onClick={() => { setReqOpen(true); setFormError('') }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                style={{ backgroundColor: '#008080', color: '#fff' }}
              >
                <Plus className="h-4 w-4" />
                New Requisition
              </button>
            </div>

            {/* List */}
            <div className="space-y-3">
              {isLoading ? (
                <p className="text-gray-500 text-sm text-center py-8">Loading requisitions…</p>
              ) : requisitions.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No requisitions yet.</p>
              ) : requisitions.map(req => {
                const rs = REQ_STYLE[req.status]
                const ps = PRIORITY_STYLE[req.priority]
                return (
                  <div
                    key={req.id}
                    className="rounded-xl p-5 border-2"
                    style={{ backgroundColor: '#1e3a5f', borderColor: 'rgba(0,128,128,0.4)' }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: rs.bg, color: rs.color }}>{req.status}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: ps.bg, color: ps.color }}>{req.priority}</span>
                        <span className="font-mono text-xs text-teal-300">{req.work_order}</span>
                        <span className="text-xs text-gray-500">· {req.created_at?.slice(0, 10)}</span>
                      </div>
                      {/* Status actions */}
                      {req.status === 'Pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateReqStatus.mutate({ id: req.id, status: 'Approved' })}
                            className="text-xs font-bold px-3 py-1 rounded-lg transition-all"
                            style={{ backgroundColor: 'rgba(14,165,233,0.2)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.3)' }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateReqStatus.mutate({ id: req.id, status: 'Rejected' })}
                            className="text-xs font-bold px-3 py-1 rounded-lg transition-all"
                            style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {req.status === 'Approved' && (
                        <button
                          onClick={() => updateReqStatus.mutate({ id: req.id, status: 'Issued' })}
                          className="text-xs font-bold px-3 py-1 rounded-lg transition-all"
                          style={{ backgroundColor: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }}
                        >
                          Mark Issued
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-500 uppercase tracking-wider mb-0.5">Requester</p>
                        <p className="text-white font-semibold">{req.requester} <span className="text-gray-500 font-normal">· {req.role}</span></p>
                        <p className="text-gray-400">{req.department}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 uppercase tracking-wider mb-0.5">Items Needed</p>
                        <p className="text-gray-300 leading-relaxed">{req.items_description}</p>
                      </div>
                    </div>

                    {req.notes && (
                      <p className="mt-3 text-xs text-gray-500 border-t pt-3" style={{ borderColor: 'rgba(0,128,128,0.15)' }}>
                        {req.notes}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {/* ════════════════════════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════════════════════════ */}

      {/* QR Code */}
      {qrItemId && (
        <Modal title="Item QR Code" onClose={() => setQrItemId(null)}>
          {qrLoading && <p className="text-center text-gray-400 py-8 text-sm">Generating QR…</p>}
          {qrData && (
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 rounded-xl bg-white">
                <img
                  src={`data:image/png;base64,${qrData.qr_base64}`}
                  alt={`QR for ${qrData.item_name}`}
                  className="w-48 h-48"
                />
              </div>
              <div className="text-center">
                <p className="text-white font-bold">{qrData.item_name}</p>
                <p className="font-mono text-xs mt-1" style={{ color: '#2dd4bf' }}>{qrData.item_code}</p>
              </div>
              <button
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = `data:image/png;base64,${qrData.qr_base64}`
                  a.download = `qr-${qrData.item_code}.png`
                  a.click()
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all w-full justify-center"
                style={{ backgroundColor: '#008080', color: '#fff' }}
              >
                <Printer className="h-4 w-4" />
                Download / Print QR
              </button>
            </div>
          )}
        </Modal>
      )}

      {/* Add Item */}
      {addItemOpen && (
        <Modal title="Add Inventory Item" onClose={() => { setAddItemOpen(false); setFormError(''); setItemForm(defaultItemForm) }}>
          <ItemForm form={itemForm} setForm={setItemForm} error={formError} />
          <div className="flex gap-3 mt-5">
            <button
              onClick={handleAddItem}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ backgroundColor: '#008080', color: '#fff' }}
            >
              Add Item
            </button>
            <button
              onClick={() => { setAddItemOpen(false); setFormError(''); setItemForm(defaultItemForm) }}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Item */}
      {editItem && (
        <Modal title="Edit Inventory Item" onClose={() => { setEditItem(null); setFormError(''); setItemForm(defaultItemForm) }}>
          <ItemForm form={itemForm} setForm={setItemForm} error={formError} />
          <div className="flex gap-3 mt-5">
            <button
              onClick={handleUpdateItem}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ backgroundColor: '#008080', color: '#fff' }}
            >
              Save Changes
            </button>
            <button
              onClick={() => { setEditItem(null); setFormError(''); setItemForm(defaultItemForm) }}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <Modal title="Delete Item" onClose={() => setDeleteId(null)}>
          <p className="text-gray-300 text-sm mb-5">
            Are you sure you want to remove <strong className="text-white">{items.find(i => i.id === deleteId)?.name}</strong> from inventory?
            This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { deleteItem.mutate(deleteId); setDeleteId(null) }}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)' }}
            >
              Delete
            </button>
            <button
              onClick={() => setDeleteId(null)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Issue (Sign-Out) */}
      {signOutOpen && (
        <Modal title="Issue Item from Storeroom" onClose={() => { setSignOutOpen(false); setFormError(''); setSignOutForm(defaultSignOutForm) }}>
          <div className="space-y-3">
            {/* Item select */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Item *</label>
              <div className="relative">
                <select
                  style={sel}
                  value={signOutForm.item_id}
                  onChange={e => setSignOutForm(f => ({ ...f, item_id: e.target.value, quantity: 1 }))}
                  className="pr-8 appearance-none"
                >
                  <option value="">— Select an item —</option>
                  {items.filter(i => i.quantity > 0).map(i => (
                    <option key={i.id} value={i.id}>{i.code} · {i.name} ({i.quantity} {i.unit} available)</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Quantity * {soItem ? `(max ${maxQty})` : ''}</label>
              <input
                type="number"
                min={1}
                max={maxQty}
                style={inp}
                value={signOutForm.quantity}
                onChange={e => setSignOutForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
              />
            </div>

            {/* Borrower */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Borrower Name *</label>
              <input style={inp} placeholder="Full name" value={signOutForm.borrower} onChange={e => setSignOutForm(f => ({ ...f, borrower: e.target.value }))} />
            </div>

            {/* Department */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Department</label>
              <div className="relative">
                <select style={sel} value={signOutForm.department} onChange={e => setSignOutForm(f => ({ ...f, department: e.target.value }))} className="pr-8 appearance-none">
                  <option value="">— Select —</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* WO/REQ */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">WO / REQ Number *</label>
              <input style={inp} placeholder="e.g. WO-2050 or REQ-0210" value={signOutForm.work_order} onChange={e => setSignOutForm(f => ({ ...f, work_order: e.target.value }))} />
            </div>

            {/* Expected Return */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Expected Return Date *</label>
              <input type="date" style={inp} value={signOutForm.expected_return} onChange={e => setSignOutForm(f => ({ ...f, expected_return: e.target.value }))} />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Notes</label>
              <textarea style={{ ...inp, resize: 'none' }} rows={2} placeholder="Optional notes…" value={signOutForm.notes} onChange={e => setSignOutForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            {formError && <p className="text-xs text-red-400">{formError}</p>}
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={handleSignOut} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ backgroundColor: '#008080', color: '#fff' }}>
              Issue Item
            </button>
            <button onClick={() => { setSignOutOpen(false); setFormError(''); setSignOutForm(defaultSignOutForm) }} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* New Requisition */}
      {reqOpen && (
        <Modal title="New Storeroom Requisition" onClose={() => { setReqOpen(false); setFormError(''); setReqForm(defaultReqForm) }}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Your Name *</label>
                <input style={inp} placeholder="Full name" value={reqForm.requester} onChange={e => setReqForm(f => ({ ...f, requester: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Role</label>
                <div className="relative">
                  <select style={sel} value={reqForm.role} onChange={e => setReqForm(f => ({ ...f, role: e.target.value }))} className="pr-8 appearance-none">
                    <option value="">— Select —</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Department</label>
                <div className="relative">
                  <select style={sel} value={reqForm.department} onChange={e => setReqForm(f => ({ ...f, department: e.target.value }))} className="pr-8 appearance-none">
                    <option value="">— Select —</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">WO / REQ Number *</label>
                <input style={inp} placeholder="WO-2050" value={reqForm.work_order} onChange={e => setReqForm(f => ({ ...f, work_order: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Priority</label>
              <div className="flex gap-2">
                {(['High', 'Medium', 'Low'] as StockPriority[]).map(p => {
                  const ps = PRIORITY_STYLE[p]
                  return (
                    <button
                      key={p}
                      onClick={() => setReqForm(f => ({ ...f, priority: p }))}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all"
                      style={reqForm.priority === p
                        ? { backgroundColor: ps.bg, color: ps.color, border: `1px solid ${ps.color}` }
                        : { backgroundColor: 'transparent', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }
                      }
                    >
                      {p}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Items Needed *</label>
              <textarea
                style={{ ...inp, resize: 'none' }}
                rows={3}
                placeholder="e.g. LED Bulb 18W × 10, PVC Conduit 20mm × 3, Teflon Tape × 2"
                value={reqForm.items_description}
                onChange={e => setReqForm(f => ({ ...f, items_description: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Notes</label>
              <textarea style={{ ...inp, resize: 'none' }} rows={2} placeholder="Optional context or urgency…" value={reqForm.notes} onChange={e => setReqForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            {formError && <p className="text-xs text-red-400">{formError}</p>}
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={handleAddReq} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ backgroundColor: '#008080', color: '#fff' }}>
              Submit Requisition
            </button>
            <button onClick={() => { setReqOpen(false); setFormError(''); setReqForm(defaultReqForm) }} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Item form (shared by Add and Edit) ───────────────────────────────────────

function ItemForm({
  form,
  setForm,
  error,
}: {
  form: typeof defaultItemForm
  setForm: React.Dispatch<React.SetStateAction<typeof defaultItemForm>>
  error: string
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Item Name *</label>
          <input style={inp} placeholder="e.g. Cable Ties 100mm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Code *</label>
          <input style={inp} placeholder="e.g. EL-007" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Category</label>
        <div className="relative">
          <select style={sel} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ItemCategory }))} className="pr-8 appearance-none">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Quantity</label>
          <input type="number" min={0} style={inp} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))} />
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Unit</label>
          <input style={inp} placeholder="Pcs / Units / Rolls…" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Min Level</label>
          <input type="number" min={0} style={inp} value={form.min_level} onChange={e => setForm(f => ({ ...f, min_level: parseInt(e.target.value) || 0 }))} />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Shelf / Location *</label>
        <input style={inp} placeholder="e.g. A-01, B-03, F-07" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value.toUpperCase() }))} />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─── Needed for Package icon usage ────────────────────────────────────────────
void Package
