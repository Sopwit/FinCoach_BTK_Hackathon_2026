import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, FileSpreadsheet, Loader2, Plus, Search, Sparkles, Trash2, UploadCloud, XCircle, ArrowUpRight, ArrowDownRight, Filter, Pencil } from 'lucide-react'
import { getTransactions, addManualTransaction, deleteTransaction, uploadTransactions, updateTransaction } from '../services/client'
import { useDemo } from '../hooks/useDemo'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'

const csvPreviewRows = [
  { date: '2026-05-03', description: 'Trendyol Yemek', amount: '-430', type: 'expense' },
  { date: '2026-05-05', description: 'Spotify', amount: '-59.99', type: 'expense' },
  { date: '2026-05-01', description: 'KYK Burs', amount: '3000', type: 'income' },
]

const initialForm = { date: '2026-05-29', description: '', amount: '', type: 'expense', category: 'auto', note: '' }

export default function TransactionsPage() {
  const fileInputRef = useRef(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(initialForm)
  const [lastAdded, setLastAdded] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('idle')
  const [uploadResult, setUploadResult] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterSource, setFilterSource] = useState('all')
  const [deletedId, setDeletedId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [uploadError, setUploadError] = useState('')
  const { selectedMonth, selectedUserId } = useDemo()

  const loadData = useCallback(async () => {
    setLoading(true)
    const res = await getTransactions({
      user_id: selectedUserId,
      month: selectedMonth,
      type: filterType === 'all' ? undefined : filterType,
      category: filterCategory === 'all' ? undefined : filterCategory,
      source: filterSource === 'all' ? undefined : filterSource,
      search: searchQuery || undefined,
    })
    setTransactions(res.data)
    setLoading(false)
  }, [filterType, filterCategory, filterSource, searchQuery, selectedMonth, selectedUserId])

  useEffect(() => {
    const timer = window.setTimeout(loadData, 0)
    return () => window.clearTimeout(timer)
  }, [loadData])

  const allCategories = useMemo(() => [...new Set(transactions.map((t) => t.category))].sort(), [transactions])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const description = t.description || ''
      const category = t.category || ''
      const matchesSearch = !searchQuery || description.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR')) || category.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR'))
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory
      const matchesType = filterType === 'all' || t.type === filterType
      const matchesSource = filterSource === 'all' || t.source === filterSource
      return matchesSearch && matchesCategory && matchesType && matchesSource
    })
  }, [transactions, searchQuery, filterCategory, filterType, filterSource])

  const totalExpense = useMemo(() => filteredTransactions.filter((i) => i.type === 'expense').reduce((s, i) => s + Math.abs(i.amount), 0), [filteredTransactions])
  const totalIncome = useMemo(() => filteredTransactions.filter((i) => i.type === 'income').reduce((s, i) => s + i.amount, 0), [filteredTransactions])

  const handleChange = (e) => { const { name, value } = e.target; setForm((f) => ({ ...f, [name]: value })) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.date || !form.description.trim() || !form.amount) return
    const num = Number(form.amount)
    if (Number.isNaN(num) || num <= 0) return

    const payload = {
      user_id: selectedUserId,
      date: form.date,
      description: form.description.trim(),
      amount: num,
      type: form.type,
      category: form.category === 'auto' ? null : form.category,
      sub_category: null,
      note: form.note.trim(),
    }

    const res = await addManualTransaction(payload)
    
    setTransactions((t) => [res.data, ...t])
    setLastAdded(res.data)
    setForm(initialForm)
  }

  const handleDelete = async (id) => {
    setDeletedId(id)
    await deleteTransaction(id)
    setTimeout(() => {
      setTransactions((t) => t.filter((tx) => tx.id !== id))
      setDeletedId(null)
    }, 300)
  }

  const handleEditSave = async (payload) => {
    const res = await updateTransaction(editing.id, payload)
    setTransactions((items) => items.map((item) => item.id === editing.id ? res.data : item))
    setEditing(null)
  }

  const handleFileSelect = (e) => { const f = e.target.files?.[0]; if (!f) return; setSelectedFile(f); setUploadStatus('idle'); setUploadResult(null); setUploadError('') }
  const handleUploadClick = () => { fileInputRef.current?.click() }
  const handleImportFile = async () => { 
    if (!selectedFile) return; 
    setUploadStatus('loading'); 
    setUploadResult(null); 
    setUploadError('')
    
    const formData = new FormData()
    formData.append('user_id', String(selectedUserId))
    formData.append('file', selectedFile)

    try {
      const res = await uploadTransactions(formData);
      setUploadStatus('success'); 
      setUploadResult({ fileName: selectedFile.name, ...res.data });
      loadData();
    } catch (error) {
      setUploadStatus('error')
      setUploadError(error.message)
    }
  }
  const handleClearFile = () => { setSelectedFile(null); setUploadStatus('idle'); setUploadResult(null); setUploadError(''); if (fileInputRef.current) fileInputRef.current.value = '' }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-sm font-bold uppercase tracking-widest text-[#00FF66]">Harcama Yönetimi</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-white">İşlemler ve Veri Girişi</h2>
        <p className="mt-3 max-w-3xl text-[#8A968F] leading-relaxed">Gelir-gider işlemlerini manuel ekle, CSV/Excel dosyası yükle ve kategorilere ayrılmış finansal kayıtlarını yönet.</p>
      </motion.div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <MiniStat icon={ArrowUpRight} iconColor="text-[#00FF66]" title="Bu Ay Gelir" value={formatCurrency(totalIncome)} valueColor="text-[#00FF66]" />
        <MiniStat icon={ArrowDownRight} iconColor="text-red-400" title="Bu Ay Gider" value={formatCurrency(totalExpense)} valueColor="text-red-400" />
        <MiniStat icon={FileSpreadsheet} iconColor="text-[#16C784]" title="Listelenen İşlem" value={`${filteredTransactions.length} / ${transactions.length}`} valueColor="text-white" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Manual Form */}
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card overflow-hidden rounded-3xl">
          <div className="flex items-center gap-3 border-b border-[#1B2A24]/60 px-6 py-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#00FF66] to-[#16C784] text-[#041008]"><Plus size={22} /></div>
            <div><h3 className="text-lg font-bold text-white">Manuel İşlem Ekle</h3><p className="text-sm text-[#8A968F]">Kategori algılama backend tarafından yapılır.</p></div>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="grid gap-4">
              <input className="input" type="date" name="date" value={form.date} onChange={handleChange} />
              <input className="input" name="description" value={form.description} onChange={handleChange} placeholder="Açıklama: Trendyol Yemek, Spotify, BIM Market" />
              <input className="input" name="amount" value={form.amount} onChange={handleChange} inputMode="decimal" placeholder="Tutar: 400" />
              <div className="grid gap-4 md:grid-cols-2">
                <select className="input" name="type" value={form.type} onChange={handleChange}><option value="expense">Gider</option><option value="income">Gelir</option></select>
                <select className="input" name="category" value={form.category} onChange={handleChange}><option value="auto">Kategori otomatik algılansın</option><option value="Yemek">Yemek</option><option value="Market">Market</option><option value="Ulaşım">Ulaşım</option><option value="Abonelik">Abonelik</option><option value="Fatura">Fatura</option><option value="Gelir">Gelir</option></select>
              </div>
              <input className="input" name="note" value={form.note} onChange={handleChange} placeholder="Not: Akşam yemeği" />
              <button type="submit" className="rounded-2xl bg-gradient-to-r from-[#00FF66] to-[#16C784] px-5 py-3.5 text-sm font-bold text-[#041008] shadow-[0_4px_20px_rgba(0,255,102,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_30px_rgba(0,255,102,0.35)] active:scale-[0.98]">İşlemi Ekle</button>
            </form>
            {lastAdded && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-5 overflow-hidden rounded-2xl border border-[#00FF66]/20 bg-[#00FF66]/5">
                <div className="h-0.5 w-full bg-gradient-to-r from-[#00FF66] to-transparent" />
                <div className="p-4 flex items-start gap-3">
                  <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-[#00FF66]" />
                  <div><p className="font-bold text-white">İşlem başarıyla eklendi</p><p className="mt-1 text-sm leading-6 text-[#B7C2BC]">{lastAdded.description} işlemi <span className="font-bold text-[#00FF66]">{lastAdded.category} {'>'} {lastAdded.sub_category}</span> olarak algılandı.</p></div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* CSV Upload */}
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="glass-card overflow-hidden rounded-3xl">
          <div className="flex items-center gap-3 border-b border-[#1B2A24]/60 px-6 py-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00FF66]/10 text-[#00FF66]"><UploadCloud size={23} /></div>
            <div><h3 className="text-lg font-bold text-white">CSV / Excel Yükle</h3><p className="text-sm text-[#8A968F]">Toplu işlem verilerini hızlıca içe aktar.</p></div>
          </div>
          <div className="p-6">
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} className="hidden" />
            <button type="button" onClick={handleUploadClick} className="w-full rounded-2xl border border-dashed border-[#284338] bg-[#050807]/50 p-8 text-center transition-all duration-300 hover:border-[#00FF66]/50 hover:bg-[#07100D] group">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00FF66]/10 text-[#00FF66] transition-all group-hover:bg-[#00FF66]/15 group-hover:shadow-[0_0_20px_rgba(0,255,102,0.15)]"><FileSpreadsheet size={28} /></div>
              <p className="mt-5 text-lg font-bold text-white">Dosya seç veya sürükle</p>
              <p className="mt-2 text-sm text-[#8A968F]">CSV ve XLSX formatları desteklenir.</p>
            </button>
            {selectedFile && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-2xl border border-[#1B2A24] bg-[#050807]/60 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div><p className="text-sm font-bold text-white">{selectedFile.name}</p><p className="mt-1 text-xs text-[#8A968F]">{(selectedFile.size / 1024).toFixed(1)} KB</p></div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleClearFile} className="rounded-xl border border-[#1B2A24] px-4 py-2 text-sm font-bold text-[#B7C2BC] transition hover:border-red-400/50 hover:text-red-400">Temizle</button>
                    <button type="button" onClick={handleImportFile} disabled={uploadStatus === 'loading'} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00FF66] to-[#16C784] px-4 py-2 text-sm font-bold text-[#041008] transition-all hover:-translate-y-0.5 disabled:opacity-60">
                      {uploadStatus === 'loading' ? (<><Loader2 size={16} className="animate-spin" />Aktarılıyor</>) : (<><UploadCloud size={16} />İçe Aktar</>)}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            {uploadResult && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-5 overflow-hidden rounded-2xl border border-[#00FF66]/20 bg-[#00FF66]/5">
                <div className="h-0.5 w-full bg-gradient-to-r from-[#00FF66] to-transparent" />
                <div className="p-4 flex items-start gap-3">
                  <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-[#00FF66]" />
                  <div><p className="font-bold text-white">Dosya başarıyla işlendi</p>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                      <UploadMetric label="Okunan satır" value={uploadResult.totalRows} />
                      <UploadMetric label="Eklenen işlem" value={uploadResult.insertedRows} />
                      <UploadMetric label="Hatalı satır" value={uploadResult.failedRows} danger />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            {uploadStatus === 'error' && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4"><XCircle size={18} className="mt-0.5 shrink-0 text-red-400" /><p className="text-sm leading-6 text-[#B7C2BC]">{uploadError}</p></div>
            )}
            {uploadResult?.transactions?.length > 0 && (
              <UploadTransactionsTable transactions={uploadResult.transactions} />
            )}
            <div className="mt-5 rounded-2xl border border-[#1B2A24]/60 bg-[#050807]/40 p-4">
              <div className="mb-3 flex items-center gap-2"><Sparkles size={14} className="text-[#00FF66]" /><p className="text-sm font-bold text-[#00FF66]">Beklenen format</p></div>
              <div className="overflow-hidden rounded-xl border border-[#1B2A24]/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#07100D] text-[#8A968F]"><tr><th className="px-3 py-2.5">date</th><th className="px-3 py-2.5">description</th><th className="px-3 py-2.5">amount</th><th className="px-3 py-2.5">type</th></tr></thead>
                  <tbody>{csvPreviewRows.map((row) => (<tr key={`${row.date}-${row.description}`} className="border-t border-[#1B2A24]/60 text-[#B7C2BC]"><td className="px-3 py-2.5">{row.date}</td><td className="px-3 py-2.5 font-bold text-white">{row.description}</td><td className={`px-3 py-2.5 font-bold ${row.type === 'income' ? 'text-[#00FF66]' : 'text-red-400'}`}>{row.amount}</td><td className="px-3 py-2.5">{row.type}</td></tr>))}</tbody>
                </table>
              </div>
            </div>
            {uploadStatus === 'success' && uploadResult?.failedRows > 0 && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4"><XCircle size={18} className="mt-0.5 shrink-0 text-yellow-400" /><p className="text-sm leading-6 text-[#B7C2BC]">{uploadResult.failedRows} satır eksik veya hatalı veri nedeniyle işlenmedi.</p></div>
            )}
          </div>
        </motion.section>
      </div>

      {/* Transaction Table with Search & Filters */}
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card mt-8 overflow-hidden rounded-3xl">
        <div className="border-b border-[#1B2A24]/60 px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div><h3 className="text-lg font-bold text-white">İşlem Listesi</h3><p className="mt-1 text-sm text-[#8A968F]">Sisteme eklenen işlemler kategori ve kaynak bilgisiyle listelenir.</p></div>
            <div className="rounded-xl border border-[#00FF66]/20 bg-[#00FF66]/5 px-4 py-2 text-sm font-bold text-[#00FF66]">{filteredTransactions.length} / {transactions.length} işlem</div>
          </div>

          {/* Search & Filters */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A968F]" />
              <input className="input pl-11 text-sm" placeholder="İşlem ara: Trendyol, Spotify, Market..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A968F] pointer-events-none" />
                <select className="input pl-9 pr-4 py-2.5 text-sm min-w-[140px]" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  <option value="all">Tüm Kategoriler</option>
                  {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <select className="input py-2.5 text-sm min-w-[100px]" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">Tümü</option>
                <option value="income">Gelir</option>
                <option value="expense">Gider</option>
              </select>
              <select className="input py-2.5 text-sm min-w-[120px]" value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
                <option value="all">Tüm Kaynaklar</option>
                <option value="manual">Manual</option>
                <option value="csv">CSV</option>
                <option value="demo">Demo</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00FF66]/10 text-[#00FF66]">
              <Loader2 size={28} className="animate-spin" />
            </div>
            <p className="mt-5 text-lg font-bold text-white">İşlemler yükleniyor</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1B2A24]/30 text-[#8A968F]"><Search size={28} /></div>
            <p className="mt-5 text-lg font-bold text-white">İşlem bulunamadı</p>
            <p className="mt-2 text-sm text-[#8A968F]">Arama kriterlerini değiştirerek tekrar deneyin veya yeni işlem ekleyin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
              <thead className="bg-[#050807]/60 text-xs uppercase tracking-wider text-[#8A968F]">
                <tr><th className="px-5 py-4">Tarih</th><th className="px-5 py-4">Açıklama</th><th className="px-5 py-4">Tutar</th><th className="px-5 py-4">Tip</th><th className="px-5 py-4">Kategori</th><th className="px-5 py-4">Alt Kategori</th><th className="px-5 py-4">Kaynak</th><th className="px-5 py-4">Not</th><th className="px-5 py-4">Oluşturulma</th><th className="px-5 py-4 w-12"></th></tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredTransactions.map((item) => (
                    <motion.tr layout key={item.id} exit={{ opacity: 0, x: -30 }} className={`border-t border-[#1B2A24]/40 text-[#B7C2BC] transition-colors hover:bg-[#0B1110]/50 ${deletedId === item.id ? 'opacity-40' : ''}`}>
                      <td className="px-5 py-4 font-medium">{formatDate(item.date)}</td>
                      <td className="px-5 py-4 font-bold text-white">{item.description}</td>
                      <td className={`px-5 py-4 font-bold ${item.type === 'income' ? 'text-[#00FF66]' : 'text-red-400'}`}>{formatCurrency(item.amount)}</td>
                      <td className="px-5 py-4"><span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${item.type === 'income' ? 'bg-[#00FF66]/10 text-[#00FF66]' : 'bg-red-500/10 text-red-400'}`}>{item.type === 'income' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{item.type === 'income' ? 'Gelir' : 'Gider'}</span></td>
                      <td className="px-5 py-4"><Badge>{item.category}</Badge></td>
                      <td className="px-5 py-4"><span className="text-xs text-[#8A968F]">{item.sub_category}</span></td>
                      <td className="px-5 py-4"><span className="rounded-lg bg-[#0B1110] border border-[#1B2A24]/40 px-2 py-1 text-xs font-semibold uppercase text-[#8A968F]">{item.source}</span></td>
                      <td className="px-5 py-4 max-w-[220px] text-xs leading-5 text-[#8A968F]">{item.note || '-'}</td>
                      <td className="px-5 py-4 text-xs text-[#8A968F]">{formatDateTime(item.created_at)}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => setEditing(item)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-[#8A968F] transition-all hover:border-[#00FF66]/30 hover:bg-[#00FF66]/10 hover:text-[#00FF66]"><Pencil size={15} /></button>
                          <button onClick={() => handleDelete(item.id)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-[#8A968F] transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      {editing && (
        <EditTransactionModal
          transaction={editing}
          onClose={() => setEditing(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  )
}

function EditTransactionModal({ transaction, onClose, onSave }) {
  const [form, setForm] = useState({
    date: transaction.date,
    description: transaction.description,
    amount: Math.abs(transaction.amount),
    type: transaction.type,
    category: transaction.category,
    sub_category: transaction.sub_category || '',
    note: transaction.note || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    await onSave({ ...form, amount: Number(form.amount) })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <motion.form
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="glass-card w-full max-w-xl overflow-hidden rounded-3xl"
      >
        <div className="border-b border-[#1B2A24]/60 px-6 py-5">
          <h3 className="text-lg font-bold text-white">İşlemi Düzenle</h3>
        </div>
        <div className="grid gap-4 p-6">
          <input className="input" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          <input className="input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="grid gap-4 md:grid-cols-2">
            <input className="input" inputMode="decimal" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
            <select className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="expense">Gider</option>
              <option value="income">Gelir</option>
            </select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            <input className="input" value={form.sub_category} onChange={(e) => setForm((f) => ({ ...f, sub_category: e.target.value }))} />
          </div>
          <input className="input" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Not" />
        </div>
        <div className="flex justify-end gap-3 border-t border-[#1B2A24]/60 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-[#1B2A24] px-4 py-2 text-sm font-bold text-[#B7C2BC]">Vazgeç</button>
          <button disabled={saving} className="rounded-xl bg-[#00FF66] px-4 py-2 text-sm font-bold text-[#041008] disabled:opacity-60">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </motion.form>
    </div>
  )
}

function MiniStat({ icon: Icon, iconColor, title, value, valueColor }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden rounded-2xl">
      <div className="p-5 flex items-center gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-[#050807] border border-[#1B2A24]/40 ${iconColor}`}><Icon size={20} /></div>
        <div><p className="text-xs font-semibold text-[#8A968F]">{title}</p><p className={`mt-0.5 text-xl font-black ${valueColor}`}>{value}</p></div>
      </div>
    </motion.div>
  )
}

function UploadMetric({ label, value, danger }) {
  return (
    <div className="rounded-xl border border-[#1B2A24]/40 bg-[#050807]/60 p-3">
      <p className="text-xs text-[#8A968F]">{label}</p>
      <p className={`mt-1 text-lg font-black ${danger ? 'text-yellow-400' : 'text-[#00FF66]'}`}>{value}</p>
    </div>
  )
}

function UploadTransactionsTable({ transactions }) {
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-[#1B2A24]/60 bg-[#050807]/40">
      <div className="border-b border-[#1B2A24]/60 px-4 py-3">
        <p className="text-sm font-bold text-white">Yüklenen İşlemler</p>
        <p className="mt-1 text-xs text-[#8A968F]">Backend tarafından eklenen ve kategorilendirilen kayıtlar.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-xs">
          <thead className="bg-[#07100D] uppercase tracking-wider text-[#8A968F]">
            <tr>
              <th className="px-3 py-2.5">Tarih</th>
              <th className="px-3 py-2.5">Açıklama</th>
              <th className="px-3 py-2.5">Tutar</th>
              <th className="px-3 py-2.5">Tip</th>
              <th className="px-3 py-2.5">Kategori</th>
              <th className="px-3 py-2.5">Alt Kategori</th>
              <th className="px-3 py-2.5">Kaynak</th>
              <th className="px-3 py-2.5">Not</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((item) => (
              <tr key={item.id || `${item.date}-${item.description}-${item.amount}`} className="border-t border-[#1B2A24]/60 text-[#B7C2BC]">
                <td className="px-3 py-2.5">{formatDate(item.date)}</td>
                <td className="px-3 py-2.5 font-bold text-white">{item.description}</td>
                <td className={`px-3 py-2.5 font-bold ${item.type === 'income' ? 'text-[#00FF66]' : 'text-red-400'}`}>{formatCurrency(item.amount)}</td>
                <td className="px-3 py-2.5">{item.type}</td>
                <td className="px-3 py-2.5">{item.category || '-'}</td>
                <td className="px-3 py-2.5">{item.sub_category || '-'}</td>
                <td className="px-3 py-2.5">{item.source || '-'}</td>
                <td className="px-3 py-2.5">{item.note || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Badge({ children }) {
  return <span className="rounded-lg border border-[#00FF66]/20 bg-[#00FF66]/8 px-2.5 py-1 text-xs font-bold text-[#00FF66]">{children}</span>
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
