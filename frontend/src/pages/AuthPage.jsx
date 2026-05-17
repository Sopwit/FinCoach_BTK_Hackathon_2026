import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Repeat,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  createUser,
  loginUser,
  loadStudentDemoData,
} from '../services/client'
import { DEFAULT_USER_ID } from '../services/config'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

export default function AuthPage() {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('login')
  const [loadingDemo, setLoadingDemo] = useState(false)
  const [demoMessage, setDemoMessage] = useState('')

  const handleDemoStart = async () => {
    setLoadingDemo(true)
    setDemoMessage('')

    const response = await loadStudentDemoData({
      user_id: DEFAULT_USER_ID,
    })

    setDemoMessage(
      response.data.transactions_count > 0
        ? `${response.data.transactions_count} işlem içeren örnek finans profili hazırlandı.`
        : 'Örnek finans profili zaten hazır.',
    )

    setTimeout(() => {
      navigate('/dashboard')
    }, 650)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030706] text-[#F4F7F5]">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-10 h-[500px] w-[500px] rounded-full bg-[#00FF66]/8 blur-[120px]" />
        <div className="absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-[#16C784]/6 blur-[150px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-[#00FF66]/4 blur-[120px]" />
      </div>

      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 soft-grid opacity-60" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 px-6 py-10 lg:grid-cols-2 lg:items-center lg:gap-20 lg:px-12">
        {/* Left: Branding */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-[#1B2A24] bg-[#0B1110]/80 px-5 py-2.5 text-sm font-bold text-[#00FF66] backdrop-blur-lg"
          >
            <BrainCircuit size={16} />
            AI Destekli Finans Koçu
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ delay: 0.15 }}
            className="max-w-2xl text-6xl font-black leading-[1.1] tracking-tight text-white md:text-8xl"
          >
            Fin
            <span className="text-[#00FF66] drop-shadow-[0_0_20px_rgba(0,255,102,0.4)]">Coach</span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ delay: 0.2 }}
            className="mt-7 max-w-xl text-lg leading-8 text-[#B7C2BC] font-medium"
          >
            Gelir ve giderlerini analiz eder, harcama alışkanlıklarını ortaya
            çıkarır, önceki ayla karşılaştırır ve{' '}
            <span className="text-[#00FF66] font-bold">AI destekli</span> kişisel bütçe
            önerileri sunar.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ delay: 0.25 }}
            className="mt-10 grid max-w-xl gap-4 sm:grid-cols-3"
          >
            <FeatureCard
              icon={Wallet}
              title="Harcama Analizi"
              text="Kategori bazlı gelir-gider görünümü."
              delay={0.3}
            />
            <FeatureCard
              icon={BrainCircuit}
              title="Akıllı Öneriler"
              text="Kişisel, uygulanabilir aksiyonlar."
              delay={0.35}
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Güvenli Kullanım"
              text="Banka bağlantısı olmadan çalışır."
              delay={0.4}
            />
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ delay: 0.45 }}
            className="mt-10 max-w-xl overflow-hidden rounded-2xl border border-[#1B2A24] bg-[#0B1110]/60 backdrop-blur-lg"
          >
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#00FF66]/50 to-transparent" />
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-[#00FF66]" />
                <p className="text-sm font-bold text-[#00FF66]">
                  Örnek Senaryo
                </p>
              </div>
              <p className="text-sm leading-6 text-[#8A968F]">
                Öğrenci gelir-giderleri, dışarıdan yemek artışı,
                Spotify/Netflix abonelikleri, önceki ay karşılaştırması ve kişisel
                tasarruf önerileri tek akışta gösterilir.
              </p>
            </div>
          </motion.div>
        </motion.section>

        {/* Right: Auth Card */}
        <motion.section
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 overflow-hidden rounded-[2rem] border border-[#1B2A24] bg-[#0B1110]/80 shadow-[0_0_100px_rgba(0,255,102,0.06)] backdrop-blur-2xl lg:mt-0"
        >
          {/* Gradient top stripe */}
          <div className="h-1 w-full bg-gradient-to-r from-[#00FF66] via-[#16C784] to-[#00FF66]" />

          <div className="p-7">
            <div className="mb-7">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00FF66] to-[#16C784] text-[#041008] shadow-[0_0_30px_rgba(0,255,102,0.25)]">
                <LockKeyhole size={26} />
              </div>

              <h2 className="mt-6 text-2xl font-black text-white">
                Hesabına eriş
              </h2>
              <p className="mt-2.5 text-sm leading-6 text-[#8A968F]">
                Örnek finans profiliyle hızlıca başlayabilir veya kendi kullanıcı
                bilgilerinle devam edebilirsin.
              </p>
            </div>

            {/* Tab selector */}
            <div className="mb-6 grid grid-cols-2 rounded-2xl border border-[#1B2A24] bg-[#050807] p-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={[
                  'relative rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300',
                  activeTab === 'login'
                    ? 'bg-gradient-to-r from-[#00FF66] to-[#16C784] text-[#041008] shadow-[0_4px_15px_rgba(0,255,102,0.25)]'
                    : 'text-[#8A968F] hover:text-white',
                ].join(' ')}
              >
                Giriş Yap
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={[
                  'relative rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300',
                  activeTab === 'register'
                    ? 'bg-gradient-to-r from-[#00FF66] to-[#16C784] text-[#041008] shadow-[0_4px_15px_rgba(0,255,102,0.25)]'
                    : 'text-[#8A968F] hover:text-white',
                ].join(' ')}
              >
                Hesap Oluştur
              </button>
            </div>

            {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}

            {/* Divider */}
            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#1B2A24] to-transparent" />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#66726B]">
                veya
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#1B2A24] to-transparent" />
            </div>

            {/* Sample profile button */}
            <button
              type="button"
              onClick={handleDemoStart}
              disabled={loadingDemo}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#00FF66] to-[#16C784] px-5 py-4 text-sm font-black text-[#041008] shadow-[0_4px_25px_rgba(0,255,102,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(0,255,102,0.4)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingDemo ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Örnek profil hazırlanıyor
                </>
              ) : (
                <>
                  Örnek Öğrenci Profiliyle Başla
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {demoMessage && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 overflow-hidden rounded-2xl border border-[#00FF66]/30 bg-[#00FF66]/5"
              >
                <div className="h-0.5 w-full bg-gradient-to-r from-[#00FF66] to-[#16C784]" />
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      size={20}
                      className="mt-0.5 shrink-0 text-[#00FF66]"
                    />
                    <div>
                      <p className="font-bold text-white">Örnek profil hazır</p>
                      <p className="mt-1 text-sm leading-6 text-[#B7C2BC]">
                        {demoMessage}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Mini metrics */}
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <MiniMetric icon={BarChart3} value="2 ay" label="geçmiş veri" />
              <MiniMetric icon={Repeat} value="3" label="abonelik" />
              <MiniMetric icon={BrainCircuit} value="AI" label="öneri motoru" />
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

function LoginForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('demo@gmail.com')
  const [password, setPassword] = useState('123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('E-posta ve şifre alanları boş bırakılamaz.')
      return
    }
    
    if (!email.endsWith('@gmail.com')) {
      setError('Sadece @gmail.com uzantılı hesaplar desteklenmektedir.')
      return
    }

    setError('')
    setLoading(true)

    try {
      await loginUser({ email: email.trim(), password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Giriş yapılamadı.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); handleLogin() }}>
      <input
        type="email"
        placeholder="E-posta (@gmail.com)"
        className="input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Şifre"
        className="input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && (
        <p className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded-2xl border border-[#1B2A24] px-5 py-3.5 text-sm font-bold text-[#B7C2BC] transition-all duration-300 hover:border-[#00FF66]/50 hover:text-white hover:bg-[#00FF66]/5 hover:shadow-[0_0_20px_rgba(0,255,102,0.08)] disabled:opacity-60"
      >
        {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
      </button>
    </form>
  )
}

function RegisterForm() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [income, setIncome] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !income) {
      setError('Tüm alanlar doldurulmalıdır.')
      return
    }
    
    if (!email.endsWith('@gmail.com')) {
      setError('Sadece @gmail.com uzantılı hesaplar desteklenmektedir.')
      return
    }

    const num = Number(income)
    if (Number.isNaN(num) || num <= 0) {
      setError('Geçerli bir aylık gelir giriniz.')
      return
    }
    setError('')
    setLoading(true)

    try {
      await createUser({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        monthly_income: num,
      })
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 800)
    } catch (err) {
      setError(err.message || 'Hesap oluşturulurken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); handleRegister() }}>
      <input type="text" placeholder="Ad Soyad" className="input" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="email" placeholder="E-posta (@gmail.com)" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Şifre" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
      <input type="number" placeholder="Aylık gelir: 5000" className="input" value={income} onChange={(e) => setIncome(e.target.value)} />
      {error && (
        <p className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>
      )}
      {success && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-semibold text-[#00FF66] bg-[#00FF66]/10 border border-[#00FF66]/20 rounded-xl px-4 py-2.5">
          Hesap oluşturuldu! Yönlendiriliyorsun...
        </motion.p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded-2xl border border-[#1B2A24] px-5 py-3.5 text-sm font-bold text-[#B7C2BC] transition-all duration-300 hover:border-[#00FF66]/50 hover:text-white hover:bg-[#00FF66]/5 hover:shadow-[0_0_20px_rgba(0,255,102,0.08)] disabled:opacity-60"
      >
        {loading ? 'Oluşturuluyor...' : 'Hesap Oluştur'}
      </button>
    </form>
  )
}

function FeatureCard({ icon: Icon, title, text, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ease: [0.22, 1, 0.36, 1] }}
      className="group overflow-hidden rounded-2xl border border-[#1B2A24] bg-[#0B1110]/70 p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#00FF66]/30 hover:shadow-[0_8px_30px_rgba(0,255,102,0.08)] backdrop-blur-lg"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00FF66]/10 text-[#00FF66] transition-all duration-300 group-hover:bg-[#00FF66]/20 group-hover:shadow-[0_0_15px_rgba(0,255,102,0.15)]">
        <Icon size={20} />
      </div>
      <h3 className="mt-4 text-sm font-bold text-white">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-[#8A968F]">{text}</p>
    </motion.div>
  )
}

function MiniMetric({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#1B2A24] bg-[#050807]/80 p-4 transition-all duration-300 hover:border-[#1B2A24] hover:bg-[#07100D]">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00FF66]/10 text-[#00FF66]">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-lg font-black text-[#00FF66] leading-tight">{value}</p>
        <p className="text-xs text-[#8A968F]">{label}</p>
      </div>
    </div>
  )
}
