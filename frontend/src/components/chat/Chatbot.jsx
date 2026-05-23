import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertCircle, Bot, Loader2, MessageCircle, Send, X } from 'lucide-react'
import {
  getBudgetStatus,
  getBudgets,
  getDashboard,
  getHabits,
  getRecurringPayments,
  getTransactions,
  resolveUserId,
  sendChatMessage,
} from '../../services/client'
import { useDemo } from '../../hooks/useDemo'
import { buildChatContext } from '../../utils/buildChatContext'

const initialMessages = [
  {
    role: 'assistant',
    content: 'Merhaba. Bu ekrandaki finansal verilerine göre harcama, bütçe, alışkanlık ve tekrar eden ödemeleri yorumlayabilirim.',
  },
]

export default function Chatbot() {
  const location = useLocation()
  const { selectedMonth, selectedUser, selectedUserId, setSelectedUserId } = useDemo()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState(initialMessages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading])

  const fetchContext = async (userId) => {
    const params = { user_id: userId, month: selectedMonth }
    const [dashboardRes, transactionsRes, habitsRes, recurringRes, rawBudgetsRes, budgetStatusRes] = await Promise.all([
      getDashboard({ ...params, include_ai: false }),
      getTransactions(params),
      getHabits(params),
      getRecurringPayments(params),
      getBudgets({ user_id: userId }),
      getBudgetStatus(params),
    ])

    return buildChatContext({
      dashboard: dashboardRes.data,
      transactions: transactionsRes.data,
      habits: habitsRes.data,
      recurringPayments: recurringRes.data,
      budgets: {
        raw: rawBudgetsRes.data,
        status: budgetStatusRes.data,
      },
      selectedMonth,
      selectedUser: selectedUser || { id: userId },
      currentPage: location.pathname,
    })
  }

  const collectContext = async () => {
    try {
      return await fetchContext(selectedUserId)
    } catch (err) {
      const message = err?.message || ''
      if (!message.includes('Kullanıcı bulunamadı')) {
        throw err
      }

      const resolvedUserId = await resolveUserId(selectedUserId)
      if (resolvedUserId && resolvedUserId !== selectedUserId) {
        setSelectedUserId(resolvedUserId)
      }

      return fetchContext(resolvedUserId || selectedUserId)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSend) return

    const userMessage = input.trim()
    setInput('')
    setError('')
    setLoading(true)
    setMessages((items) => [...items, { role: 'user', content: userMessage }])

    try {
      const contextPayload = await collectContext()
      const response = await sendChatMessage({
        ...contextPayload,
        message: userMessage,
        user_id: selectedUserId,
        current_page: location.pathname,
      })

      setMessages((items) => [
        ...items,
        {
          role: 'assistant',
          content: response.data.answer,
        },
      ])
    } catch (err) {
      setError(err.message || 'Yanıt hazırlanamadı.')
      setMessages((items) => [
        ...items,
        {
          role: 'assistant',
          content: 'Şu anda yanıt hazırlayamıyorum. Lütfen biraz sonra tekrar dene.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open && (
        <section className="mb-4 flex h-[520px] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-[#1B2A24] bg-[#07100D]/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-[#1B2A24]/70 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00FF66]/10 text-[#00FF66]">
                <Bot size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-white">FinCoach Chat</p>
                <p className="text-xs text-[#8A968F]">{selectedMonth} • {selectedUser?.name || `Kullanıcı ${selectedUserId}`}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1B2A24] text-[#8A968F] transition hover:text-white"
            >
              <X size={17} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <ChatMessage key={`${message.role}-${index}`} message={message} />
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-[#8A968F]">
                <Loader2 size={16} className="animate-spin text-[#00FF66]" />
                Finansal veriler inceleniyor...
              </div>
            )}
          </div>

          {error && (
            <div className="mx-4 mb-3 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs leading-5 text-red-200">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="border-t border-[#1B2A24]/70 p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="input min-w-0 flex-1 py-3 text-sm"
                placeholder="Örn: Bu ay bütçemi en çok ne zorluyor?"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00FF66] text-[#041008] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00FF66] to-[#16C784] text-[#041008] shadow-[0_18px_50px_rgba(0,255,102,0.25)] transition hover:-translate-y-0.5"
      >
        {open ? <X size={22} /> : <MessageCircle size={24} />}
      </button>
    </div>
  )
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={[
        'max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6',
        isUser ? 'bg-[#00FF66] text-[#041008]' : 'border border-[#1B2A24]/70 bg-[#050807]/80 text-[#DDE5E0]',
      ].join(' ')}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  )
}
