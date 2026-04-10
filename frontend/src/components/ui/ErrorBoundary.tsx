import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SpaceMind OS] Uncaught error:', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-surface">
          <div className="text-center max-w-md px-6">
            <div className="h-16 w-16 rounded-full bg-red-900/30 border border-red-800/40 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="text-white font-bold text-xl mb-2">Something went wrong</h1>
            <p className="text-gray-400 text-sm mb-1">
              SpaceMind OS encountered an unexpected error.
            </p>
            {this.state.error?.message && (
              <p className="text-gray-600 text-xs font-mono mb-6 bg-surface-card border border-surface-border rounded-lg px-3 py-2">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
