import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  Activity,
  ArrowRightLeft,
  BarChart3,
  BrainCircuit,
  ClipboardList,
  Heart,
  History,
  Home,
  LayoutDashboard,
  LayoutTemplate,
  MapPin,
  Package,
  X,
} from 'lucide-react'

const primaryNav = [
  { to: '/storeroom',      label: 'Storeroom',       icon: Package },
  { to: '/signout',        label: 'Sign-Out',         icon: ArrowRightLeft },
  { to: '/assets',         label: 'Asset Lifecycle', icon: Activity },
  { to: '/floor-plans',    label: 'Floor Plans',     icon: LayoutTemplate },
  { to: '/tickets',        label: 'Help Desk',       icon: ClipboardList },
  { to: '/medical',        label: 'People Services', icon: Heart },
  { to: '/smart-insights', label: 'Intelligence',    icon: BarChart3 },
]

const nav = [
  { to: '/',          label: 'Home',         icon: Home },
  { to: '/dashboard', label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/decompose', label: 'New Request',  icon: BrainCircuit },
  { to: '/history',   label: 'History',      icon: History },
  { to: '/locations', label: 'Locations',    icon: MapPin },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open = true, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={clsx(
          'fixed md:static inset-y-0 left-0 z-30 w-60 shrink-0 bg-surface-card border-r border-surface-border flex flex-col transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">SpaceMind OS</p>
              <p className="text-gray-500 text-xs">Facilities Intelligence</p>
            </div>
          </div>
          {/* Close button — mobile only */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden text-gray-500 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Primary domain nav */}
          {primaryNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'text-white border border-[#008080]/60'
                    : 'text-gray-400 hover:text-white hover:bg-surface-muted',
                )
              }
              style={({ isActive }) => isActive ? { backgroundColor: 'rgba(0,128,128,0.2)' } : {}}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}

          {/* Divider */}
          <div className="my-3 border-t border-surface-border" />

          {/* Secondary nav */}
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
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
          <p className="text-gray-600 text-xs">Powered by Claude AI</p>
          <p className="text-gray-700 text-xs">v1.0.0</p>
        </div>
      </aside>
    </>
  )
}
