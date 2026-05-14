export const mockSummary = {
  month: '2026-05',
  total_income: 5000,
  total_expense: 3144.97,
  remaining_budget: 1855.03,
  saving_potential: 850,
  top_category: 'Yemek',
  risky_increase: {
    category: 'Dışarıdan Sipariş',
    percent: 61,
  },
}

export const mockCategories = [
  {
    category: 'Yemek',
    amount: 1470,
    percent: 72,
  },
  {
    category: 'Market',
    amount: 1100,
    percent: 64,
  },
  {
    category: 'Abonelik',
    amount: 289.98,
    percent: 18,
  },
  {
    category: 'Ulaşım',
    amount: 180,
    percent: 12,
  },
  {
    category: 'Fatura',
    amount: 185,
    percent: 12,
  },
]

export const mockMonthlyComparison = [
  {
    category: 'Yemek',
    previous_month_total: 560,
    current_month_total: 1470,
    change_percent: 162,
  },
  {
    category: 'Market',
    previous_month_total: 250,
    current_month_total: 1100,
    change_percent: 340,
  },
  {
    category: 'Abonelik',
    previous_month_total: 289.98,
    current_month_total: 289.98,
    change_percent: 0,
  },
  {
    category: 'Fatura',
    previous_month_total: 185,
    current_month_total: 185,
    change_percent: 0,
  },
]

export const mockRecurringPayments = [
  {
    name: 'Spotify',
    amount: 59.99,
    type: 'Dijital Abonelik',
    frequency: 'Aylık',
  },
  {
    name: 'Netflix',
    amount: 229.99,
    type: 'Dijital Abonelik',
    frequency: 'Aylık',
  },
  {
    name: 'Telefon Faturası',
    amount: 185,
    type: 'Tekrar Eden Ödeme',
    frequency: 'Aylık',
  },
]

export const mockHabits = [
  {
    name: 'Trendyol Yemek',
    count: 2,
    total: 690,
    category: 'Dışarıdan Sipariş',
  },
  {
    name: 'Yemeksepeti',
    count: 2,
    total: 770,
    category: 'Dışarıdan Sipariş',
  },
  {
    name: 'Starbucks',
    count: 1,
    total: 180,
    category: 'Kafe',
  },
]

export const mockAiAdvice = {
  title: 'Dışarıdan yemek harcamaların dikkat çekiyor',
  summary:
    'Bu ay dışarıdan yemek siparişlerin geçen aya göre belirgin şekilde artmış. Artışın büyük kısmı Trendyol Yemek, Yemeksepeti ve Getir Yemek işlemlerinden geliyor.',
  actions: [
    'Haftada 1-2 dışarıdan yemek siparişini azalt.',
    'Kullanmadığın abonelikleri kontrol et.',
    'Market alışverişi için haftalık limit belirle.',
  ],
  estimated_saving: '700 - 900 TL',
}