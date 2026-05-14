import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays,
  CheckCircle2,
  DatabaseZap,
  Loader2,
  Menu,
  User,
} from 'lucide-react'
import { loadStudentDemoData, getUser } from '../../services/client'
import { DEFAULT_USER_ID } from '../../services/config'
import { useEffect } from 'react'

export default function Topbar({ onMenuToggle }) {
  const [loadingDemo, setLoadingDemo] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState({ name: 'Kullanıcı', email: '...' })

  useEffect(() => {
    getUser().then(res => setUser(res.data))
  }, [])

  const handleLoadDemoData = async () => {
    setLoadingDemo(true)
    setMessage('')

    const response = await loadStudentDemoData({
      user_id: DEFAULT_USER_ID,
    })

    setMessage(
      `${response.data.transactions_count} işlem içeren demo verisi yüklendi. Yönlendiriliyorsunuz...`,
    )

    setLoadingDemo(false)

    setTimeout(() => {
      setMessage('')
      window.location.reload()
    }, 1500)
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
              <p className="text-[13px] font-bold text-white leading-tight">{user.name}</p>
              <p className="text-[11px] text-[#8A968F] font-medium hidden sm:block">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <CalendarDays size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#00FF66] pointer-events-none" />
            <select className="appearance-none rounded-xl border border-[#1B2A24] bg-[#0B1110]/60 pl-9 sm:pl-11 pr-8 sm:pr-10 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-[#B7C2BC] backdrop-blur-lg focus:border-[#00FF66]/50 focus:outline-none transition-all cursor-pointer">
              <option value="2026-05">Mayıs 2026</option>
              <option value="2026-04">Nisan 2026</option>
              <option value="2026-03">Mart 2026</option>
            </select>
            <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8A968F]">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
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
                <DatabaseZap size={16} />
                <span className="hidden sm:inline">Örnek Veriyi Yükle</span>
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            className="absolute right-4 sm:right-6 top-[calc(100%+12px)] z-50 w-[300px] sm:w-[340px] overflow-hidden rounded-2xl border border-[#00FF66]/30 bg-[#0B1110]/95 shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_40px_rgba(0,255,102,0.1)] backdrop-blur-2xl"
          >
            <div className="h-1 w-full bg-gradient-to-r from-[#00FF66] to-[#16C784]" />
            <div className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-[#00FF66]" />
                <div>
                  <p className="font-bold text-white">Demo verisi hazır</p>
                  <p className="mt-1 text-sm leading-6 text-[#B7C2BC]">{message}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}