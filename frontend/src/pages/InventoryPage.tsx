import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Boxes, Download, Package, Plus, Printer, RefreshCw } from 'lucide-react'
import { Header } from '../components/layout/Header'

const STATS = [
  { label: 'Total Assets', value: '428', sub: 'Across all categories' },
  { label: 'Low Stock Items', value: '12', sub: 'Need immediate attention', alert: true },
  { label: 'Total Value', value: 'R 214,850', sub: 'Replacement cost estimate' },
  { label: 'Categories', value: '6', sub: 'Active inventory categories' },
]

const CATEGORIES = [
  {
    emoji: '⚡',
    name: 'Electrical',
    description: 'Cables, plugs, breakers, lighting fixtures',
    items: 84,
    lowStock: 3,
    color: '#f59e0b',
  },
  {
    emoji: '🔧',
    name: 'Plumbing',
    description: 'Pipes, taps, fittings, sealants, tools',
    items: 67,
    lowStock: 2,
    color: '#3b82f6',
  },
  {
    emoji: '🪵',
    name: 'Carpentry',
    description: 'Timber, screws, hinges, locks, handles',
    items: 53,
    lowStock: 1,
    color: '#92400e',
  },
  {
    emoji: '🎨',
    name: 'Painting',
    description: 'Paint, brushes, rollers, primers, fillers',
    items: 41,
    lowStock: 4,
    color: '#ec4899',
  },
  {
    emoji: '🧴',
    name: 'Hygiene & Cleaning',
    description: 'Sanitisers, detergents, paper, dispensers',
    items: 112,
    lowStock: 2,
    color: '#10b981',
  },
  {
    emoji: '🛠️',
    name: 'Tools & Equipment',
    description: 'Power tools, hand tools, ladders, PPE',
    items: 71,
    lowStock: 0,
    color: '#6366f1',
  },
]

const RECENT = [
  { item: 'Fluorescent Tubes 1.2m', code: 'EL-0042', category: 'Electrical', stock: 6, min: 20, action: 'Low Stock' },
  { item: 'White Acrylic Paint 20L', code: 'PA-0018', category: 'Painting', stock: 2, min: 5, action: 'Low Stock' },
  { item: 'Hand Sanitiser 500ml', code: 'HY-0031', category: 'Hygiene & Cleaning', stock: 8, min: 30, action: 'Low Stock' },
  { item: 'PVC Pipe 50mm x 3m', code: 'PL-0009', category: 'Plumbing', stock: 14, min: 10, action: 'Normal' },
  { item: 'Safety Gloves (Large)', code: 'TL-0055', category: 'Tools & Equipment', stock: 25, min: 15, action: 'Normal' },
]

export function InventoryPage() {
  const navigate = useNavigate()
  const [hoveredCat, setHoveredCat] = useState<string | null>(null)
  const totalLow = CATEGORIES.reduce((s, c) => s + c.lowStock, 0)

  return (
    <div className="flex flex-col h-full">
      <Header title="Inventory System" subtitle="Facilities Operations — Asset & Stock Management" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">

        {/* Stats strip */}
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

        {/* Low stock alert banner */}
        {totalLow > 0 && (
          <div
            className="rounded-xl p-4 flex items-center gap-3 border"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.4)' }}
          >
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
            <div className="flex-1">
              <p className="text-red-300 font-semibold text-sm">Low Stock Alert</p>
              <p className="text-red-400/70 text-xs">{totalLow} items across categories are below minimum stock levels — reorder required.</p>
            </div>
            <button className="text-xs font-semibold text-red-300 border border-red-500/50 px-3 py-1.5 rounded-lg transition-all hover:bg-red-500/20">
              View Critical
            </button>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          {[
            { icon: Plus, label: 'Add Item' },
            { icon: RefreshCw, label: 'Request Reorder' },
            { icon: Download, label: 'Export CSV' },
            { icon: Printer, label: 'Print Report' },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all"
              style={{ backgroundColor: 'rgba(0,128,128,0.1)', borderColor: '#008080', color: '#2dd4bf' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,128,128,0.25)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,128,128,0.1)' }}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Category grid */}
        <div>
          <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
            <Boxes className="h-4 w-4" style={{ color: '#2dd4bf' }} />
            INVENTORY CATEGORIES
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map(cat => (
              <div
                key={cat.name}
                className="rounded-xl p-5 border-2 cursor-pointer transition-all"
                style={{
                  backgroundColor: hoveredCat === cat.name ? '#1e4a7f' : '#1e3a5f',
                  borderColor: '#008080',
                }}
                onMouseEnter={() => setHoveredCat(cat.name)}
                onMouseLeave={() => setHoveredCat(null)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.emoji}</span>
                    <div>
                      <h3 className="text-white font-bold text-sm">{cat.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                    </div>
                  </div>
                  {cat.lowStock > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
                      {cat.lowStock} low
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <span className="text-2xl font-extrabold text-white">{cat.items}</span>
                    <span className="text-xs text-gray-500 ml-1">items</span>
                  </div>
                  <button
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                    style={{ backgroundColor: 'rgba(0,128,128,0.25)', color: '#2dd4bf' }}
                  >
                    View Items
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                {/* Stock health bar */}
                <div className="mt-3">
                  <div className="h-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <div
                      className="h-1 rounded-full transition-all"
                      style={{
                        width: cat.lowStock > 0 ? `${100 - (cat.lowStock / cat.items) * 100}%` : '100%',
                        backgroundColor: cat.lowStock > 2 ? '#ef4444' : cat.lowStock > 0 ? '#f59e0b' : '#10b981',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low stock table */}
        <div>
          <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
            <Package className="h-4 w-4" style={{ color: '#2dd4bf' }} />
            RECENT STOCK ACTIVITY
          </h2>
          <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: '#008080' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'rgba(0,128,128,0.2)' }}>
                    {['Item', 'Code', 'Category', 'Stock', 'Min Level', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#2dd4bf' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RECENT.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t transition-all"
                      style={{ borderColor: 'rgba(0,128,128,0.2)', backgroundColor: i % 2 === 0 ? '#1e3a5f' : 'rgba(30,58,95,0.5)' }}
                    >
                      <td className="px-4 py-3 text-white font-medium">{row.item}</td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{row.code}</td>
                      <td className="px-4 py-3 text-gray-300">{row.category}</td>
                      <td className="px-4 py-3 font-bold" style={{ color: row.stock < row.min ? '#f87171' : '#a3e635' }}>{row.stock}</td>
                      <td className="px-4 py-3 text-gray-500">{row.min}</td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={row.action === 'Low Stock'
                            ? { backgroundColor: 'rgba(239,68,68,0.2)', color: '#f87171' }
                            : { backgroundColor: 'rgba(16,185,129,0.2)', color: '#6ee7b7' }
                          }
                        >
                          {row.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Navigate to Sign-Out */}
        <div
          className="rounded-xl border p-4 flex items-center justify-between"
          style={{ backgroundColor: 'rgba(0,128,128,0.08)', borderColor: 'rgba(0,128,128,0.3)' }}
        >
          <div>
            <p className="text-white font-semibold text-sm">Equipment Sign-Out Register</p>
            <p className="text-gray-500 text-xs mt-0.5">View tool checkout history, overdue items & stewardship scorecards</p>
          </div>
          <button
            onClick={() => navigate('/signout')}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all"
            style={{ backgroundColor: '#008080', color: '#fff' }}
          >
            Sign-Out Register
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>
    </div>
  )
}
