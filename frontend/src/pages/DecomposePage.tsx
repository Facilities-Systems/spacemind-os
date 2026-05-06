import { useState } from 'react'
import toast from 'react-hot-toast'
import { Zap } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { CatalogSelector } from '../components/decompose/CatalogSelector'
import type { OperationType } from '../components/decompose/CatalogSelector'
import { RequestForm } from '../components/decompose/RequestForm'
import { ResultView } from '../components/decompose/ResultView'
import { StreamingResult } from '../components/decompose/StreamingResult'
import { LoadingOverlay } from '../components/ui/Spinner'
import { useDecompose } from '../hooks/useDecompose'
import { api } from '../api/client'
import type { DecompositionRequest, DecompositionResult } from '../types'

type Step = 'catalog' | 'form'
type Mode = 'idle' | 'loading' | 'streaming' | 'done'

export function DecomposePage() {
  const { mutate, isPending } = useDecompose()
  const [step, setStep] = useState<Step>('catalog')
  const [selectedOp, setSelectedOp] = useState<OperationType | null>(null)
  const [result, setResult] = useState<DecompositionResult | null>(null)
  const [wasMultiAgent, setWasMultiAgent] = useState(false)
  const [mode, setMode] = useState<Mode>('idle')
  const [streamingRequest, setStreamingRequest] = useState<DecompositionRequest | null>(null)

  const handleSelectOp = (op: OperationType) => {
    setSelectedOp(op)
    setStep('form')
  }

  const handleSubmit = (req: DecompositionRequest, multiAgent: boolean) => {
    setResult(null)
    setWasMultiAgent(multiAgent)

    if (multiAgent) {
      // SSE streaming path — show live agent progress
      setStreamingRequest(req)
      setMode('streaming')
      return
    }

    // Standard single-pass path
    setMode('loading')
    mutate({ req, multiAgent: false }, {
      onSuccess: (data) => {
        setResult(data)
        setMode('done')
        toast.success(`AI plan complete — ${data.total_tasks} tasks across ${data.phases.length} phases`)
      },
      onError: (err: unknown) => {
        setMode('idle')
        const msg =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          (err instanceof Error ? err.message : 'Something went wrong')
        toast.error(msg)
      },
    })
  }

  const handleStreamComplete = async (decompositionId: string) => {
    try {
      const data = await api.getById(decompositionId)
      setResult(data)
      setMode('done')
      setStreamingRequest(null)
      toast.success(`Deep analysis complete — ${data.total_tasks} tasks across ${data.phases.length} phases`)
    } catch {
      setMode('idle')
      setStreamingRequest(null)
      toast.error('Plan generated but failed to load. Check History.')
    }
  }

  const handleStreamError = (message: string) => {
    setMode('idle')
    setStreamingRequest(null)
    toast.error(message)
  }

  const handleNewRequest = () => {
    setResult(null)
    setMode('idle')
    setStep('catalog')
    setSelectedOp(null)
    setStreamingRequest(null)
  }

  const isLoading = mode === 'loading' || isPending
  const isStreaming = mode === 'streaming'
  const isDone = mode === 'done'

  const subtitle =
    step === 'catalog'
      ? 'Select an operation type — SpaceMind OS applies expert templates before planning'
      : selectedOp && selectedOp.type !== 'unknown'
        ? `${selectedOp.label} · ${selectedOp.duration} · ${selectedOp.phases} phases`
        : 'Describe any facilities operation — SpaceMind OS builds the plan'

  return (
    <div className="flex flex-col h-full">
      <Header title="New Request" subtitle={subtitle} />

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto">

          {/* Step 1 — Catalog */}
          {!isDone && !isLoading && !isStreaming && step === 'catalog' && (
            <CatalogSelector onSelect={handleSelectOp} />
          )}

          {/* Step 2 — Form */}
          {!isDone && !isLoading && !isStreaming && step === 'form' && (
            <div className="max-w-2xl mx-auto">
              <RequestForm
                onSubmit={handleSubmit}
                isLoading={isLoading}
                selectedOp={selectedOp ?? undefined}
                onChangeType={() => setStep('catalog')}
              />
            </div>
          )}

          {/* Standard loading spinner */}
          {isLoading && (
            <LoadingOverlay message="Generating AI execution plan..." />
          )}

          {/* SSE streaming display */}
          {isStreaming && streamingRequest && (
            <StreamingResult
              request={streamingRequest}
              onComplete={handleStreamComplete}
              onError={handleStreamError}
            />
          )}

          {/* Result */}
          {isDone && result && (
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
