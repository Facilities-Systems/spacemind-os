import axios from 'axios'
import type {
  DecompositionRequest,
  DecompositionResult,
  HistoryResponse,
  IncidentStatus,
  InsightsSummary,
  InventoryAnalytics,
  InventoryItem,
  Location,
  MedicalAnalytics,
  MedicalIncident,
  MedicalItem,
  Requisition,
  ReqStatus,
  SignOutTx,
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

  // ── Inventory ───────────────────────────────────────────────────────────────

  getInventoryItems: async (params?: { category?: string; stock_filter?: string }): Promise<InventoryItem[]> => {
    const { data } = await http.get<InventoryItem[]>('/inventory/items', { params })
    return data
  },

  createInventoryItem: async (payload: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> => {
    const { data } = await http.post<InventoryItem>('/inventory/items', payload)
    return data
  },

  updateInventoryItem: async (id: string, payload: Partial<Omit<InventoryItem, 'id' | 'code' | 'created_at' | 'updated_at'>>): Promise<InventoryItem> => {
    const { data } = await http.patch<InventoryItem>(`/inventory/items/${id}`, payload)
    return data
  },

  deleteInventoryItem: async (id: string): Promise<void> => {
    await http.delete(`/inventory/items/${id}`)
  },

  getTransactions: async (params?: { status?: string; department?: string }): Promise<SignOutTx[]> => {
    const { data } = await http.get<SignOutTx[]>('/inventory/transactions', { params })
    return data
  },

  signOutItem: async (payload: {
    item_id: string; quantity: number; borrower: string;
    department?: string; work_order?: string; expected_return?: string; notes?: string
  }): Promise<SignOutTx> => {
    const { data } = await http.post<SignOutTx>('/inventory/transactions', payload)
    return data
  },

  returnItem: async (txId: string): Promise<SignOutTx> => {
    const { data } = await http.patch<SignOutTx>(`/inventory/transactions/${txId}/return`)
    return data
  },

  getRequisitions: async (params?: { status?: string }): Promise<Requisition[]> => {
    const { data } = await http.get<Requisition[]>('/inventory/requisitions', { params })
    return data
  },

  createRequisition: async (payload: {
    requester: string; role?: string; department?: string;
    work_order?: string; priority?: string; items_description: string; notes?: string
  }): Promise<Requisition> => {
    const { data } = await http.post<Requisition>('/inventory/requisitions', payload)
    return data
  },

  updateRequisitionStatus: async (id: string, status: ReqStatus): Promise<Requisition> => {
    const { data } = await http.patch<Requisition>(`/inventory/requisitions/${id}/status`, { status })
    return data
  },

  getInventoryAnalytics: async (): Promise<InventoryAnalytics> => {
    const { data } = await http.get<InventoryAnalytics>('/inventory/analytics')
    return data
  },

  // ── Medical ─────────────────────────────────────────────────────────────────

  getMedicalItems: async (params?: { category?: string }): Promise<MedicalItem[]> => {
    const { data } = await http.get<MedicalItem[]>('/medical/items', { params })
    return data
  },

  createMedicalItem: async (payload: Omit<MedicalItem, 'id' | 'created_at' | 'updated_at'>): Promise<MedicalItem> => {
    const { data } = await http.post<MedicalItem>('/medical/items', payload)
    return data
  },

  updateMedicalItem: async (id: string, payload: Partial<Omit<MedicalItem, 'id' | 'created_at' | 'updated_at'>>): Promise<MedicalItem> => {
    const { data } = await http.patch<MedicalItem>(`/medical/items/${id}`, payload)
    return data
  },

  deleteMedicalItem: async (id: string): Promise<void> => {
    await http.delete(`/medical/items/${id}`)
  },

  getIncidents: async (params?: { status?: string }): Promise<MedicalIncident[]> => {
    const { data } = await http.get<MedicalIncident[]>('/medical/incidents', { params })
    return data
  },

  createIncident: async (payload: {
    incident_type: string; severity: string; employee_name?: string;
    department?: string; description: string; treatment?: string
  }): Promise<MedicalIncident> => {
    const { data } = await http.post<MedicalIncident>('/medical/incidents', payload)
    return data
  },

  updateIncidentStatus: async (id: string, status: IncidentStatus): Promise<MedicalIncident> => {
    const { data } = await http.patch<MedicalIncident>(`/medical/incidents/${id}/status`, { status })
    return data
  },

  getMedicalAnalytics: async (): Promise<MedicalAnalytics> => {
    const { data } = await http.get<MedicalAnalytics>('/medical/analytics')
    return data
  },

  // ── Insights ────────────────────────────────────────────────────────────────

  getInsightsSummary: async (): Promise<InsightsSummary> => {
    const { data } = await http.get<InsightsSummary>('/insights/summary')
    return data
  },
}
