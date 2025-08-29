import React from 'react'
import { Download, FileText, Table, FileSpreadsheet } from 'lucide-react'
import type { 
  ReporteStock, 
  ReporteVentas, 
  ReportePedidos, 
  ReporteClientes, 
  ReporteMovimientos,
  DashboardEjecutivo,
  ParametrosExportacion
} from '../../types/reportes'

type TipoReporte = ReporteStock | ReporteVentas | ReportePedidos | ReporteClientes | ReporteMovimientos | DashboardEjecutivo

interface ExportadorReportesProps {
  datos: TipoReporte
  tipoReporte: string
  onExportar: (parametros: ParametrosExportacion) => void
  cargandoExportacion: boolean
}

export const ExportadorReportes: React.FC<ExportadorReportesProps> = ({
  datos,
  tipoReporte,
  onExportar,
  cargandoExportacion
}) => {
  const formatos = [
    {
      tipo: 'pdf' as const,
      nombre: 'PDF',
      descripcion: 'Documento imprimible con formato profesional',
      icono: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      tipo: 'excel' as const,
      nombre: 'Excel',
      descripcion: 'Hoja de cálculo para análisis de datos',
      icono: FileSpreadsheet,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      tipo: 'csv' as const,
      nombre: 'CSV',
      descripcion: 'Datos separados por comas para importar',
      icono: Table,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    }
  ]

  const exportar = (formato: 'pdf' | 'excel' | 'csv') => {
    const parametros: ParametrosExportacion = {
      formato,
      incluir_graficos: formato === 'pdf',
      incluir_resumen: true,
      incluir_detalles: true,
      nombre_reporte: `reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}`
    }
    
    onExportar(parametros)
  }

  const obtenerResumenDatos = () => {
    switch (tipoReporte) {
      case 'stock':
        const stockData = datos as ReporteStock
        return {
          titulo: 'Reporte de Stock',
          elementos: stockData.productos_bajo_minimo.length + stockData.productos_sin_stock.length,
          valorTotal: stockData.resumen.valor_total_inventario,
          alertas: stockData.resumen.productos_sin_stock + stockData.resumen.productos_en_minimo
        }
      case 'ventas':
        const ventasData = datos as ReporteVentas
        return {
          titulo: 'Reporte de Ventas',
          elementos: ventasData.ventas_periodo.length,
          valorTotal: ventasData.resumen.monto_total,
          alertas: 0
        }
      case 'pedidos':
        const pedidosData = datos as ReportePedidos
        return {
          titulo: 'Reporte de Pedidos',
          elementos: pedidosData.pedidos_por_estado.length,
          valorTotal: pedidosData.resumen.total_pedidos,
          alertas: pedidosData.pedidos_por_estado.filter((p: any) => p.estado === 'pendiente').length
        }
      case 'clientes':
        const clienteData = datos as ReporteClientes
        return {
          titulo: 'Reporte de Cliente',
          elementos: clienteData.historial_compras.length,
          valorTotal: clienteData.estadisticas_compras.monto_total_gastado,
          alertas: 0
        }
      case 'movimientos':
        const movimientosData = datos as ReporteMovimientos
        return {
          titulo: 'Reporte de Movimientos',
          elementos: movimientosData.movimientos_productos.length + movimientosData.movimientos_insumos.length,
          valorTotal: 0,
          alertas: 0
        }
      case 'dashboard':
        const dashboardData = datos as DashboardEjecutivo
        return {
          titulo: 'Dashboard Ejecutivo',
          elementos: dashboardData.kpis_principales.valor_inventario_total,
          valorTotal: dashboardData.kpis_principales.ventas_mes_actual,
          alertas: dashboardData.alertas_importantes.filter(a => a.prioridad === 'alta').length
        }
      default:
        return {
          titulo: 'Reporte',
          elementos: 0,
          valorTotal: 0,
          alertas: 0
        }
    }
  }

  const resumen = obtenerResumenDatos()

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <Download className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Exportar Reporte</h3>
          <p className="text-sm text-gray-600">
            {resumen.titulo} • {resumen.elementos} elementos
          </p>
        </div>
      </div>

      {/* Resumen del reporte */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-gray-600">Elementos</p>
          <p className="text-xl font-bold text-gray-900">{resumen.elementos.toLocaleString()}</p>
        </div>
        {resumen.valorTotal > 0 && (
          <div className="text-center">
            <p className="text-sm text-gray-600">Valor Total</p>
            <p className="text-xl font-bold text-green-600">
              Bs. {resumen.valorTotal.toFixed(2)}
            </p>
          </div>
        )}
        {resumen.alertas > 0 && (
          <div className="text-center">
            <p className="text-sm text-gray-600">Alertas</p>
            <p className="text-xl font-bold text-red-600">{resumen.alertas}</p>
          </div>
        )}
      </div>

      {/* Opciones de formato */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Seleccionar formato de exportación:</h4>
        
        {formatos.map((formato) => {
          const IconoFormato = formato.icono
          
          return (
            <button
              key={formato.tipo}
              onClick={() => exportar(formato.tipo)}
              disabled={cargandoExportacion}
              className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className={`p-3 rounded-lg ${formato.bgColor} group-hover:scale-105 transition-transform`}>
                <IconoFormato className={`h-6 w-6 ${formato.color}`} />
              </div>
              
              <div className="flex-1 text-left">
                <h5 className="font-medium text-gray-900">{formato.nombre}</h5>
                <p className="text-sm text-gray-600">{formato.descripcion}</p>
              </div>
              
              <div className="flex items-center gap-2">
                {cargandoExportacion && (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                )}
                <Download className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              </div>
            </button>
          )
        })}
      </div>

      {/* Nota informativa */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 text-blue-600 mt-0.5">ℹ️</div>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Información sobre exportación:</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>PDF:</strong> Incluye gráficos y formato profesional para presentaciones</li>
              <li>• <strong>Excel:</strong> Datos estructurados para análisis avanzado y manipulación</li>
              <li>• <strong>CSV:</strong> Formato universal compatible con cualquier sistema</li>
            </ul>
            <p className="mt-2 text-xs text-blue-600">
              Los archivos se descargarán automáticamente a tu carpeta de descargas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
