import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteBudget, getBudgetStatus, setBudget, updateBudget } from '../services/client'
import { DEFAULT_MONTH, DEFAULT_USER_ID } from '../services/config'
import { formatCurrency } from '../utils/formatCurrency'

const categories = ['Yemek', 'Market', 'Ulaşım', 'Abonelik', 'Fatura', 'Eğitim', 'Diğer']

export default function BudgetsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ category: 'Yemek', monthly_limit: '' })
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')

  const loadBudgets = async () => {
    setLoading(true)
    const response = await getBudgetStatus({ user_id: DEFAULT_USER_ID, month: DEFAULT_MONTH })
    setItems(response.data.budgets || [])
    setLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(loadBudgets, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const totalLimit = useMemo(() => items.reduce((sum, item) => sum + item.monthly_limit, 0), [items])
  const totalSpent = useMemo(() => items.reduce((sum, item) => sum + item.spent, 0), [items])
  const exceededCount = useMemo(() => items.filter((item) => item.is_exceeded).length, [items])

  const handleCreate = async (event) => {
    event.preventDefault()
    const limit = Number(form.monthly_limit)
    if (!form.category || Number.isNaN(limit) || limit <= 0) return

    setSaving(true)
    await setBudget({ user_id: DEFAULT_USER_ID, category: form.category, monthly_limit: limit })
    setForm({ category: 'Yemek', monthly_limit: '' })
    await loadBudgets()
    setSaving(false)
  }

  const saveEdit = async (budgetId) => {
    const limit = Number(editValue)
    if (Number.isNaN(limit) || limit <= 0) return
    setSaving(true)
    await updateBudget(budgetId, { monthly_limit: limit })
    setEditingId(null)
    await loadBudgets()
    setSaving(false)
  }

  const handleDelete = async (budgetId) => {
    setSaving(true)
    await deleteBudget(budgetId)
    await loadBudgets()
    setSaving(false)
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-sm font-bold uppercase tracking-widest text-[#00FF66]">Bütçe Yönetimi</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-white">Kategori Limitleri</h2>
        <p className="mt-3 max-w-3xl text-[#8A968F] leading-relaxed">
          Aylık kategori limitlerini ekle, güncelle ve backend tarafından hesaplanan kullanım durumunu takip et.
        </p>
      </motion.div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Metric title="Toplam Limit" value={formatCurrency(totalLimit)} />
        <Metric title="Bu Ay Harcanan" value={formatCurrency(totalSpent)} />
        <Metric title="Aşım Sayısı" value={`${exceededCount} kategori`} danger={exceededCount > 0} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <section className="glass-card overflow-hidden rounded-3xl">
          <div className="border-b border-[#1B2A24]/60 px-6 py-5">
            <h3 className="text-lg font-bold text-white">Limit Ekle</h3>
          </div>
          <form onSubmit={handleCreate} className="grid gap-4 p-6">
            <select className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <input
              className="input"
              inputMode="decimal"
              placeholder="Aylık limit: 2500"
              value={form.monthly_limit}
              onChange={(e) => setForm((f) => ({ ...f, monthly_limit: e.target.value }))}
            />
            <button disabled={saving} className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00FF66] to-[#16C784] px-5 py-3.5 text-sm font-bold text-[#041008] disabled:opacity-60">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Kaydet
            </button>
          </form>
        </section>

        <section className="glass-card overflow-hidden rounded-3xl">
          <div className="border-b border-[#1B2A24]/60 px-6 py-5">
            <h3 className="text-lg font-bold text-white">Bütçe Durumu</h3>
          </div>
          {loading ? (
            <div className="p-12 text-center text-[#8A968F]">Bütçeler yükleniyor...</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-[#8A968F]">Henüz bütçe limiti eklenmemiş.</div>
          ) : (
            <div className="divide-y divide-[#1B2A24]/60">
              {items.map((item) => (
                <BudgetRow
                  key={item.budget_id}
                  item={item}
                  editing={editingId === item.budget_id}
                  editValue={editValue}
                  onEditValue={setEditValue}
                  onStartEdit={() => { setEditingId(item.budget_id); setEditValue(String(item.monthly_limit)) }}
                  onSave={() => saveEdit(item.budget_id)}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => handleDelete(item.budget_id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Metric({ title, value, danger }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <p className="text-xs font-semibold text-[#8A968F]">{title}</p>
      <p className={`mt-1 text-2xl font-black ${danger ? 'text-red-400' : 'text-white'}`}>{value}</p>
    </div>
  )
}

function BudgetRow({ item, editing, editValue, onEditValue, onStartEdit, onSave, onCancel, onDelete }) {
  const usage = Math.min(item.usage_percent, 100)

  return (
    <div className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {item.is_exceeded ? <AlertTriangle size={17} className="text-red-400" /> : <CheckCircle2 size={17} className="text-[#00FF66]" />}
            <p className="font-bold text-white">{item.category}</p>
            <span className="text-xs text-[#8A968F]">%{item.usage_percent}</span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full border border-[#1B2A24]/50 bg-[#050807]">
            <div className={`h-full ${item.is_exceeded ? 'bg-red-400' : 'bg-[#00FF66]'}`} style={{ width: `${usage}%` }} />
          </div>
          <p className="mt-2 text-sm text-[#8A968F]">
            {formatCurrency(item.spent)} harcandı, {formatCurrency(item.remaining)} kaldı
          </p>
        </div>

        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <input className="input w-32 py-2" value={editValue} onChange={(e) => onEditValue(e.target.value)} />
              <button onClick={onSave} className="rounded-xl bg-[#00FF66] px-3 py-2 text-sm font-bold text-[#041008]">Kaydet</button>
              <button onClick={onCancel} className="rounded-xl border border-[#1B2A24] px-3 py-2 text-sm font-bold text-[#B7C2BC]">Vazgeç</button>
            </>
          ) : (
            <>
              <p className="min-w-28 text-right font-black text-white">{formatCurrency(item.monthly_limit)}</p>
              <button onClick={onStartEdit} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1B2A24] text-[#8A968F] hover:text-white">
                <Pencil size={15} />
              </button>
              <button onClick={onDelete} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1B2A24] text-[#8A968F] hover:border-red-500/40 hover:text-red-400">
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
