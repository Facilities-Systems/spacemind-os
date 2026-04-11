import axios from 'axios'
import type {
  DecompositionRequest,
  DecompositionResult,
  HistoryResponse,
  Location,
} from '../types'

const TOKEN_KEY = 'sm_access_token'

const http = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 120_000,
})

// Attach JWT on every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redirect to login on 401
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('sm_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export const api = {
  decompose: async (
    payload: DecompositionRequest,
    multiAgent = false,
  ): Promise<DecompositionResult> => {
    const endpoint = multiAgent ? '/orchestrate' : '/decompose'
    const { data } = await http.post<DecompositionResult>(endpoint, payload)
    return data
  },

  getHistory: async (
    limit = 20,
    offset = 0,
    request_type?: string,
    location_id?: string,
    priority?: string,
    from_date?: string,
    to_date?: string,
  ): Promise<HistoryResponse> => {
    const { data } = await http.get<HistoryResponse>('/history', {
      params: {
        limit,
        offset,
        ...(request_type && { request_type }),
        ...(location_id && { location_id }),
        ...(priority && { priority }),
        ...(from_date && { from_date }),
        ...(to_date && { to_date }),
      },
    })
    return data
  },

  getById: async (id: string): Promise<DecompositionResult> => {
    const { data } = await http.get<DecompositionResult>(`/history/${id}`)
    return data
  },

  updateTaskStatus: async (
    decompositionId: string,
    taskId: string,
    status: string,
  ): Promise<void> => {
    await http.patch(`/history/${decompositionId}/tasks/${taskId}`, null, {
      params: { status },
    })
  },

  exportDecomposition: async (
    id: string,
    format: 'pdf' | 'json' | 'markdown' | 'excel',
  ): Promise<void> => {
    const token = localStorage.getItem(TOKEN_KEY)
    const res = await fetch(`/api/v1/history/${id}/export?format=${format}`, {
      headers: { Authorization: `Bearer ${token ?? ''}` },
    })
    if (!res.ok) throw new Error('Export failed')
    const blob = await res.blob()
    const ext = format === 'markdown' ? 'md' : format === 'excel' ? 'xlsx' : format
    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href     = url
    a.download = `spacemind-plan-${id.slice(0, 8)}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  },

  getAnalytics: async (): Promise<Record<string, unknown>> => {
    const { data } = await http.get('/analytics')
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
