import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { ErrorBoundary } from '../ui/ErrorBoundary'

export function Layout() {
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [collapsed,   setCollapsed]   = useState(false)

  return (
    <ErrorBoundary>
      {/* Skip navigation — visible on focus, hidden otherwise (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-teal-600 focus:text-white focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to main content
      </a>

      <div className="flex h-screen overflow-hidden bg-surface font-sans">

        {/* ── Desktop sidebar — width transitions to 0 when collapsed ─── */}
        <div
          className="hidden md:flex shrink-0 overflow-hidden transition-all duration-200 ease-in-out"
          style={{ width: collapsed ? 0 : 240 }}
        >
          <Sidebar />
        </div>

        {/* ── Mobile overlay drawer ────────────────────────────────────── */}
        <div className="md:hidden">
          <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
        </div>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Desktop toggle strip — always visible, sits above every page header */}
          <div
            className="hidden md:flex items-center gap-3 px-3 border-b shrink-0"
            style={{
              height: 36,
              backgroundColor: '#080f1a',
              borderColor: 'rgba(0,128,128,0.15)',
            }}
          >
            <button
              onClick={() => setCollapsed(v => !v)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              className="flex items-center gap-2 px-2 py-1 rounded-lg transition-all text-gray-500 hover:text-white hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              {collapsed
                ? <PanelLeftOpen  className="h-4 w-4" aria-hidden="true" />
                : <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              }
              <span className="text-xs font-medium select-none">
                {collapsed ? 'Show sidebar' : 'Hide sidebar'}
              </span>
            </button>
          </div>

          {/* Mobile top bar */}
          <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-surface-border bg-surface-card shrink-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="text-gray-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <p className="font-bold text-white text-sm">SpaceMind OS</p>
          </div>

          <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
            <Outlet />
          </main>
        </div>

      </div>
    </ErrorBoundary>
  )
}
