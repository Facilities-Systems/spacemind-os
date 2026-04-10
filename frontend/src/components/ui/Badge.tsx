import { clsx } from 'clsx'
import type { RiskLevel, RequestType, Priority, TenureType, ResponsiblePartyType } from '../../types'

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'purple'

const variantClasses: Record<Variant, string> = {
  default:  'bg-brand-900/60 text-brand-300 border border-brand-700/50',
  success:  'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50',
  warning:  'bg-amber-900/40 text-amber-300 border border-amber-700/50',
  danger:   'bg-red-900/40 text-red-300 border border-red-700/50',
  info:     'bg-sky-900/40 text-sky-300 border border-sky-700/50',
  muted:    'bg-surface-muted text-gray-400 border border-surface-border',
  purple:   'bg-purple-900/40 text-purple-300 border border-purple-700/50',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: Variant
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', variantClasses[variant], className)}>
      {children}
    </span>
  )
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const map: Record<RiskLevel, Variant> = {
    low: 'success', medium: 'warning', high: 'danger', critical: 'danger',
  }
  return <Badge variant={map[level]}>{level.toUpperCase()}</Badge>
}

export function RequestTypeBadge({ type }: { type: RequestType }) {
  const labels: Record<RequestType, string> = {
    office_move: 'Office Move',
    full_fitout: 'Full Fit-Out',
    floor_renovation: 'Renovation',
    canteen_setup: 'Canteen Setup',
    maintenance: 'Maintenance',
    space_change: 'Space Change',
    vendor_coordination: 'Vendor',
    unknown: 'Unknown',
  }
  return <Badge variant="purple">{labels[type] ?? type}</Badge>
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, Variant> = {
    low: 'muted', normal: 'info', high: 'warning', urgent: 'danger',
  }
  return <Badge variant={map[priority] ?? 'muted'}>{priority.toUpperCase()}</Badge>
}

export function TenureBadge({ tenure }: { tenure: TenureType }) {
  const map: Record<TenureType, Variant> = { owned: 'success', rented: 'warning', mixed: 'info' }
  return <Badge variant={map[tenure]}>{tenure.toUpperCase()}</Badge>
}

export function ResponsibleBadge({ party }: { party: ResponsiblePartyType }) {
  const partyMap: Record<ResponsiblePartyType, Variant> = {
    internal: 'info',
    landlord: 'warning',
    vendor: 'purple',
    it_team: 'default',
    electrician: 'warning',
    plumber: 'muted',
    contractor: 'purple',
    facilities_manager: 'success',
    hr: 'info',
    legal: 'danger',
    other: 'muted',
  }
  return <Badge variant={partyMap[party] ?? 'muted'}>{party.replace('_', ' ')}</Badge>
}
