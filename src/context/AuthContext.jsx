import { createContext, useContext, useEffect, useState } from 'react'
import { subscribeToAuthChanges, login as authLogin, register as authRegister, signOut as authSignOut } from '../firebase/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  async function login(email, password) {
    return authLogin(email, password)
  }

  async function register(email, password) {
    return authRegister(email, password)
  }

  async function signOut() {
    return authSignOut()
  }

  const value = { user, loading, login, register, signOut }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
