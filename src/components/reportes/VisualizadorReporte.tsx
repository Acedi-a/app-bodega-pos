import React from 'react'
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Activity,
  DollarSign,
  Calendar,
  ShoppingCart,
  BarChart3,
  Download
} from 'lucide-react'
import { ExportadorReportes } from './ExportadorReportes'
import type {
  ReporteStock,
  ReporteVentas,
  ReportePedidos,
  ReporteClientes,
  ReporteMovimientos,
  DashboardEjecutivo,
  ParametrosExportacion
} from '../../types/reportes'

interface Props {
  tipoReporte: string
  datos: ReporteStock | ReporteVentas | ReportePedidos | ReporteClientes | ReporteMovimientos | DashboardEjecutivo | null
  onExportar?: (parametros: ParametrosExportacion) => void
  cargandoExportacion?: boolean
}

export const VisualizadorReporte: React.FC<Props> = ({ tipoReporte, datos, onExportar, cargandoExportacion = false }) => {
  if (!datos) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No hay datos para mostrar</p>
      </div>
    )
  }

  const formatearMoneda = (valor: number) => `Bs. ${valor.toFixed(2)}`
  const formatearFecha = (fecha: string) => new Date(fecha).toLocaleDateString('es-ES')

  return (
    <div className="space-y-6">
      {/* Header del Reporte */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 capitalize">
              {tipoReporte.replace('_', ' ')} Report
            </h2>
            <p className="text-gray-500 mt-1">
              Generado el {new Date().toLocaleDateString('es-ES')} a las {new Date().toLocaleTimeString('es-ES')}
            </p>
          </div>
        </div>
      </div>

      {/* Contenido específico por tipo de reporte */}
      {tipoReporte === 'stock' && <ReporteStockComponent datos={datos as ReporteStock} />}
      {tipoReporte === 'ventas' && <ReporteVentasComponent datos={datos as ReporteVentas} />}
      {tipoReporte === 'pedidos' && <ReportePedidosComponent datos={datos as ReportePedidos} />}
      {tipoReporte === 'clientes' && <ReporteClientesComponent datos={datos as ReporteClientes} />}
      {tipoReporte === 'movimientos' && <ReporteMovimientosComponent datos={datos as ReporteMovimientos} />}
      {tipoReporte === 'ejecutivo' && <DashboardEjecutivoComponent datos={datos as DashboardEjecutivo} />}

      {/* Exportador de Reportes */}
      {onExportar && (
        <ExportadorReportes
          datos={datos}
          tipoReporte={tipoReporte}
          onExportar={onExportar}
          cargandoExportacion={cargandoExportacion}
        />
      )}
    </div>
  )
}

// ======================================================
// COMPONENTE REPORTE DE STOCK
// ======================================================
const ReporteStockComponent: React.FC<{ datos: ReporteStock }> = ({ datos }) => {
  const formatearMoneda = (valor: number) => `Bs. ${valor.toFixed(2)}`

  return (
    <div className="space-y-6">
      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900">{datos.resumen.total_productos}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Stock Mínimo</p>
              <p className="text-2xl font-bold text-yellow-600">{datos.resumen.productos_en_minimo}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sin Stock</p>
              <p className="text-2xl font-bold text-red-600">{datos.resumen.productos_sin_stock}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Inventario</p>
              <p className="text-2xl font-bold text-green-600">{formatearMoneda(datos.resumen.valor_total_inventario)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Productos Bajo Mínimo */}
      {datos.productos_bajo_minimo.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Productos Bajo Stock Mínimo
            </h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-700">Producto</th>
                    <th className="text-right py-2 font-medium text-gray-700">Stock Actual</th>
                    <th className="text-right py-2 font-medium text-gray-700">Stock Mínimo</th>
                    <th className="text-right py-2 font-medium text-gray-700">Diferencia</th>
                    <th className="text-right py-2 font-medium text-gray-700">Valor Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.productos_bajo_minimo.map((producto, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-gray-900">{producto.nombre}</p>
                          <p className="text-xs text-gray-500">{producto.categoria}</p>
                        </div>
                      </td>
                      <td className="text-right py-3 text-red-600 font-medium">{producto.stock_actual}</td>
                      <td className="text-right py-3">{producto.stock_minimo}</td>
                      <td className="text-right py-3 text-red-600">-{producto.diferencia}</td>
                      <td className="text-right py-3 text-gray-900">{formatearMoneda(producto.valor_stock)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Productos Sin Stock */}
      {datos.productos_sin_stock.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Productos Sin Stock
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {datos.productos_sin_stock.map((producto, index) => (
                <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-medium text-gray-900">{producto.nombre}</h4>
                  <p className="text-sm text-red-600 mt-1">
                    Sin stock desde hace {producto.dias_sin_stock} días
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ======================================================
// COMPONENTE REPORTE DE VENTAS
// ======================================================
const ReporteVentasComponent: React.FC<{ datos: ReporteVentas }> = ({ datos }) => {
  const formatearMoneda = (valor: number) => `Bs. ${valor.toFixed(2)}`
  const formatearFecha = (fecha: string) => new Date(fecha).toLocaleDateString('es-ES')

  return (
    <div className="space-y-6">
      {/* Resumen de Ventas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Ventas</p>
              <p className="text-2xl font-bold text-gray-900">{datos.resumen.total_ventas}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monto Total</p>
              <p className="text-2xl font-bold text-green-600">{formatearMoneda(datos.resumen.monto_total)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Promedio por Venta</p>
              <p className="text-2xl font-bold text-blue-600">{formatearMoneda(datos.resumen.monto_promedio)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Producto Estrella</p>
              <p className="text-lg font-bold text-purple-600">{datos.resumen.producto_estrella}</p>
            </div>
            <Package className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Productos Más Vendidos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Productos Más Vendidos</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {datos.productos_mas_vendidos.slice(0, 10).map((producto, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{producto.nombre}</p>
                    <p className="text-sm text-gray-500">{producto.frecuencia_ventas} ventas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">{producto.cantidad_vendida} unidades</p>
                  <p className="text-sm text-green-600">{formatearMoneda(producto.monto_total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clientes Frecuentes */}
      {datos.clientes_frecuentes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Clientes Más Frecuentes</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {datos.clientes_frecuentes.slice(0, 6).map((cliente, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {cliente.nombre} {cliente.apellido}
                    </h4>
                    <span className="text-sm text-gray-500">{cliente.total_compras} compras</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total gastado:</span>
                    <span className="font-medium text-green-600">{formatearMoneda(cliente.monto_total)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Última compra:</span>
                    <span className="text-gray-900">{formatearFecha(cliente.ultima_compra)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ======================================================
// COMPONENTE REPORTE DE PEDIDOS
// ======================================================
const ReportePedidosComponent: React.FC<{ datos: ReportePedidos }> = ({ datos }) => {
  const formatearMoneda = (valor: number) => `Bs. ${valor.toFixed(2)}`
  const formatearFecha = (fecha: string) => new Date(fecha).toLocaleDateString('es-ES')

  return (
    <div className="space-y-6">
      {/* Resumen de Pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">{datos.resumen.total_pedidos}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completados</p>
              <p className="text-2xl font-bold text-green-600">{datos.resumen.pedidos_completados}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{datos.resumen.pedidos_pendientes}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monto Total</p>
              <p className="text-2xl font-bold text-green-600">{formatearMoneda(datos.resumen.monto_total_periodo)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Pedidos por Estado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Distribución por Estados</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {datos.pedidos_por_estado.map((estado, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">{estado.estado}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold text-gray-900">{estado.cantidad}</span>
                  <span className="text-sm text-gray-500 ml-2">({estado.porcentaje.toFixed(1)}%)</span>
                  <p className="text-sm text-green-600">{formatearMoneda(estado.monto_total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rendimiento de Entregas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Rendimiento de Entregas</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{datos.rendimiento_entregas.entregas_tiempo}</p>
              <p className="text-sm text-gray-600">Entregas a Tiempo</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{datos.rendimiento_entregas.entregas_tarde}</p>
              <p className="text-sm text-gray-600">Entregas Tardías</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{datos.rendimiento_entregas.promedio_dias_entrega}</p>
              <p className="text-sm text-gray-600">Días Promedio</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-lg">
              <span className="text-gray-600">Puntualidad: </span>
              <span className={`font-bold ${datos.rendimiento_entregas.porcentaje_puntualidad >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                {datos.rendimiento_entregas.porcentaje_puntualidad.toFixed(1)}%
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Stubs para los otros componentes (implementar según necesidad)
const ReporteClientesComponent: React.FC<{ datos: ReporteClientes }> = ({ datos }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Reporte de Cliente: {datos.nombre_completo}</h3>
      <p className="text-gray-600">Detalles del cliente y análisis completo...</p>
    </div>
  )
}

const ReporteMovimientosComponent: React.FC<{ datos: ReporteMovimientos }> = ({ datos }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Reporte de Movimientos</h3>
      <p className="text-gray-600">Total movimientos: {datos.movimientos_productos.length + datos.movimientos_insumos.length}</p>
    </div>
  )
}

const DashboardEjecutivoComponent: React.FC<{ datos: DashboardEjecutivo }> = ({ datos }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Ventas Este Mes</p>
          <p className="text-2xl font-bold text-green-600">Bs. {datos.kpis_principales.ventas_mes_actual.toFixed(2)}</p>
          <p className={`text-sm ${datos.kpis_principales.crecimiento_ventas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {datos.kpis_principales.crecimiento_ventas >= 0 ? '↗' : '↘'} {Math.abs(datos.kpis_principales.crecimiento_ventas).toFixed(1)}%
          </p>
        </div>
      </div>
      
      {/* Productos Críticos */}
      {datos.productos_criticos.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Productos Críticos</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {datos.productos_criticos.map((producto, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{producto.nombre}</p>
                    <p className="text-sm text-gray-600 capitalize">{producto.situacion.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-600">{producto.accion_recomendada}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
