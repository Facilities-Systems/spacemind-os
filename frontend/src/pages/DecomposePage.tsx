import { useState } from 'react'
import toast from 'react-hot-toast'
import { Header } from '../components/layout/Header'
import { RequestForm } from '../components/decompose/RequestForm'
import { ResultView } from '../components/decompose/ResultView'
import { LoadingOverlay } from '../components/ui/Spinner'
import { useDecompose } from '../hooks/useDecompose'
import type { DecompositionResult } from '../types'

export function DecomposePage() {
  const { mutate, isPending } = useDecompose()
  const [result, setResult] = useState<DecompositionResult | null>(null)

  const handleSubmit = (req: Parameters<typeof mutate>[0]) => {
    setResult(null)
    mutate(req, {
      onSuccess: (data) => {
        setResult(data)
        toast.success(`Plan generated — ${data.total_tasks} tasks across ${data.phases.length} phases`)
      },
      onError: (err: unknown) => {
        const msg =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          (err instanceof Error ? err.message : 'Something went wrong')
        toast.error(msg)
      },
    })
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="New Request"
        subtitle="Describe any facilities operation — SpaceMind OS builds the plan"
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          {!result && !isPending && (
            <div className="max-w-2xl mx-auto">
              <RequestForm onSubmit={handleSubmit} isLoading={isPending} />
            </div>
          )}

          {isPending && <LoadingOverlay />}

          {result && !isPending && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white font-semibold">Execution Plan Generated</h2>
                <button
                  onClick={() => setResult(null)}
                  className="text-sm text-brand-400 hover:text-brand-300 transition-all"
                >
                  ← New Request
                </button>
              </div>
              <ResultView result={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
