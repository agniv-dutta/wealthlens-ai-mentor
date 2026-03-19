import { useEffect, useState } from 'react'
import { blink } from '../blink/client'
import type { BlinkUser } from '@blinkdotnew/sdk'

export function useAuth() {
  const [user, setUser] = useState<BlinkUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const login = () => blink.auth.login()
  const logout = () => blink.auth.signOut()

  return { user, loading, login, logout, isAuthenticated: !!user }
}
