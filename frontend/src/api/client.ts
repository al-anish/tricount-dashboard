import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
})

/** Turns an Axios/FastAPI error into a single readable message for the UI. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (error.code === 'ECONNABORTED') return 'The request timed out. Is the backend running?'
    if (error.response?.status) return `Request failed (${error.response.status}).`
    return `Could not reach the backend at ${baseURL}. Is it running?`
  }
  return 'Something went wrong.'
}
