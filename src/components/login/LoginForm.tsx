import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wine, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { signIn, loading, user } = useAuth()
  const navigate = useNavigate()

  // Redirigir si el usuario ya está autenticado
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Por favor complete todos los campos')
      return
    }

    const { error } = await signIn(email, password)
    if (error) {
      console.error('Error de login:', error)
      if (error.message.includes('Invalid login credentials')) {
        setError('Credenciales incorrectas. Verifique su email y contraseña.')
      } else if (error.message.includes('PGRST116')) {
        setError('Usuario no encontrado en el sistema. Contacte al administrador.')
      } else {
        setError(error.message || 'Error al iniciar sesión. Intente nuevamente.')
      }
    } else {
      console.log('Inicio de sesión exitoso:', email)
      // Redirigir al dashboard después del login exitoso
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='0.05'%3E%3Cpath d='M30 30c0-16.5685 13.4315-30 30-30v30H30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-600 to-red-700 rounded-full shadow-lg mb-4">
            <Wine className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bodega Premium</h1>
          <p className="text-gray-600">Gestión integral de vinos de calidad</p>
        </div>

        {/* Formulario */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 bg-white/50 placeholder-gray-400"
                placeholder="ejemplo@bodega.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 bg-white/50 placeholder-gray-400 pr-12"
                  placeholder="Ingrese su contraseña"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-600 to-red-700 text-white py-3 px-4 rounded-lg font-medium hover:from-amber-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Sistema de gestión para bodegas de vinos premium
            </p>
          </div>
        </div>

        {/* Decoración inferior */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-amber-300"></div>
            <Wine className="w-4 h-4" />
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-amber-300"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
