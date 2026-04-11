import { useReducer, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ItemCategory = 'Electrical' | 'Plumbing' | 'Carpentry' | 'Painting' | 'Hygiene' | 'Tools' | 'Other'
export type TxStatus     = 'Outstanding' | 'Returned' | 'Overdue'
export type ReqStatus    = 'Pending' | 'Approved' | 'Issued' | 'Rejected'
export type Priority     = 'High' | 'Medium' | 'Low'

export interface InventoryItem {
  id: string
  name: string
  code: string
  category: ItemCategory
  quantity: number
  unit: string
  minLevel: number
  location: string      // shelf / bin reference e.g. A-01
  lastUpdated: string   // ISO date
}

export interface SignOutTx {
  id: string
  itemId: string
  itemName: string
  itemCode: string
  quantity: number
  borrower: string
  department: string
  woReq: string
  dateOut: string
  expectedReturn: string
  dateReturned: string | null
  status: TxStatus
  notes: string
}

export interface Requisition {
  id: string
  requester: string
  role: string
  department: string
  woReq: string
  priority: Priority
  items: string        // freeform description of items needed
  dateSubmitted: string
  status: ReqStatus
  notes: string
}

export interface StoreroomState {
  items: InventoryItem[]
  transactions: SignOutTx[]
  requisitions: Requisition[]
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_ITEMS: InventoryItem[] = [
  { id: 'el-001', name: 'Cable Ties 100mm',         code: 'EL-001', category: 'Electrical', quantity: 250, unit: 'Pcs',    minLevel: 100, location: 'A-01', lastUpdated: '2026-04-11' },
  { id: 'el-002', name: 'PVC Conduit 20mm (3m)',    code: 'EL-002', category: 'Electrical', quantity: 18,  unit: 'Pcs',    minLevel: 20,  location: 'A-02', lastUpdated: '2026-04-10' },
  { id: 'el-003', name: 'DB Board 12-Way',          code: 'EL-003', category: 'Electrical', quantity: 4,   unit: 'Units',  minLevel: 2,   location: 'A-03', lastUpdated: '2026-04-09' },
  { id: 'el-004', name: 'Extension Cord 5m 3-Way',  code: 'EL-004', category: 'Electrical', quantity: 12,  unit: 'Pcs',    minLevel: 5,   location: 'A-04', lastUpdated: '2026-04-08' },
  { id: 'el-005', name: 'LED Bulb 18W',             code: 'EL-005', category: 'Electrical', quantity: 6,   unit: 'Pcs',    minLevel: 20,  location: 'A-05', lastUpdated: '2026-04-07' },
  { id: 'pl-001', name: 'PVC Pipe 20mm (3m)',       code: 'PL-001', category: 'Plumbing',   quantity: 22,  unit: 'Pcs',    minLevel: 10,  location: 'B-01', lastUpdated: '2026-04-11' },
  { id: 'pl-002', name: 'Ball Valve 20mm',          code: 'PL-002', category: 'Plumbing',   quantity: 8,   unit: 'Pcs',    minLevel: 5,   location: 'B-02', lastUpdated: '2026-04-10' },
  { id: 'pl-003', name: 'Teflon Tape',              code: 'PL-003', category: 'Plumbing',   quantity: 3,   unit: 'Rolls',  minLevel: 10,  location: 'B-03', lastUpdated: '2026-04-09' },
  { id: 'pl-004', name: 'Tap Washer Assortment',    code: 'PL-004', category: 'Plumbing',   quantity: 45,  unit: 'Pcs',    minLevel: 20,  location: 'B-04', lastUpdated: '2026-04-08' },
  { id: 'ca-001', name: 'Wood Screw 50mm (Box/100)',code: 'CA-001', category: 'Carpentry',  quantity: 12,  unit: 'Boxes',  minLevel: 5,   location: 'C-01', lastUpdated: '2026-04-11' },
  { id: 'ca-002', name: 'Sandpaper 120-Grit',       code: 'CA-002', category: 'Carpentry',  quantity: 30,  unit: 'Sheets', minLevel: 20,  location: 'C-02', lastUpdated: '2026-04-10' },
  { id: 'ca-003', name: 'Wood Filler 500g',         code: 'CA-003', category: 'Carpentry',  quantity: 2,   unit: 'Tubs',   minLevel: 4,   location: 'C-03', lastUpdated: '2026-04-09' },
  { id: 'pa-001', name: 'Interior Paint 5L White',  code: 'PA-001', category: 'Painting',   quantity: 8,   unit: 'Tins',   minLevel: 4,   location: 'D-01', lastUpdated: '2026-04-11' },
  { id: 'pa-002', name: 'Paint Roller 228mm',       code: 'PA-002', category: 'Painting',   quantity: 15,  unit: 'Pcs',    minLevel: 10,  location: 'D-02', lastUpdated: '2026-04-10' },
  { id: 'pa-003', name: 'Masking Tape 48mm',        code: 'PA-003', category: 'Painting',   quantity: 1,   unit: 'Rolls',  minLevel: 8,   location: 'D-03', lastUpdated: '2026-04-09' },
  { id: 'hy-001', name: 'Hand Soap Liquid 5L',      code: 'HY-001', category: 'Hygiene',    quantity: 24,  unit: 'Bottles',minLevel: 10,  location: 'E-01', lastUpdated: '2026-04-11' },
  { id: 'hy-002', name: 'Toilet Paper (48-roll)',   code: 'HY-002', category: 'Hygiene',    quantity: 6,   unit: 'Packs',  minLevel: 4,   location: 'E-02', lastUpdated: '2026-04-10' },
  { id: 'hy-003', name: 'Refuse Bags 75L (Box)',    code: 'HY-003', category: 'Hygiene',    quantity: 12,  unit: 'Boxes',  minLevel: 5,   location: 'E-03', lastUpdated: '2026-04-09' },
  { id: 'hy-004', name: 'Multi-Surface Cleaner 5L', code: 'HY-004', category: 'Hygiene',    quantity: 3,   unit: 'Bottles',minLevel: 6,   location: 'E-04', lastUpdated: '2026-04-08' },
  { id: 'to-001', name: 'Angle Grinder 115mm',      code: 'TO-001', category: 'Tools',      quantity: 3,   unit: 'Units',  minLevel: 2,   location: 'F-01', lastUpdated: '2026-04-11' },
  { id: 'to-002', name: 'Cordless Drill 18V',       code: 'TO-002', category: 'Tools',      quantity: 5,   unit: 'Units',  minLevel: 3,   location: 'F-02', lastUpdated: '2026-04-10' },
  { id: 'to-003', name: 'Hammer 500g',              code: 'TO-003', category: 'Tools',      quantity: 8,   unit: 'Units',  minLevel: 4,   location: 'F-03', lastUpdated: '2026-04-09' },
  { id: 'to-004', name: 'Spirit Level 600mm',       code: 'TO-004', category: 'Tools',      quantity: 4,   unit: 'Units',  minLevel: 2,   location: 'F-04', lastUpdated: '2026-04-08' },
  { id: 'to-005', name: 'Safety Harness Full-Body', code: 'TO-005', category: 'Tools',      quantity: 2,   unit: 'Units',  minLevel: 3,   location: 'F-05', lastUpdated: '2026-04-07' },
  { id: 'to-006', name: 'Pressure Washer 2000psi',  code: 'TO-006', category: 'Tools',      quantity: 1,   unit: 'Units',  minLevel: 1,   location: 'F-06', lastUpdated: '2026-04-06' },
]

const SEED_TRANSACTIONS: SignOutTx[] = [
  { id: 'tx-001', itemId: 'to-001', itemName: 'Angle Grinder 115mm',      itemCode: 'TO-001', quantity: 1, borrower: 'Sipho Dlamini',       department: 'Maintenance', woReq: 'WO-2041', dateOut: '2026-04-10', expectedReturn: '2026-04-11', dateReturned: null,         status: 'Overdue',     notes: 'Roof repairs FP1' },
  { id: 'tx-002', itemId: 'to-002', itemName: 'Cordless Drill 18V',        itemCode: 'TO-002', quantity: 1, borrower: 'Thabo Mthembu',        department: 'Carpentry',   woReq: 'WO-2042', dateOut: '2026-04-11', expectedReturn: '2026-04-12', dateReturned: null,         status: 'Outstanding', notes: '' },
  { id: 'tx-003', itemId: 'el-004', itemName: 'Extension Cord 5m 3-Way',   itemCode: 'EL-004', quantity: 2, borrower: 'Zanele Mkhize',        department: 'Events',      woReq: 'REQ-0198',dateOut: '2026-04-09', expectedReturn: '2026-04-09', dateReturned: '2026-04-09', status: 'Returned',    notes: 'Board meeting setup' },
  { id: 'tx-004', itemId: 'to-005', itemName: 'Safety Harness Full-Body',  itemCode: 'TO-005', quantity: 2, borrower: 'Bongani Nkosi',        department: 'Maintenance', woReq: 'WO-2039', dateOut: '2026-04-08', expectedReturn: '2026-04-10', dateReturned: null,         status: 'Overdue',     notes: 'Facade inspection' },
  { id: 'tx-005', itemId: 'to-003', itemName: 'Hammer 500g',               itemCode: 'TO-003', quantity: 1, borrower: 'Nompumelelo Dube',     department: 'Carpentry',   woReq: 'WO-2044', dateOut: '2026-04-11', expectedReturn: '2026-04-11', dateReturned: '2026-04-11', status: 'Returned',    notes: '' },
  { id: 'tx-006', itemId: 'pl-001', itemName: 'PVC Pipe 20mm (3m)',        itemCode: 'PL-001', quantity: 3, borrower: 'Mpendulo Sithole',     department: 'Plumbing',    woReq: 'WO-2043', dateOut: '2026-04-10', expectedReturn: '2026-04-11', dateReturned: null,         status: 'Overdue',     notes: 'Bathroom leak L2' },
  { id: 'tx-007', itemId: 'to-006', itemName: 'Pressure Washer 2000psi',   itemCode: 'TO-006', quantity: 1, borrower: 'Thulani Ngcobo',       department: 'Facilities',  woReq: 'WO-2040', dateOut: '2026-04-09', expectedReturn: '2026-04-09', dateReturned: '2026-04-09', status: 'Returned',    notes: 'Parking lot clean' },
]

const SEED_REQUISITIONS: Requisition[] = [
  { id: 'req-001', requester: 'Sipho Dlamini',   role: 'Electrician', department: 'Maintenance', woReq: 'WO-2045', priority: 'High',   items: 'LED Bulb 18W × 20, PVC Conduit 20mm × 5',                       dateSubmitted: '2026-04-11', status: 'Pending',  notes: 'Urgent — floor 3 lights out' },
  { id: 'req-002', requester: 'Thabo Mthembu',   role: 'Plumber',     department: 'Maintenance', woReq: 'WO-2043', priority: 'Medium', items: 'Teflon Tape × 5, Ball Valve 20mm × 2',                           dateSubmitted: '2026-04-10', status: 'Approved', notes: '' },
  { id: 'req-003', requester: 'Zanele Mkhize',   role: 'Painter',     department: 'Facilities',  woReq: 'REQ-0201',priority: 'Low',    items: 'Interior Paint 5L White × 4, Masking Tape × 6, Paint Roller × 4',dateSubmitted: '2026-04-09', status: 'Issued',   notes: 'Reception repaint' },
  { id: 'req-004', requester: 'Bongani Nkosi',   role: 'Technician',  department: 'Maintenance', woReq: 'WO-2046', priority: 'High',   items: 'Wood Filler 500g × 3, Sandpaper 120-Grit × 10',                  dateSubmitted: '2026-04-11', status: 'Pending',  notes: 'Boardroom door frame repair' },
]

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD_ITEM';         payload: InventoryItem }
  | { type: 'UPDATE_ITEM';      payload: InventoryItem }
  | { type: 'DELETE_ITEM';      payload: string }
  | { type: 'SIGN_OUT';         payload: SignOutTx }
  | { type: 'RETURN_ITEM';      payload: { txId: string; itemId: string; quantity: number; date: string } }
  | { type: 'ADD_REQUISITION';  payload: Requisition }
  | { type: 'UPDATE_REQ_STATUS';payload: { id: string; status: ReqStatus } }

function reducer(state: StoreroomState, action: Action): StoreroomState {
  const today = new Date().toISOString().split('T')[0]

  switch (action.type) {
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] }

    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(i => i.id === action.payload.id ? action.payload : i),
      }

    case 'DELETE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) }

    case 'SIGN_OUT':
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.payload.itemId
            ? { ...i, quantity: Math.max(0, i.quantity - action.payload.quantity), lastUpdated: today }
            : i,
        ),
        transactions: [action.payload, ...state.transactions],
      }

    case 'RETURN_ITEM':
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.payload.itemId
            ? { ...i, quantity: i.quantity + action.payload.quantity, lastUpdated: action.payload.date }
            : i,
        ),
        transactions: state.transactions.map(tx =>
          tx.id === action.payload.txId
            ? { ...tx, dateReturned: action.payload.date, status: 'Returned' }
            : tx,
        ),
      }

    case 'ADD_REQUISITION':
      return { ...state, requisitions: [action.payload, ...state.requisitions] }

    case 'UPDATE_REQ_STATUS':
      return {
        ...state,
        requisitions: state.requisitions.map(r =>
          r.id === action.payload.id ? { ...r, status: action.payload.status } : r,
        ),
      }

    default:
      return state
  }
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'spacemind_storeroom_v1'

function loadState(): StoreroomState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StoreroomState
  } catch { /* storage unavailable or corrupted — fall through to defaults */ }
  return { items: SEED_ITEMS, transactions: SEED_TRANSACTIONS, requisitions: SEED_REQUISITIONS }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStoreroom() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* storage unavailable — skip persistence */ }
  }, [state])

  // Inventory actions
  function addItem(data: Omit<InventoryItem, 'id' | 'lastUpdated'>) {
    dispatch({
      type: 'ADD_ITEM',
      payload: { ...data, id: `item-${Date.now()}`, lastUpdated: new Date().toISOString().split('T')[0] },
    })
  }

  function updateItem(item: InventoryItem) {
    dispatch({ type: 'UPDATE_ITEM', payload: { ...item, lastUpdated: new Date().toISOString().split('T')[0] } })
  }

  function deleteItem(id: string) {
    dispatch({ type: 'DELETE_ITEM', payload: id })
  }

  // Sign-out actions
  function signOut(data: Omit<SignOutTx, 'id' | 'dateReturned' | 'status'>) {
    const today = new Date().toISOString().split('T')[0]
    dispatch({
      type: 'SIGN_OUT',
      payload: {
        ...data,
        id: `tx-${Date.now()}`,
        dateReturned: null,
        status: data.expectedReturn < today ? 'Overdue' : 'Outstanding',
      },
    })
  }

  function returnItem(txId: string, itemId: string, quantity: number) {
    dispatch({
      type: 'RETURN_ITEM',
      payload: { txId, itemId, quantity, date: new Date().toISOString().split('T')[0] },
    })
  }

  // Requisition actions
  function addRequisition(data: Omit<Requisition, 'id' | 'dateSubmitted' | 'status'>) {
    dispatch({
      type: 'ADD_REQUISITION',
      payload: { ...data, id: `req-${Date.now()}`, dateSubmitted: new Date().toISOString().split('T')[0], status: 'Pending' },
    })
  }

  function updateReqStatus(id: string, status: ReqStatus) {
    dispatch({ type: 'UPDATE_REQ_STATUS', payload: { id, status } })
  }

  // Helpers
  function itemStockStatus(item: InventoryItem): 'Critical' | 'Low' | 'Good' {
    if (item.quantity === 0) return 'Critical'
    if (item.quantity < item.minLevel) return 'Low'
    return 'Good'
  }

  return {
    state,
    addItem, updateItem, deleteItem,
    signOut, returnItem,
    addRequisition, updateReqStatus,
    itemStockStatus,
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const CATEGORIES: ItemCategory[] = ['Electrical', 'Plumbing', 'Carpentry', 'Painting', 'Hygiene', 'Tools', 'Other']

export const DEPARTMENTS = [
  'Maintenance', 'Carpentry', 'Plumbing', 'Electrical', 'Painting',
  'Hygiene', 'Events', 'Facilities', 'IT', 'Admin', 'Security', 'Operations',
]

export const ROLES = [
  'Electrician', 'Plumber', 'Carpenter', 'Painter', 'Facilities Assistant',
  'Technician', 'Groundsman', 'Cleaner', 'Security Officer', 'Supervisor',
]

export const STOCK_STYLE: Record<string, { bg: string; color: string }> = {
  Good:     { bg: 'rgba(16,185,129,0.2)',  color: '#6ee7b7' },
  Low:      { bg: 'rgba(245,158,11,0.2)',  color: '#fcd34d' },
  Critical: { bg: 'rgba(239,68,68,0.2)',   color: '#f87171' },
}

export const TX_STYLE: Record<TxStatus, { bg: string; color: string }> = {
  Outstanding: { bg: 'rgba(245,158,11,0.2)',  color: '#fcd34d' },
  Returned:    { bg: 'rgba(16,185,129,0.2)',  color: '#6ee7b7' },
  Overdue:     { bg: 'rgba(239,68,68,0.2)',   color: '#f87171' },
}

export const REQ_STYLE: Record<ReqStatus, { bg: string; color: string }> = {
  Pending:  { bg: 'rgba(245,158,11,0.2)',  color: '#fcd34d' },
  Approved: { bg: 'rgba(14,165,233,0.2)',  color: '#38bdf8' },
  Issued:   { bg: 'rgba(16,185,129,0.2)',  color: '#6ee7b7' },
  Rejected: { bg: 'rgba(239,68,68,0.2)',   color: '#f87171' },
}

export const PRIORITY_STYLE: Record<Priority, { bg: string; color: string }> = {
  High:   { bg: 'rgba(239,68,68,0.2)',   color: '#f87171' },
  Medium: { bg: 'rgba(245,158,11,0.2)',  color: '#fcd34d' },
  Low:    { bg: 'rgba(16,185,129,0.2)',  color: '#6ee7b7' },
}
