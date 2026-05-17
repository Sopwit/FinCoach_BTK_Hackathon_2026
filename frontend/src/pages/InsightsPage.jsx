import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BrainCircuit,
  HandCoins,
  ListChecks,
  Loader2,
  RefreshCw,
  Repeat,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  PlusCircle,
  PiggyBank,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  getAiAdvice,
  getHabits,
  getHealthScore,
  getMonthlyComparison,
  getRecurringPayments,
} from '../services/client'
import {
  DEFAULT_PREVIOUS_MONTH,
} from '../services/config'
import { useDemo } from '../hooks/useDemo'
import { formatCurrency } from '../utils/formatCurrency'

export default function InsightsPage() {
  const [monthlyComparison, setMonthlyComparison] = useState([])
  const [recurringPayments, setRecurringPayments] = useState([])
  const [habits, setHabits] = useState({ frequent_sub_categories: [], frequent_descriptions: [] })
  const [healthScore, setHealthScore] = useState(null)
  const [aiAdvice, setAiAdvice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const { selectedMonth, selectedUserId } = useDemo()

  const loadInsightsData = useCallback(async () => {
    setLoading(true)
    const params = {
      user_id: selectedUserId,
      month: selectedMonth,
      current_month: selectedMonth,
      previous_month: DEFAULT_PREVIOUS_MONTH,
    }

    const [compRes, recRes, habRes, healthRes, aiRes] = await Promise.all([
      getMonthlyComparison(params),
      getRecurringPayments(params),
      getHabits(params),
      getHealthScore(params),
      getAiAdvice(params),
    ])

    setMonthlyComparison(compRes.data)
    setRecurringPayments(recRes.data)
    setHabits(habRes.data)
    setHealthScore(healthRes.data)
    setAiAdvice(aiRes.data)
    setLoading(false)
  }, [selectedMonth, selectedUserId])

  useEffect(() => {
    const timer = window.setTimeout(loadInsightsData, 0)
    return () => window.clearTimeout(timer)
  }, [loadInsightsData])

  const refreshAiAdvice = async () => {
    setAiLoading(true)
    const response = await getAiAdvice({ user_id: selectedUserId, month: selectedMonth })
    setAiAdvice(response.data)
    setAiLoading(false)
  }

  if (loading) return <InsightsLoading />

  const frequentSubCategories = habits.frequent_sub_categories || []
  const frequentDescriptions = habits.frequent_descriptions || []

  if (monthlyComparison.length === 0 && recurringPayments.length === 0 && frequentSubCategories.length === 0 && frequentDescriptions.length === 0) {
    return <InsightsEmptyState />
  }

  const highest = getHighestIncrease(monthlyComparison)

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-sm font-bold uppercase tracking-widest text-[#00FF66]">Finansal Detaylar</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-white">Harcama Analizi</h2>
        <p className="mt-3 max-w-3xl text-[#8A968F] leading-relaxed">
          Harcama davranışlarını analiz et, tekrar eden ödemeleri gör ve önerilen aksiyonlarla bütçeni güçlendir.
        </p>
      </motion.div>

      {/* Summary row */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={TrendingUp} iconColor="text-red-400" iconBg="bg-red-500/10"
          title="En Çok Artan Kategori" value={highest}
          text="Geçen ay ile bu ay arasındaki en belirgin değişim."
        />
        <SummaryCard
          icon={Repeat} iconColor="text-[#00FF66]" iconBg="bg-[#00FF66]/10"
          title="Tekrar Eden Ödeme" value={`${recurringPayments.length} ödeme`}
          text="Abonelik ve düzenli ödeme olarak algılandı."
        />
        <SummaryCard
          icon={ListChecks} iconColor="text-[#16C784]" iconBg="bg-[#16C784]/10"
          title="Sık Alışkanlık" value={`${frequentSubCategories.length + frequentDescriptions.length} alan`}
          text="Ay içinde tekrar eden harcama davranışı bulundu."
        />
      </div>

      {healthScore && <HealthScorePanel healthScore={healthScore} />}

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Monthly Comparison */}
        <Panel delay={0.06} icon={TrendingUp} title="Geçen Ay / Bu Ay Karşılaştırması" subtitle="Kategori bazlı değişim analizi">
          <div className="mt-6">
            <div className="grid grid-cols-4 px-4 pb-3 text-xs font-bold uppercase tracking-wider text-[#8A968F]">
              <span>Kategori</span>
              <span>Nisan</span>
              <span>Mayıs</span>
              <span className="text-right">Değişim</span>
            </div>
            <div className="space-y-2">
              {monthlyComparison.map((item) => (
                <InsightRow
                  key={item.category}
                  label={item.category}
                  oldValue={formatCurrency(item.previous_month_total)}
                  newValue={formatCurrency(item.current_month_total)}
                  change={item.change_percent}
                />
              ))}
            </div>
          </div>
        </Panel>

        {/* Recurring Payments */}
        <Panel delay={0.12} icon={Repeat} title="Tekrar Eden Ödemeler" subtitle="Abonelik ve düzenli ödeme tespiti">
          <div className="mt-6 space-y-3">
            {recurringPayments.map((item) => (
              <PaymentCard
                key={`${item.description || item.name}-${item.category}-${item.sub_category}`}
                item={item}
                title={item.description || item.name}
                price={formatCurrency(item.average_amount ?? item.amount)}
                type={item.type}
                frequency={item.frequency}
              />
            ))}
            <div className="rounded-xl border border-[#1B2A24]/40 bg-[#050807]/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#8A968F]">Toplam aylık abonelik</span>
                <span className="text-lg font-black text-[#00FF66]">
                  {formatCurrency(recurringPayments.reduce((s, i) => s + (i.average_amount ?? i.amount), 0))}
                </span>
              </div>
            </div>
          </div>
        </Panel>

        {(frequentSubCategories.length > 0 || frequentDescriptions.length > 0) && (
          <Panel delay={0.18} icon={ListChecks} title="Sık Harcama Alışkanlıkları" subtitle="Abonelik olmayan tekrar eden davranışlar">
            <div className="mt-6 space-y-3">
              {frequentSubCategories.length > 0 && (
                <HabitGroup
                  title="Sık Alt Kategoriler"
                  description="Aynı alt kategori ay içinde en az 2 kez harcandığında listelenir."
                  items={frequentSubCategories}
                />
              )}
              {frequentDescriptions.length > 0 && (
                <HabitGroup
                  title="Sık Açıklamalar"
                  description="Aynı işlem açıklaması ay içinde en az 2 kez tekrarlandığında listelenir."
                  items={frequentDescriptions}
                />
              )}
            </div>
          </Panel>
        )}

        {/* Savings Plan */}
        <Panel
          delay={0.24}
          icon={BrainCircuit}
          title="Tasarruf Planı"
          subtitle="Kullanıcının kendi verisine göre öneriler"
          action={
            <button
              onClick={refreshAiAdvice}
              disabled={aiLoading}
              className="flex items-center gap-2 rounded-xl border border-[#1B2A24] bg-[#050807] px-3 py-2 text-xs font-bold text-[#B7C2BC] transition-all duration-300 hover:border-[#00FF66]/40 hover:text-white disabled:opacity-60"
            >
              {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Yenile
            </button>
          }
        >
          <div className="mt-6 rounded-xl border border-[#1B2A24]/40 bg-[#050807]/40 p-5">
            <h4 className="text-lg font-black text-white">{aiAdvice.title}</h4>
            <p className="mt-3 text-sm leading-7 text-[#B7C2BC]">{aiAdvice.summary}</p>
          </div>

          <div className="mt-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8A968F] px-1">Önerilen Aksiyonlar</p>
            {aiAdvice.actions.map((action, index) => (
              <ActionCard key={action} number={index + 1} text={action} />
            ))}
          </div>

          {aiAdvice.estimated_saving && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-[#00FF66]/20 bg-gradient-to-br from-[#00FF66]/8 to-transparent">
              <div className="h-0.5 w-full bg-gradient-to-r from-[#00FF66] to-transparent" />
              <div className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#8A968F] uppercase tracking-wider">Tahmini tasarruf potansiyeli</p>
                  <p className="mt-2 text-3xl font-black text-[#00FF66] drop-shadow-[0_0_10px_rgba(0,255,102,0.3)]">
                    {aiAdvice.estimated_saving}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00FF66]/10">
                  <HandCoins size={22} className="text-[#00FF66]" />
                </div>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

function InsightsEmptyState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card max-w-md overflow-hidden rounded-3xl p-10 text-center"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#00FF66]/10 text-[#00FF66]">
          <PiggyBank size={36} />
        </div>
        <h3 className="mt-6 text-2xl font-black text-white">Yeterli Veri Yok</h3>
        <p className="mt-3 text-sm leading-relaxed text-[#8A968F]">
          Aylık karşılaştırmalar ve tasarruf önerileri için sistemde yeterli geçmiş veri bulunmuyor.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            to="/transactions"
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00FF66] to-[#16C784] px-5 py-3.5 text-sm font-bold text-[#041008] shadow-[0_4px_20px_rgba(0,255,102,0.2)] transition-all duration-300 hover:shadow-[0_4px_30px_rgba(0,255,102,0.35)] hover:-translate-y-0.5 active:scale-95"
          >
            <PlusCircle size={18} />
            İşlem Ekle
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

function InsightsLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card overflow-hidden rounded-3xl">
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#00FF66] to-transparent animate-pulse" />
        <div className="p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00FF66]/10 text-[#00FF66]">
            <Loader2 className="animate-spin" size={30} />
          </div>
          <p className="mt-6 text-lg font-black text-white">Finansal detaylar hazırlanıyor</p>
          <p className="mt-2 text-sm text-[#8A968F]">Karşılaştırmalar, abonelikler, alışkanlıklar ve öneriler yükleniyor.</p>
        </div>
      </motion.div>
    </div>
  )
}

function getHighestIncrease(items) {
  if (!items.length) return '-'
  const highest = [...items].sort((a, b) => b.change_percent - a.change_percent)[0]
  return `${highest.category} +%${highest.change_percent}`
}

function SummaryCard({ icon: Icon, iconColor, iconBg, title, value, text }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden rounded-2xl">
      <div className="p-5">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
        <p className="mt-3 text-xs font-semibold text-[#8A968F]">{title}</p>
        <p className="mt-1 text-xl font-black text-[#00FF66]">{value}</p>
        <p className="mt-2 text-xs leading-5 text-[#B7C2BC]">{text}</p>
      </div>
    </motion.div>
  )
}

function HealthScorePanel({ healthScore }) {
  const metrics = healthScore.metrics || {}
  const reasons = healthScore.reasons || []
  const positives = healthScore.positive_points || []

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card mb-8 overflow-hidden rounded-3xl"
    >
      <div className="flex flex-col gap-5 border-b border-[#1B2A24]/60 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#00FF66]">Finansal Sağlık</p>
          <h3 className="mt-2 text-2xl font-black text-white">{healthScore.status}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#B7C2BC]">{healthScore.message}</p>
        </div>
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-[#00FF66]/20 bg-[#00FF66]/10">
          <span className="text-3xl font-black text-[#00FF66]">{healthScore.score}</span>
          <span className="mt-2 text-sm font-bold text-[#8A968F]">/100</span>
        </div>
      </div>

      <div className="grid gap-4 p-6 md:grid-cols-3">
        <HealthMetric label="Gider Oranı" value={`%${metrics.expense_ratio ?? 0}`} />
        <HealthMetric label="Tekrar Eden Ödeme" value={formatCurrency(metrics.recurring_total ?? 0)} />
        <HealthMetric label="Aşılan Bütçe" value={`${metrics.exceeded_budget_count ?? 0}`} />
      </div>

      {(reasons.length > 0 || positives.length > 0) && (
        <div className="grid gap-4 border-t border-[#1B2A24]/60 p-6 md:grid-cols-2">
          <HealthList title="Dikkat Edilecekler" items={reasons} tone="warning" />
          <HealthList title="Olumlu Noktalar" items={positives} tone="positive" />
        </div>
      )}
    </motion.section>
  )
}

function HealthMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#1B2A24]/50 bg-[#050807]/50 p-4">
      <p className="text-xs font-semibold text-[#8A968F]">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  )
}

function HealthList({ title, items, tone }) {
  const color = tone === 'positive' ? 'text-[#00FF66]' : 'text-yellow-400'

  return (
    <div>
      <p className={`text-xs font-bold uppercase tracking-widest ${color}`}>{title}</p>
      {items.length ? (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <p key={item} className="rounded-xl border border-[#1B2A24]/50 bg-[#050807]/50 p-3 text-sm leading-6 text-[#B7C2BC]">
              {item}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[#8A968F]">Kayıt yok.</p>
      )}
    </div>
  )
}

function Panel({ icon: Icon, title, subtitle, children, delay, action }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card overflow-hidden rounded-3xl"
    >
      <div className="flex items-start justify-between border-b border-[#1B2A24]/60 px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00FF66]/10 text-[#00FF66]">
            <Icon size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="mt-1 text-sm text-[#8A968F]">{subtitle}</p>
          </div>
        </div>
        {action}
      </div>

      <div className="p-6">{children}</div>
    </motion.section>
  )
}

function InsightRow({ label, oldValue, newValue, change }) {
  const isIncrease = change > 0
  const isZero = change === 0
  return (
    <div className="grid grid-cols-4 items-center rounded-xl border border-[#1B2A24]/40 bg-[#050807]/40 px-4 py-3.5 text-sm transition-all duration-200 hover:border-[#1B2A24]">
      <span className="font-bold text-white">{label}</span>
      <span className="text-[#8A968F] font-medium">{oldValue}</span>
      <span className="text-[#B7C2BC] font-semibold">{newValue}</span>
      <span className="text-right">
        <span className={[
          'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold',
          isZero ? 'bg-[#1B2A24]/40 text-[#8A968F]' :
          isIncrease ? 'bg-red-500/10 text-red-400' : 'bg-[#00FF66]/10 text-[#00FF66]',
        ].join(' ')}>
          {!isZero && (isIncrease ? <ArrowUpRight size={12} /> : <ArrowRight size={12} />)}
          {isZero ? '—' : `${change > 0 ? '+' : ''}%${change}`}
        </span>
      </span>
    </div>
  )
}

function PaymentCard({ item, title, price, type, frequency }) {
  return (
    <div className="rounded-xl border border-[#1B2A24]/40 bg-[#050807]/40 p-4 transition-all duration-200 hover:border-[#1B2A24]">
      <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00FF66]/10 text-[#00FF66]">
          <Repeat size={16} />
        </div>
        <div>
          <p className="font-bold text-white">{title}</p>
          <p className="mt-0.5 text-xs text-[#8A968F]">{type} • {frequency}</p>
        </div>
      </div>
      <p className="font-black text-[#00FF66]">{price}</p>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-[#8A968F] sm:grid-cols-3">
        <span>Kategori: <b className="text-[#B7C2BC]">{item.category || '-'}</b></span>
        <span>Alt kategori: <b className="text-[#B7C2BC]">{item.sub_category || '-'}</b></span>
        <span>Adet: <b className="text-[#B7C2BC]">{item.count ?? '-'}</b></span>
      </div>
    </div>
  )
}

function HabitGroup({ title, description, items }) {
  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#8A968F]">{title}</p>
      {description && <p className="mb-3 text-xs leading-5 text-[#8A968F]">{description}</p>}
      <div className="space-y-3">
        {items.map((item) => (
          <HabitCard
            key={item.name}
            title={item.name}
            count={item.count}
            total={formatCurrency(item.total)}
            category={item.category}
          />
        ))}
      </div>
    </div>
  )
}

function HabitCard({ title, count, total, category }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#1B2A24]/40 bg-[#050807]/40 p-4 transition-all duration-200 hover:border-[#1B2A24]">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#16C784]/10 text-[#16C784]">
          <ListChecks size={16} />
        </div>
        <div>
          <p className="font-bold text-white">{title}</p>
          <p className="mt-0.5 text-xs text-[#8A968F]">{category} • {total}</p>
        </div>
      </div>
      <span className="rounded-lg bg-[#00FF66]/10 border border-[#00FF66]/20 px-3 py-1 text-xs font-bold text-[#00FF66]">
        {count} işlem
      </span>
    </div>
  )
}

function ActionCard({ number, text }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#1B2A24]/40 bg-[#050807]/40 p-4 transition-all duration-200 hover:border-[#1B2A24]">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#00FF66] to-[#16C784] text-sm font-black text-[#041008]">
        {number}
      </div>
      <p className="text-sm font-medium leading-relaxed text-[#B7C2BC]">{text}</p>
    </div>
  )
}
