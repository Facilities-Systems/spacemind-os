// ─── SpaceMind OS — Shared TypeScript Types ─────────────────────────────────
// Mirror of the Python Pydantic schemas — keep in sync with backend

export type RequestType =
  | 'office_move'
  | 'full_fitout'
  | 'floor_renovation'
  | 'canteen_setup'
  | 'maintenance'
  | 'space_change'
  | 'vendor_coordination'
  | 'unknown'

export type Priority = 'low' | 'normal' | 'high' | 'urgent'
export type TenureType = 'owned' | 'rented' | 'mixed'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type PhaseStatus = 'pending' | 'in_progress' | 'blocked' | 'completed'
export type ResponsiblePartyType =
  | 'internal'
  | 'landlord'
  | 'vendor'
  | 'it_team'
  | 'electrician'
  | 'plumber'
  | 'contractor'
  | 'facilities_manager'
  | 'hr'
  | 'legal'
  | 'other'

// ─── Request ─────────────────────────────────────────────────────────────────

export interface DecompositionRequest {
  request_text: string
  location_id: string
  priority?: Priority
  requester_name?: string
  target_completion_date?: string
  additional_context?: string
}

// ─── Response ─────────────────────────────────────────────────────────────────

export interface ResponsibleParty {
  party: ResponsiblePartyType
  name?: string
  notes?: string
}

export interface TaskItem {
  id: string
  name: string
  description?: string
  responsible: ResponsibleParty
  estimated_duration_hours?: number
  dependencies: string[]
  risks: string[]
  risk_level: RiskLevel
  status: PhaseStatus
  landlord_approval_required: boolean
  notes?: string
}

export interface Phase {
  name: string
  order: number
  description?: string
  tasks: TaskItem[]
  status: PhaseStatus
}

export interface LocationContext {
  location_id: string
  tenure: TenureType
  country: string
  landlord_approval_required: boolean
  notes?: string
}

export interface DecompositionResult {
  id: string
  created_at: string
  request_summary: string
  original_request: string
  request_type: RequestType
  priority: Priority
  location_context: LocationContext
  phases: Phase[]
  total_estimated_duration_days?: number
  total_tasks: number
  key_risks: string[]
  recommendations: string[]
  landlord_items: string[]
  compliance_notes: string[]
  metadata: Record<string, unknown>
}

export interface DecompositionSummary {
  id: string
  created_at: string
  request_type: string
  request_summary: string
  location_id: string
  total_tasks: number
  priority: string
}

export interface HistoryResponse {
  items: DecompositionSummary[]
  total: number
}

export interface Location {
  id: string
  country: string
  tenure: TenureType
  landlord_required: boolean
  notes: string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface UserOut {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
}

export interface Token {
  access_token: string
  token_type: string
  user: UserOut
}

export interface LoginCredentials {
  username: string   // OAuth2PasswordRequestForm uses 'username'
  password: string
}

export interface RegisterPayload {
  email: string
  full_name: string
  password: string
  role?: string
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export type ItemCategory = 'Electrical' | 'Plumbing' | 'Carpentry' | 'Painting' | 'Hygiene' | 'Tools' | 'Other'
export type TxStatus     = 'Outstanding' | 'Returned' | 'Overdue'
export type ReqStatus    = 'Pending' | 'Approved' | 'Issued' | 'Rejected'
export type StockPriority = 'High' | 'Medium' | 'Low'

export interface InventoryItem {
  id: string
  name: string
  code: string
  category: ItemCategory
  quantity: number
  unit: string
  min_level: number
  location: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SignOutTx {
  id: string
  item_id: string
  item_name: string
  item_code: string
  quantity: number
  borrower: string
  department: string | null
  work_order: string | null
  date_out: string
  expected_return: string | null
  date_returned: string | null
  status: TxStatus
  notes: string | null
}

export interface Requisition {
  id: string
  requester: string
  role: string | null
  department: string | null
  work_order: string | null
  priority: StockPriority
  items_description: string
  status: ReqStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ReorderRecommendation {
  item_id: string
  item_name: string
  item_code: string
  current_qty: number
  min_level: number
  deficit: number
  suggested_reorder_qty: number
}

export interface InventoryAnalytics {
  total_items: number
  low_stock_count: number
  critical_count: number
  outstanding_transactions: number
  pending_requisitions: number
  low_stock_items: ReorderRecommendation[]
  critical_items: ReorderRecommendation[]
  reorder_recommendations: ReorderRecommendation[]
}

export interface DeptCompliance {
  department: string
  total: number
  returned: number
  outstanding: number
  overdue: number
  compliance_rate: number
}

export interface ComplianceAnalytics {
  total_transactions: number
  returned: number
  outstanding: number
  overdue: number
  compliance_rate: number
  by_department: DeptCompliance[]
  top_outstanding_borrowers: Array<{ borrower: string; department: string | null; outstanding: number }>
}

export interface ItemQr {
  item_id: string
  item_code: string
  item_name: string
  qr_base64: string
  payload: string
}

// ─── Medical ──────────────────────────────────────────────────────────────────

export type MedicalItemCategory = 'First Aid' | 'Medication' | 'Equipment' | 'PPE'
export type IncidentSeverity    = 'Low' | 'Medium' | 'High' | 'Critical'
export type IncidentStatus      = 'Open' | 'Resolved' | 'Referred'

export interface MedicalItem {
  id: string
  name: string
  category: MedicalItemCategory
  quantity: number
  unit: string
  min_level: number
  expiry_date: string | null
  equipment_serial_number: string | null
  last_service_date: string | null
  location: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MedicalAlerts {
  expired: MedicalItem[]
  expiring_soon: MedicalItem[]
  low_stock: MedicalItem[]
}

export interface MedicalIncident {
  id: string
  incident_type: string
  severity: IncidentSeverity
  employee_name: string | null
  department: string | null
  description: string
  treatment: string | null
  status: IncidentStatus
  reported_at: string
  resolved_at: string | null
}

export interface MedicalAnalytics {
  total_items: number
  low_stock_count: number
  expiring_soon_count: number
  open_incidents: number
  critical_incidents: number
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export interface Supplier {
  id: string
  name: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  category: string | null
  lead_time_days: number | null
  notes: string | null
  is_active: boolean
  created_at: string
}

export interface SupplierPayload {
  name: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  category?: string
  lead_time_days?: number
  notes?: string
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminUserSummary {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
}

export interface AuditEntry {
  id: string
  created_at: string
  user_email: string | null
  action: string
  resource_type: string
  resource_id: string | null
  details: Record<string, unknown> | null
}

export interface AuditLogResponse {
  items: AuditEntry[]
  total: number
}

export interface AdminDashboard {
  total_users: number
  active_users: number
  total_decompositions: number
  decompositions_this_week: number
  decompositions_this_month: number
  users: AdminUserSummary[]
  recent_audit: AuditEntry[]
}

// ─── Floor Plans ──────────────────────────────────────────────────────────────

export type FloorStatus = 'active' | 'under_renovation' | 'inactive'

export interface FloorPlan {
  id: string
  building_id: string
  building_name: string
  floor_name: string
  floor_order: number
  total_area_sqm: number
  capacity_pax: number
  total_desks: number
  occupied_desks: number
  meeting_rooms: number
  status: FloorStatus
  created_at: string
  updated_at: string
}

export interface FloorPlanPayload {
  building_id: string
  building_name: string
  floor_name: string
  floor_order?: number
  total_area_sqm?: number
  capacity_pax?: number
  total_desks?: number
  occupied_desks?: number
  meeting_rooms?: number
  status?: FloorStatus
}

// ─── Insights Summary ─────────────────────────────────────────────────────────

export interface InsightsKpi {
  label: string
  value: string
  description: string
  trend: 'up' | 'down'
}

export interface InsightsSummary {
  decompositions: {
    total: number
    by_type: Array<{ type: string; count: number }>
  }
  inventory: {
    total_items: number
    low_stock_count: number
    critical_count: number
    outstanding_signouts: number
    compliance_rate: number
  }
  medical: {
    open_incidents: number
    critical_incidents: number
    low_stock_items: number
  }
  kpis: InsightsKpi[]
}

// ─── Assets ──────────────────────────────────────────────────────────────────

export type AssetStatus = 'active' | 'under_maintenance' | 'decommissioned'
export type MaintenanceType = 'preventive' | 'corrective' | 'inspection'

export interface Asset {
  id: string
  name: string
  asset_code: string
  category: string
  location_id: string | null
  floor_plan_id: string | null
  status: AssetStatus
  purchase_date: string | null
  purchase_cost: number | null
  current_value: number | null
  depreciation_method: string
  useful_life_years: number | null
  condition_score: number
  last_maintained_at: string | null
  next_maintenance_due: string | null
  supplier_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MaintenanceLog {
  id: string
  asset_id: string
  maintenance_type: MaintenanceType
  description: string
  cost: number | null
  performed_by: string | null
  performed_at: string
  condition_before: number | null
  condition_after: number | null
  notes: string | null
}

export interface AssetAnalytics {
  total_assets: number
  active_count: number
  under_maintenance_count: number
  decommissioned_count: number
  avg_condition_score: number
  total_portfolio_value: number
  overdue_maintenance_count: number
  low_condition_count: number
}

export interface AssetRiskItem {
  asset_id: string
  asset_name: string
  asset_code: string
  category: string
  risk_score: number
  risk_level: 'low' | 'medium' | 'high'
  condition_score: number
  days_since_maintenance: number
  overdue_days: number
  recent_maintenance_count: number
}

export interface MaintenanceScheduleItem {
  asset_id: string
  asset_name: string
  asset_code: string
  category: string
  next_maintenance_due: string
  days_until_due: number
  condition_score: number
  overdue: boolean
}

// ─── IoT Sensors ──────────────────────────────────────────────────────────────

export type SensorType = 'temperature' | 'humidity' | 'occupancy' | 'air_quality' | 'noise' | 'security'

export interface SensorReading {
  id: string
  sensor_id: string
  sensor_type: SensorType
  location_id: string | null
  zone_name: string | null
  value: number
  unit: string
  recorded_at: string
  is_anomaly: boolean
}

export interface LatestSensorReading {
  sensor_type: SensorType
  location_id: string | null
  zone_name: string | null
  value: number
  unit: string
  recorded_at: string
  is_anomaly: boolean
  sensor_name: string
}

export interface SensorSummary {
  readings: LatestSensorReading[]
  anomaly_count: number
  total_sensors: number
}

// ─── Search ───────────────────────────────────────────────────────────────────

export type SearchDomain = 'inventory' | 'assets' | 'medical' | 'history'

export interface SearchResult {
  id: string
  domain: SearchDomain
  title: string
  subtitle: string
  url: string
  score: number
}

export interface SearchResultsResponse {
  query: string
  total: number
  results: SearchResult[]
}

// ─── SSE Streaming (orchestrate/stream) ──────────────────────────────────────

export type StreamEventType =
  | 'status'
  | 'agent_start'
  | 'agent_done'
  | 'complete'
  | 'error'

export type AgentKey = 'supervisor' | 'operations' | 'technical' | 'vendor' | 'synthesizer'

export interface AgentStreamEvent {
  type: StreamEventType
  /** Present on agent_start / agent_done */
  agent?: AgentKey
  label?: string
  message?: string
  content?: string
  /** Present on complete */
  decomposition_id?: string
  total_tasks?: number
  phases?: number
  total_tokens?: number
}
