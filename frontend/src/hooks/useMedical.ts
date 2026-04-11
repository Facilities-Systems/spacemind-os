import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { IncidentStatus } from '../types'

export function useMedical() {
  const qc = useQueryClient()

  const invalidateItems     = () => qc.invalidateQueries({ queryKey: ['medical', 'items'] })
  const invalidateIncidents = () => qc.invalidateQueries({ queryKey: ['medical', 'incidents'] })
  const invalidateAnalytics = () => qc.invalidateQueries({ queryKey: ['medical', 'analytics'] })

  // ── Queries ────────────────────────────────────────────────────────────────
  const itemsQ     = useQuery({ queryKey: ['medical', 'items'],     queryFn: () => api.getMedicalItems() })
  const incidentsQ = useQuery({ queryKey: ['medical', 'incidents'], queryFn: () => api.getIncidents() })
  const analyticsQ = useQuery({ queryKey: ['medical', 'analytics'], queryFn: () => api.getMedicalAnalytics(),
                                staleTime: 60_000 })

  // ── Medical item mutations ─────────────────────────────────────────────────
  const addItem = useMutation({
    mutationFn: api.createMedicalItem,
    onSuccess: () => { invalidateItems(); invalidateAnalytics() },
  })

  const updateItem = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof api.updateMedicalItem>[1]) =>
      api.updateMedicalItem(id, data),
    onSuccess: () => { invalidateItems(); invalidateAnalytics() },
  })

  const deleteItem = useMutation({
    mutationFn: api.deleteMedicalItem,
    onSuccess: () => { invalidateItems(); invalidateAnalytics() },
  })

  // ── Incident mutations ─────────────────────────────────────────────────────
  const logIncident = useMutation({
    mutationFn: api.createIncident,
    onSuccess: () => { invalidateIncidents(); invalidateAnalytics() },
  })

  const updateIncidentStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: IncidentStatus }) =>
      api.updateIncidentStatus(id, status),
    onSuccess: () => { invalidateIncidents(); invalidateAnalytics() },
  })

  return {
    // Queries
    itemsQ,
    incidentsQ,
    analyticsQ,
    // Convenience data accessors
    items:     itemsQ.data     ?? [],
    incidents: incidentsQ.data ?? [],
    analytics: analyticsQ.data,
    isLoading: itemsQ.isLoading || incidentsQ.isLoading,
    // Mutations
    addItem,
    updateItem,
    deleteItem,
    logIncident,
    updateIncidentStatus,
  }
}
