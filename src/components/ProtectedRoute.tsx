import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, Wine } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { user, role, loading } = useAuth()

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

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRoles.length > 0 && role && !requiredRoles.includes(role.clave)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-full shadow-lg mb-4">
            <Wine className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">No tiene permisos para acceder a esta sección</p>
          <button 
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-red-700 text-white rounded-lg font-medium hover:from-amber-700 hover:to-red-800 transition-all duration-200"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
