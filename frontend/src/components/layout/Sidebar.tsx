import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  BrainCircuit,
  ClipboardList,
  History,
  LayoutDashboard,
  MapPin,
} from 'lucide-react'

const nav = [
  { to: '/',          label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/decompose', label: 'New Request', icon: BrainCircuit },
  { to: '/history',   label: 'History',     icon: History },
  { to: '/locations', label: 'Locations',   icon: MapPin },
]

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-surface-card border-r border-surface-border flex flex-col">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">SpaceMind OS</p>
            <p className="text-gray-500 text-xs">Facilities Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-700/40'
                  : 'text-gray-400 hover:text-white hover:bg-surface-muted',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-surface-border">
        <p className="text-gray-600 text-xs">
          Powered by Claude AI
        </p>
        <p className="text-gray-700 text-xs">v1.0.0</p>
      </div>
    </aside>
  )
}
