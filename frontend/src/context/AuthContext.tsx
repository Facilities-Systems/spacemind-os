import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { UserOut, LoginCredentials, RegisterPayload, Token } from '../types'

const TOKEN_KEY = 'sm_access_token'
const USER_KEY  = 'sm_user'

interface AuthContextValue {
  token: string | null
  user:  UserOut | null
  isAuthenticated: boolean
  login:    (creds: LoginCredentials) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout:   () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

function loadUser(): UserOut | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as UserOut) : null
  } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(loadToken)
  const [user,  setUser]  = useState<UserOut | null>(loadUser)

  const persist = (t: Token) => {
    localStorage.setItem(TOKEN_KEY, t.access_token)
    localStorage.setItem(USER_KEY,  JSON.stringify(t.user))
    setToken(t.access_token)
    setUser(t.user)
  }

  const login = useCallback(async (creds: LoginCredentials) => {
    const form = new URLSearchParams()
    form.append('username', creds.username)
    form.append('password', creds.password)

    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail ?? 'Login failed')
    }
    persist(await res.json() as Token)
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail ?? 'Registration failed')
    }
    // Auto-login after registration
    await login({ username: payload.email, password: payload.password })
  }, [login])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
