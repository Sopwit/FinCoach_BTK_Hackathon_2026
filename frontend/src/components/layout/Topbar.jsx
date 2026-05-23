import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Circle,
  Loader2,
  Menu,
  RotateCcw,
  Trash2,
  User,
  XCircle,
} from 'lucide-react'
import { clearStudentDemoData, loadStudentDemoData } from '../../services/client'
import { useDemo } from '../../hooks/useDemo'

const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

function generateMonthOptions() {
  const now = new Date()
  const options = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
    options.push({ value, label })
  }
  return options
}

export default function Topbar({ onMenuToggle }) {
  const [loadingDemo, setLoadingDemo] = useState(false)
  const [clearingDemo, setClearingDemo] = useState(false)
  const [notice, setNotice] = useState(null)
  const {
    health,
    selectedMonth,
    selectedUser,
    selectedUserId,
    setSelectedMonth,
    setSelectedUserId,
    users,
    refreshUsers,
  } = useDemo()

  const handleLoadDemoData = async () => {
    setLoadingDemo(true)
    setNotice(null)
    const activeUserId = selectedUserId

    try {
      const response = await loadStudentDemoData({
        user_id: activeUserId,
        preserve_session: true,
      })
      setSelectedUserId(activeUserId)
      const alreadyLoaded = response.data.transactions_count === 0
      setNotice({
        type: alreadyLoaded ? 'warning' : 'success',
        title: alreadyLoaded ? 'Örnek veriler zaten yüklü' : 'Örnek veriler hazır',
        message: alreadyLoaded
          ? 'Mevcut örnek verileri temizleyip yeniden yükleyebilirsin.'
          : `${response.data.transactions_count} işlem içeren örnek veri yüklendi.`,
        canReload: alreadyLoaded,
      })
      if (!alreadyLoaded) {
        window.setTimeout(() => window.location.reload(), 1000)
      }
    } catch (error) {
      const alreadyLoaded = error.message.includes('already been loaded')
      setNotice({
        type: alreadyLoaded ? 'warning' : 'error',
        title: alreadyLoaded ? 'Örnek veriler zaten yüklü' : 'Örnek veriler yüklenemedi',
        message: alreadyLoaded
          ? 'Mevcut örnek verileri temizleyip yeniden yükleyebilirsin.'
          : error.message,
        canReload: alreadyLoaded,
      })
    } finally {
      setLoadingDemo(false)
    }
  }

  const handleClearDemoData = async ({ reload = false } = {}) => {
    setClearingDemo(true)
    setNotice(null)
    try {
      await clearStudentDemoData({
        user_id: selectedUserId,
        preserve_session: true,
      })
      setSelectedUserId(selectedUserId)
      setNotice({
        type: 'success',
        title: 'Örnek veriler temizlendi',
        message: reload ? 'Yeni örnek veriler yükleniyor...' : 'Seçili kullanıcı için örnek kayıtlar kaldırıldı.',
      })
      if (reload) {
        await handleLoadDemoData()
      } else {
        window.setTimeout(() => window.location.reload(), 800)
      }
    } catch (error) {
      setNotice({ type: 'error', title: 'Örnek veriler temizlenemedi', message: error.message })
    } finally {
      setClearingDemo(false)
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#1B2A24]/80 bg-[#030706]/70 px-4 py-3.5 backdrop-blur-2xl sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={onMenuToggle}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1B2A24] text-[#8A968F] hover:text-white hover:border-[#00FF66]/30 transition-all lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1B2A24] to-[#0B1110] border border-[#1B2A24]">
              <User size={18} className="text-[#00FF66]" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white leading-tight">{selectedUser?.name || 'Kullanıcı'}</p>
              <p className="text-[11px] text-[#8A968F] font-medium hidden sm:block">{selectedUser?.email || `ID: ${selectedUserId}`}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-[#1B2A24] bg-[#0B1110]/60 px-3 py-2 text-xs font-bold text-[#B7C2BC] md:flex">
            <Circle size={9} className={health.status === 'online' ? 'fill-[#00FF66] text-[#00FF66]' : 'fill-red-400 text-red-400'} />
            Bağlantı
          </div>

          <select
            value={selectedUserId}
            onChange={(event) => {
              setSelectedUserId(event.target.value)
              refreshUsers()
            }}
            className="rounded-xl border border-[#1B2A24] bg-[#0B1110]/60 px-3 py-2 text-xs font-semibold text-[#B7C2BC] backdrop-blur-lg focus:border-[#00FF66]/50 focus:outline-none transition-all cursor-pointer"
          >
            {users.length === 0 ? (
              <option value={selectedUserId}>Kullanıcı {selectedUserId}</option>
            ) : users.map((item) => (
              <option key={item.id} value={item.id}>{item.name} #{item.id}</option>
            ))}
          </select>

          <div className="relative">
            <CalendarDays size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#00FF66] pointer-events-none" />
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="appearance-none rounded-xl border border-[#1B2A24] bg-[#0B1110]/60 pl-9 sm:pl-11 pr-8 sm:pr-10 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-[#B7C2BC] backdrop-blur-lg focus:border-[#00FF66]/50 focus:outline-none transition-all cursor-pointer"
            >
              {generateMonthOptions().map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8A968F]">
              <ChevronDown size={15} />
            </div>
          </div>

          <button
            type="button"
            onClick={handleLoadDemoData}
            disabled={loadingDemo}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00FF66] to-[#16C784] px-3 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-[#041008] shadow-[0_4px_20px_rgba(0,255,102,0.2)] transition-all duration-300 hover:shadow-[0_4px_30px_rgba(0,255,102,0.35)] hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loadingDemo ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span className="hidden sm:inline">Yükleniyor</span>
              </>
            ) : (
              <>
                <RotateCcw size={16} />
                <span className="hidden sm:inline">Örnek Verileri Yükle</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleClearDemoData()}
            disabled={loadingDemo || clearingDemo}
            className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-red-300 transition-all duration-300 hover:border-red-400/50 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {clearingDemo ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            <span className="hidden xl:inline">Örnek Verileri Temizle</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            className={[
              'absolute right-4 sm:right-6 top-[calc(100%+12px)] z-50 w-[300px] sm:w-[360px] overflow-hidden rounded-2xl bg-[#0B1110]/95 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl',
              notice.type === 'error' ? 'border border-red-500/30' : notice.type === 'warning' ? 'border border-yellow-500/30' : 'border border-[#00FF66]/30',
            ].join(' ')}
          >
            <div className={[
              'h-1 w-full',
              notice.type === 'error' ? 'bg-red-400' : notice.type === 'warning' ? 'bg-yellow-400' : 'bg-gradient-to-r from-[#00FF66] to-[#16C784]',
            ].join(' ')} />
            <div className="p-4">
              <div className="flex items-start gap-3">
                {notice.type === 'error' ? (
                  <XCircle size={20} className="mt-0.5 shrink-0 text-red-400" />
                ) : (
                  <CheckCircle2 size={20} className={`mt-0.5 shrink-0 ${notice.type === 'warning' ? 'text-yellow-400' : 'text-[#00FF66]'}`} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white">{notice.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[#B7C2BC]">{notice.message}</p>
                  {notice.canReload && (
                    <button
                      type="button"
                      onClick={() => handleClearDemoData({ reload: true })}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#00FF66] px-3 py-2 text-xs font-bold text-[#041008]"
                    >
                      <RotateCcw size={14} />
                      Temizle ve yeniden yükle
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
