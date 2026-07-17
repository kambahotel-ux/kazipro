import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { isSuperAdminEmail } from '@/lib/user-role'

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      setCheckingAdmin(false)
      return
    }

    const admin =
      user.role === 'admin' || isSuperAdminEmail(user.email)
    setIsAdmin(admin)
    setCheckingAdmin(false)
  }, [user])

  if (loading || checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/connexion" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard/client" replace />
  }

  return <>{children}</>
}
