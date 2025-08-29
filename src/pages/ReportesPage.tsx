import React, { useState } from 'react'
import { FileText, TrendingUp, AlertCircle } from 'lucide-react'
import { SelectorReportes } from '../components/reportes/SelectorReportes'
import { VisualizadorReporte } from '../components/reportes/VisualizadorReporte'
import { DashboardRapido } from '../components/reportes/DashboardRapido'
import { reportesService } from '../services/ReportesService'
import type { 
  ReporteStock, 
  ReporteVentas, 
  ReportePedidos, 
  ReporteClientes, 
  ReporteMovimientos,
  DashboardEjecutivo,
  ParametrosExportacion
} from '../types/reportes'

export const ReportesPage: React.FC = () => {
  const [cargando, setCargando] = useState(false)
  const [cargandoExportacion, setCargandoExportacion] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tipoReporteActual, setTipoReporteActual] = useState<string>('')
  const [datosReporte, setDatosReporte] = useState<ReporteStock | ReporteVentas | ReportePedidos | ReporteClientes | ReporteMovimientos | DashboardEjecutivo | null>(null)

  const generarReporte = async (tipoReporte: string, filtros: any) => {
    setCargando(true)
    setError(null)
    setTipoReporteActual(tipoReporte)

    try {
      let datos = null

      switch (tipoReporte) {
        case 'stock':
          datos = await reportesService.getReporteStock()
          break
          
        case 'ventas':
          if (!filtros.fecha_inicio || !filtros.fecha_fin) {
            throw new Error('Las fechas son requeridas para el reporte de ventas')
          }
          datos = await reportesService.getReporteVentas({
            fecha_inicio: filtros.fecha_inicio,
            fecha_fin: filtros.fecha_fin
          })
          break
          
        case 'pedidos':
          if (!filtros.fecha_inicio || !filtros.fecha_fin) {
            throw new Error('Las fechas son requeridas para el reporte de pedidos')
          }
          datos = await reportesService.getReportePedidos({
            fecha_inicio: filtros.fecha_inicio,
            fecha_fin: filtros.fecha_fin
          })
          break
          
        case 'clientes':
          if (!filtros.cliente_id) {
            throw new Error('El ID del cliente es requerido')
          }
          datos = await reportesService.getReporteCliente(parseInt(filtros.cliente_id))
          break
          
        case 'movimientos':
          if (!filtros.fecha_inicio || !filtros.fecha_fin) {
            throw new Error('Las fechas son requeridas para el reporte de movimientos')
          }
          datos = await reportesService.getReporteMovimientos({
            fecha_inicio: filtros.fecha_inicio,
            fecha_fin: filtros.fecha_fin
          })
          break
          
        case 'ejecutivo':
          datos = await reportesService.getDashboardEjecutivo()
          break
          
        default:
          throw new Error('Tipo de reporte no válido')
      }

      setDatosReporte(datos)
    } catch (err) {
      console.error('Error generando reporte:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido al generar el reporte')
      setDatosReporte(null)
    } finally {
      setCargando(false)
    }
  }

  const exportarReporte = async (parametros: ParametrosExportacion) => {
    if (!datosReporte || !tipoReporteActual) {
      alert('No hay datos para exportar')
      return
    }

    setCargandoExportacion(true)

    try {
      // Aquí implementarías la lógica de exportación según el formato
      console.log(`Exportando reporte ${tipoReporteActual} en formato ${parametros.formato}`)
      
      // Por ahora, creamos una versión JSON del reporte
      const datosExportacion = {
        tipo_reporte: tipoReporteActual,
        fecha_generacion: new Date().toISOString(),
        parametros_exportacion: parametros,
        datos: datosReporte
      }

      const blob = new Blob([JSON.stringify(datosExportacion, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${parametros.nombre_reporte}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // Mensaje de éxito
      alert(`Reporte exportado en formato ${parametros.formato.toUpperCase()}`)
    } catch (err) {
      console.error('Error exportando reporte:', err)
      alert('Error al exportar el reporte')
    } finally {
      setCargandoExportacion(false)
    }
  }

  const limpiarReporte = () => {
    setDatosReporte(null)
    setTipoReporteActual('')
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sistema de Reportes</h1>
                <p className="text-gray-600">
                  Generación de reportes empresariales completos y análisis de datos
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Reportes Disponibles</p>
                <p className="text-lg font-semibold text-gray-900">6 Tipos</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Rápido */}
        <div className="mb-8">
          <DashboardRapido />
        </div>

        {/* Indicadores Rápidos del Sistema de Reportes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reportes Generados Hoy</p>
                <p className="text-2xl font-bold text-blue-600">0</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Último Reporte</p>
                <p className="text-lg font-bold text-gray-900">
                  {tipoReporteActual ? tipoReporteActual.charAt(0).toUpperCase() + tipoReporteActual.slice(1) : 'Ninguno'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estado del Sistema</p>
                <p className="text-lg font-bold text-green-600">Activo</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Selector de Reportes */}
        {!datosReporte && (
          <SelectorReportes 
            onGenerarReporte={generarReporte}
            cargando={cargando}
          />
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-red-800">Error al generar el reporte</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Loading State */}
        {cargando && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Generando Reporte</h3>
            <p className="text-gray-600">
              Procesando datos y compilando información...
            </p>
          </div>
        )}

        {/* Visualizador de Reportes */}
        {datosReporte && !cargando && (
          <div className="space-y-6">
            {/* Controles del Reporte */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Reporte de <strong className="text-gray-900 capitalize">{tipoReporteActual}</strong> generado exitosamente
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={limpiarReporte}
                    className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Nuevo Reporte
                  </button>
                </div>
              </div>
            </div>

            {/* Contenido del Reporte */}
            <VisualizadorReporte
              tipoReporte={tipoReporteActual}
              datos={datosReporte}
              onExportar={exportarReporte}
              cargandoExportacion={cargandoExportacion}
            />
          </div>
        )}

        {/* Ayuda/Información */}
        {!datosReporte && !cargando && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
            <h3 className="text-lg font-medium text-blue-900 mb-3">💡 Guía de Reportes</h3>
            <div className="space-y-2 text-blue-800">
              <p><strong>Reporte de Inventario:</strong> Productos con stock bajo mínimo, sin stock y sobrestockeados</p>
              <p><strong>Reporte de Ventas:</strong> Análisis de ventas por período, productos más vendidos y clientes frecuentes</p>
              <p><strong>Reporte de Pedidos:</strong> Estados de pedidos, rendimiento de entregas y productos más pedidos</p>
              <p><strong>Reporte de Cliente:</strong> Análisis detallado del comportamiento de compra de un cliente específico</p>
              <p><strong>Reporte de Movimientos:</strong> Historial completo de movimientos de inventario e insumos</p>
              <p><strong>Dashboard Ejecutivo:</strong> KPIs principales, tendencias y alertas para la toma de decisiones</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
