import { apiClient } from './client'
import type { ExpenseFilters, ExpenseList, Expense } from '../types'

export async function fetchExpenses(filters: ExpenseFilters = {}): Promise<ExpenseList> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
  )
  const { data } = await apiClient.get<ExpenseList>('/api/expenses', { params })
  return data
}


export interface CreateExpensePayload {
  description: string
  amount: number
  date: string
  category: string
  payer_uuid: string
  split_member_uuids: string[]
}

export interface UpdateExpensePayload {
  description: string
  amount: number
  date: string
  category: string
}

function mutationHeaders() {
  const key = window.prompt('Enter the Tricount mutation key configured by the backend administrator:')
  if (!key) throw new Error('Mutation cancelled: a key is required.')
  return { headers: { 'X-Mutation-Key': key } }
}

export async function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  const { data } = await apiClient.post<Expense>('/api/expenses', payload, mutationHeaders())
  return data
}

export async function updateExpense(id: number, payload: UpdateExpensePayload): Promise<Expense> {
  const { data } = await apiClient.put<Expense>(`/api/expenses/${id}`, payload, mutationHeaders())
  return data
}

export async function deleteExpense(id: number): Promise<void> {
  await apiClient.delete(`/api/expenses/${id}`, mutationHeaders())
}
