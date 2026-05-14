import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  CreditCard,
  Loader2,
  PiggyBank,
  PlusCircle,
  RefreshCw,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getAiAdvice, getDashboard } from '../services/client'
import { DEFAULT_MONTH, DEFAULT_USER_ID } from '../services/config'
import { formatCurrency } from '../utils/formatCurrency'

const CARD_META = {
  total_income: { icon: Wallet, trendType: 'positive', gradient: 'from-[#00FF66]/10 to-transparent' },
  total_expense: { icon: CreditCard, trendType: 'negative', gradient: 'from-red-500/8 to-transparent' },
  remaining_budget: { icon: PiggyBank, trendType: 'positive', gradient: 'from-amber-500/8 to-transparent' },
  top_category: { icon: TrendingUp, trendType: 'positive', gradient: 'from-[#16C784]/10 to-transparent' },
  financial_health: { icon: Activity, trendType: 'positive', gradient: 'from-[#00D4AA]/10 to-transparent' },
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [aiAdvice, setAiAdvice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)

  const loadDashboardData = async () => {
    setLoading(true)
    const response = await getDashboard({
      user_id: DEFAULT_USER_ID,
      month: DEFAULT_MONTH,
      include_ai: true,
    })
    setDashboard(response.data)
    setAiAdvice(response.data.advice)
    setLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(loadDashboardData, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const refreshAiAdvice = async () => {
    setAiLoading(true)
    const response = await getAiAdvice({
      user_id: DEFAULT_USER_ID,
      month: DEFAULT_MONTH,
    })
    setAiAdvice(response.data)
    setAiLoading(false)
  }

  if (loading) return <DashboardLoading />

  const summary = dashboard?.summary
  if (summary && summary.total_income === 0 && summary.total_expense === 0) {
    return <DashboardEmptyState />
  }

  const stats = (dashboard?.cards || []).slice(0, 4).map((card) => {
    const meta = CARD_META[card.key] || CARD_META.top_category
    const isMoney = card.unit === 'TL'
    const suffix = card.unit && card.unit !== 'TL' ? card.unit : ''

    return {
      title: card.title,
      value: isMoney ? formatCurrency(card.value) : `${card.value}${suffix}`,
      trend: card.status || 'Canlı',
      ...meta,
    }
  })

  return (
    <div>
      <PageHeader />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, index) => (
          <StatCard key={item.title} item={item} index={index} />
        ))}
      </div>

      <DashboardSignals dashboard={dashboard} />

      <BackendCharts
        dashboard={dashboard}
        aiAdvice={aiAdvice}
        aiLoading={aiLoading}
        onRefreshAi={refreshAiAdvice}
      />

      <BudgetAlerts budgets={dashboard?.charts?.budget_usage || dashboard?.budget_status || []} />
    </div>
  )
}

function PageHeader() {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <p className="text-sm font-bold uppercase tracking-widest text-[#00FF66]">Genel Bakış</p>
      <h2 className="mt-3 text-4xl font-black tracking-tight text-white">Finansal Kontrol Paneli</h2>
      <p className="mt-3 max-w-3xl text-[#8A968F] leading-relaxed">
        Backend analizlerinden gelen kartları, uyarıları, bütçe durumunu ve harcama eğilimlerini takip et.
      </p>
    </motion.div>
  )
}

function StatCard({ item, index }) {
  const Icon = item.icon
  const isPositive = item.trendType === 'positive'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card group overflow-hidden rounded-3xl"
    >
      <div className={`bg-gradient-to-br ${item.gradient} p-6`}>
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1B2A24] bg-[#050807]/80 text-[#00FF66]">
            <Icon size={22} />
          </div>
          <div className={[
            'flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold',
            isPositive ? 'bg-[#00FF66]/10 text-[#00FF66]' : 'bg-red-500/10 text-red-400',
          ].join(' ')}
          >
            {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {item.trend}
          </div>
        </div>
        <p className="mt-5 text-sm font-semibold text-[#8A968F]">{item.title}</p>
        <h3 className="mt-1.5 text-3xl font-black tracking-tight text-white">{item.value}</h3>
      </div>
    </motion.div>
  )
}

function AiAdvicePanel({ aiAdvice, aiLoading, onRefresh }) {
  if (!aiAdvice) return null

  return (
    <section className="glass-card flex h-full flex-col overflow-hidden rounded-3xl">
      <div className="flex items-center justify-between border-b border-[#1B2A24]/60 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#00FF66] to-[#16C784] text-[#041008]">
            <BrainCircuit size={22} />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#00FF66]">Gemini Analizi</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={aiLoading}
          className="flex items-center gap-2 rounded-xl border border-[#1B2A24] bg-[#050807] px-3 py-2 text-xs font-bold text-[#B7C2BC] transition hover:text-white disabled:opacity-60"
        >
          {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Yenile
        </button>
      </div>
      <div className="p-5">
        <h3 className="text-xl font-black leading-tight text-white">{aiAdvice.title}</h3>
        <p className="mt-3 text-sm leading-6 text-[#B7C2BC]">{aiAdvice.summary}</p>
        {aiAdvice.actions?.length > 0 && (
          <div className="mt-5 space-y-2.5">
            {aiAdvice.actions.map((action, index) => (
              <div key={action} className="flex gap-3 rounded-xl border border-[#1B2A24]/60 bg-[#050807]/60 p-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#00FF66]/10 text-xs font-black text-[#00FF66]">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-[#B7C2BC]">{action}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function DashboardSignals({ dashboard }) {
  const insights = dashboard?.quick_insights || []
  const alerts = dashboard?.alerts || []
  if (!insights.length && !alerts.length) return null

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-2">
      <section className="glass-card overflow-hidden rounded-3xl">
        <PanelHeader title="Hızlı İçgörüler" />
        <div className="space-y-3 p-6">
          {insights.map((item) => (
            <p key={item} className="rounded-xl border border-[#1B2A24]/50 bg-[#050807]/50 p-4 text-sm leading-6 text-[#B7C2BC]">
              {item}
            </p>
          ))}
        </div>
      </section>

      <section className="glass-card overflow-hidden rounded-3xl">
        <PanelHeader title="Backend Uyarıları" />
        <div className="space-y-3 p-6">
          {alerts.length ? alerts.map((alert) => (
            <div key={`${alert.title}-${alert.message}`} className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <p className="font-bold text-white">{alert.title}</p>
              <p className="mt-1 text-sm leading-6 text-[#B7C2BC]">{alert.message}</p>
            </div>
          )) : <p className="text-sm text-[#8A968F]">Bu ay için kritik uyarı yok.</p>}
        </div>
      </section>
    </div>
  )
}

function BackendCharts({ dashboard, aiAdvice, aiLoading, onRefreshAi }) {
  const comparison = dashboard?.charts?.monthly_comparison || []
  const habits = dashboard?.charts?.spending_habits || []
  const budgets = dashboard?.charts?.budget_usage || dashboard?.budget_status || []

  return (
    <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,0.95fr)]">
      <div className="space-y-6">
        <section className="glass-card overflow-hidden rounded-3xl">
          <PanelHeader title="Aylık Karşılaştırma" subtitle="Backend dashboard grafiğinden gelen kategori bazlı değişim." />
          <div className="h-64 p-5">
            {comparison.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparison} barSize={24}>
                  <XAxis dataKey="category" stroke="#66726B" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis stroke="#66726B" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `₺${v}`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,255,102,0.04)' }}
                    contentStyle={{ background: '#0B1110', border: '1px solid rgba(0,255,102,0.2)', borderRadius: '12px', color: '#F4F7F5' }}
                    formatter={(value) => [formatCurrency(value), '']}
                  />
                  <Bar dataKey="previous_month_total" name="Önceki Ay" fill="#66726B" radius={[8, 8, 3, 3]} />
                  <Bar dataKey="current_month_total" name="Bu Ay" fill="#00FF66" radius={[8, 8, 3, 3]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState text="Karşılaştırma verisi yok." />}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.2fr)]">
          <section className="glass-card overflow-hidden rounded-3xl">
            <PanelHeader title="Sık Alışkanlıklar" />
            <div className="space-y-3 p-5">
              {habits.length ? habits.slice(0, 4).map((item) => (
                <div key={item.name} className="rounded-xl border border-[#1B2A24]/50 bg-[#050807]/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-white">{item.name}</p>
                    <span className="text-xs font-bold text-[#00FF66]">{item.count} işlem</span>
                  </div>
                  <p className="mt-1 text-sm text-[#8A968F]">{formatCurrency(item.total)}</p>
                </div>
              )) : <p className="text-sm text-[#8A968F]">Alışkanlık verisi yok.</p>}
            </div>
          </section>

          <section className="glass-card overflow-hidden rounded-3xl">
            <PanelHeader title="Bütçe Kullanımı" />
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {budgets.length ? budgets.map((item) => (
                <BudgetUsageMini key={item.budget_id} item={item} />
              )) : (
                <div className="rounded-2xl border border-[#1B2A24]/50 bg-[#050807]/50 p-5 text-sm text-[#8A968F] md:col-span-2">
                  Bütçe limiti eklenmemiş.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <AiAdvicePanel aiAdvice={aiAdvice} aiLoading={aiLoading} onRefresh={onRefreshAi} />
    </div>
  )
}

function BudgetUsageMini({ item }) {
  const usage = Math.min(item.usage_percent || 0, 100)

  return (
    <div className="rounded-2xl border border-[#1B2A24]/50 bg-[#050807]/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold text-white">{item.category}</p>
        <span className={item.is_exceeded ? 'text-sm font-bold text-red-400' : 'text-sm font-bold text-[#00FF66]'}>
          %{item.usage_percent}
        </span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#0B1110]">
        <div className={item.is_exceeded ? 'h-full bg-red-400' : 'h-full bg-[#00FF66]'} style={{ width: `${usage}%` }} />
      </div>
      <p className="mt-2 text-sm text-[#8A968F]">
        {formatCurrency(item.spent)} / {formatCurrency(item.monthly_limit)}
      </p>
    </div>
  )
}

function BudgetAlerts({ budgets }) {
  const alerts = budgets.filter((budget) => budget.is_exceeded)
  if (!alerts.length) return null

  return (
    <div className="mt-8 space-y-4">
      {alerts.map((alert, index) => (
        <motion.div
          key={alert.category}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="font-bold text-white">Bütçe Aşımı: {alert.category}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-[#B7C2BC]">
              {formatCurrency(alert.monthly_limit)} limit aşıldı. Toplam harcama: {formatCurrency(alert.spent)}.
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function PanelHeader({ title, subtitle }) {
  return (
    <div className="border-b border-[#1B2A24]/60 px-6 py-5">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-[#8A968F]">{subtitle}</p>}
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl border border-[#1B2A24]/50 bg-[#050807]/50 text-sm text-[#8A968F]">
      {text}
    </div>
  )
}

function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="glass-card overflow-hidden rounded-3xl p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00FF66]/10 text-[#00FF66]">
          <Loader2 className="animate-spin" size={30} />
        </div>
        <p className="mt-6 text-lg font-black text-white">Finansal veriler hazırlanıyor</p>
      </div>
    </div>
  )
}

function DashboardEmptyState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="glass-card max-w-md overflow-hidden rounded-3xl p-10 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#00FF66]/10 text-[#00FF66]">
          <PiggyBank size={36} />
        </div>
        <h3 className="mt-6 text-2xl font-black text-white">Henüz veriniz yok</h3>
        <p className="mt-3 text-sm leading-relaxed text-[#8A968F]">
          Analizleri görebilmek için manuel işlem ekleyebilir veya örnek bir demo veri seti yükleyebilirsiniz.
        </p>
        <Link
          to="/transactions"
          className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00FF66] to-[#16C784] px-5 py-3.5 text-sm font-bold text-[#041008]"
        >
          <PlusCircle size={18} />
          İşlem Ekle
        </Link>
      </div>
    </div>
  )
}
