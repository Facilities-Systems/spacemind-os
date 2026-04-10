import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { HistoryList } from '../components/history/HistoryList'
import { ResultView } from '../components/decompose/ResultView'
import { Spinner } from '../components/ui/Spinner'
import { useHistory, useDecompositionById, useLocations } from '../hooks/useDecompose'

const REQUEST_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'office_move', label: 'Office Move' },
  { value: 'full_fitout', label: 'Full Fit-Out' },
  { value: 'floor_renovation', label: 'Floor Renovation' },
  { value: 'canteen_setup', label: 'Canteen Setup' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'space_change', label: 'Space Change' },
  { value: 'vendor_coordination', label: 'Vendor Coordination' },
]

const PRIORITIES = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const PAGE_SIZE = 15

export function HistoryPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  // Filters
  const [requestType, setRequestType] = useState('')
  const [locationId, setLocationId] = useState('')
  const [priority, setPriority] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(0)

  const offset = page * PAGE_SIZE

  const { data: history, isLoading } = useHistory(
    PAGE_SIZE,
    offset,
    requestType || undefined,
    locationId || undefined,
    priority || undefined,
    fromDate || undefined,
    toDate || undefined,
  )
  const { data: detail, isLoading: detailLoading } = useDecompositionById(id ?? null)
  const { data: locations = [] } = useLocations()

  const totalPages = history ? Math.ceil(history.total / PAGE_SIZE) : 0
  const hasFilters = requestType || locationId || priority || fromDate || toDate

  const clearFilters = () => {
    setRequestType('')
    setLocationId('')
    setPriority('')
    setFromDate('')
    setToDate('')
    setPage(0)
  }

  // Detail view
  if (id) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Plan Detail" subtitle={id} />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => navigate('/history')}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6 transition-all"
            >
              <ArrowLeft className="h-4 w-4" /> Back to History
            </button>
            {detailLoading && <div className="flex justify-center py-20"><Spinner size="lg" /></div>}
            {detail && <ResultView result={detail} />}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="History"
        subtitle={history ? `${history.total} plans generated` : 'Loading...'}
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-4">

          {/* Filter toggle bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-all ${
                showFilters || hasFilters
                  ? 'text-brand-300 border-brand-700/50 bg-brand-900/20'
                  : 'text-gray-400 border-surface-border hover:text-white'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {hasFilters && (
                <span className="h-4 w-4 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center">
                  !
                </span>
              )}
            </button>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-all"
              >
                <X className="h-3 w-3" /> Clear filters
              </button>
            )}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="bg-surface-card border border-surface-border rounded-xl p-4 grid grid-cols-2 gap-3 animate-fade-in">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Request Type</label>
                <select
                  value={requestType}
                  onChange={e => { setRequestType(e.target.value); setPage(0) }}
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-600 transition-all"
                >
                  {REQUEST_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Location</label>
                <select
                  value={locationId}
                  onChange={e => { setLocationId(e.target.value); setPage(0) }}
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-600 transition-all"
                >
                  <option value="">All Locations</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.id}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={e => { setPriority(e.target.value); setPage(0) }}
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-600 transition-all"
                >
                  {PRIORITIES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => { setFromDate(e.target.value); setPage(0) }}
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => { setToDate(e.target.value); setPage(0) }}
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-600 transition-all"
                />
              </div>
            </div>
          )}

          {/* Results */}
          {isLoading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : (
            <HistoryList items={history?.items ?? []} />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-surface-border text-gray-400 hover:text-white hover:border-brand-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              <span className="text-xs text-gray-500">
                Page {page + 1} of {totalPages} &nbsp;·&nbsp; {history?.total} total
              </span>

              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-surface-border text-gray-400 hover:text-white hover:border-brand-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
