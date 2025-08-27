import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, Wine } from 'lucide-react'

interface PublicRouteProps {
  children: React.ReactNode
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()

  // Si está cargando por más de 5 segundos, mostrar un mensaje de advertencia
  const [showWarning, setShowWarning] = React.useState(false)
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setShowWarning(true)
      }
    }, 5000) // 5 segundos
    
    return () => clearTimeout(timer)
  }, [loading])

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
          {showWarning && (
            <div className="mt-4 text-sm text-amber-600 max-w-md">
              <p>Si esta pantalla tarda mucho en cargar, puede intentar limpiar el almacenamiento local del navegador.</p>
              <button 
                onClick={() => {
                  localStorage.clear()
                  sessionStorage.clear()
                  window.location.reload()
                }}
                className="mt-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
              >
                Limpiar almacenamiento y recargar
              </button>
            </div>
          )}
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
