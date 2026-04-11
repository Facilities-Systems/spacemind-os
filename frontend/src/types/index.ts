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

export interface InventoryAnalytics {
  total_items: number
  low_stock_count: number
  critical_count: number
  outstanding_transactions: number
  pending_requisitions: number
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
  location: string | null
  notes: string | null
  created_at: string
  updated_at: string
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
