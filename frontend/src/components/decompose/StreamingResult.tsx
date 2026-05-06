/**
 * StreamingResult — Live multi-agent orchestration display
 * Connects to /api/v1/orchestrate/stream via fetch + ReadableStream (POST-based SSE).
 * Shows each of the 5 agents as a lane that transitions: idle → thinking → done.
 * On completion, calls onComplete(decompositionId) so the parent can fetch + show ResultView.
 */
import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2, Circle } from 'lucide-react'
import type { AgentKey, AgentStreamEvent } from '../../types'

// ─── Agent lane config ────────────────────────────────────────────────────────

const AGENT_ORDER: AgentKey[] = [
  'supervisor',
  'operations',
  'technical',
  'vendor',
  'synthesizer',
]

const AGENT_META: Record<AgentKey, { label: string; role: string; color: string }> = {
  supervisor:   { label: 'Supervisor',          role: 'Complexity assessment & routing',      color: '#a855f7' },
  operations:   { label: 'Operations Planner',  role: 'Phase sequencing & scheduling',        color: '#0ea5e9' },
  technical:    { label: 'Technical Specialist', role: 'Technical requirements & compliance',  color: '#f59e0b' },
  vendor:       { label: 'Vendor Coordinator',   role: 'Vendor mapping & procurement',         color: '#10b981' },
  synthesizer:  { label: 'Synthesizer',          role: 'Unified execution plan construction',  color: '#2dd4bf' },
}

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentStatus = 'idle' | 'thinking' | 'done'

interface AgentState {
  status: AgentStatus
  content: string
}

interface Props {
  request: {
    request_text: string
    location_id: string
    priority?: string
    requester_name?: string
    additional_context?: string
  }
  onComplete: (decompositionId: string) => void
  onError: (message: string) => void
}

// ─── Thinking dots animation ──────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      {[0, 150, 300].map(delay => (
        <span
          key={delay}
          className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-bounce opacity-70"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StreamingResult({ request, onComplete, onError }: Props) {
  const [agentStates, setAgentStates] = useState<Record<AgentKey, AgentState>>(() =>
    Object.fromEntries(
      AGENT_ORDER.map(key => [key, { status: 'idle', content: '' }])
    ) as Record<AgentKey, AgentState>
  )
  const [statusMsg, setStatusMsg] = useState('Connecting to AI pipeline...')
  const [completionStats, setCompletionStats] = useState<{ tasks: number; phases: number } | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const setAgent = (key: AgentKey, patch: Partial<AgentState>) =>
    setAgentStates(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))

  useEffect(() => {
    const ctrl = new AbortController()
    abortRef.current = ctrl

    const TOKEN_KEY = 'sm_access_token'
    const token = localStorage.getItem(TOKEN_KEY) ?? ''

    const run = async () => {
      try {
        const res = await fetch('/api/v1/orchestrate/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(request),
          signal: ctrl.signal,
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({ detail: 'Connection failed' }))
          onError(body.detail ?? `HTTP ${res.status}`)
          return
        }

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        // eslint-disable-next-line no-constant-condition
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          let currentEvent = ''
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim()
            } else if (line.startsWith('data: ')) {
              const raw = line.slice(6)
              try {
                const evt: AgentStreamEvent = { type: currentEvent as AgentStreamEvent['type'], ...JSON.parse(raw) }
                handleEvent(evt)
              } catch {
                // ignore malformed frames
              }
              currentEvent = ''
            }
          }
        }
      } catch (e: unknown) {
        if ((e as { name?: string }).name === 'AbortError') return
        onError('Stream connection lost. Please try again.')
      }
    }

    const handleEvent = (evt: AgentStreamEvent) => {
      if (evt.type === 'status') {
        setStatusMsg(evt.message ?? '')
      } else if (evt.type === 'agent_start' && evt.agent) {
        setAgent(evt.agent, { status: 'thinking' })
      } else if (evt.type === 'agent_done' && evt.agent) {
        setAgent(evt.agent, { status: 'done', content: evt.content ?? 'Done' })
      } else if (evt.type === 'complete' && evt.decomposition_id) {
        setCompletionStats({ tasks: evt.total_tasks ?? 0, phases: evt.phases ?? 0 })
        setStatusMsg('Plan ready — loading result...')
        onComplete(evt.decomposition_id)
      } else if (evt.type === 'error') {
        onError(evt.message ?? 'Unknown error during analysis.')
      }
    }

    run()
    return () => ctrl.abort()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const doneCount = AGENT_ORDER.filter(k => agentStates[k].status === 'done').length
  const progress = Math.round((doneCount / AGENT_ORDER.length) * 100)

  return (
    <div className="space-y-4 max-w-2xl mx-auto">

      {/* Header */}
      <div
        className="rounded-2xl border-2 p-5"
        style={{ backgroundColor: '#1e3a5f', borderColor: '#008080' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-bold text-sm tracking-widest">5-AGENT DEEP ANALYSIS</p>
          <span className="text-xs font-mono" style={{ color: '#2dd4bf' }}>{doneCount}/{AGENT_ORDER.length} agents</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, backgroundColor: '#008080' }}
          />
        </div>

        <p className="text-xs mt-2" style={{ color: '#2dd4bf' }}>{statusMsg}</p>
      </div>

      {/* Agent lanes */}
      <div className="space-y-2">
        {AGENT_ORDER.map(key => {
          const state = agentStates[key]
          const meta = AGENT_META[key]

          return (
            <div
              key={key}
              className="rounded-xl border p-4 flex items-start gap-3 transition-all duration-300"
              style={{
                backgroundColor: state.status === 'idle' ? '#0f172a' : '#1e3a5f',
                borderColor: state.status === 'done'
                  ? meta.color
                  : state.status === 'thinking'
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(255,255,255,0.07)',
              }}
            >
              {/* Status icon */}
              <div className="mt-0.5 shrink-0">
                {state.status === 'done' && (
                  <CheckCircle2 className="h-4 w-4" style={{ color: meta.color }} />
                )}
                {state.status === 'thinking' && (
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: meta.color }} />
                )}
                {state.status === 'idle' && (
                  <Circle className="h-4 w-4 text-gray-700" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: state.status === 'idle' ? '#475569' : '#fff' }}
                  >
                    {meta.label}
                  </p>
                  {state.status === 'thinking' && <ThinkingDots />}
                </div>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{meta.role}</p>
                {state.status === 'done' && state.content && (
                  <p className="text-xs mt-1.5" style={{ color: '#94a3b8' }}>{state.content}</p>
                )}
                {state.status === 'thinking' && (
                  <p className="text-xs mt-1 italic" style={{ color: '#64748b' }}>Processing...</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Completion stats */}
      {completionStats && (
        <div
          className="rounded-xl border p-4 flex items-center justify-center gap-6"
          style={{ backgroundColor: 'rgba(0,128,128,0.1)', borderColor: 'rgba(0,128,128,0.4)' }}
        >
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{completionStats.phases}</p>
            <p className="text-xs text-gray-400">Phases</p>
          </div>
          <div className="w-px h-10 bg-gray-700" />
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{completionStats.tasks}</p>
            <p className="text-xs text-gray-400">Tasks</p>
          </div>
          <div className="w-px h-10 bg-gray-700" />
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: '#2dd4bf' }}>Ready</p>
            <p className="text-xs text-gray-400">Status</p>
          </div>
        </div>
      )}
    </div>
  )
}
