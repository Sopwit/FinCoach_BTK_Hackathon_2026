import { BarChart3, LayoutDashboard, LogOut, PiggyBank, Sparkles, WalletCards, X } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Harcama Yönetimi', path: '/transactions', icon: WalletCards },
  { label: 'Bütçeler', path: '/budgets', icon: PiggyBank },
  { label: 'İçgörüler', path: '/insights', icon: BarChart3 },
]

export default function Sidebar({ mobile = false, onClose }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    if (onClose) onClose()
    navigate('/login')
  }

  const handleNavClick = () => {
    if (onClose) onClose()
  }

  return (
    <aside
      className={[
        'flex w-[280px] flex-shrink-0 flex-col border-r border-[#1B2A24] bg-black/40 backdrop-blur-2xl px-6 py-8 relative z-20',
        mobile ? 'h-full' : 'hidden lg:flex',
      ].join(' ')}
    >
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#00FF66]/5 to-transparent pointer-events-none" />

      <div className="mb-12 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00FF66] to-[#16C784] text-[#041008] shadow-[0_0_20px_rgba(0,255,102,0.3)]">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="text-[26px] font-black tracking-tight text-white leading-none">
                Fin<span className="text-[#00FF66] drop-shadow-[0_0_8px_rgba(0,255,102,0.5)]">Coach</span>
              </div>
              <p className="text-xs font-semibold text-[#8A968F] tracking-wide uppercase mt-1">
                AI Finance
              </p>
            </div>
          </div>

          {mobile && (
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1B2A24] text-[#8A968F] hover:text-white hover:border-[#00FF66]/30 transition-all"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <p className="mt-6 text-[13px] leading-relaxed text-[#8A968F] font-medium border-l-2 border-[#1B2A24] pl-3">
          Harcamalarını analiz et, bütçeni akıllıca yönet.
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-300 relative overflow-hidden',
                  isActive
                    ? 'bg-gradient-to-r from-[#00FF66]/10 to-transparent text-[#00FF66] border border-[#00FF66]/20'
                    : 'text-[#8A968F] hover:bg-white/5 hover:text-white border border-transparent',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00FF66] rounded-r-full shadow-[0_0_10px_#00FF66]" />
                  )}
                  <Icon size={20} className={isActive ? 'text-[#00FF66]' : 'text-[#8A968F] group-hover:text-white transition-colors'} />
                  {item.label}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-auto relative overflow-hidden rounded-3xl border border-[#1B2A24] bg-gradient-to-br from-[#0B1110] to-[#050807] p-5 shadow-lg">
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#00FF66]/10 rounded-full blur-2xl" />
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
          <p className="text-xs font-bold uppercase tracking-widest text-[#00FF66]">MVP Aktif</p>
        </div>
        <p className="text-[13px] leading-relaxed text-[#B7C2BC]">
          Demo verisi, analiz ekranları ve bütçe yönetimi hazır.
        </p>
      </div>

      <button
        onClick={handleLogout}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-[#8A968F] border border-[#1B2A24] hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 transition-all duration-300"
      >
        <LogOut size={18} />
        Çıkış Yap
      </button>
    </aside>
  )
}
