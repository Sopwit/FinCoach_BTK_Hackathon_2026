export function buildChatContext({
  dashboard = null,
  transactions = [],
  habits = null,
  recurringPayments = [],
  budgets = null,
  selectedMonth,
  selectedUser,
  currentPage,
} = {}) {
  return {
    message: '',
    user_id: selectedUser?.id ?? null,
    current_page: currentPage ?? window.location.pathname,
    context: {
      selected_month: selectedMonth,
      selected_user: selectedUser,
      dashboard,
      transactions,
      habits,
      recurring_payments: recurringPayments,
      budgets,
    },
  }
}
