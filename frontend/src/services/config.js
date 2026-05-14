export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export const DEFAULT_USER_ID = 1

export const DEFAULT_MONTH = '2026-05'
export const DEFAULT_PREVIOUS_MONTH = '2026-04'
