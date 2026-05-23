import * as mockApi from './mockApi'
import * as realApi from './api'
import { USE_MOCK_API } from './config'

const client = USE_MOCK_API ? mockApi : realApi

export const {
  createUser,
  loginUser,
  getUsers,
  resolveUserId,
  getUser,
  getHealth,
  addManualTransaction,
  updateTransaction,
  uploadTransactions,
  getTransactions,
  getDashboard,
  getMonthlyComparison,
  getRecurringPayments,
  getHabits,
  getHealthScore,
  getAiAdvice,
  sendChatMessage,
  loadStudentDemoData,
  clearStudentDemoData,
  getBudgets,
  getBudgetStatus,
  setBudget,
  updateBudget,
  deleteBudget,
  deleteTransaction,
  deleteTransactions,
} = client
