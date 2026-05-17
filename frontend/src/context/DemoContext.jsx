import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_MONTH, DEFAULT_USER_ID } from '../services/config'
import { getHealth, getUser, getUsers } from '../services/client'
import { DemoContext } from './DemoContextValue'

const SESSION_KEY = 'fincoach_session'

export function DemoProvider({ children }) {
  const [selectedMonth, setSelectedMonth] = useState(DEFAULT_MONTH)
  const [selectedUserId, setSelectedUserIdState] = useState(() => {
    const stored = localStorage.getItem(SESSION_KEY)
    return stored ? Number(stored) : DEFAULT_USER_ID
  })
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [health, setHealth] = useState({ status: 'unknown', message: '' })

  const setSelectedUserId = (userId) => {
    const nextUserId = Number(userId)
    localStorage.setItem(SESSION_KEY, String(nextUserId))
    setSelectedUserIdState(nextUserId)
  }

  const refreshUsers = async () => {
    try {
      const response = await getUsers()
      setUsers(response.data || [])
    } catch {
      setUsers([])
    }
  }

  useEffect(() => {
    Promise.resolve().then(refreshUsers)
    getHealth()
      .then(() => setHealth({ status: 'online', message: 'Bağlantı hazır' }))
      .catch((error) => setHealth({ status: 'offline', message: error.message }))
  }, [])

  useEffect(() => {
    getUser(selectedUserId)
      .then((response) => setSelectedUser(response.data))
      .catch(() => setSelectedUser(null))
  }, [selectedUserId])

  const value = useMemo(() => ({
    selectedMonth,
    selectedUser,
    selectedUserId,
    users,
    health,
    setSelectedMonth,
    setSelectedUserId,
    refreshUsers,
  }), [selectedMonth, selectedUser, selectedUserId, users, health])

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}
