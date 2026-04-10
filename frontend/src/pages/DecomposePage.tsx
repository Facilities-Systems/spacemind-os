import { useState } from 'react'
import { Header } from '../components/layout/Header'
import { RequestForm } from '../components/decompose/RequestForm'
import { ResultView } from '../components/decompose/ResultView'
import { LoadingOverlay } from '../components/ui/Spinner'
import { useDecompose } from '../hooks/useDecompose'
import type { DecompositionResult } from '../types'

export function DecomposePage() {
  const { mutate, isPending, isError, error } = useDecompose()
  const [result, setResult] = useState<DecompositionResult | null>(null)

  const handleSubmit = (req: Parameters<typeof mutate>[0]) => {
    setResult(null)
    mutate(req, { onSuccess: setResult })
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
              {isError && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-800/40 rounded-xl text-red-400 text-sm">
                  <strong>Error:</strong>{' '}
                  {(error as any)?.response?.data?.detail ?? error?.message ?? 'Something went wrong'}
                </div>
              )}
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
