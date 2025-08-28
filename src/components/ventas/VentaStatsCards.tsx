import React, { useState, useEffect } from 'react'
import { 
  ShoppingCart, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  CreditCard,
  Package
} from 'lucide-react'
import { ventaService } from '../../services/VentaService'
import type { VentaStats } from '../../types/ventas'

export const VentaStatsCards: React.FC = () => {
  const [stats, setStats] = useState<VentaStats>({
    totalVentas: 0,
    ventasHoy: 0,
    ventasSemana: 0,
    ventasMes: 0,
    montoTotalHoy: 0,
    montoTotalSemana: 0,
    montoTotalMes: 0,
    ventasPorEstado: [],
    ventasPorMetodoPago: [],
    productosPopulares: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const { data } = await ventaService.getVentaStats()
      setStats(data)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Cards principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ventas Hoy */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              Hoy
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.ventasHoy.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600">Ventas realizadas</p>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-lg font-semibold text-blue-700">
              ${stats.montoTotalHoy.toLocaleString()}
            </p>
            <p className="text-xs text-blue-600">Total del día</p>
          </div>
        </div>

        {/* Ventas Semana */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Semana
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.ventasSemana.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600">Ventas de la semana</p>
          <div className="mt-3 pt-3 border-t border-green-200">
            <p className="text-lg font-semibold text-green-700">
              ${stats.montoTotalSemana.toLocaleString()}
            </p>
            <p className="text-xs text-green-600">Total semanal</p>
          </div>
        </div>

        {/* Ventas Mes */}
        <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl border border-purple-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              Mes
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.ventasMes.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600">Ventas del mes</p>
          <div className="mt-3 pt-3 border-t border-purple-200">
            <p className="text-lg font-semibold text-purple-700">
              ${stats.montoTotalMes.toLocaleString()}
            </p>
            <p className="text-xs text-purple-600">Total mensual</p>
          </div>
        </div>

        {/* Total General */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl border border-amber-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
              Total
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.totalVentas.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600">Ventas registradas</p>
          <div className="mt-3 pt-3 border-t border-amber-200">
            <p className="text-xs text-amber-600">Histórico completo</p>
          </div>
        </div>
      </div>

      {/* Gráficos y detalles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ventas por Estado */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Por Estado</h3>
          </div>
          <div className="space-y-3">
            {stats.ventasPorEstado.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.estado}</span>
                    <span className="text-sm text-gray-500">{item.count}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    ${item.monto.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {stats.ventasPorEstado.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay datos disponibles
              </p>
            )}
          </div>
        </div>

        {/* Métodos de Pago */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Métodos de Pago</h3>
          </div>
          <div className="space-y-3">
            {stats.ventasPorMetodoPago.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.metodo}</span>
                    <span className="text-sm text-gray-500">{item.count}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    ${item.monto.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {stats.ventasPorMetodoPago.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay datos disponibles
              </p>
            )}
          </div>
        </div>

        {/* Productos Populares */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Productos Populares</h3>
          </div>
          <div className="space-y-3">
            {stats.productosPopulares.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 line-clamp-1">
                      {item.producto}
                    </span>
                    <span className="text-sm text-gray-500">{item.cantidad}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    ${item.ingresos.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {stats.productosPopulares.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay datos disponibles
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
