import axios from 'axios'
import { API_BASE_URL } from './config'

const SESSION_KEY = 'fincoach_session'
const DEFAULT_DEMO_USER = {
  name: 'Demo Ogrenci',
  email: 'demo@gmail.com',
  monthly_income: 5000,
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'Beklenmeyen bir hata olustu.'

    return Promise.reject(new Error(message))
  },
)

function response(data) {
  return { data }
}

function getSessionUserId() {
  const value = localStorage.getItem(SESSION_KEY)
  return value ? Number(value) : null
}

function setSessionUserId(userId) {
  localStorage.setItem(SESSION_KEY, String(userId))
}

function normalizePeriod(params = {}) {
  if (params.year && params.month && Number(params.month) <= 12) {
    return {
      year: Number(params.year),
      month: Number(params.month),
    }
  }

  const monthValue = params.month || params.current_month || '2026-05'

  if (typeof monthValue === 'string' && monthValue.includes('-')) {
    const [year, month] = monthValue.split('-')
    return {
      year: Number(year),
      month: Number(month),
    }
  }

  return {
    year: Number(params.year || 2026),
    month: Number(monthValue || 5),
  }
}

async function ensureUserId(preferredUserId) {
  const sessionUserId = getSessionUserId()
  if (preferredUserId && preferredUserId !== 1) return preferredUserId
  if (sessionUserId) return sessionUserId

  const usersResponse = await api.get('/users/')
  const users = usersResponse.data
  const demoUser =
    users.find((user) => user.id === 1) ||
    users.find((user) => user.email === DEFAULT_DEMO_USER.email)

  if (demoUser) {
    setSessionUserId(demoUser.id)
    return demoUser.id
  }

  const created = await api.post('/users/', DEFAULT_DEMO_USER)
  setSessionUserId(created.data.id)
  return created.data.id
}

async function withBackendParams(params = {}) {
  const period = normalizePeriod(params)
  const userId = await ensureUserId(params.user_id)

  return {
    ...params,
    ...period,
    user_id: userId,
  }
}

function normalizeSummary(data) {
  const totalExpense = Number(data.total_expense || 0)
  const totalIncome = Number(data.total_income || 0)

  return {
    ...data,
    total_income: totalIncome,
    total_expense: totalExpense,
    remaining_budget: Number(data.remaining_budget || 0),
    saving_potential: Math.max(totalIncome - totalExpense, 0),
    top_category: data.top_category || '-',
    risky_increase: data.risky_increase || { category: data.top_category || '-', percent: 0 },
  }
}

function normalizeCategories(data) {
  const categories = Array.isArray(data) ? data : data?.categories || []

  return categories.map((item) => ({
    ...item,
    amount: Number(item.amount ?? item.total ?? 0),
    percent: Number(item.percent ?? item.percentage ?? 0),
  }))
}

function normalizeMonthlyComparison(data) {
  const items = Array.isArray(data) ? data : data?.comparison || []

  return items.map((item) => ({
    ...item,
    previous_month_total: Number(item.previous_month_total ?? item.previous_total ?? 0),
    current_month_total: Number(item.current_month_total ?? item.current_total ?? 0),
    change_percent: Number(item.change_percent ?? 0),
  }))
}

function normalizeRecurringPayments(data) {
  const items = Array.isArray(data) ? data : data?.recurring_payments || []

  return items.map((item) => ({
    ...item,
    name: item.name || item.description || item.category || 'Tekrar eden odeme',
    amount: Number(item.amount ?? item.average_amount ?? 0),
    frequency: item.frequency || `${item.count || 1} kez`,
  }))
}

function normalizeHabits(data) {
  const items = Array.isArray(data) ? data : data?.frequent_sub_categories || []

  return items.map((item) => ({
    ...item,
    name: item.name || item.sub_category || item.description || 'Harcama aliskanligi',
    total: Number(item.total || 0),
    category: item.category || item.sub_category || 'Diger',
  }))
}

function normalizeAiAdvice(data) {
  const advice = data?.advice || data || {}
  const text = advice.text || advice.summary || ''
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*\d.\s]+/, '').trim())
    .filter(Boolean)

  return {
    ...advice,
    title: advice.title || (advice.source === 'gemini' ? 'Gemini Analizi' : 'Finansal Oneri'),
    summary: advice.summary || text || 'Bu ay icin henuz uretilmis bir oneriniz yok.',
    actions: advice.actions?.length ? advice.actions : lines.slice(1, 4),
    estimated_saving: advice.estimated_saving || 'Veriye gore degisir',
  }
}

function normalizeUploadResult(data) {
  return {
    ...data,
    totalRows: (data.inserted_count || 0) + (data.skipped_count || 0),
    insertedRows: data.inserted_count || 0,
    failedRows: data.skipped_count || 0,
  }
}

function normalizeDashboard(data) {
  const categoryDistribution = normalizeCategories(data.charts?.category_distribution || data.categories)
  const monthlyComparison = normalizeMonthlyComparison(data.charts?.monthly_comparison || data.monthly_comparison)
  const spendingHabits = normalizeHabits(data.charts?.spending_habits || data.spending_habits)

  return {
    ...data,
    summary: normalizeSummary(data.summary || {}),
    categories: categoryDistribution,
    monthly_comparison: monthlyComparison,
    recurring_payments: normalizeRecurringPayments(data.recurring_payments),
    spending_habits: spendingHabits,
    budget_status: data.budget_status || data.charts?.budget_usage || [],
    charts: {
      ...data.charts,
      category_distribution: categoryDistribution,
      monthly_comparison: monthlyComparison,
      spending_habits: spendingHabits,
      budget_usage: data.charts?.budget_usage || data.budget_status || [],
    },
    advice: data.advice ? normalizeAiAdvice(data.advice) : null,
  }
}

export const createUser = async (payload) => {
  const body = { ...payload }
  delete body.password
  const result = await api.post('/users/', body)
  setSessionUserId(result.data.id)
  return result
}

export const loginUser = async (payload) => {
  const usersResponse = await api.get('/users/')
  const user = usersResponse.data.find((item) => item.email === payload.email)

  if (!user) {
    if (payload.email === DEFAULT_DEMO_USER.email) {
      return createUser(DEFAULT_DEMO_USER)
    }

    throw new Error('Bu e-posta ile kayitli kullanici bulunamadi.')
  }

  setSessionUserId(user.id)
  return response(user)
}

export const getUser = async (userId) => {
  const resolvedUserId = await ensureUserId(userId)
  return api.get(`/users/${resolvedUserId}`)
}

export const getUsers = async () => {
  return api.get('/users/')
}

export const getHealth = async () => {
  return api.get('/')
}

export const addManualTransaction = async (payload) => {
  const userId = await ensureUserId(payload.user_id)

  return api.post('/transactions/manual', {
    ...payload,
    user_id: userId,
    amount: Math.abs(Number(payload.amount)),
    category: payload.category === 'auto' ? null : payload.category,
    sub_category: payload.sub_category || null,
    note: payload.note || null,
  })
}

export const uploadTransactions = async (formData) => {
  const result = await api.post('/transactions/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response(normalizeUploadResult(result.data))
}

export const getTransactions = async (params = {}) => {
  const backendParams = await withBackendParams(params)
  return api.get('/transactions/', { params: backendParams })
}

export const updateTransaction = async (transactionId, payload) => {
  return api.put(`/transactions/${transactionId}`, {
    ...payload,
    amount: payload.amount === undefined ? undefined : Math.abs(Number(payload.amount)),
    category: payload.category === 'auto' ? null : payload.category,
    sub_category: payload.sub_category || null,
    note: payload.note || null,
  })
}

export const getDashboard = async (params) => {
  const result = await api.get('/dashboard/', {
    params: {
      ...(await withBackendParams(params)),
      include_ai: params?.include_ai ?? true,
    },
  })

  return response(normalizeDashboard(result.data))
}

export const getSummary = async (params) => {
  const result = await api.get('/analytics/summary', { params: await withBackendParams(params) })
  return response(normalizeSummary(result.data))
}

export const getCategories = async (params) => {
  const result = await api.get('/analytics/categories', { params: await withBackendParams(params) })
  return response(normalizeCategories(result.data))
}

export const getMonthlyComparison = async (params) => {
  const result = await api.get('/analytics/monthly-comparison', { params: await withBackendParams(params) })
  return response(normalizeMonthlyComparison(result.data))
}

export const getRecurringPayments = async (params) => {
  const result = await api.get('/analytics/recurring', { params: await withBackendParams(params) })
  return response(normalizeRecurringPayments(result.data))
}

export const getHabits = async (params) => {
  const result = await api.get('/analytics/habits', { params: await withBackendParams(params) })
  return response(normalizeHabits(result.data))
}

export const getHealthScore = async (params) => {
  return api.get('/analytics/health-score', { params: await withBackendParams(params) })
}

export const getAiAdvice = async (params) => {
  const result = await api.post('/ai/advice', null, { params: await withBackendParams(params) })
  return response(normalizeAiAdvice(result.data))
}

export const loadStudentDemoData = async (payload = {}) => {
  const userId = await ensureUserId(payload.user_id)

  try {
    const result = await api.post('/demo/load-student-data', null, {
      params: { user_id: userId },
    })

    return response({
      ...result.data,
      transactions_count: result.data.inserted_count,
    })
  } catch (error) {
    if (error.message.includes('already been loaded')) {
      return response({
        inserted_count: 0,
        skipped_count: 0,
        transactions_count: 0,
        message: 'Demo verisi daha once yuklenmis.',
      })
    }

    throw error
  }
}

export const clearStudentDemoData = async (payload = {}) => {
  const userId = await ensureUserId(payload.user_id)
  const result = await api.delete('/demo/clear-student-data', {
    params: { user_id: userId },
  })

  return result
}

export const getBudgets = async (params = {}) => {
  const userId = await ensureUserId(params.user_id)
  return api.get('/budgets/', { params: { user_id: userId } })
}

export const getBudgetStatus = async (params = {}) => {
  const result = await api.get('/budgets/status', {
    params: await withBackendParams(params),
  })

  return result
}

export const setBudget = async (payload) => {
  const userId = await ensureUserId(payload.user_id)
  return api.post('/budgets/', { ...payload, user_id: userId })
}

export const updateBudget = async (budgetId, payload) => {
  return api.put(`/budgets/${budgetId}`, payload)
}

export const deleteBudget = async (budgetId) => {
  return api.delete(`/budgets/${budgetId}`)
}

export const deleteTransaction = (transactionId) => {
  return api.delete(`/transactions/${transactionId}`)
}
