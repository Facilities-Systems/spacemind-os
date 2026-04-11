/**
 * CatalogSelector — Step 1 of the decompose flow.
 * Presents the 7 operation types as cards rooted in The Sifiso Methodology.
 * Clicking a card moves the user to the request form with the type pre-selected.
 */
import {
  ArrowRightLeft,
  Building2,
  Layers,
  UtensilsCrossed,
  Wrench,
  LayoutGrid,
  Package,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface OperationType {
  type: string
  label: string
  description: string
  duration: string
  phases: number
  icon: LucideIcon
  accent: string        // Tailwind text colour class
  border: string        // Tailwind border + bg class for hover
  iconBg: string        // Icon container bg class
}

export const OPERATION_TYPES: OperationType[] = [
  {
    type: 'office_move',
    label: 'Office Move',
    description: 'Relocate teams between spaces. Infrastructure readiness, IT migration, physical move sequenced end-to-end.',
    duration: '~21 days',
    phases: 6,
    icon: ArrowRightLeft,
    accent: 'text-brand-400',
    border: 'hover:border-brand-600/50 hover:bg-brand-900/10',
    iconBg: 'bg-brand-600/20 text-brand-300',
  },
  {
    type: 'full_fitout',
    label: 'Full Fit-Out',
    description: 'Complete build-out from shell or core. Ceiling → Walls → Floor sequencing enforced. Landlord approval tracked.',
    duration: '~90 days',
    phases: 8,
    icon: Building2,
    accent: 'text-purple-400',
    border: 'hover:border-purple-600/50 hover:bg-purple-900/10',
    iconBg: 'bg-purple-600/20 text-purple-300',
  },
  {
    type: 'floor_renovation',
    label: 'Floor Renovation',
    description: 'Phased occupied-floor refresh. Business continuity planned across zones — staff never fully displaced.',
    duration: '~60 days',
    phases: 5,
    icon: Layers,
    accent: 'text-amber-400',
    border: 'hover:border-amber-600/50 hover:bg-amber-900/10',
    iconBg: 'bg-amber-600/20 text-amber-300',
  },
  {
    type: 'canteen_setup',
    label: 'Canteen Setup',
    description: 'Food service area installation. HACCP compliance, extraction design, gas safety, food authority registration.',
    duration: '~45 days',
    phases: 5,
    icon: UtensilsCrossed,
    accent: 'text-green-400',
    border: 'hover:border-green-600/50 hover:bg-green-900/10',
    iconBg: 'bg-green-600/20 text-green-300',
  },
  {
    type: 'maintenance',
    label: 'Maintenance',
    description: 'Reactive and preventive fault resolution. P1/P2/P3 triage, SLA-tracked vendor dispatch, root-cause documentation.',
    duration: '~3 days',
    phases: 4,
    icon: Wrench,
    accent: 'text-red-400',
    border: 'hover:border-red-600/50 hover:bg-red-900/10',
    iconBg: 'bg-red-600/20 text-red-300',
  },
  {
    type: 'space_change',
    label: 'Space Change',
    description: 'Partition installation or removal, layout reconfiguration. M&E adjusted before walls — always.',
    duration: '~21 days',
    phases: 5,
    icon: LayoutGrid,
    accent: 'text-cyan-400',
    border: 'hover:border-cyan-600/50 hover:bg-cyan-900/10',
    iconBg: 'bg-cyan-600/20 text-cyan-300',
  },
  {
    type: 'vendor_coordination',
    label: 'Vendor Coordination',
    description: 'End-to-end procurement and SLA management. RFQ, evaluation, appointment, onsite management, completion.',
    duration: '~30 days',
    phases: 6,
    icon: Package,
    accent: 'text-orange-400',
    border: 'hover:border-orange-600/50 hover:bg-orange-900/10',
    iconBg: 'bg-orange-600/20 text-orange-300',
  },
]

interface CatalogSelectorProps {
  onSelect: (op: OperationType) => void
}

export function CatalogSelector({ onSelect }: CatalogSelectorProps) {
  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">What do you need to do?</h2>
        <p className="text-gray-500 text-sm max-w-lg mx-auto">
          Select the operation type — SpaceMind OS will apply the right knowledge template,
          compliance rules, and expert sequencing before the AI begins planning.
        </p>
      </div>

      {/* 7-card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {OPERATION_TYPES.map((op) => {
          const Icon = op.icon
          return (
            <button
              key={op.type}
              onClick={() => onSelect(op)}
              className={`group text-left bg-surface-card border border-surface-border rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 ${op.border}`}
            >
              {/* Icon */}
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${op.iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>

              {/* Name */}
              <h3 className="text-white font-bold text-sm mb-1.5">{op.label}</h3>

              {/* Description */}
              <p className="text-gray-500 text-xs leading-relaxed mb-4">{op.description}</p>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold ${op.accent}`}>{op.duration}</span>
                <span className="text-gray-700 text-xs">·</span>
                <span className="text-gray-500 text-xs">{op.phases} phases</span>
              </div>

              {/* CTA hint */}
              <div className={`mt-3 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity ${op.accent}`}>
                Select →
              </div>
            </button>
          )
        })}

        {/* Free-form option */}
        <button
          onClick={() => onSelect({
            type: 'unknown',
            label: 'Other / Free-form',
            description: '',
            duration: 'Varies',
            phases: 0,
            icon: Package,
            accent: 'text-gray-400',
            border: '',
            iconBg: 'bg-surface-muted text-gray-400',
          })}
          className="group text-left bg-surface border border-dashed border-surface-border rounded-2xl p-5 transition-all hover:border-gray-600"
        >
          <div className="h-10 w-10 rounded-xl bg-surface-muted flex items-center justify-center mb-4">
            <span className="text-gray-500 text-lg font-bold">+</span>
          </div>
          <h3 className="text-gray-400 font-bold text-sm mb-1.5">Other / Free-form</h3>
          <p className="text-gray-600 text-xs leading-relaxed">
            Describe any facilities request in plain language — the AI will classify and plan it.
          </p>
        </button>
      </div>
    </div>
  )
}
