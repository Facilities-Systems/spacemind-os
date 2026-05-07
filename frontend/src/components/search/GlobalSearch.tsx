import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Search, Package, Wrench, Heart, Clock, X, Loader2 } from 'lucide-react'
import { api } from '../../api/client'
import type { SearchDomain, SearchResult } from '../../types'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const DOMAIN_META: Record<SearchDomain, { label: string; icon: typeof Package; color: string }> = {
  inventory: { label: 'Inventory', icon: Package, color: 'text-teal-400' },
  assets:    { label: 'Assets',    icon: Wrench,  color: 'text-blue-400'  },
  medical:   { label: 'Medical',   icon: Heart,   color: 'text-cyan-400'  },
  history:   { label: 'History',   icon: Clock,   color: 'text-purple-400'},
}

function groupByDomain(results: SearchResult[]): Map<SearchDomain, SearchResult[]> {
  const map = new Map<SearchDomain, SearchResult[]>()
  for (const r of results) {
    const arr = map.get(r.domain) ?? []
    arr.push(r)
    map.set(r.domain, arr)
  }
  return map
}

export function GlobalSearch({ isOpen, onClose }: Props) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Focus + reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setError(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setError(false)
      return
    }
    const t = setTimeout(async () => {
      setLoading(true)
      setError(false)
      try {
        const data = await api.search(query.trim())
        setResults(data.results)
      } catch {
        setError(true)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const handleSelect = (result: SearchResult) => {
    onClose()
    navigate(result.url)
  }

  if (!isOpen) return null

  const grouped = groupByDomain(results)
  const hasResults = results.length > 0

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-16 px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1e293b] border border-[#334155] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#334155]">
          {loading
            ? <Loader2 className="h-5 w-5 text-teal-400 animate-spin shrink-0" />
            : <Search className="h-5 w-5 text-gray-400 shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search inventory, assets, medical, history..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-500 hover:text-gray-300">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center rounded border border-[#334155] px-1.5 py-0.5 text-xs text-gray-500 font-mono">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-y-auto">
          {error && (
            <p className="text-center text-red-400 text-sm py-8">
              Search failed — please try again.
            </p>
          )}

          {!error && query.trim().length >= 2 && !loading && !hasResults && (
            <p className="text-center text-gray-500 text-sm py-8">
              No results for <span className="text-gray-300">"{query}"</span>
            </p>
          )}

          {!error && !hasResults && query.trim().length < 2 && (
            <div className="px-4 py-6 text-center">
              <p className="text-gray-500 text-sm">Type at least 2 characters to search</p>
              <div className="mt-4 flex justify-center gap-3 flex-wrap">
                {(Object.entries(DOMAIN_META) as [SearchDomain, typeof DOMAIN_META[SearchDomain]][]).map(([domain, meta]) => {
                  const Icon = meta.icon
                  return (
                    <span key={domain} className={`flex items-center gap-1.5 text-xs ${meta.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {meta.label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {hasResults && (
            <div className="py-2">
              {(Array.from(grouped.entries()) as [SearchDomain, SearchResult[]][]).map(([domain, items]) => {
                const meta = DOMAIN_META[domain]
                const Icon = meta.icon
                return (
                  <div key={domain}>
                    <div className="flex items-center gap-2 px-4 py-2 mt-1">
                      <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                      <span className={`text-xs font-semibold uppercase tracking-wider ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className="text-xs text-gray-600">({items.length})</span>
                    </div>
                    {items.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelect(result)}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors group"
                      >
                        <p className="text-sm text-white group-hover:text-teal-300 transition-colors truncate">
                          {result.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{result.subtitle}</p>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {hasResults && (
          <div className="border-t border-[#334155] px-4 py-2 flex items-center gap-4 text-xs text-gray-600">
            <span>↵ to navigate</span>
            <span>esc to close</span>
            <span className="ml-auto">{results.length} result{results.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
