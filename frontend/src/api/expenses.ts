import { apiClient } from './client'
import type { ExpenseFilters, ExpenseList } from '../types'

export async function fetchExpenses(filters: ExpenseFilters = {}): Promise<ExpenseList> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
  )
  const { data } = await apiClient.get<ExpenseList>('/api/expenses', { params })
  return data
}
