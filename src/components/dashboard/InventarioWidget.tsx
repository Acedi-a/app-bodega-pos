import { useState, useEffect } from 'react'
import { Package, TrendingUp, TrendingDown, AlertTriangle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { inventarioService } from '../../services/InventarioService'
import type { InventarioStats } from '../../types/inventario'

export default function InventarioWidget() {
  const [stats, setStats] = useState<InventarioStats>({
    total_movimientos: 0,
    movimientos_entrada: 0,
    movimientos_salida: 0,
    productos_afectados: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      // Obtener estadísticas de los últimos 7 días
      const fechaDesde = new Date()
      fechaDesde.setDate(fechaDesde.getDate() - 7)
      
      const response = await inventarioService.getMovimientos(1, 1, {
        fecha_desde: fechaDesde.toISOString().split('T')[0]
      })
      
      setStats(response.stats)
    } catch (error) {
      console.error('Error cargando estadísticas de inventario:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  const totalMovimientos = stats.total_movimientos
  const balanceMovimientos = stats.movimientos_entrada - stats.movimientos_salida

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Inventario</h3>
            <p className="text-sm text-gray-500">Últimos 7 días</p>
          </div>
        </div>
        <Link 
          to="/inventario"
          className="text-purple-600 hover:text-purple-700 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="space-y-4">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{totalMovimientos}</p>
            <p className="text-xs text-gray-500">Movimientos totales</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{stats.productos_afectados}</p>
            <p className="text-xs text-gray-500">Productos afectados</p>
          </div>
        </div>

        {/* Balance de movimientos */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-red-50 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              +{stats.movimientos_entrada}
            </span>
          </div>
          <div className="text-center">
            <p className={`text-sm font-semibold ${balanceMovimientos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {balanceMovimientos >= 0 ? '+' : ''}{balanceMovimientos}
            </p>
            <p className="text-xs text-gray-500">Balance</p>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-700">
              -{stats.movimientos_salida}
            </span>
          </div>
        </div>

        {/* Indicador de estado */}
        {balanceMovimientos < 0 && (
          <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <p className="text-xs text-orange-700">
              Más salidas que entradas en la semana
            </p>
          </div>
        )}

        {totalMovimientos === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">
              Sin movimientos en los últimos 7 días
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
