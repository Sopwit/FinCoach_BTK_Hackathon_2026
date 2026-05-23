export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '/api')

export const DEFAULT_USER_ID = 1

function getLatestMonth() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function getPreviousMonth() {
  const now = new Date()
  now.setMonth(now.getMonth() - 1)
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export const DEFAULT_MONTH = getLatestMonth()
export const DEFAULT_PREVIOUS_MONTH = getPreviousMonth()
