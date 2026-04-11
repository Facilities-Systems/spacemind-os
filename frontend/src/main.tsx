import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// ─── Sentry (only initialised if VITE_SENTRY_DSN is set) ─────────────────────
const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
if (sentryDsn) {
  import('@sentry/react').then(({ init, browserTracingIntegration }) => {
    init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE,
      integrations: [browserTracingIntegration()],
      tracesSampleRate: 0.1,
      // Never send PII
      beforeSend(event) {
        if (event.request?.headers) {
          delete event.request.headers['Authorization']
        }
        return event
      },
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
