import { apiClient } from './client'
import type { TricountInfo } from '../types'

export async function fetchTricount(): Promise<TricountInfo> {
  const { data } = await apiClient.get<TricountInfo>('/api/tricount')
  return data
}
