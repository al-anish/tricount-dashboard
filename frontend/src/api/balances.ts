import { apiClient } from './client'
import type { Balances } from '../types'

export async function fetchBalances(): Promise<Balances> {
  const { data } = await apiClient.get<Balances>('/api/balances')
  return data
}
