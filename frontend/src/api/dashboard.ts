import { apiClient } from './client'
import type { Dashboard } from '../types'

export async function fetchDashboard(): Promise<Dashboard> {
  const { data } = await apiClient.get<Dashboard>('/api/dashboard')
  return data
}
