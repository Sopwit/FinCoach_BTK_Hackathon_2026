import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Banknote,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  Repeat,
  ShieldCheck,
  TrendingUp,
  UserRound,
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
  const [demoError, setDemoError] = useState('')

  const handleDemoStart = async () => {
    setLoadingDemo(true)
    setDemoMessage('')
    setDemoError('')

    try {
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
    } catch (error) {
      setDemoError(error.message || 'Örnek profil hazırlanamadı.')
    } finally {
      setLoadingDemo(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030706] text-[#F4F7F5]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(0,255,102,0.12),transparent_32%),linear-gradient(315deg,rgba(22,199,132,0.08),transparent_36%)]" />
      <div className="pointer-events-none absolute inset-0 soft-grid opacity-60" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 px-6 py-10 lg:grid-cols-2 lg:items-center lg:gap-20 lg:px-12">
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
            AI destekli finans koçu
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-4 sm:gap-5"
          >
            <img
              src="/fincoach-logo.png"
              alt="FinCoach"
              className="h-16 w-16 shrink-0 rounded-[1.4rem] border border-[#00FF66]/25 object-cover shadow-[0_0_28px_rgba(0,255,102,0.25)] md:h-20 md:w-20 md:rounded-[1.7rem]"
            />
            <h1 className="max-w-2xl text-6xl font-black leading-[1.1] tracking-tight text-white md:text-8xl">
              Fin
              <span className="text-[#00FF66] drop-shadow-[0_0_20px_rgba(0,255,102,0.4)]">Coach</span>
            </h1>
          </motion.div>

          <motion.p
            {...fadeUp}
            transition={{ delay: 0.2 }}
            className="mt-7 max-w-xl text-lg font-medium leading-8 text-[#B7C2BC]"
          >
            Gelir ve giderlerini analiz et, harcama alışkanlıklarını gör ve AI destekli
            önerilerle bütçeni daha bilinçli yönet.
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
              text="Kişisel ve uygulanabilir aksiyonlar."
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
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp size={14} className="text-[#00FF66]" />
                <p className="text-sm font-bold text-[#00FF66]">Örnek senaryo</p>
              </div>
              <p className="text-sm leading-6 text-[#8A968F]">
                Öğrenci gelir-giderleri, abonelikler, önceki ay karşılaştırması ve tasarruf
                önerileri tek panelde gösterilir.
              </p>
            </div>
          </motion.div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 overflow-hidden rounded-[2rem] border border-[#1B2A24] bg-[#0B1110]/80 shadow-[0_0_100px_rgba(0,255,102,0.06)] backdrop-blur-2xl lg:mt-0"
        >
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
                Kendi hesabınla devam et veya sunum için hazır örnek finans profiline geç.
              </p>
            </div>

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

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#1B2A24] to-transparent" />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#66726B]">
                veya
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#1B2A24] to-transparent" />
            </div>

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

            {(demoMessage || demoError) && (
              <Notice
                type={demoError ? 'error' : 'success'}
                title={demoError ? 'Örnek profil açılamadı' : 'Örnek profil hazır'}
                message={demoError || demoMessage}
              />
            )}

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
  const [password, setPassword] = useState('12345')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('E-posta ve şifre alanları boş bırakılamaz.')
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
      <InputField
        icon={Mail}
        label="E-posta"
        type="email"
        placeholder="ornek@gmail.com"
        value={email}
        onChange={setEmail}
        autoComplete="email"
      />
      <InputField
        icon={KeyRound}
        label="Şifre"
        type="password"
        placeholder="Şifreni gir"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
      />
      {error && <Alert message={error} />}
      <SubmitButton loading={loading} loadingText="Giriş yapılıyor..." text="Giriş Yap" />
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

    if (password.trim().length < 3) {
      setError('Şifre en az 3 karakter olmalıdır.')
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
      <InputField icon={UserRound} label="Ad Soyad" placeholder="Adını yaz" value={name} onChange={setName} autoComplete="name" />
      <InputField icon={Mail} label="E-posta" type="email" placeholder="ornek@gmail.com" value={email} onChange={setEmail} autoComplete="email" />
      <InputField icon={KeyRound} label="Şifre" type="password" placeholder="Şifre" value={password} onChange={setPassword} autoComplete="new-password" />
      <InputField icon={Banknote} label="Aylık Gelir" type="number" placeholder="5000" value={income} onChange={setIncome} inputMode="decimal" />
      {error && <Alert message={error} />}
      {success && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-[#00FF66]/20 bg-[#00FF66]/10 px-4 py-2.5 text-xs font-semibold text-[#00FF66]">
          Hesap oluşturuldu. Yönlendiriliyorsun...
        </motion.p>
      )}
      <SubmitButton loading={loading} loadingText="Oluşturuluyor..." text="Hesap Oluştur" />
    </form>
  )
}

function InputField({ icon: Icon, label, value, onChange, ...props }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#66726B]">{label}</span>
      <span className="relative">
        <Icon size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#00FF66]" />
        <input
          className="input pl-11"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          {...props}
        />
      </span>
    </label>
  )
}

function SubmitButton({ loading, loadingText, text }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="rounded-2xl border border-[#1B2A24] px-5 py-3.5 text-sm font-bold text-[#B7C2BC] transition-all duration-300 hover:border-[#00FF66]/50 hover:bg-[#00FF66]/5 hover:text-white hover:shadow-[0_0_20px_rgba(0,255,102,0.08)] disabled:opacity-60"
    >
      {loading ? loadingText : text}
    </button>
  )
}

function Alert({ message }) {
  return (
    <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-400">
      {message}
    </p>
  )
}

function Notice({ type, title, message }) {
  const isError = type === 'error'

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={[
        'mt-5 overflow-hidden rounded-2xl border',
        isError ? 'border-red-500/30 bg-red-500/5' : 'border-[#00FF66]/30 bg-[#00FF66]/5',
      ].join(' ')}
    >
      <div className={isError ? 'h-0.5 w-full bg-red-400' : 'h-0.5 w-full bg-gradient-to-r from-[#00FF66] to-[#16C784]'} />
      <div className="flex items-start gap-3 p-4">
        <CheckCircle2 size={20} className={isError ? 'mt-0.5 shrink-0 text-red-400' : 'mt-0.5 shrink-0 text-[#00FF66]'} />
        <div>
          <p className="font-bold text-white">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[#B7C2BC]">{message}</p>
        </div>
      </div>
    </motion.div>
  )
}

function FeatureCard({ icon: Icon, title, text, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ease: [0.22, 1, 0.36, 1] }}
      className="group overflow-hidden rounded-2xl border border-[#1B2A24] bg-[#0B1110]/70 p-5 backdrop-blur-lg transition-all duration-300 hover:-translate-y-1.5 hover:border-[#00FF66]/30 hover:shadow-[0_8px_30px_rgba(0,255,102,0.08)]"
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
        <p className="text-lg font-black leading-tight text-[#00FF66]">{value}</p>
        <p className="text-xs text-[#8A968F]">{label}</p>
      </div>
    </div>
  )
}
