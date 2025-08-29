import React, { useEffect, useState } from 'react'
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  DollarSign,
  Activity,
  RefreshCw
} from 'lucide-react'
import { reportesService } from '../../services/ReportesService'

interface EstadisticasRapidas {
  productos_totales: number
  productos_bajo_minimo: number
  productos_sin_stock: number
  ventas_mes_actual: number
  pedidos_pendientes: number
  clientes_activos: number
  valor_inventario: number
  alertas_criticas: number
}

export const DashboardRapido: React.FC = () => {
  const [estadisticas, setEstadisticas] = useState<EstadisticasRapidas | null>(null)
  const [cargando, setCargando] = useState(true)
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date())

  useEffect(() => {
    cargarEstadisticas()
    
    // Actualizar cada 5 minutos
    const intervalo = setInterval(cargarEstadisticas, 5 * 60 * 1000)
    
    return () => clearInterval(intervalo)
  }, [])

  const cargarEstadisticas = async () => {
    try {
      setCargando(true)
      
      // Cargar datos básicos del dashboard ejecutivo
      const dashboardData = await reportesService.getDashboardEjecutivo()
      const stockData = await reportesService.getReporteStock()
      
      const stats: EstadisticasRapidas = {
        productos_totales: stockData.resumen.total_productos,
        productos_bajo_minimo: stockData.resumen.productos_en_minimo,
        productos_sin_stock: stockData.resumen.productos_sin_stock,
        ventas_mes_actual: dashboardData.kpis_principales.ventas_mes_actual,
        pedidos_pendientes: dashboardData.kpis_principales.pedidos_mes_actual,
        clientes_activos: dashboardData.kpis_principales.clientes_activos,
        valor_inventario: stockData.resumen.valor_total_inventario,
        alertas_criticas: dashboardData.alertas_importantes.filter(a => a.prioridad === 'alta').length
      }
      
      setEstadisticas(stats)
      setUltimaActualizacion(new Date())
    } catch (error) {
      console.error('Error cargando estadísticas rápidas:', error)
    } finally {
      setCargando(false)
    }
  }

  const formatearMoneda = (valor: number) => `Bs. ${valor.toFixed(2)}`

  if (cargando && !estadisticas) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!estadisticas) return null

  const tarjetas = [
    {
      titulo: 'Productos Total',
      valor: estadisticas.productos_totales,
      icono: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      titulo: 'Stock Bajo Mínimo',
      valor: estadisticas.productos_bajo_minimo,
      icono: AlertTriangle,
      color: estadisticas.productos_bajo_minimo > 0 ? 'text-yellow-600' : 'text-green-600',
      bgColor: estadisticas.productos_bajo_minimo > 0 ? 'bg-yellow-100' : 'bg-green-100',
      alerta: estadisticas.productos_bajo_minimo > 0
    },
    {
      titulo: 'Sin Stock',
      valor: estadisticas.productos_sin_stock,
      icono: AlertTriangle,
      color: estadisticas.productos_sin_stock > 0 ? 'text-red-600' : 'text-green-600',
      bgColor: estadisticas.productos_sin_stock > 0 ? 'bg-red-100' : 'bg-green-100',
      alerta: estadisticas.productos_sin_stock > 0
    },
    {
      titulo: 'Ventas Este Mes',
      valor: formatearMoneda(estadisticas.ventas_mes_actual),
      icono: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      esMoneda: true
    },
    {
      titulo: 'Pedidos Pendientes',
      valor: estadisticas.pedidos_pendientes,
      icono: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      titulo: 'Clientes Activos',
      valor: estadisticas.clientes_activos,
      icono: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      titulo: 'Valor Inventario',
      valor: formatearMoneda(estadisticas.valor_inventario),
      icono: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      esMoneda: true
    },
    {
      titulo: 'Alertas Críticas',
      valor: estadisticas.alertas_criticas,
      icono: AlertTriangle,
      color: estadisticas.alertas_criticas > 0 ? 'text-red-600' : 'text-green-600',
      bgColor: estadisticas.alertas_criticas > 0 ? 'bg-red-100' : 'bg-green-100',
      alerta: estadisticas.alertas_criticas > 0
    }
  ]

  return (
    <div className="space-y-4">
      {/* Header con botón de actualización */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Dashboard en Tiempo Real</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            Actualizado: {ultimaActualizacion.toLocaleTimeString('es-ES')}
          </span>
          <button
            onClick={cargarEstadisticas}
            disabled={cargando}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Actualizar datos"
          >
            <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tarjetas.map((tarjeta, index) => {
          const IconoComponente = tarjeta.icono
          
          return (
            <div 
              key={index} 
              className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative transition-all duration-200 hover:shadow-md ${
                tarjeta.alerta ? 'ring-2 ring-red-200' : ''
              }`}
            >
              {tarjeta.alerta && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{tarjeta.titulo}</p>
                  <p className={`text-2xl font-bold ${tarjeta.color}`}>
                    {tarjeta.esMoneda ? tarjeta.valor : tarjeta.valor.toLocaleString()}
                  </p>
                  {tarjeta.alerta && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      ⚠️ Requiere atención
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${tarjeta.bgColor}`}>
                  <IconoComponente className={`h-6 w-6 ${tarjeta.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Barra de estado del sistema */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Sistema Operativo</span>
          </div>
          
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <span>Productos monitoreados: {estadisticas.productos_totales}</span>
            <span>Última sincronización: {ultimaActualizacion.toLocaleTimeString('es-ES')}</span>
            <span className={`px-2 py-1 rounded-full ${
              estadisticas.productos_sin_stock === 0 && estadisticas.alertas_criticas === 0
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {estadisticas.productos_sin_stock === 0 && estadisticas.alertas_criticas === 0 ? 'Todo OK' : 'Revisar alertas'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
