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
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="flex items-center gap-2 px-2 py-1 rounded-lg transition-all text-gray-500 hover:text-white hover:bg-white/5"
            >
              {collapsed
                ? <PanelLeftOpen  className="h-4 w-4" />
                : <PanelLeftClose className="h-4 w-4" />
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
              className="text-gray-400 hover:text-white"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <p className="font-bold text-white text-sm">SpaceMind OS</p>
          </div>

          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>

      </div>
    </ErrorBoundary>
  )
}
