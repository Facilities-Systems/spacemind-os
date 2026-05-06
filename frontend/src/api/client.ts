import axios from 'axios'
import type {
  AdminDashboard,
  Asset,
  AssetAnalytics,
  AssetRiskItem,
  AuditLogResponse,
  ComplianceAnalytics,
  DecompositionRequest,
  DecompositionResult,
  FloorPlan,
  FloorPlanPayload,
  HistoryResponse,
  IncidentStatus,
  InsightsSummary,
  InventoryAnalytics,
  InventoryItem,
  ItemQr,
  Location,
  MaintenanceLog,
  MaintenanceScheduleItem,
  MedicalAlerts,
  MedicalAnalytics,
  MedicalIncident,
  MedicalItem,
  Requisition,
  ReqStatus,
  SensorReading,
  SensorSummary,
  SignOutTx,
  Supplier,
  SupplierPayload,
  UserOut,
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

  getItemQr: async (itemId: string): Promise<ItemQr> => {
    const { data } = await http.get<ItemQr>(`/inventory/items/${itemId}/qr`)
    return data
  },

  getComplianceAnalytics: async (): Promise<ComplianceAnalytics> => {
    const { data } = await http.get<ComplianceAnalytics>('/inventory/compliance')
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

  getMedicalAlerts: async (daysAhead = 30): Promise<MedicalAlerts> => {
    const { data } = await http.get<MedicalAlerts>('/medical/alerts', { params: { days_ahead: daysAhead } })
    return data
  },

  // ── Suppliers ────────────────────────────────────────────────────────────────

  getSuppliers: async (activeOnly = false): Promise<Supplier[]> => {
    const { data } = await http.get<Supplier[]>('/suppliers', { params: { active_only: activeOnly } })
    return data
  },

  createSupplier: async (payload: SupplierPayload): Promise<Supplier> => {
    const { data } = await http.post<Supplier>('/suppliers', payload)
    return data
  },

  updateSupplier: async (id: string, payload: Partial<SupplierPayload> & { is_active?: boolean }): Promise<Supplier> => {
    const { data } = await http.patch<Supplier>(`/suppliers/${id}`, payload)
    return data
  },

  deleteSupplier: async (id: string): Promise<void> => {
    await http.delete(`/suppliers/${id}`)
  },

  // ── Admin ───────────────────────────────────────────────────────────────────

  getAdminDashboard: async (): Promise<AdminDashboard> => {
    const { data } = await http.get<AdminDashboard>('/admin/dashboard')
    return data
  },

  getAuditLog: async (params?: {
    limit?: number; offset?: number
    action?: string; user_email?: string; resource_type?: string
  }): Promise<AuditLogResponse> => {
    const { data } = await http.get<AuditLogResponse>('/admin/audit-log', { params })
    return data
  },

  updateUser: async (userId: string, payload: { role?: string; is_active?: boolean; full_name?: string }): Promise<UserOut> => {
    const { data } = await http.patch<UserOut>(`/auth/users/${userId}`, payload)
    return data
  },

  deactivateUser: async (userId: string): Promise<UserOut> => {
    const { data } = await http.post<UserOut>(`/auth/users/${userId}/deactivate`)
    return data
  },

  // ── Floor Plans ─────────────────────────────────────────────────────────────

  getFloorPlans: async (buildingId?: string): Promise<FloorPlan[]> => {
    const { data } = await http.get<FloorPlan[]>('/floor-plans', {
      params: buildingId ? { building_id: buildingId } : undefined,
    })
    return data
  },

  createFloorPlan: async (payload: FloorPlanPayload): Promise<FloorPlan> => {
    const { data } = await http.post<FloorPlan>('/floor-plans', payload)
    return data
  },

  updateFloorPlan: async (id: string, payload: Partial<FloorPlanPayload>): Promise<FloorPlan> => {
    const { data } = await http.patch<FloorPlan>(`/floor-plans/${id}`, payload)
    return data
  },

  deleteFloorPlan: async (id: string): Promise<void> => {
    await http.delete(`/floor-plans/${id}`)
  },

  // ── Insights ────────────────────────────────────────────────────────────────

  getInsightsSummary: async (): Promise<InsightsSummary> => {
    const { data } = await http.get<InsightsSummary>('/insights/summary')
    return data
  },

  // ── Assets ──────────────────────────────────────────────────────────────────

  getAssets: async (params?: { category?: string; status?: string; location_id?: string }): Promise<Asset[]> => {
    const { data } = await http.get<Asset[]>('/assets', { params })
    return data
  },

  getAsset: async (id: string): Promise<Asset> => {
    const { data } = await http.get<Asset>(`/assets/${id}`)
    return data
  },

  createAsset: async (payload: Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<Asset> => {
    const { data } = await http.post<Asset>('/assets', payload)
    return data
  },

  updateAsset: async (id: string, payload: Partial<Asset>): Promise<Asset> => {
    const { data } = await http.patch<Asset>(`/assets/${id}`, payload)
    return data
  },

  decommissionAsset: async (id: string): Promise<void> => {
    await http.delete(`/assets/${id}`)
  },

  getAssetHistory: async (id: string): Promise<MaintenanceLog[]> => {
    const { data } = await http.get<MaintenanceLog[]>(`/assets/${id}/history`)
    return data
  },

  logMaintenance: async (id: string, payload: Omit<MaintenanceLog, 'id' | 'asset_id'>): Promise<MaintenanceLog> => {
    const { data } = await http.post<MaintenanceLog>(`/assets/${id}/maintenance`, payload)
    return data
  },

  getAssetAnalytics: async (): Promise<AssetAnalytics> => {
    const { data } = await http.get<AssetAnalytics>('/assets/analytics')
    return data
  },

  analyseAsset: async (id: string): Promise<{ asset_id: string; analysis: string }> => {
    const { data } = await http.post<{ asset_id: string; analysis: string }>(`/assets/${id}/analyse`)
    return data
  },

  getAssetRiskReport: async (): Promise<AssetRiskItem[]> => {
    const { data } = await http.get<AssetRiskItem[]>('/assets/risk-report')
    return data
  },

  getMaintenanceSchedule: async (): Promise<MaintenanceScheduleItem[]> => {
    const { data } = await http.get<MaintenanceScheduleItem[]>('/assets/maintenance-schedule')
    return data
  },

  // ── IoT Sensors ─────────────────────────────────────────────────────────────

  getSensorLatest: async (): Promise<SensorSummary> => {
    const { data } = await http.get<SensorSummary>('/sensors/latest')
    return data
  },

  getSensorHistory: async (params?: { sensor_type?: string; location_id?: string; limit?: number }): Promise<SensorReading[]> => {
    const { data } = await http.get<SensorReading[]>('/sensors/history', { params })
    return data
  },

  getSensorAnomalies: async (limit = 100): Promise<SensorReading[]> => {
    const { data } = await http.get<SensorReading[]>('/sensors/anomalies', { params: { limit } })
    return data
  },

  analyseSensors: async (): Promise<{ analysis: string }> => {
    const { data } = await http.post<{ analysis: string }>('/sensors/analyse')
    return data
  },

  // ── AI Concierge Chat ────────────────────────────────────────────────────────

  chat: async (messages: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<{ reply: string }> => {
    const { data } = await http.post<{ reply: string }>('/chat', { messages })
    return data
  },
}
