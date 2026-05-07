import { memo } from 'react'
import { format } from 'date-fns'
import { ArrowRight, ClipboardList, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PriorityBadge, RequestTypeBadge } from '../ui/Badge'
import { Card } from '../ui/Card'
import type { DecompositionSummary, RequestType } from '../../types'

export const HistoryList = memo(function HistoryList({ items }: { items: DecompositionSummary[] }) {
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="text-center py-16" role="status">
        <ClipboardList className="h-10 w-10 text-gray-700 mx-auto mb-3" aria-hidden="true" />
        <p className="text-gray-500 text-sm">No decompositions yet.</p>
        <p className="text-gray-600 text-xs">Submit your first request to see history here.</p>
      </div>
    )
  }

  return (
    <ul role="list" className="space-y-2.5 list-none p-0">
      {items.map(item => (
        <li key={item.id}>
          <Card
            hover
            onClick={() => navigate(`/history/${item.id}`)}
            aria-label={`${item.request_summary} — ${item.request_type.replace('_', ' ')}, ${item.priority} priority`}
            className="flex items-start gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <RequestTypeBadge type={item.request_type as RequestType} />
                <PriorityBadge priority={item.priority} />
              </div>
              <p className="text-sm text-white font-medium line-clamp-2">{item.request_summary}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500" aria-hidden="true">
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
            <ArrowRight className="h-4 w-4 text-gray-600 shrink-0 mt-1" aria-hidden="true" />
          </Card>
        </li>
      ))}
    </ul>
  )
})
