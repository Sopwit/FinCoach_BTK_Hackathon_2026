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
        { id: 1, name: 'Demo Öğrenci', email: 'demo@gmail.com', password: '123', monthly_income: 5000, created_at: new Date().toISOString() }
      ]
      localStorage.setItem(DB_KEY, JSON.stringify(db))
    }
    return db
  }
  const emptyDb = {
    users: [
      { id: 1, name: 'Demo Öğrenci', email: 'demo@gmail.com', password: '123', monthly_income: 5000, created_at: new Date().toISOString() }
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

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms))

export async function loginUser(payload) {
  await wait()
  const db = getDB()
  const user = db.users.find((u) => u.email === payload.email && u.password === payload.password)
  
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

export async function getUser(userId) {
  await wait()
  const db = getDB()
  const id = userId || getCurrentUserId()
  const user = db.users.find((u) => u.id === id) || mockUser
  return { data: user }
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
      total_rows: 23,
      inserted_rows: 21,
      failed_rows: 2,
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

export async function getSummary() {
  await wait()
  if (!hasTransactions()) {
    return {
      data: {
        total_income: 0,
        total_expense: 0,
        remaining_budget: 0,
        saving_potential: 0,
        top_category: '-',
        risky_increase: { category: '-', percent: 0 },
      },
    }
  }
  return { data: mockSummary }
}

export async function getCategories() {
  await wait()
  if (!hasTransactions()) return { data: [] }
  return { data: mockCategories }
}

export async function getMonthlyComparison() {
  await wait()
  if (!hasTransactions()) return { data: [] }
  return { data: mockMonthlyComparison }
}

export async function getRecurringPayments() {
  await wait()
  if (!hasTransactions()) return { data: [] }
  return { data: mockRecurringPayments }
}

export async function getHabits() {
  await wait()
  if (!hasTransactions()) return { data: [] }
  return { data: mockHabits }
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

export async function loadStudentDemoData() {
  await wait(700)
  const db = getDB()
  const userId = getCurrentUserId() || 1

  const newTx = mockTransactions.map(tx => ({ ...tx, id: Date.now() + Math.random(), user_id: userId }))
  const newBudgets = mockBudgets.map(b => ({ ...b, id: Date.now() + Math.random(), user_id: userId }))

  db.transactions = [...db.transactions.filter(t => t.user_id !== userId), ...newTx]
  db.budgets = [...db.budgets.filter(b => b.user_id !== userId), ...newBudgets]
  setDB(db)

  return {
    data: {
      transactions_count: mockTransactions.length,
      message: 'Öğrenci demo verisi yüklendi.',
    },
  }
}

export async function getBudgets() {
  await wait()
  const db = getDB()
  const userId = getCurrentUserId() || 1
  return { data: db.budgets.filter(b => b.user_id === userId) }
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