import React, { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Package, 
  Activity, 
  DollarSign,
  Calendar,
  Filter,
  Download,
  Eye
} from 'lucide-react'

interface Props {
  onGenerarReporte: (tipo: string, filtros: any) => void
  cargando?: boolean
}

export const SelectorReportes: React.FC<Props> = ({ onGenerarReporte, cargando }) => {
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>('')
  const [filtros, setFiltros] = useState({
    fecha_inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    cliente_id: '',
    producto_id: '',
    categoria_id: '',
    incluir_detalles: true,
    formato_exportacion: 'pdf'
  })

  const tiposReporte = [
    {
      id: 'stock',
      nombre: 'Reporte de Inventario',
      descripcion: 'Stock bajo mínimo, productos sin stock, sobrestockeados',
      icono: Package,
      color: 'bg-blue-500',
      colorLight: 'bg-blue-50'
    },
    {
      id: 'ventas',
      nombre: 'Reporte de Ventas',
      descripcion: 'Ventas por período, productos más vendidos, clientes frecuentes',
      icono: TrendingUp,
      color: 'bg-green-500',
      colorLight: 'bg-green-50'
    },
    {
      id: 'pedidos',
      nombre: 'Reporte de Pedidos',
      descripcion: 'Estados de pedidos, entregas, productos más pedidos',
      icono: BarChart3,
      color: 'bg-purple-500',
      colorLight: 'bg-purple-50'
    },
    {
      id: 'clientes',
      nombre: 'Reporte de Cliente Específico',
      descripcion: 'Análisis detallado de un cliente particular',
      icono: Users,
      color: 'bg-orange-500',
      colorLight: 'bg-orange-50'
    },
    {
      id: 'movimientos',
      nombre: 'Reporte de Movimientos',
      descripcion: 'Movimientos de inventario e insumos',
      icono: Activity,
      color: 'bg-red-500',
      colorLight: 'bg-red-50'
    },
    {
      id: 'ejecutivo',
      nombre: 'Dashboard Ejecutivo',
      descripcion: 'KPIs principales, tendencias, alertas importantes',
      icono: DollarSign,
      color: 'bg-indigo-500',
      colorLight: 'bg-indigo-50'
    }
  ]

  const handleGenerarReporte = () => {
    if (!tipoSeleccionado) {
      alert('Por favor seleccione un tipo de reporte')
      return
    }

    onGenerarReporte(tipoSeleccionado, {
      ...filtros,
      tipo_reporte: tipoSeleccionado
    })
  }

  const tipoActual = tiposReporte.find(t => t.id === tipoSeleccionado)

  return (
    <div className="space-y-6">
      {/* Selector de Tipo de Reporte */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Seleccionar Tipo de Reporte
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiposReporte.map((tipo) => {
            const IconoComponente = tipo.icono
            const isSelected = tipoSeleccionado === tipo.id
            
            return (
              <button
                key={tipo.id}
                onClick={() => setTipoSeleccionado(tipo.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md ${
                  isSelected 
                    ? `border-gray-400 ${tipo.colorLight} shadow-md` 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isSelected ? tipo.color : 'bg-gray-100'}`}>
                    <IconoComponente className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 mb-1">{tipo.nombre}</h4>
                    <p className="text-sm text-gray-500">{tipo.descripcion}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Filtros */}
      {tipoSeleccionado && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros para {tipoActual?.nombre}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Rango de Fechas - Para todos los reportes excepto cliente específico */}
            {tipoSeleccionado !== 'clientes' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={filtros.fecha_inicio}
                    onChange={(e) => setFiltros(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={filtros.fecha_fin}
                    onChange={(e) => setFiltros(prev => ({ ...prev, fecha_fin: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}

            {/* Filtro de Cliente - Solo para reportes de cliente */}
            {tipoSeleccionado === 'clientes' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="h-4 w-4 inline mr-1" />
                  ID del Cliente
                </label>
                <input
                  type="number"
                  value={filtros.cliente_id}
                  onChange={(e) => setFiltros(prev => ({ ...prev, cliente_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese el ID del cliente"
                />
              </div>
            )}

            {/* Filtro de Producto - Para reportes relevantes */}
            {['ventas', 'pedidos', 'movimientos'].includes(tipoSeleccionado) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="h-4 w-4 inline mr-1" />
                  ID del Producto (Opcional)
                </label>
                <input
                  type="number"
                  value={filtros.producto_id}
                  onChange={(e) => setFiltros(prev => ({ ...prev, producto_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Filtrar por producto específico"
                />
              </div>
            )}
          </div>

          {/* Opciones adicionales */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtros.incluir_detalles}
                  onChange={(e) => setFiltros(prev => ({ ...prev, incluir_detalles: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Incluir detalles completos</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Download className="h-4 w-4 inline mr-1" />
                Formato de Exportación
              </label>
              <select
                value={filtros.formato_exportacion}
                onChange={(e) => setFiltros(prev => ({ ...prev, formato_exportacion: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Botón Generar */}
      {tipoSeleccionado && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">¿Listo para generar el reporte?</h4>
              <p className="text-sm text-gray-500 mt-1">
                Se generará el reporte de {tipoActual?.nombre.toLowerCase()} con los filtros seleccionados
              </p>
            </div>
            
            <button
              onClick={handleGenerarReporte}
              disabled={cargando}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                cargando
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {cargando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Generar Reporte
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
