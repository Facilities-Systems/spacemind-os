import { Building2, CheckCircle2, Globe, Lock } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { TenureBadge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { useLocations } from '../hooks/useDecompose'

export function LocationsPage() {
  const { data: locations = [], isLoading } = useLocations()

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Office Locations"
        subtitle="All registered facilities — owned and rented"
      />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locations.map(loc => (
                <Card key={loc.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-surface-muted flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-brand-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{loc.id}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                          <Globe className="h-3 w-3" />
                          {loc.country}
                        </div>
                      </div>
                    </div>
                    <TenureBadge tenure={loc.tenure} />
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {loc.landlord_required ? (
                      <span className="flex items-center gap-1.5 text-amber-400 bg-amber-900/20 border border-amber-800/30 rounded-lg px-2.5 py-1.5">
                        <Lock className="h-3 w-3" />
                        Landlord approval required for structural changes
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-900/20 border border-emerald-800/30 rounded-lg px-2.5 py-1.5">
                        <CheckCircle2 className="h-3 w-3" />
                        Owned — full internal authority
                      </span>
                    )}
                  </div>

                  {loc.notes && (
                    <p className="text-xs text-gray-500 leading-relaxed">{loc.notes}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
