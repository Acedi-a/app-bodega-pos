import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, Wine } from 'lucide-react'

interface PublicRouteProps {
  children: React.ReactNode
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-600 to-red-700 rounded-full shadow-lg mb-4">
            <Wine className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center justify-center space-x-2 text-amber-700">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-lg font-medium">Cargando...</span>
          </div>
        </div>
      </div>
    )
  }

  // Si el usuario está autenticado, redirigir al dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
