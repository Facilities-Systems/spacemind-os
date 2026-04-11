import { useState } from 'react'
import toast from 'react-hot-toast'
import { Zap } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { CatalogSelector } from '../components/decompose/CatalogSelector'
import type { OperationType } from '../components/decompose/CatalogSelector'
import { RequestForm } from '../components/decompose/RequestForm'
import { ResultView } from '../components/decompose/ResultView'
import { LoadingOverlay } from '../components/ui/Spinner'
import { useDecompose } from '../hooks/useDecompose'
import type { DecompositionRequest, DecompositionResult } from '../types'

type Step = 'catalog' | 'form'

export function DecomposePage() {
  const { mutate, isPending } = useDecompose()
  const [step, setStep] = useState<Step>('catalog')
  const [selectedOp, setSelectedOp] = useState<OperationType | null>(null)
  const [result, setResult] = useState<DecompositionResult | null>(null)
  const [wasMultiAgent, setWasMultiAgent] = useState(false)

  const handleSelectOp = (op: OperationType) => {
    setSelectedOp(op)
    setStep('form')
  }

  const handleSubmit = (req: DecompositionRequest, multiAgent: boolean) => {
    setResult(null)
    setWasMultiAgent(multiAgent)
    mutate({ req, multiAgent }, {
      onSuccess: (data) => {
        setResult(data)
        const agentLabel = multiAgent ? '5-agent deep analysis' : 'AI plan'
        toast.success(
          `${agentLabel} complete — ${data.total_tasks} tasks across ${data.phases.length} phases`,
        )
      },
      onError: (err: unknown) => {
        const msg =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          (err instanceof Error ? err.message : 'Something went wrong')
        toast.error(msg)
      },
    })
  }

  const handleNewRequest = () => {
    setResult(null)
    setStep('catalog')
    setSelectedOp(null)
  }

  const subtitle =
    step === 'catalog'
      ? 'Select an operation type — SpaceMind OS applies expert templates before planning'
      : selectedOp && selectedOp.type !== 'unknown'
        ? `${selectedOp.label} · ${selectedOp.duration} · ${selectedOp.phases} phases`
        : 'Describe any facilities operation — SpaceMind OS builds the plan'

  return (
    <div className="flex flex-col h-full">
      <Header
        title="New Request"
        subtitle={subtitle}
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto">

          {/* Step 1 — Catalog */}
          {!result && !isPending && step === 'catalog' && (
            <CatalogSelector onSelect={handleSelectOp} />
          )}

          {/* Step 2 — Form */}
          {!result && !isPending && step === 'form' && (
            <div className="max-w-2xl mx-auto">
              <RequestForm
                onSubmit={handleSubmit}
                isLoading={isPending}
                selectedOp={selectedOp ?? undefined}
                onChangeType={() => setStep('catalog')}
              />
            </div>
          )}

          {/* Loading */}
          {isPending && (
            <LoadingOverlay
              message={wasMultiAgent ? 'Running 5 specialist agents in parallel...' : undefined}
            />
          )}

          {/* Result */}
          {result && !isPending && (
            <div>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-white font-semibold">Execution Plan Generated</h2>
                  {wasMultiAgent && (
                    <span className="flex items-center gap-1 text-xs bg-purple-900/40 text-purple-300 border border-purple-700/40 px-2 py-0.5 rounded-full">
                      <Zap className="h-3 w-3" /> Deep Analysis
                    </span>
                  )}
                </div>
                <button
                  onClick={handleNewRequest}
                  className="text-sm text-brand-400 hover:text-brand-300 transition-all"
                >
                  ← New Request
                </button>
              </div>
              <ResultView result={result} decompositionId={result.id} />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
