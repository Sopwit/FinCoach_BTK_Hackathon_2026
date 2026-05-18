import { mockUser } from '../data/mockUser'
import { mockTransactions } from '../data/mockTransactions'
import { mockBudgets } from '../data/mockBudgets'
import {
  mockAiAdvice,
  mockCategories,
  mockHabits,
  mockMonthlyComparison,
  mockRecurringPayments,
  mockSummary,
} from '../data/mockAnalytics'

const DB_KEY = 'fincoach_demo_db'
const SESSION_KEY = 'fincoach_session'

function getDB() {
  const dbStr = localStorage.getItem(DB_KEY)
  if (dbStr) {
    const db = JSON.parse(dbStr)
    // Eski veritabanı yapısında 'users' yoksa ekleyelim
    if (!db.users) {
      db.users = [
        { id: 1, name: 'Örnek Öğrenci', email: 'demo@gmail.com', password: '12345', monthly_income: 5000, created_at: new Date().toISOString() }
      ]
      localStorage.setItem(DB_KEY, JSON.stringify(db))
    }
    return db
  }
  const emptyDb = {
    users: [
      { id: 1, name: 'Örnek Öğrenci', email: 'demo@gmail.com', password: '12345', monthly_income: 5000, created_at: new Date().toISOString() }
    ],
    transactions: [],
    budgets: [],
  }
  localStorage.setItem(DB_KEY, JSON.stringify(emptyDb))
  return emptyDb
}

function setDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

export function getCurrentUserId() {
  const id = localStorage.getItem(SESSION_KEY)
  return id ? parseInt(id, 10) : null
}

function resolveUserId(payload = {}) {
  return Number(payload.user_id) || getCurrentUserId() || 1
}

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms))

export async function loginUser(payload) {
  await wait()
  const db = getDB()
  const user = db.users.find((u) => {
    const isDemoLogin = u.email === 'demo@gmail.com' && payload.password === '12345'
    return u.email === payload.email && (u.password === payload.password || isDemoLogin)
  })
  
  if (!user) {
    throw new Error('E-posta veya şifre hatalı.')
  }
  
  localStorage.setItem(SESSION_KEY, user.id.toString())
  return { data: user }
}

export async function createUser(payload) {
  await wait()
  const db = getDB()

  if (db.users.find((u) => u.email === payload.email)) {
    throw new Error('Bu e-posta adresi zaten kullanılıyor.')
  }

  const newUser = {
    id: Date.now(),
    created_at: new Date().toISOString(),
    ...payload,
  }

  db.users.push(newUser)
  setDB(db)

  localStorage.setItem(SESSION_KEY, newUser.id.toString())
  return { data: newUser }
}

export async function getUsers() {
  await wait()
  const db = getDB()
  return { data: db.users }
}

export async function getUser(userId) {
  await wait()
  const db = getDB()
  const id = userId || getCurrentUserId()
  const user = db.users.find((u) => u.id === id) || mockUser
  return { data: user }
}

export async function getHealth() {
  await wait(100)
  return { data: { status: 'ok' } }
}

export async function addManualTransaction(payload) {
  await wait()
  const db = getDB()
  const userId = getCurrentUserId() || 1

  const tx = {
    id: Date.now(),
    user_id: userId,
    source: 'manual',
    created_at: new Date().toISOString(),
    category: payload.category || 'Yemek',
    sub_category: payload.sub_category || 'Dışarıdan Sipariş',
    ...payload,
  }

  db.transactions = [tx, ...db.transactions]
  setDB(db)

  return { data: tx }
}

export async function uploadTransactions() {
  await wait(600)
  const db = getDB()
  const userId = getCurrentUserId() || 1
  
  const userTx = db.transactions.filter(t => t.user_id === userId)
  
  if (userTx.length < mockTransactions.length) {
    const newTx = mockTransactions.map(tx => ({ ...tx, id: Date.now() + Math.random(), user_id: userId }))
    db.transactions = [...newTx, ...db.transactions]
    setDB(db)
  }

  return {
    data: {
      inserted_count: mockTransactions.length,
      skipped_count: 0,
      totalRows: mockTransactions.length,
      insertedRows: mockTransactions.length,
      failedRows: 0,
      transactions: mockTransactions.filter((tx) => tx.user_id === 1 || !tx.user_id).slice(0, 12),
      message: 'İşlemler başarıyla içe aktarıldı.',
    },
  }
}

export async function getTransactions(params = {}) {
  await wait()
  const db = getDB()
  const month = params.month || '2026-05'
  const userId = getCurrentUserId() || 1

  const filtered = db.transactions.filter((transaction) =>
    transaction.user_id === userId && transaction.date.startsWith(month),
  )

  return { data: filtered }
}

function hasTransactions() {
  const db = getDB()
  const userId = getCurrentUserId() || 1
  return db.transactions.some(t => t.user_id === userId)
}

export async function getDashboard() {
  await wait()
  if (!hasTransactions()) {
    return {
      data: {
        summary: {
          total_income: 0,
          total_expense: 0,
          remaining_budget: 0,
          top_category: '-',
        },
        cards: [],
        categories: [],
        budget_status: [],
        charts: { monthly_comparison: [], spending_habits: [], budget_usage: [] },
      },
    }
  }

  return {
    data: {
      summary: mockSummary,
      cards: [
        { key: 'total_income', title: 'Toplam Gelir', value: mockSummary.total_income, unit: 'TL' },
        { key: 'total_expense', title: 'Toplam Gider', value: mockSummary.total_expense, unit: 'TL' },
        { key: 'remaining_budget', title: 'Kalan Bütçe', value: mockSummary.remaining_budget, unit: 'TL' },
        { key: 'top_category', title: 'En Çok Harcama', value: mockSummary.top_category, unit: null },
        { key: 'financial_health', title: 'Finansal Sağlık Skoru', value: 74, unit: '/100', status: 'Dengeli' },
      ],
      categories: mockCategories,
      monthly_comparison: mockMonthlyComparison,
      recurring_payments: mockRecurringPayments,
      spending_habits: { frequent_sub_categories: mockHabits, frequent_descriptions: mockHabits },
      budget_status: [],
      charts: {
        category_distribution: mockCategories,
        monthly_comparison: mockMonthlyComparison,
        spending_habits: mockHabits,
        budget_usage: [],
      },
      alerts: [],
      quick_insights: ['Örnek veriler yüklendi.'],
      advice: mockAiAdvice,
    },
  }
}

export async function getMonthlyComparison() {
  await wait()
  if (!hasTransactions()) return { data: [] }
  return { data: mockMonthlyComparison }
}

export async function getRecurringPayments() {
  await wait()
  if (!hasTransactions()) return { data: [] }
  return { data: mockRecurringPayments.map((item) => ({ ...item, description: item.name, average_amount: item.amount, count: 1, category: 'Abonelik', sub_category: item.type })) }
}

export async function getHabits() {
  await wait()
  if (!hasTransactions()) return { data: { frequent_sub_categories: [], frequent_descriptions: [] } }
  return {
    data: {
      frequent_sub_categories: mockHabits.map((item) => ({ ...item, sub_category: item.category })),
      frequent_descriptions: mockHabits.map((item) => ({ ...item, description: item.name })),
    },
  }
}

export async function getAiAdvice() {
  await wait(700)
  if (!hasTransactions()) {
    return {
      data: {
        title: 'Veri Bekleniyor',
        summary: 'Yapay zekanın analiz yapabilmesi için işlemlere ihtiyacı var.',
        actions: [],
        estimated_saving: '0 TL',
      },
    }
  }
  return { data: mockAiAdvice }
}

export async function sendChatMessage(payload) {
  await wait(500)
  return {
    data: {
      answer: `"${payload.message}" sorusunu mevcut finansal verilerine göre değerlendirdim. Yatırım tavsiyesi vermeden harcama ve bütçe verilerine odaklanıyorum.`,
      used_context_summary: 'finansal özet, işlemler, bütçeler ve alışkanlıklar',
      warning: null,
    },
  }
}

export async function loadStudentDemoData(payload = {}) {
  await wait(700)
  const db = getDB()
  const previousUserId = getCurrentUserId()
  const userId = resolveUserId(payload)

  const newTx = mockTransactions.map(tx => ({ ...tx, id: Date.now() + Math.random(), user_id: userId }))
  const newBudgets = mockBudgets.map(b => ({ ...b, id: Date.now() + Math.random(), user_id: userId }))

  db.transactions = [...db.transactions.filter(t => t.user_id !== userId), ...newTx]
  db.budgets = [...db.budgets.filter(b => b.user_id !== userId), ...newBudgets]
  setDB(db)
  localStorage.setItem(SESSION_KEY, String(payload.preserve_session && previousUserId ? previousUserId : userId))

  return {
    data: {
      transactions_count: mockTransactions.length,
      message: 'Örnek finans verileri yüklendi.',
    },
  }
}

export async function clearStudentDemoData(payload = {}) {
  await wait(400)
  const db = getDB()
  const previousUserId = getCurrentUserId()
  const userId = resolveUserId(payload)
  db.transactions = db.transactions.filter(t => !(t.user_id === userId && t.source === 'demo'))
  db.budgets = db.budgets.filter(b => b.user_id !== userId)
  setDB(db)
  localStorage.setItem(SESSION_KEY, String(payload.preserve_session && previousUserId ? previousUserId : userId))
  return { data: { message: 'Örnek veriler temizlendi.' } }
}

export async function getBudgets() {
  await wait()
  const db = getDB()
  const userId = getCurrentUserId() || 1
  return { data: db.budgets.filter(b => b.user_id === userId) }
}

export async function getBudgetStatus() {
  await wait()
  const db = getDB()
  const userId = getCurrentUserId() || 1
  const budgets = db.budgets.filter(b => b.user_id === userId).map((budget) => ({
    budget_id: budget.id,
    category: budget.category,
    monthly_limit: budget.monthly_limit,
    spent: 0,
    remaining: budget.monthly_limit,
    usage_percent: 0,
    is_exceeded: false,
  }))
  return { data: { budgets } }
}

export async function setBudget(payload) {
  await wait()
  const db = getDB()
  const userId = getCurrentUserId() || 1

  const budget = {
    id: Date.now(),
    user_id: userId,
    created_at: new Date().toISOString(),
    ...payload,
  }

  db.budgets = [...db.budgets, budget]
  setDB(db)

  return { data: budget }
}

export async function deleteTransaction(transactionId) {
  await wait()
  const db = getDB()

  db.transactions = db.transactions.filter((tx) => tx.id !== transactionId)
  setDB(db)

  return {
    data: {
      id: transactionId,
      deleted: true,
      message: 'İşlem başarıyla silindi.',
    },
  }
}

export async function deleteTransactions(params = {}) {
  await wait()
  const db = getDB()
  const userId = getCurrentUserId() || 1
  const selectedMonth = typeof params.month === 'string' && params.month.includes('-') ? params.month : null
  const isTargetTransaction = (tx) => {
    if (tx.user_id !== userId) return false
    if (!selectedMonth) return true
    return String(tx.date || '').startsWith(selectedMonth)
  }
  const deletedCount = db.transactions.filter(isTargetTransaction).length

  db.transactions = db.transactions.filter((tx) => !isTargetTransaction(tx))
  setDB(db)

  return {
    data: {
      deleted_count: deletedCount,
      message: 'İşlemler silindi.',
    },
  }
}

export async function updateTransaction(transactionId, payload) {
  await wait()
  const db = getDB()
  let updated = null
  db.transactions = db.transactions.map((tx) => {
    if (tx.id !== transactionId) return tx
    updated = { ...tx, ...payload }
    return updated
  })
  setDB(db)
  return { data: updated }
}

export async function updateBudget(budgetId, payload) {
  await wait()
  const db = getDB()
  let updated = null
  db.budgets = db.budgets.map((budget) => {
    if (budget.id !== budgetId) return budget
    updated = { ...budget, ...payload }
    return updated
  })
  setDB(db)
  return { data: updated }
}

export async function deleteBudget(budgetId) {
  await wait()
  const db = getDB()
  db.budgets = db.budgets.filter((budget) => budget.id !== budgetId)
  setDB(db)
  return { data: { deleted_budget_id: budgetId } }
}

export async function getHealthScore() {
  await wait()
  return {
    data: {
      score: 74,
      status: 'Dengeli',
      message: 'Finansal sağlık skoru mevcut verilerinize göre hesaplandı.',
      metrics: {},
      reasons: [],
      positive_points: [],
    },
  }
}
