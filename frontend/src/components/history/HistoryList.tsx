import { format } from 'date-fns'
import { ArrowRight, ClipboardList, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PriorityBadge, RequestTypeBadge } from '../ui/Badge'
import { Card } from '../ui/Card'
import type { DecompositionSummary } from '../../types'

export function HistoryList({ items }: { items: DecompositionSummary[] }) {
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <ClipboardList className="h-10 w-10 text-gray-700 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No decompositions yet.</p>
        <p className="text-gray-600 text-xs">Submit your first request to see history here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {items.map(item => (
        <Card
          key={item.id}
          hover
          onClick={() => navigate(`/history/${item.id}`)}
          className="flex items-start gap-4"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <RequestTypeBadge type={item.request_type as any} />
              <PriorityBadge priority={item.priority} />
            </div>
            <p className="text-sm text-white font-medium line-clamp-2">{item.request_summary}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {item.location_id}
              </span>
              <span className="flex items-center gap-1">
                <ClipboardList className="h-3 w-3" />
                {item.total_tasks} tasks
              </span>
              <span>{format(new Date(item.created_at), 'dd MMM yyyy, HH:mm')}</span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-600 shrink-0 mt-1" />
        </Card>
      ))}
    </div>
  )
}
