import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { ApiError, authApi } from '@/lib/api'
import { clearStoredUser, getStoredUser, setStoredUser } from '@/lib/auth-session'
import { clearAuthToken, getAuthToken, setAuthToken } from '@/lib/auth-token'
import { clearCachedUserRole, cacheUserRole, resolveUserRole } from '@/lib/user-role'
import type { AppUser } from '@/types/auth'

interface AuthContextType {
  user: AppUser | null
  token: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<AppUser>
  signOut: () => Promise<void>
  signUp: typeof authApi.register
  refreshUser: () => Promise<AppUser | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function isAuthError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403)
}

async function fetchMeWithRetry(maxAttempts = 3): Promise<AppUser> {
  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await authApi.getMe()
    } catch (error) {
      lastError = error
      if (isAuthError(error)) throw error
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)))
      }
    }
  }
  throw lastError
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    if (!getAuthToken()) return null
    return getStoredUser()
  })
  const [token, setTokenState] = useState<string | null>(() => getAuthToken())
  const [loading, setLoading] = useState(true)

  const persistSession = useCallback(async (appUser: AppUser, authToken: string) => {
    setAuthToken(authToken)
    setStoredUser(appUser)
    setUser(appUser)
    setTokenState(authToken)
    const role = await resolveUserRole(appUser)
    if (role) cacheUserRole(String(appUser.id), role)
  }, [])

  const clearSession = useCallback(() => {
    clearAuthToken()
    clearStoredUser()
    clearCachedUserRole()
    setUser(null)
    setTokenState(null)
  }, [])

  const refreshUser = useCallback(async (): Promise<AppUser | null> => {
    const storedToken = getAuthToken()
    if (!storedToken) {
      clearSession()
      return null
    }

    // Restaurer immédiatement la session en cache pendant la validation API
    const cachedUser = getStoredUser()
    if (cachedUser) {
      setUser(cachedUser)
      setTokenState(storedToken)
    }

    try {
      const me = await fetchMeWithRetry()
      setStoredUser(me)
      setUser(me)
      setTokenState(storedToken)
      const role = await resolveUserRole(me)
      if (role) cacheUserRole(String(me.id), role)
      return me
    } catch (error: unknown) {
      if (isAuthError(error)) {
        clearSession()
        return null
      }
      // Erreur réseau / serveur : conserver le token et l'utilisateur en cache
      if (cachedUser) {
        setUser(cachedUser)
        setTokenState(storedToken)
        return cachedUser
      }
      return null
    }
  }, [clearSession])

  useEffect(() => {
    let cancelled = false
    const timeoutMs = 12_000

    const timeout = window.setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, timeoutMs)

    refreshUser()
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false)
        window.clearTimeout(timeout)
      })

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [refreshUser])

  const signIn = async (email: string, password: string): Promise<AppUser> => {
    const response = await authApi.login(email, password)
    const newToken = response.token as string | undefined

    if (!newToken) {
      throw new Error('Token de connexion manquant')
    }

    let appUser = response.user as AppUser | undefined
    if (!appUser) {
      appUser = await authApi.getMe()
    }
    await persistSession(appUser, newToken)
    return appUser
  }

  const signOut = async () => {
    try {
      if (getAuthToken()) {
        await authApi.logout()
      }
    } catch {
      // Déconnexion locale même si l'API échoue
    } finally {
      clearSession()
    }
  }

  const signUp = authApi.register

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut, signUp, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
