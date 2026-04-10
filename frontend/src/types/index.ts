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
