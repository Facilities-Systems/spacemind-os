import axios from 'axios'
import type {
  DecompositionRequest,
  DecompositionResult,
  HistoryResponse,
  Location,
} from '../types'

const http = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 120_000, // AI calls can take time
})

export const api = {
  decompose: async (payload: DecompositionRequest): Promise<DecompositionResult> => {
    const { data } = await http.post<DecompositionResult>('/decompose', payload)
    return data
  },

  getHistory: async (limit = 20, offset = 0): Promise<HistoryResponse> => {
    const { data } = await http.get<HistoryResponse>('/history', {
      params: { limit, offset },
    })
    return data
  },

  getById: async (id: string): Promise<DecompositionResult> => {
    const { data } = await http.get<DecompositionResult>(`/history/${id}`)
    return data
  },

  getLocations: async (): Promise<Location[]> => {
    const { data } = await http.get<{ locations: Location[] }>('/locations')
    return data.locations
  },

  health: async (): Promise<{ status: string }> => {
    const { data } = await http.get('/health')
    return data
  },
}
