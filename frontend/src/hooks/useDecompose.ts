import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { DecompositionRequest } from '../types'

export const QUERY_KEYS = {
  history: ['history'] as const,
  decomposition: (id: string) => ['decomposition', id] as const,
  locations: ['locations'] as const,
}

export function useDecompose() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: DecompositionRequest) => api.decompose(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.history })
    },
  })
}

export function useHistory(limit = 20, offset = 0) {
  return useQuery({
    queryKey: [...QUERY_KEYS.history, limit, offset],
    queryFn: () => api.getHistory(limit, offset),
  })
}

export function useDecompositionById(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.decomposition(id ?? ''),
    queryFn: () => api.getById(id!),
    enabled: !!id,
  })
}

export function useLocations() {
  return useQuery({
    queryKey: QUERY_KEYS.locations,
    queryFn: api.getLocations,
    staleTime: Infinity,
  })
}
