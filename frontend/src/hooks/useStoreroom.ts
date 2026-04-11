import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { ItemCategory, ReqStatus, StockPriority, TxStatus } from '../types'

// ─── Re-export types for backwards-compat with StoreroomPage ─────────────────
export type { ItemCategory, TxStatus, ReqStatus, StockPriority }
export type { InventoryItem, SignOutTx, Requisition } from '../types'

// ─── Style / UI constants — inline style format { bg, color } ────────────────

export const CATEGORIES: ItemCategory[] = [
  'Electrical', 'Plumbing', 'Carpentry', 'Painting', 'Hygiene', 'Tools', 'Other',
]

export const DEPARTMENTS = [
  'Facilities', 'IT', 'HR', 'Finance', 'Operations', 'Security', 'Cleaning', 'Other',
]

export const ROLES = [
  'Technician', 'Supervisor', 'Manager', 'Contractor', 'Admin', 'Other',
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
  Approved: { bg: 'rgba(16,185,129,0.2)',  color: '#6ee7b7' },
  Issued:   { bg: 'rgba(14,165,233,0.2)',  color: '#38bdf8' },
  Rejected: { bg: 'rgba(239,68,68,0.2)',   color: '#f87171' },
}

export const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
  High:   { bg: 'rgba(239,68,68,0.2)',   color: '#f87171' },
  Medium: { bg: 'rgba(245,158,11,0.2)',  color: '#fcd34d' },
  Low:    { bg: 'rgba(156,163,175,0.2)', color: '#9ca3af' },
}

// ─── Stock status helper ──────────────────────────────────────────────────────

export function itemStockStatus(qty: number, minLevel: number): 'Critical' | 'Low' | 'Good' {
  if (qty === 0) return 'Critical'
  if (qty <= minLevel) return 'Low'
  return 'Good'
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStoreroom() {
  const qc = useQueryClient()

  const invalidateItems = () => qc.invalidateQueries({ queryKey: ['inventory', 'items'] })
  const invalidateTx    = () => qc.invalidateQueries({ queryKey: ['inventory', 'transactions'] })
  const invalidateReqs  = () => qc.invalidateQueries({ queryKey: ['inventory', 'requisitions'] })

  // ── Queries ────────────────────────────────────────────────────────────────
  const itemsQ        = useQuery({ queryKey: ['inventory', 'items'],        queryFn: () => api.getInventoryItems() })
  const txQ           = useQuery({ queryKey: ['inventory', 'transactions'],  queryFn: () => api.getTransactions() })
  const requisitionsQ = useQuery({ queryKey: ['inventory', 'requisitions'],  queryFn: () => api.getRequisitions() })

  // ── Item mutations ─────────────────────────────────────────────────────────
  const addItem = useMutation({
    mutationFn: api.createInventoryItem,
    onSuccess: invalidateItems,
  })

  const updateItem = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof api.updateInventoryItem>[1]) =>
      api.updateInventoryItem(id, data),
    onSuccess: invalidateItems,
  })

  const deleteItem = useMutation({
    mutationFn: api.deleteInventoryItem,
    onSuccess: invalidateItems,
  })

  // ── Transaction mutations ──────────────────────────────────────────────────
  const signOut = useMutation({
    mutationFn: api.signOutItem,
    onSuccess: () => { invalidateItems(); invalidateTx() },
  })

  const returnItemMutation = useMutation({
    mutationFn: api.returnItem,
    onSuccess: () => { invalidateItems(); invalidateTx() },
  })

  // ── Requisition mutations ──────────────────────────────────────────────────
  const addRequisition = useMutation({
    mutationFn: api.createRequisition,
    onSuccess: invalidateReqs,
  })

  const updateReqStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReqStatus }) =>
      api.updateRequisitionStatus(id, status),
    onSuccess: invalidateReqs,
  })

  return {
    // Queries
    itemsQ,
    txQ,
    requisitionsQ,
    // Convenience data accessors
    items:        itemsQ.data        ?? [],
    transactions: txQ.data           ?? [],
    requisitions: requisitionsQ.data ?? [],
    isLoading: itemsQ.isLoading || txQ.isLoading || requisitionsQ.isLoading,
    // Mutations
    addItem,
    updateItem,
    deleteItem,
    signOut,
    returnItem: returnItemMutation,
    addRequisition,
    updateReqStatus,
    // Helper
    itemStockStatus,
  }
}
