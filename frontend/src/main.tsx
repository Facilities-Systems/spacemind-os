import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

// Register service worker in production only — dev mode keeps SW disabled in vite.config.ts
if (import.meta.env.PROD) {
  registerSW({
    onOfflineReady() {
      console.info('[PWA] SpaceMind OS is ready to work offline.')
    },
    onNeedRefresh() {
      // New version available — reload to pick it up
      // In a future iteration this could show a toast with a manual refresh button
      window.location.reload()
    },
  })
}

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
