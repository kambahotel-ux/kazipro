import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { session, loading, user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setCheckingAdmin(false)
        return
      }

      try {
        // Check if user is admin by email
        const adminEmails = ['admin@kazipro.com']
        
        if (adminEmails.includes(user.email || '')) {
          setIsAdmin(true)
        } else {
          // Optionally check in database for admin role
          const { data: clientData } = await supabase
            .from('clients')
            .select('role')
            .eq('email', user.email)
            .single()

          if (clientData?.role === 'admin') {
            setIsAdmin(true)
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
      } finally {
        setCheckingAdmin(false)
      }
    }

    checkAdminStatus()
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

  if (!session) {
    return <Navigate to="/connexion" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard/client" replace />
  }

  return <>{children}</>
}
