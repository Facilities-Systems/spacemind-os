import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { HistoryList } from '../components/history/HistoryList'
import { ResultView } from '../components/decompose/ResultView'
import { Spinner } from '../components/ui/Spinner'
import { useHistory, useDecompositionById } from '../hooks/useDecompose'

export function HistoryPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { data: history, isLoading } = useHistory(50)
  const { data: detail, isLoading: detailLoading } = useDecompositionById(id ?? null)

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
        subtitle={`${history?.total ?? 0} plans generated`}
      />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : (
            <HistoryList items={history?.items ?? []} />
          )}
        </div>
      </div>
    </div>
  )
}
