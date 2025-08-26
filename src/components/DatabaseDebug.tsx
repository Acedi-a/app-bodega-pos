import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { AlertCircle, CheckCircle, Database } from 'lucide-react'

export const DatabaseDebug: React.FC = () => {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    const testResults: any[] = []

    try {
      // Test 1: Verificar conexión a Supabase
      testResults.push({ name: 'Conexión Supabase', status: 'success', message: 'Conectado correctamente' })

      // Test 2: Verificar tabla roles
      try {
        const { data: roles, error } = await supabase.from('roles').select('*').limit(5)
        if (error) throw error
        testResults.push({ 
          name: 'Tabla roles', 
          status: 'success', 
          message: `${roles?.length || 0} roles encontrados`,
          data: roles 
        })
      } catch (error: any) {
        testResults.push({ 
          name: 'Tabla roles', 
          status: 'error', 
          message: error.message 
        })
      }

      // Test 3: Verificar usuario actual
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          testResults.push({ 
            name: 'Usuario autenticado', 
            status: 'success', 
            message: `Usuario: ${user.email}`,
            data: { id: user.id, email: user.email }
          })

          // Test 4: Verificar perfil en tabla usuarios
          try {
            const { data: profile, error } = await supabase
              .from('usuarios')
              .select('*, roles(*)')
              .eq('id', user.id)
              .maybeSingle()

            if (error) throw error

            if (profile) {
              testResults.push({ 
                name: 'Perfil usuario', 
                status: 'success', 
                message: `Perfil encontrado: ${profile.nombre}`,
                data: profile 
              })
            } else {
              testResults.push({ 
                name: 'Perfil usuario', 
                status: 'warning', 
                message: 'Perfil no encontrado - se creará automáticamente' 
              })
            }
          } catch (error: any) {
            testResults.push({ 
              name: 'Perfil usuario', 
              status: 'error', 
              message: error.message 
            })
          }
        } else {
          testResults.push({ 
            name: 'Usuario autenticado', 
            status: 'warning', 
            message: 'No hay usuario autenticado' 
          })
        }
      } catch (error: any) {
        testResults.push({ 
          name: 'Usuario autenticado', 
          status: 'error', 
          message: error.message 
        })
      }

    } catch (error: any) {
      testResults.push({ 
        name: 'Conexión Supabase', 
        status: 'error', 
        message: error.message 
      })
    }

    setResults(testResults)
    setLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Database className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Database Debug</h2>
          <button
            onClick={runTests}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Ejecutando...' : 'Ejecutar Tests'}
          </button>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
            >
              <div className="flex items-center space-x-3 mb-2">
                {getStatusIcon(result.status)}
                <h3 className="font-semibold text-gray-900">{result.name}</h3>
              </div>
              <p className="text-gray-700 mb-2">{result.message}</p>
              {result.data && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                    Ver datos
                  </summary>
                  <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
